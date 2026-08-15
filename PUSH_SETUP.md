# Push de visitas (Camada 2) — como ativar

O código já está pronto e **inerte**: enquanto o `FCM_VAPID_KEY` (em `index.html`)
estiver vazio, nada de push carrega e o site funciona normal (só o sininho interno,
que já vale com o app aberto). Para ligar o push **com o app fechado**, faça os 5
passos abaixo. Precisa do plano **Blaze** (pré-pago; tem franquia grátis, mas exige
cartão) porque Cloud Functions só rodam no Blaze.

## 1. Ativar o plano Blaze
Console Firebase → engrenagem → **Uso e faturamento** → **Detalhes e configurações**
→ mudar de Spark para **Blaze**. (Cloud Functions e o envio de FCM exigem isso.)

## 2. Pegar o VAPID key (Web Push)
Console Firebase → **Configurações do projeto** → aba **Cloud Messaging** →
seção **Certificados push da Web** → **Gerar par de chaves** → copie a chave.
Cole em `index.html`, na linha:
```
const FCM_VAPID_KEY = ""; // <-- COLE AQUI o VAPID key (Web Push certificate)
```
Depois **suba a versão** do `index.html` (título + `CURRENT_APP_VERSION` +
`console.log`) e commite, como sempre.

## 3. Publicar as regras (nó fcm_tokens + agenda + visitas)
As regras já estão em `database.rules.json`. Publique:
```
firebase deploy --only database
```
(ou cole o `database.rules.json` inteiro em Console → Realtime Database → Regras → Publicar.)

## 4. Deployar a Cloud Function
```
cd functions
npm install
cd ..
firebase deploy --only functions
```
Isso publica a função `notifyVisita`, que dispara quando uma visita é marcada e
manda o push para **gestores + master + o corretor dono** da visita.

## 5. Testar
- Abra o sistema no celular. Ele vai pedir **permissão de notificação** — aceite.
  (No **iPhone** só funciona se você **adicionar o site à tela de início** primeiro —
  Safari → Compartilhar → "Adicionar à Tela de Início" — e abrir por esse ícone.)
- Com o app **fechado**, peça para outro corretor marcar uma visita.
- O push deve chegar no aparelho do gestor (e no seu, se você for o dono).

## Como funciona (resumo técnico)
- `firebase-messaging-sw.js` (raiz): service worker que recebe o push em segundo plano.
- `index.html` → `AppPush`: registra o SW, pede permissão e salva o token do aparelho
  em `madrid_data/fcm_tokens/<emailKey>/<token>`.
- `functions/index.js` → `notifyVisita`: no `onCreate` de `madrid_data/agenda/<id>`,
  descobre os destinatários (masters + gestores + dono), busca os tokens e envia o FCM.
  Tokens inválidos/expirados são limpos automaticamente.
- **Privacidade:** o push usa só o nó `agenda` (corretor/data/hora/unidade) — que por
  regra **não pode** conter nome/telefone do cliente. A notificação nunca vaza PII.
