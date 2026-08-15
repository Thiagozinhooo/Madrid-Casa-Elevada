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
// 6. ACESSO
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
// 7. REGRAS DO FIREBASE — sintaxe que o motor aceita
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
// 8. AVISOS (não impedem publicar)
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
