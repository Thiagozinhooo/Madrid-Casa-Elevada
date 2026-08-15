/* Madrid Casa Elevada — Cloud Function de push de visita (Camada 2, V362).
 *
 * Dispara quando uma visita nova é gravada em madrid_data/agenda/<id> e envia
 * push (FCM) para: todos os MASTER + todos os GESTORES + o CORRETOR dono da
 * visita. Usa os tokens salvos em madrid_data/fcm_tokens/<emailKey>/<token>.
 *
 * Requer plano Blaze. Deploy: `firebase deploy --only functions`.
 * O nó `agenda` NÃO contém dados do cliente (nome/telefone) — só corretor/
 * data/hora/unidade — então a notificação nunca vaza PII do cliente.
 */

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

const encodeEmail = (e) => String(e || '').replace(/[.#$\[\]]/g, '_');

exports.notifyVisita = functions.database
  .ref('/madrid_data/agenda/{id}')
  .onCreate(async (snap, context) => {
    const slot = snap.val() || {};
    if (!slot.data || !slot.hora) return null;

    const db = admin.database();
    const [mastersSnap, permsSnap] = await Promise.all([
      db.ref('madrid_data/master_admins').once('value'),
      db.ref('madrid_data/permissions').once('value')
    ]);

    // Destinatários: masters + gestores + o corretor dono da visita.
    const emails = new Set();
    Object.values(mastersSnap.val() || {}).forEach((e) => { if (e) emails.add(e); });
    Object.values(permsSnap.val() || {}).forEach((p) => {
      if (p && p.role === 'gestor' && p.email) emails.add(p.email);
    });
    if (slot.corretor) emails.add(slot.corretor);
    // V364: não notificar quem MARCOU a visita (evita self-push do próprio autor).
    // Se um gestor marca para um corretor, o corretor (dono) segue notificado.
    if (slot.criadoPor) emails.delete(slot.criadoPor);
    if (!emails.size) return null;

    // Coleta os tokens FCM de cada destinatário. Mapeia token -> emailKey p/ poder
    // limpar tokens inválidos depois.
    const emailList = Array.from(emails);
    const tokenSnaps = await Promise.all(
      emailList.map((e) => db.ref('madrid_data/fcm_tokens/' + encodeEmail(e)).once('value'))
    );
    const tokenToKey = {};
    tokenSnaps.forEach((s, i) => {
      Object.keys(s.val() || {}).forEach((t) => { tokenToKey[t] = encodeEmail(emailList[i]); });
    });
    const tokens = Object.keys(tokenToKey);
    if (!tokens.length) return null;

    const quem = slot.corretorNome || (slot.corretor ? String(slot.corretor).split('@')[0] : '');
    const uni = slot.unidade ? (' · Apto ' + slot.unidade) : '';
    const dataBr = String(slot.data).substring(8, 10) + '/' + String(slot.data).substring(5, 7);
    const notification = { title: 'Nova visita marcada', body: dataBr + ' às ' + slot.hora + ' — ' + quem + uni };
    const dataPayload = { tag: 'visita-' + context.params.id, dia: String(slot.data) };

    // sendEachForMulticast aceita no máximo 500 tokens por chamada. Fatiar em
    // lotes de 500 — senão, acima de 500 aparelhos, a chamada rejeita e o push
    // deixa de sair para TODOS (e a limpeza de tokens nem roda). Higiene: remove
    // os tokens que o FCM reportar como inválidos/expirados, por lote.
    const cleanups = [];
    for (let i = 0; i < tokens.length; i += 500) {
      const chunk = tokens.slice(i, i + 500);
      const resp = await admin.messaging().sendEachForMulticast({
        notification: notification,
        data: dataPayload,
        tokens: chunk
      });
      resp.responses.forEach((r, j) => {
        if (r.success) return;
        const code = r.error && r.error.code;
        if (code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/invalid-argument') {
          const tok = chunk[j];
          cleanups.push(db.ref('madrid_data/fcm_tokens/' + tokenToKey[tok] + '/' + tok).remove().catch(() => {}));
        }
      });
    }
    await Promise.all(cleanups);
    return null;
  });
