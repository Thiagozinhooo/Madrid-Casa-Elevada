#!/usr/bin/env node
/**
 * VALIDAR.JS — conferência automática antes de publicar (V394)
 * ---------------------------------------------------------------
 * Rode na pasta do projeto:      node validar.js
 *
 * Por que existe: cada versão deste app já foi corrigida por auditorias, e a
 * mesma classe de erro voltava depois. Este arquivo guarda as REGRAS que não
 * podem quebrar — se algo aqui falhar, NÃO publique.
 *
 * Ele NÃO precisa de internet, login nem instalação: só Node e os arquivos
 * do projeto. Adicione uma checagem nova sempre que corrigir um bug de novo.
 */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const ler = (arq) => fs.readFileSync(path.join(DIR, arq), 'utf8');
const idx = ler('index.html');
const lnd = ler('landing.html');
const agents = ler('agents.md');
const rulesRaw = ler('database.rules.json');
// privacidade.html é o canal exigido pela LGPD: se ela apontar pra um contato
// que não existe mais, a promessa legal fica sem lastro.
const priv = fs.existsSync(path.join(DIR, 'privacidade.html')) ? ler('privacidade.html') : null;

const erros = [];
const avisos = [];
const ok = [];
const checar = (nome, condicao, dica) => {
    if (condicao) ok.push(nome);
    else erros.push(nome + (dica ? '  → ' + dica : ''));
};

// ─────────────────────────────────────────────────────────────
// 1. VERSÃO — os 3 lugares precisam bater
// ─────────────────────────────────────────────────────────────
const mTitle = idx.match(/<title>Madrid Casa Elevada \| Premium V(\d+)<\/title>/);
const mConst = idx.match(/const CURRENT_APP_VERSION = "(\d+)";/);
const mLog = idx.match(/console\.log\("LOG: Versão Premium V(\d+)"\);/);
checar('versão no <title>', !!mTitle, 'o título precisa terminar com "Premium V###"');
checar('versão em CURRENT_APP_VERSION', !!mConst);
checar('versão no console.log', !!mLog);
if (mTitle && mConst && mLog) {
    checar('as 3 versões são iguais',
        mTitle[1] === mConst[1] && mConst[1] === mLog[1],
        `título=V${mTitle[1]} const=V${mConst[1]} log=V${mLog[1]}`);
}
const VERSAO = mConst ? mConst[1] : '???';

// ─────────────────────────────────────────────────────────────
// 2. O ARQUIVO ABRE? (sintaxe do JS e equilíbrio do HTML)
// ─────────────────────────────────────────────────────────────
[['index.html', idx], ['landing.html', lnd]].forEach(([nome, txt]) => {
    [...txt.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => {
        try { new Function(m[1]); }
        catch (e) { erros.push(`${nome}: erro de sintaxe no script ${i + 1} — ${e.message}`); }
    });
    const abre = (txt.match(/<div\b/g) || []).length;
    const fecha = (txt.match(/<\/div>/g) || []).length;
    checar(`${nome}: <div> equilibrados`, abre === fecha, `${abre} abertos vs ${fecha} fechados`);
});
try { JSON.parse(rulesRaw); ok.push('database.rules.json é um JSON válido'); }
catch (e) { erros.push('database.rules.json inválido: ' + e.message); }

// ─────────────────────────────────────────────────────────────
// 3. SIGILO — o repositório e o site são PÚBLICOS
// ─────────────────────────────────────────────────────────────
[['index.html', idx], ['landing.html', lnd], ['agents.md', agents]].forEach(([nome, txt]) => {
    // preços-base de unidade (formato 1234567.89) fora de comentário
    const semComentario = txt.split('\n').filter(l => !/^\s*(\/\/|\*|<!--)/.test(l)).join('\n');
    const precos = semComentario.match(/valor: \d{6,7}\.\d+/g) || [];
    checar(`${nome}: sem preço de unidade no código`, precos.length === 0,
        precos.length + ' preço(s) encontrado(s) — os valores vivem só no Firebase');
    // tabela de preços formatada (agents.md). Comentários explicativos não contam
    // — o que não pode é preço REAL de unidade servido ao visitante.
    const formatados = (semComentario.match(/\d\.\d{3}\.\d{3},\d{2}/g) || []);
    checar(`${nome}: sem tabela de preços formatada`, formatados.length === 0,
        formatados.slice(0, 3).join(', '));
    // dados de cliente
    ['SCHILLER', 'CHIAPETTI', 'BIRCK', 'VENTIMIGLIA', '28351926'].forEach(t => {
        if (txt.toUpperCase().includes(t)) erros.push(`${nome}: DADO DE CLIENTE no código ("${t}")`);
    });
    const cpfs = (txt.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/g) || []).filter(c => c !== '000.000.000-00');
    if (cpfs.length) erros.push(`${nome}: CPF no código (${cpfs.join(', ')})`);
});
checar('landing sem valores em R$', !/R\$/.test(lnd),
    'regra do gestor: nenhum valor financeiro na página pública');

// ─────────────────────────────────────────────────────────────
// 4. DINHEIRO — regras que já quebraram antes
// ─────────────────────────────────────────────────────────────
checar('multiplicador do INCC nunca fica nulo',
    /state\.globalMultiplier = \(isFinite\(m\) && m > 0\) \? m : 1;/.test(idx),
    'sem isso, toda a tela e o PDF saem R$ 0,00 (V390)');
checar('preço ausente vira travessão, não R$ 0,00',
    /precoTexto: \(v\) => \{ const n = Number\(v\); return \(isFinite\(n\) && n > 0\) \?/.test(idx));
checar('proposta bloqueada quando a unidade está sem preço',
    /if \(AppCore\.precoUnidade\(state\.selectedUnit\) === null\) \{/.test(idx));
checar('data de entrega em constante única',
    /const ENTREGA = \{ ano: \d{4}, mes: \d+, dia: \d+ \};/.test(idx),
    'não escrever a data solta — usar ENTREGA_BR / ENTREGA_ISO / ENTREGA_DATE');
checar('nenhuma parcela vence depois da entrega',
    (idx.match(/_capEntrega\(AppSim\._isoDate\(/g) || []).length === 3,
    'sinal, mensais e balões precisam passar pelo _capEntrega (V387)');
checar('colunas da tabela seguem o percentual, não o nome do plano',
    (idx.match(/const showM = pMensal > 0;/g) || []).length === 2,
    'plano "Personalizado" escondia parcelas na tela e no PDF (V392)');
checar('vaga avulsa reajusta com a tabela',
    /getExtraVagaUnit: \(\) => EXTRA_VAGA_PRICE \* \(state\.globalMultiplier \|\| 1\)/.test(idx),
    'decisão do gestor na V387');
checar('rótulo das vagas extras é único nos 3 documentos',
    (idx.match(/AppSim\._rotuloVagas\(d\)/g) || []).length === 3,
    'PDF, WhatsApp e Excel precisam contar a mesma história (V392)');

// ─────────────────────────────────────────────────────────────
// 5. NÃO PERDER TRABALHO
// ─────────────────────────────────────────────────────────────
checar('gravação da proposta tem prazo de resposta',
    /return Promise\.race\(\[confirmada, timeout\]\);/.test(idx),
    'sem isso o app fica "salvando" para sempre offline (V386)');
checar('logout de inatividade não descarta gravação em voo',
    /if \(AppDB\._gravacoesPendentes > 0 && adiamentos < MAX_ADIAMENTOS\)/.test(idx));
checar('adiamento do logout tem teto', /const MAX_ADIAMENTOS = \d+;/.test(idx),
    'sem teto a sessão nunca encerra (V391)');
checar('mudança de status confere quem mexeu antes',
    /\{ esperado: AppCore\._detStatusRender \}/.test(idx),
    'evita desfazer venda feita em outro acesso (V391)');
checar('reserva grava o status ANTES dos dados do cliente',
    /Promise\.race\(\[AppCore\.changeUnitStatus\(apt, 'reservado', \{ esperado: 'livre' \}\), prazo\]\)/.test(idx),
    'a ordem inversa apagava a reserva de outro gestor (V391)');
checar('cronograma da obra avisa antes de descartar',
    /Você tem alterações NÃO SALVAS no cronograma/.test(idx));

// ─────────────────────────────────────────────────────────────
// 6. CONTATO — se o número quebrar, o lead some sem ninguém notar
// ─────────────────────────────────────────────────────────────
// Números que o gestor já usou e desativou. Voltar a um deles manda o lead
// para uma linha que ninguém atende — e nada na tela denuncia isso.
const APOSENTADOS = ['5577988669009'];   // aposentado em 17/08/2026

// Pega a declaração REAL (ignora linha comentada): se alguém deixar a antiga
// comentada logo acima, um match simples leria o número velho e aprovaria tudo.
const linhasWa = lnd.split('\n')
    .filter(l => /const WHATSAPP_NUM = '\d+';/.test(l) && !/^\s*(\/\/|\*|<!--)/.test(l));
checar('o número de WhatsApp está declarado uma vez só', linhasWa.length === 1,
    linhasWa.length === 0
        ? "não achei a linha: const WHATSAPP_NUM = '55DDD9XXXXXXXX';"
        : `achei ${linhasWa.length} declarações ativas — o navegador nem carrega a página assim`);
const mWa = linhasWa.length === 1 ? linhasWa[0].match(/'(\d+)'/) : null;
if (mWa) {
    checar('número de WhatsApp no formato que o wa.me aceita',
        /^55\d{2}9\d{8}$/.test(mWa[1]),
        `"${mWa[1]}" — tem que ser 55 + DDD (2) + 9 + 8 dígitos, só números. ` +
        'Faltando o 9 do celular, o link abre em erro e TODO lead se perde calado');
    checar('não voltou para um número aposentado',
        !APOSENTADOS.includes(mWa[1]),
        `${mWa[1]} foi desativado — o gestor não atende mais nele`);
}
// Nenhum contato escrito na mão: wa.me com número fixo, api.whatsapp.com ou tel:
const contatosDuros = [
    ...(lnd.match(/wa\.me\/(?!\$\{WHATSAPP_NUM\})/g) || []),
    ...(lnd.match(/api\.whatsapp\.com/g) || []),
    ...(lnd.match(/tel:\+?\d/g) || []),
];
checar('todo botão de contato usa a mesma constante', contatosDuros.length === 0,
    `${contatosDuros.length} contato(s) na mão (${contatosDuros.join(', ')}) — use \${WHATSAPP_NUM}`);

if (mWa && priv) {
    const numsPriv = [...priv.matchAll(/wa\.me\/(\d+)/g)].map(m => m[1]);
    checar('a política de privacidade oferece um contato real',
        numsPriv.length > 0 && numsPriv.every(n => n === mWa[1]),
        numsPriv.length === 0
            ? 'privacidade.html não tem link de WhatsApp — a LGPD pede um canal que funcione'
            : `privacidade.html aponta para ${[...new Set(numsPriv)].join(', ')} em vez de ${mWa[1]}`);
}

// O book em PDF é baixado e REENCAMINHADO por fora do site: se ele guardar o
// número velho, trocar a constante não adianta e ninguém percebe. O jsPDF grava
// o texto sem compressão, então dá para conferir lendo o binário.
const bookArq = path.join(DIR, 'book-madrid.pdf');
if (mWa && fs.existsSync(bookArq)) {
    const pdf = fs.readFileSync(bookArq, 'latin1');
    const semDDI = mWa[1].slice(2);                       // 77981346775
    const impressos = [...pdf.matchAll(/\((?:[^()\\]|\\.)*\)\s*Tj/g)]
        .map(m => m[0].slice(1, m[0].lastIndexOf(')')))
        .filter(t => /\d{4}\s?-\s?\d{4}/.test(t));        // o que parece telefone
    const errados = impressos.filter(t => t.replace(/\D/g, '') !== semDDI);
    checar('o book em PDF traz o número atual',
        impressos.length > 0 && errados.length === 0,
        impressos.length === 0
            ? 'o book não imprime telefone nenhum — quem baixa fica sem contato'
            : `o book imprime "${errados.join('" / "')}" — regere com scratchpad/gerar_book.js`);
    checar('o número do book é clicável e aponta pro atual',
        pdf.includes('/URI (https://wa.me/' + mWa[1] + ')'),
        'a anotação de link do PDF ficou com outro número (ou sumiu)');
}

// Lê uma constante de configuração do HTML. Aceita aspas simples, duplas ou
// crase, com espaçamento livre, e IGNORA linha comentada.
//
// Por que tanto cuidado: a primeira versão desta função só aceitava um tipo de
// aspa. Quem colasse o ID com o outro tipo — a convenção usada no MESMO arquivo,
// duas linhas acima — fazia a checagem "não encontrar" e concluir DESLIGADO.
// Ou seja: o portão aprovava exatamente o que ele existe para barrar. Agora,
// "não encontrei" é ERRO, nunca "está desligado" (falha fechada, não aberta).
const lerConst = (txt, nome) => {
    const linhas = txt.split('\n')
        .filter(l => !/^\s*(\/\/|\*|<!--)/.test(l))
        .filter(l => new RegExp('const\\s+' + nome + '\\s*=').test(l));
    if (linhas.length !== 1) return { achou: false, quantas: linhas.length, valor: null };
    const m = linhas[0].match(new RegExp('const\\s+' + nome + '\\s*=\\s*([\'"`])([\\s\\S]*?)\\1'));
    return m ? { achou: true, quantas: 1, valor: m[2].trim() } : { achou: false, quantas: 1, valor: null };
};

// A política de privacidade é linkada pela landing e pelo sitemap. Sumir com
// ela deixa dois links mortos numa página que promete LGPD — isso é erro.
checar('privacidade.html existe', priv !== null,
    'a landing e o sitemap.xml apontam para ela — sem o arquivo, os links morrem');

// App Check só pode ser exigido no console quando as DUAS páginas mandam token.
// Com a chave só no app dos corretores, ligar a exigência apaga o cronograma da
// landing e recusa o formulário de lead — e nada no código denuncia isso.
const acApp = lerConst(idx, 'APP_CHECK_SITE_KEY');
const acLnd = lerConst(lnd, 'APP_CHECK_SITE_KEY');
checar('as duas páginas têm o campo do App Check',
    acApp.achou && acLnd.achou,
    'não achei uma declaração única de APP_CHECK_SITE_KEY em ' +
    (!acApp.achou ? `index.html (${acApp.quantas} linha[s])` : `landing.html (${acLnd.quantas} linha[s])`));
if (acApp.achou && acLnd.achou) {
    checar('a chave do App Check é a mesma nas duas páginas', acApp.valor === acLnd.valor,
        acApp.valor && !acLnd.valor ? 'só o index.html tem a chave — exigir App Check derruba a landing pública'
            : (!acApp.valor && acLnd.valor ? 'só a landing tem a chave — o app dos corretores fica de fora'
                : 'as chaves são diferentes'));

    if (acApp.valor && acApp.valor === acLnd.valor) {
        // Chave preenchida = App Check vai pra valer. Três coisas precisam estar
        // no lugar ANTES de o dono marcar "Enforced" no console, e nenhuma delas
        // aparece na tela quando falta: o site simplesmente para de ler o banco.
        const SDK = 'firebase-app-check-compat.js';
        checar('o SDK do App Check está nas duas páginas',
            idx.includes(SDK) && lnd.includes(SDK),
            'falta a tag <script> do ' + SDK + ' em ' + (idx.includes(SDK) ? 'landing.html' : 'index.html') +
            ' — com a chave preenchida e sem o SDK, a página não gera token e o banco recusa tudo');
        const csp = (idx.match(/Content-Security-Policy"\s+content="([\s\S]*?)"/) || [])[1] || '';
        const bloco = (nome) => (csp.match(new RegExp(nome + '([^;]*)')) || [])[1] || '';
        checar('a CSP do app libera o reCAPTCHA',
            bloco('script-src').includes('https://www.google.com') &&
            bloco('frame-src').includes('https://www.google.com'),
            'o reCAPTCHA v3 carrega de www.google.com; sem ele em script-src E frame-src ' +
            'a CSP bloqueia calado e NENHUM corretor consegue usar o app com App Check exigido');
        checar('o reCAPTCHA está declarado na política de privacidade',
            !!priv && /reCAPTCHA/i.test(priv),
            'App Check ligado usa o reCAPTCHA do Google, que grava cookie — a política precisa dizer isso');
    }
    if (!acApp.valor && !acLnd.valor) ok.push('App Check preparado nas duas páginas, ainda desligado');
}

// Rastreamento não declarado é problema de LGPD, não de código: se o ID estiver
// preenchido, a política PRECISA citar o serviço antes de a página ir ao ar.
const medicao = [
    { const: 'GA_ID', nome: 'Google Analytics', termos: ['Google Analytics', 'GA4'] },
    { const: 'PIXEL_ID', nome: 'Meta (Facebook) Pixel', termos: ['Facebook', 'Meta Pixel', 'Meta (Facebook)'] },
];
medicao.forEach(m => {
    const c = lerConst(lnd, m.const);
    checar(`o campo ${m.const} existe uma vez só na landing`, c.achou,
        `não achei uma declaração única de ${m.const} — sem ela eu não consigo saber se ` +
        'o rastreamento está ligado, e não vou aprovar no escuro');
    if (!c.achou) return;
    if (!c.valor) { ok.push(`${m.nome} desligado (nenhum cookie criado)`); return; }
    checar(`${m.nome} está declarado na política de privacidade`,
        !!priv && m.termos.some(t => priv.includes(t)),
        `${m.const} está preenchido, mas privacidade.html não cita "${m.termos[0]}" — ` +
        'ligar rastreamento sem declarar é o tipo de coisa que a LGPD pune');
});

// A grade da galeria usa fotos-mini/. Adicionar foto em galleryFiles sem rodar
// `node gerar-miniaturas.js` deixa um quadrado quebrado no site publico — e o
// erro so aparece para quem visita, nunca para quem publicou.
(function () {
    const ini = lnd.indexOf('galleryFiles');
    const fim = lnd.indexOf('];', ini);
    if (ini < 0 || fim < 0) { erros.push('não achei a lista galleryFiles na landing.html'); return; }
    const fotos = [...new Set([...lnd.slice(ini, fim).matchAll(/src: *['"`]([^'"`]+)['"`]/g)].map(m => m[1]))];
    checar('a galeria tem fotos listadas', fotos.length > 0);
    const semMini = fotos.filter(f => !fs.existsSync(path.join(DIR, 'fotos-mini', f.replace(/[.](jpeg|png)$/i, '.jpg'))));
    checar('toda foto da galeria tem miniatura', semMini.length === 0,
        semMini.length + ' sem miniatura (' + semMini.slice(0, 4).join(', ') + ') — rode: node gerar-miniaturas.js');
    const semOriginal = fotos.filter(f => !fs.existsSync(path.join(DIR, f)));
    checar('toda foto da galeria tem o arquivo original', semOriginal.length === 0,
        'o lightbox abre o original: ' + semOriginal.slice(0, 4).join(', ') + ' não existe(m)');
    checar('a grade usa a miniatura, não o arquivo grande',
        lnd.includes('<img src="${miniatura(g.src)}"'),
        'a grade voltou a apontar para o original — 8 MB por visita');
})();

// O resto deste arquivo confere o DISCO. Mas o site é servido pelo GitHub Pages
// a partir do que está no REPOSITÓRIO: arquivo que existe aqui e não foi
// versionado responde 404 no ar. Foi exatamente o risco das miniaturas — a pasta
// fotos-mini/ nasceu fora do versionamento e todas as checagens passavam, porque
// olhavam a máquina que já funciona em vez de olhar o que vai ao ar.
(function () {
    let rastreados = null;
    try {
        const saida = require('child_process').execSync('git ls-files -z', {
            cwd: DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 8 * 1024 * 1024
        });
        rastreados = new Set(saida.split(' ').map(x => x.trim()).filter(Boolean));
    } catch (e) { rastreados = null; }

    if (!rastreados || rastreados.size === 0) {
        avisos.push('não consegui perguntar ao git quais arquivos estão versionados — confira à mão se todo arquivo novo entrou no commit');
        return;
    }

    // todo arquivo local que a landing referencia
    const refs = new Set();
    const juntar = (re, grupo) => { for (const m of lnd.matchAll(re)) refs.add(m[grupo]); };
    juntar(/src="([^"${}]+.(?:jpe?g|png|mp4|pdf))"/gi, 1);
    juntar(/href="([^"${}]+.(?:jpe?g|png|mp4|pdf))"/gi, 1);
    juntar(/src: *['"`]([^'"`${}]+[.](?:jpe?g|png))['"`]/gi, 1);
    // as miniaturas correspondentes (a grade monta o caminho por JS)
    [...refs].forEach(f => {
        if (f.indexOf('fotos-mini/') === 0) return;
        const mini = 'fotos-mini/' + f.replace(/[.](jpeg|png)$/i, '.jpg');
        if (fs.existsSync(path.join(DIR, mini))) refs.add(mini);
    });

    const fora = [...refs].filter(f => !rastreados.has(f));
    checar('todo arquivo que a landing usa está versionado', fora.length === 0,
        fora.length + ' fora do repositório (' + fora.slice(0, 5).join(', ') + ') — existe aqui, mas daria 404 no ar. Rode: git add -A');

    ['gerar-miniaturas.js', 'validar.js', 'privacidade.html'].forEach(f => {
        if (fs.existsSync(path.join(DIR, f))) {
            checar(f + ' está versionado', rastreados.has(f),
                'existe na sua máquina mas não no repositório — some para quem clonar');
        }
    });
})();

// ─────────────────────────────────────────────────────────────
// 7. ACESSO
// ─────────────────────────────────────────────────────────────
checar('endereço curto leva o visitante à landing',
    /window\.__madridIndoLanding = true;/.test(idx) && /location\.replace\('landing\.html'\);/.test(idx));
checar('recarregamento de versão preserva o passe do corretor',
    /q\.set\('app', '1'\);/.test(idx));
checar('aprovação de acesso dá papel de corretor (nunca gestor)',
    /database\.ref\('madrid_data\/permissions\/' \+ enc\)\.set\(\{ email: email, role: 'corretor' \}\)/.test(idx));
checar('gestor não consegue se auto-rebaixar/remover',
    (idx.match(/Você não pode rebaixar a própria conta/g) || []).length === 2 &&
    /Você não pode remover a própria conta/.test(idx));

// ─────────────────────────────────────────────────────────────
// 8. REGRAS DO FIREBASE — sintaxe que o motor aceita
// ─────────────────────────────────────────────────────────────
if (/indexOf\(|numChildren\(/.test(rulesRaw)) {
    erros.push('database.rules.json usa indexOf/numChildren — o motor de regras NÃO tem esses métodos (o publish falha)');
} else ok.push('rules sem métodos inexistentes (indexOf/numChildren)');
(function () {
    const expr = [];
    (function varre(no) {
        if (!no || typeof no !== 'object') return;
        Object.keys(no).forEach(k => {
            if (['.read', '.write', '.validate'].includes(k) && typeof no[k] === 'string') expr.push(no[k]);
            else if (!k.startsWith('.')) varre(no[k]);
        });
    })(JSON.parse(rulesRaw).rules);
    const desbalanceadas = expr.filter(e => {
        let n = 0;
        for (const c of e) { if (c === '(') n++; else if (c === ')') n--; if (n < 0) return true; }
        return n !== 0;
    });
    checar('rules com parênteses equilibrados', desbalanceadas.length === 0,
        desbalanceadas.length + ' expressão(ões) quebrada(s)');
})();

// ─────────────────────────────────────────────────────────────
// 9. AVISOS (não impedem publicar)
// ─────────────────────────────────────────────────────────────
const versaoAgents = (agents.match(/Versão do sistema: V(\d+)/) || [])[1];
if (versaoAgents && VERSAO !== '???' && Math.abs(Number(versaoAgents) - Number(VERSAO)) > 3) {
    avisos.push(`agents.md está em V${versaoAgents} e o app em V${VERSAO} — atualize o manual que a IA lê primeiro`);
}
const planta = path.join(DIR, 'PLANTA_3_SUITES.jpeg');
if (fs.existsSync(planta) && fs.statSync(planta).size > 600 * 1024) {
    avisos.push('PLANTA_3_SUITES.jpeg está pesada (>600 KB) — otimize antes de publicar');
}

// ─────────────────────────────────────────────────────────────
// RESULTADO
// ─────────────────────────────────────────────────────────────
console.log(`\nMadrid Casa Elevada — conferência da V${VERSAO}`);
console.log(`${ok.length} verificações passaram.`);
if (avisos.length) {
    console.log('\nAVISOS (dá pra publicar, mas olhe):');
    avisos.forEach(a => console.log('  ! ' + a));
}
if (erros.length) {
    console.log('\n❌ NÃO PUBLIQUE — problemas encontrados:');
    erros.forEach(e => console.log('  - ' + e));
    process.exit(1);
}
console.log('\n✅ Tudo certo. Pode publicar.\n');
