# 🏗️ AGENTS.MD — Diretrizes do Sistema Tabela Madrid

> **Documento de referência obrigatória para qualquer agente IA ou desenvolvedor.**
> Última atualização: 2026-08-19 | Versão do sistema: V397

## 🔴 ANTES DE PUBLICAR QUALQUER MUDANÇA

```
node validar.js
```

São 57 verificações do que já quebrou neste projeto (versão nos 3 lugares, sintaxe,
sigilo, regras de dinheiro, "não perder trabalho", acesso, contato, medição,
App Check, fotos da galeria, versionamento dos arquivos e sintaxe das rules do
Firebase). Ele responde **"Pode publicar"** ou lista exatamente o que impede.
Não precisa de internet nem login. **Se falhar, não publique.**

Outras duas regras que este projeto aprendeu na prática:

1. **Toda alteração passa por revisão adversarial antes do deploy.** Entre a V386 e a
   V396, as revisões acharam mais defeitos NAS CORREÇÕES do que nas auditorias do
   código antigo — três vezes o defeito era o oposto do que a correção prometia
   (um redirecionamento que nunca acontecia, uma reserva que apagava a de outro
   gestor, uma "correção de contraste" que piorou o contraste).
2. **Defeito que só aparece rodando, teste rodando.** Zoom do iOS, redirecionamento,
   coluna fora da tela: valide no navegador, não só no código.

## ⚠️ LEIA ANTES: o que mudou desde a V386 (auditoria de 2026-08-13)

Este arquivo estava 30 versões atrasado e afirmava coisas que o código já não fazia.
As correções abaixo VALEM sobre qualquer texto mais antigo neste documento:

| Assunto | Verdade atual |
|---------|---------------|
| **Preços das unidades** | **NÃO ficam no código.** `DEFAULT_UNITS` tem só estrutura (tipo, áreas, vaga, escaninho, pavimento); `valor` vive apenas em `madrid_data/units` (Firebase). O `index.html` é servido a qualquer visitante e o repo é público. Sem preço no banco o app avisa e mostra "—", nunca R$ 0,00. Recuperação: GESTÃO → Manutenção avançada → "Enviar tabela de preços". (V390) |
| **Vaga avulsa** | **REAJUSTA junto com a tabela** (base × `globalMultiplier`) — decisão do gestor na V387. O texto antigo dizia "preço fixo, não sofre globalMultiplier": está ERRADO. |
| **Parcelas** | Nenhuma vence depois da entrega. Teto do select = `getMensalMax()`; a garantia dura é `_capEntrega` no `generateSchedule`. (V387) |
| **Data de entrega** | Constante única `ENTREGA` no topo do script (`ENTREGA_DATE`/`ENTREGA_ISO`/`ENTREGA_BR`/`ENTREGA_MES_ANO`). Não escrever data solta em lugar nenhum. (V394) |
| **Reservas** | **NÃO expiram sozinhas** desde a V343: `expiresAt` é só o limiar do aviso de 7 dias. `checkExpiredReservations` é apelido de `checkOldReservations` e só notifica. |
| **`public_stats`** | **Removido** na V370 — o app APAGA o nó a cada gatilho de gestor. A landing não mostra número de vendas (regra do gestor: nenhum valor financeiro público). |
| **Comparador "vs aluguel"** | **Removido** da landing por ordem do gestor. Não recolocar. |
| **Cadastro de corretor** | Existe **auto-cadastro com aprovação** (V388): a pessoa cria a conta na tela de login, cai em "Acesso aguardando liberação" e o gestor libera na aba EQUIPE ("Solicitações de acesso"). Aprovar dá papel de **corretor**; gestor só por promoção manual. O texto antigo ("o sistema NÃO faz auto-registro / signOut imediato") está ERRADO. |
| **Endereço curto** | `madridcasaelevada.com` manda **todo mundo** para a **landing**, inclusive quem já entrou no app neste aparelho. O app só abre com passe explícito: `?app=1` (link "Sou corretor") ou **exatamente** `#agenda` (deep-link do push). Qualquer outra âncora (`/#galeria`) vai para a landing COM a âncora — antes jogava o cliente na tela de login. (V397) A marca `madrid_equipe` **foi removida** em 18/08/2026 — o gestor pediu que o endereço sempre caia na landing, e ela era o caminho pelo qual um estranho no computador do plantão caía dentro do sistema sem digitar nada (achado 3 da auditoria de segurança). O portão agora **apaga** a marca dos navegadores que já a tinham. Os 4 caminhos foram testados no navegador. (V390, revisto em 18/08/2026) |
| **Contratos/VGV** | Fonte é o **cofre** `proposals/zz_vendas_reais` (o nó `madrid_data/vendas` é legado e perde a prioridade). Importação: GESTÃO → "Importar/atualizar contratos". Distrato (unidade que deixou de estar vendida) sai dos KPIs e fica marcado na lista. (V389/V392) |
| **Permuta/FGTS** | **Sem trava**, por decisão do gestor — pode passar do valor do imóvel. O campo "Destino pretendido" é ANOTAÇÃO: o abatimento é sempre sobre o saldo total. Lembrar o gestor a cada atualização. |
| **`AppLeads` / `AppPerf`** | **Apagados na V365.** As tabelas mais abaixo ainda os citam — ignore; voltar a ter leads significa reescrever, não "reativar". |
| **Mensagens do site** | O formulário da landing grava em `leads_inbox` e o gestor lê no card "Mensagens do site" (aba GESTÃO). Quem tem `interesse: 'ACESSO_APP'` é pedido de acesso, não mensagem. A ordem usa a CHAVE do Firebase (o campo `ts` é escolhido pelo visitante e não é confiável). (V395) |
| **Política de privacidade** | `privacidade.html` — exigida pela LGPD, linkada no formulário e no rodapé, e no sitemap. Se mudar o que o site coleta (hoje: nome, telefone, e-mail, interesse, mensagem, data, user agent e referrer) ou embutir outro serviço de terceiros, **atualize a página — e a data do topo junto**, que a própria política promete isso. (V395) |
| **Data de entrega** | Constante `ENTREGA` no topo do script → `ENTREGA_DATE` / `ENTREGA_ISO` / `ENTREGA_BR` / `ENTREGA_MES_ANO`. Nunca escrever data solta. (V394) |
| **Valor Total** | Uma função só: `AppSim._valorTotal()` (usada por `_currentPrice`, `calculate` e `_getProposalData`). Não repetir a fórmula. (V394) |
| **Histórico do Git** | Consolidado em 15/08/2026 num commit único para tirar preços e 141,5 MB de imagens do repositório público. As mensagens dos 335 commits antigos estão em `HISTORICO.md`. |
| **Fotos da galeria** | A grade usa **`fotos-mini/`** (900×675, ~83 KB cada); o **original** só é baixado quando a pessoa amplia. Trocar ou acrescentar foto em `galleryFiles` exige rodar **`node gerar-miniaturas.js`** e **commitar a pasta** — o `validar.js` reprova se faltar miniatura, se faltar o original, se a grade voltar a apontar para o arquivo grande, **ou se algum arquivo usado pela landing não estiver versionado** (essa última nasceu porque `fotos-mini/` quase foi publicada fora do repositório: tudo funcionava na máquina e a galeria daria 404 no ar). Antes: 8,05 MB por visita; agora: 1,54 MB. (18/08/2026) |
| **Originais em alta** | Logos e a foto do topo foram recomprimidos no lugar. Os originais em alta resolução ficaram em **`C:\Projetos\_originais_madrid`**, fora do repositório — é a única cópia. Precisa de logo para impressão ou placa de obra? É lá. (18/08/2026) |
| **Imagens originais** | Os `.png` de alta resolução saíram do repositório (`.gitignore`) — o site usa os `.jpg` otimizados. Não recommitar os originais. (V396) |
| **App Check** | Preparado nas **duas** páginas (`APP_CHECK_SITE_KEY`, hoje vazio = desligado). Ligar exige 4 coisas juntas, e o `validar.js` reprova se faltar qualquer uma: (1) a MESMA chave nos dois arquivos, (2) o `firebase-app-check-compat.js` nos dois, (3) `https://www.google.com` em `script-src` **e** `frame-src` da CSP do `index.html` — senão o reCAPTCHA é bloqueado calado e nenhum corretor entra, (4) o reCAPTCHA declarado na `privacidade.html`. Só depois de publicado é que se marca "Enforced" no console. A chave tem que ser reCAPTCHA **v3 clássica** (console do App Check), não Enterprise. (17/08/2026) |
| **Medição (GA4 / Pixel)** | `GA_ID` e `PIXEL_ID` no fim do script da `landing.html`, vazios = desligados (nada é baixado, nenhum cookie). Preencher um deles **obriga** a `privacidade.html` a citar o serviço — o `validar.js` reprova senão. O leitor de constantes (`lerConst`) aceita aspas simples, duplas e crase e **falha fechado**: se não achar a constante, é erro, nunca "está desligado". A 1ª versão só aceitava aspas simples e aprovava rastreamento não declarado. (17/08/2026) |
| **Datas de parcela (V400, decisão do gestor 21/08/2026)** | `AppSim._addMonths` faz clamp: mês destino sem o dia → **último dia do mês** (31/01+1 = 28/02; bissexto = 29/02). Antes transbordava (31/01+1 = 03/03) — fevereiro sem parcela e março com duas, no PDF do cliente. Dias 1–28 idênticos ao comportamento antigo. O `validar.js` pina o clamp. NÃO reverter achando que é "simplificação". No mesmo lote: `removeUser` lembra o **2º passo da demissão** (Disable no Auth — sem ele a conta demitida segue lendo/apagando a própria carteira). Rules V398/V399 **publicadas em 21/08/2026** via CLI (deploy `released successfully`); primeiro backup rodado no mesmo dia (`Documents\Backups Madrid\`). |
| **Classes recorrentes com guarda (V399)** | Três padrões que já quebraram 2+ vezes agora têm UM lugar canônico e checagem no `validar.js`: **(1) link de WhatsApp** — todo link com número sai de `AppAuthManager._linkWhats` (zero no DDD quebrava o número; voltou 3×); **(2) chave de e-mail** — todo encode sai de `AppUtils.chaveEmail` (a regex era copiada inline 24×; acoplar à forma da regex já criou buraco 3×); **(3) guarda de gestor** — `AppAuthManager._exigeAdmin()`. NÃO copiar essas expressões inline: o validador reprova. Também V399: mensagens de timeout são HONESTAS (transação RTDB continua na fila após o prazo — nunca escrever "nada foi alterado" em catch de timeout); troca de e-mail na EQUIPE é atômica (update multi-caminho); `saveVisit` tem trava de voo; rascunho da OBRA conta como pendência no beforeunload e no logout por inatividade. (20/08/2026) |
| **Nome nas contas (V398)** | Cada entrada de `/permissions` pode ter um campo `nome` (2–80 letras) — é o que a aba EQUIPE, o crachá do topo e o pedido de acesso mostram. **Toda gravação de permissão passa por `AppAuthManager._entradaPermissao()`**, que preserva o nome existente quando quem chama não mandou um novo — um `set({...})` cru apagaria o nome em silêncio (o `validar.js` reprova). O cadastro grava o nome no pedido ACESSO_APP **e** no `displayName` do Firebase Auth (lista do console); a aprovação copia o nome do pedido pra permissão. Qualquer conta **já aprovada** corrige o próprio nome pelo lápis do topo (`AppAuth.mudarMeuNome`) — a rule `permissions/$emailKey/nome` libera só esse campo pro dono **e exige `data.parent().child('role').exists()`**: sem isso, escrever o nome MATERIALIZAVA a entrada e todas as leituras que liberam por `.exists()` (units, statusMap, reservas, agenda, master_admins) abriam pra conta não aprovada — achado gravidade 9 da revisão da V398, **nunca remover essa condição**. O validate repete a tranca (`newData.parent().child('role').exists()`). Precisa do deploy das rules; antes disso o botão avisa e o gestor corrige pela EQUIPE. Masters não têm entrada em permissions: aparecem só com e-mail. (19/08/2026) |
| **Número de atendimento** | Hoje: **(77) 9 8134-6775** (`5577981346775`). Vive em `WHATSAPP_NUM` no topo do script da `landing.html` e alimenta os 7 botões da página (flutuante, topo, galeria, obra, rodapé, barra do celular e o pós-formulário). **Mas existem mais 2 cópias fora da landing:** o `book-madrid.pdf` (última página, "Vamos conversar?") e a `privacidade.html` (2 links). Trocar o número = mudar a constante **+ regerar o book** com `scratchpad/gerar_book.js` **+ os 2 links da privacidade**. O `validar.js` (seção CONTATO) confere os três e reprova a publicação se divergirem — inclusive lendo o binário do PDF. Formato obrigatório: 55 + DDD + 9 + 8 dígitos. Nunca escrever `wa.me/` com número na mão. (17/08/2026 — sem número de versão: o `index.html` não mudou) |
| **Documentação fora do site** | O GitHub Pages monta o site com **Jekyll**, e o `_config.yml` (V397) **exclui do site** — mas não do repositório — `agents.md`, `HISTORICO.md`, `SECURITY-SETUP.md`, `database.rules.json`, `publicar-regras.cmd`, `backup-madrid.cmd`, `validar.js`, `gerar-miniaturas.js`, `firebase.json` e `functions/`. Antes tudo isso respondia 200 em `madridcasaelevada.com/` (com a conta dona do banco e um preço em R$ dentro). O `validar.js` reprova se o exclude perder um item — ou se excluir por engano uma página/foto do site. Arquivo novo servido? Lembre que ele nasce PÚBLICO. |
| **Cronograma na landing** | Lê com **`.once`**, nunca `.on` (V397): o `.on` segurava 1 conexão por visitante no teto de 100 do plano Spark — o MESMO teto do app. Um grupo de WhatsApp com o link derrubava a tabela no stand. A aba relê no `visibilitychange`. O `validar.js` reprova se o `.on` voltar. |
| **Contato escrito no HTML** | Desde a V397 os 7 botões têm `href="https://wa.me/NUMERO"` literal (fallback sem-JS; eram `href="#"` — sem JS nenhum botão funcionava) e o rodapé mostra o número por extenso + `tel:`. A regra do validar mudou de "proibido escrever o número" para "**todo número escrito TEM que ser o da constante**" — trocar o número continua exigindo mexer em todos, senão reprova. |
| **Sino / visitas** | O sino tem bloco fixo **HOJE** no topo (dourado, imune ao "marcar lido", some sozinho amanhã) e **não lista mais visitas passadas** (V397). Motivo: ordenava por `criadoEm` e uma visita marcada há 3 semanas pra hoje ficava no fim, atrás de visitas já ocorridas. Enquanto o push (VAPID) estiver desligado, o sino é o ÚNICO aviso de visita que existe. |
| **Backup do banco** | `backup-madrid.cmd` (V397): duplo clique → baixa o banco INTEIRO para `Documentos\Backups Madrid\madrid-backup-AAAA-MM-DD.json` (FORA do repo; `.gitignore` bloqueia o padrão por segurança). O plano Spark não tem backup automático — sem isso, qualquer apagamento é irreversível. Cobrar o gestor 1×/mês e lembrar de subir ao Drive. |
| **Rules V397 preparadas, NÃO publicadas** | `database.rules.json` já traz: `leads_inbox` com lista fechada de campos (`$other: false`, + campo `utm`), `logs` sem apagamento (cada um escreve só o próprio, delete negado), `price_history` só-acrescenta e assinado por `auth.token.email`. **Vale no ar só depois do duplo clique no `publicar-regras.cmd`.** A landing já manda `utm` — as rules VIVAS aceitam (não têm $other), e as novas têm o campo na lista; o validar confere esse alinhamento. |
| **UTM nos leads** | A landing captura `utm_source/medium/campaign` da URL do anúncio na chegada (sessionStorage `madrid_utm`) e grava no lead como `utm` (máx 160, sanitizado). Sem isso o gestor não sabia qual campanha pagou a conta — Instagram/WhatsApp não mandam referrer. |

## V337 — Vaga extra (avulsa) na proposta

Card opcional no simulador para adicionar **vaga(s) de garagem extras** à proposta:

- **Preço base R$ 55.000,00 por vaga** (constante `EXTRA_VAGA_PRICE`) — ⚠️ **corrigido na
  V387**: a vaga **É reajustada** pelo `globalMultiplier`, igual aos apartamentos
  (`AppSim.getExtraVagaUnit()`). O texto original desta linha dizia o contrário.
- **8 vagas avulsas disponíveis** na garagem (52, 53, 54, 55, 56, 57, 58, 28) — não
  alocadas a unidades.
- Select de 1 a 3 vagas extras. Quantidade salva em `state.extraVagas`.
- O valor é **somado ao preço total da proposta** e **distribuído no mesmo plano**
  de pagamento (sinal / mensais / balões / chaves).
- PDF mostra breakdown: "Valor da Unidade + Vaga Adicional Avulsa = Valor Total".
- Persistido em `sessionStorage` (sobrevive troca de aba).

⚠️ **Não confundir com `propostas_especiais`** (permuta/FGTS) — aquelas ABATEM do
total; vaga extra ADICIONA ao total.

## V335 — Rua contínua em "E" rotacionada

Reformulação do asfalto da garagem para formar um **circuito contínuo** ligando todas
as fileiras de vagas ao portão:

- **Nova classe `.road-track`** (substitui a `.via-asfalto` antiga, que agora é só alias).
  Variantes `.road-h` (horizontal) e `.road-v` (vertical) compartilham o mesmo gradient
  de asfalto, então visualmente formam uma única via.
- **4 vias horizontais** por pavimento (entre `tRowTop`, ilha, `tRowBot`, e uma nova
  4ª via abaixo de `tRowBot` fechando o circuito).
- **1 coluna vertical de asfalto** entre `flex:1` e a coluna do portão, com `align-self:
  stretch` — conecta as 4 horizontais.
- **Cotovelo "L"** na coluna do portão: a via curta acima do portão sai da vertical até
  o portão.
- **Faixas amarelas centrais** (cor de via principal) tanto nas horizontais quanto
  na vertical.
- **Setas de fluxo** apontam direção do tráfego: → nas horizontais (para o portão), ↑
  na vertical (saída).
- Posições de vagas, escaninhos e portão **INALTERADAS** (validado por script — 12
  arrays preservadas byte-a-byte).

## V334 — Redesign visual da garagem

- **Garagem premium**: novo CSS (`.garage-canvas`, `.vaga-v2`, `.via-asfalto`, `.portao-v2`,
  `.escaninho-v2`) substitui o visual antigo `.vaga-blueprint` / `.via-circulacao-blueprint`
  no `renderGarageMap`. As **posições e ordens dos arrays continuam idênticas** (`tRowTop`,
  `tIslTop`, `tIslBot`, `tRowBot`, `tRight`, `sRow*`, `eRow*`).
- **Header com KPIs por pavimento**: cada bloco (Térreo / Subsolo / Escaninhos) ganha um card
  superior com ícone gigante, eyebrow dourado, título serifado e 4 KPIs em pílulas (Total /
  Livres / Reservadas / Vendidas) — calculados dinamicamente.
- **Vagas com profundidade**: gradient diagonal + inset shadows multi-camada, animação
  `vagaPulse` 3,5s nas livres pra chamar atenção, hover com lift de 6px + glow colorido.
  Vendidas ganham hatching diagonal por cima.
- **Asfalto realista** (`.via-asfalto`): faixas amarelas centrais, setas de fluxo animadas
  (`@keyframes arrowGlide`), efeito de "sulco" via gradient lateral.
- **Portão redesenhado** (`.portao-v2`): listras horizontais tipo porta basculante metálica,
  LED verde piscante (`@keyframes portaoBlink`) sinalizando entrada ativa.
- **Pilares estruturais decorativos** nos 4 cantos do canvas (sem cobrir vagas reais).
- **Subsolo escurecido** (`.is-subsolo`): tom mais profundo + indicador `-3,00m`.
- **Mini-mapa flutuante** (`.minimap`) no canto inferior direito de cada canvas — primeiras 32
  vagas coloridas por status.
- **Legenda em pílulas** (`.garage-legend-v2`) com glow nos dots.
- **Escaninhos** ganham trincos laterais e gradient.
- Tudo respeita `@media (prefers-reduced-motion: reduce)`.

## V333 — Novidades

- **`landing.html`**: landing pública (sem login) com hero, galeria, plantas, ~~comparador "vs aluguel"~~ (REMOVIDO por ordem do gestor),
  cronograma de obra ao vivo, formulário de lead, WhatsApp flutuante, easter egg (Konami code),
  SEO/OG/JSON-LD.
- **Reserva com TTL**: `madrid_data/reservas/<apt> = { user, expiresAt, createdAt, note }`. Reservas
  ~~expiram automaticamente após 24/48/72h~~ — **desde a V343 NÃO expiram**: `expiresAt` é só o limiar do aviso de 7 dias e o gestor decide o que fazer.
- **`madrid_data/public_stats`**: contador público (`total`, `livre`, `reservado`, `vendido`,
  `vgv_total`, `vgv_disponivel`) atualizado automaticamente quando `statusMap` ou `globalMultiplier`
  mudam. Leitura aberta (rules: `.read: true`) — alimenta o hero da landing.
- **`madrid_data/cronograma`**: editado pelo gestor na aba **OBRA** dentro do app; lido em tempo real
  pela landing. Estrutura: `{ geral_percentual, proxima_etapa, etapas: [{nome, percentual, status, icone}] }`.
- **`madrid_data/leads_inbox`**: leads do formulário público (escrita anônima permitida com schema
  validado nas rules). O gestor vê a INBOX no topo da aba LEADS e clica **Aprovar** (move pra
  `madrid_data/leads`) ou **Rejeitar** (exclui).
- **Funil de conversão + ranking de corretor** na aba LEADS: barra de cada estágio, taxa de
  conversão, top 6 corretores por nº de propostas + comissão estimada (5%).
- ⚠️ **V356 — abas LEADS e DESEMPENHO REMOVIDAS da UI** (a pedido do gestor, pra liberar contas de
  corretor). Removidos: os 2 botões de nav, os painéis `tab-leads`/`tab-perf` e os listeners de
  `leads`/`leads_inbox`. O código dos módulos `AppLeads`/`AppPerf` (kanban, inbox, funil, metas) foi
  **mantido dormente** (não apagado) — reversível. Abas do gestor que permanecem: GESTÃO, EQUIPE, OBRA.
  **Consequência:** o formulário público da landing ainda grava em `leads_inbox`, mas **não há mais UI
  pra ver/aprovar** esses contatos — decidir se desativa o form da landing ou reintroduz só a inbox.
- **V357 — Countdown INCC + Minhas Propostas.** (1) Banner `#inccCountdown` (após a barra de abas,
  visível a todos) conta regressivamente até o dia `INCC_REAJUSTE_DAY` (1º) — puro client-side, sem
  backend; ajustar a const se a data real do reajuste for outra. (2) Aba **MINHAS PROPOSTAS**
  (`tab-minhas`, `not-admin-only` = só corretor) mostra as PRÓPRIAS propostas do corretor via
  `filterProposals` (agora escolhe container/busca por papel: gestor→`proposalsListContainer` em GESTÃO,
  corretor→`minhasPropostasContainer`). O corretor só lê o próprio path `proposals/<email>` (rule +
  listener) — não vê propostas de outros corretores.
- **V358 — "modo simples" pro corretor** (8 melhorias de usabilidade, baseadas em análise de mercado +
  workflow de 49 agentes). (1) `validateFields` bloqueia gerar proposta sem unidade (fim da falha
  silenciosa). (2) Estado vazio `#simEmptyState` "Passo 1 — Escolha a unidade" quando `!selectedUnit`
  (via `AppSim.updateSimGate`, chamado em selectApt/switchTab/init). (3) Progressive disclosure:
  parcelas dentro de "Ajustes de parcelas (avançado)" recolhido (`toggleAdvanced`/`#simAdvanced`),
  cronograma recolhido (`toggleCronograma`, `#scheduleList` display:none default), e campos de %
  de Mensais/Balões escondidos quando o plano não os usa (`applyPlanVisibility`, `#grpPctMensal`/
  `#grpPctBalao`). (4) CSS mobile do cronograma (grid-areas, nome não espreme mais). (5) CPF/Telefone
  com `inputmode="numeric"`. (6) Dica da tabela ensina "toque na linha da unidade". (8) "Salvar Excel"
  rebaixado a link discreto (PDF vira primário full-width). (9) Chip "MINHAS PROPOSTAS" → "PROPOSTAS".
- **V359 — WhatsApp envia o PDF anexado (Web Share).** `wa.me` NÃO anexa arquivo (só texto), então o
  envio usa `navigator.share({files:[pdf]})`: no celular abre o compartilhamento nativo, o corretor
  escolhe WhatsApp + contato e o PDF vai junto. A geração do PDF foi extraída para `AppSim._buildProposalDoc(d)`
  (retorna o doc jsPDF), reusada por `saveProposalPDF` e `sendWhatsApp`; `_proposalFileName(d)` dá o nome do
  arquivo. Fallback (`_whatsFallback`, desktop/sem Web Share): baixa o PDF + abre a conversa com o texto pro
  corretor anexar. Envio 100% automático (zero toque) exigiria WhatsApp Business API (backend + custo) — fora
  de escopo. Testar no CELULAR (Web Share é mobile).
- **GA4 + Meta Pixel**: infra montada em `<head>` (consts `_GA_MEASUREMENT_ID` e `_META_PIXEL_ID`
  no início do `<script>`). Vazias por padrão; preencher pra ativar.
- **SEO**: `robots.txt` (Allow landing, Disallow app interno), `sitemap.xml`, `<meta name="robots"
  content="noindex">` no app interno.

---

## 1. VISÃO GERAL DO PROJETO

Este é o **Sistema de Tabela de Vendas** do empreendimento imobiliário **Madrid Casa Elevada**.
- **Arquivo principal:** `index.html` (SPA monolítica — CSS + HTML + JS no mesmo arquivo)
- **Backend:** Firebase Realtime Database + Firebase Authentication
- **Empreendimento:** Torre residencial de 14 andares (sem 13º), 50 unidades, 2 fachadas
- **Razão Social:** TORRE MADRID EMPREENDIMENTOS IMOBILIARIOS SPE LTDA (CNPJ: 51.114.117/0001-37)
- **Previsão de Entrega:** Julho/2027
- **Validade da Tabela:** A partir de 01/01/2026

---

## 2. REGRAS INQUEBRÁVEIS

> ⚠️ **NUNCA modifique as seguintes estruturas sem autorização explícita do gestor.**

### 2.1 — Dados das Unidades (`DEFAULT_UNITS`)

São exatamente **50 unidades** (bloco `DEFAULT_UNITS` no index.html). Cada unidade possui:

> **V390 — os PREÇOS saíram do código.** O `index.html` é servido a qualquer visitante e o
> repositório é público: a tabela inteira era legível sem login. O código guarda só a estrutura
> (tipologia, áreas, vaga, escaninho, pavimento) e o `valor` vem exclusivamente do Firebase.
> Sem preço no banco o app **não inventa número**: avisa e o gestor reenvia pelo botão
> "Enviar tabela de preços" (GESTÃO → Manutenção avançada), a partir de um arquivo local.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `tipo` | string | `'1 Suíte'` ou `'3 Suítes'` |
| `area` | number | Área privativa em m² |
| `areaTotal` | number | Área total (privativa + escaninho + fração) em m² |
| `esc` | string | Número do escaninho atribuído |
| `areaEsc` | number | Área do escaninho em m² |
| `vagas` | string | Vagas de garagem no formato `'NNA/NNB'` (ex: `'27A/27B'`) |
| `pav` | string | Pavimento da vaga: `'SUB'` (Subsolo) ou `'TER'` (Térreo) |
| `valor` | number | **NÃO fica no código.** Vive só em `madrid_data/units` (Firebase, exige login). Ver V390. |

#### Tabela Completa das 50 Unidades

```
APTO  | TIPO      | ÁREA PRIV | ÁREA TOTAL | ESC | ÁREA ESC | VAGAS      | PAV
------|-----------|-----------|------------|-----|----------|------------|-----
1404  | 1 Suíte   | 108.22    | 114.69     | 49  | 6.47     | 27A/27B    | SUB
1403  | 3 Suítes  | 125.20    | 133.12     | 3   | 7.92     | 49A/49B    | TER
1402  | 3 Suítes  | 125.20    | 133.27     | 2   | 8.07     | 48A/48B    | TER
1401  | 1 Suíte   | 108.22    | 115.32     | 45  | 7.10     | 26A/26B    | SUB
1204  | 1 Suíte   | 108.22    | 113.46     | 8   | 5.24     | 25A/25B    | SUB
1203  | 3 Suítes  | 125.20    | 131.14     | 44  | 5.94     | 5A/5B      | SUB
1202  | 3 Suítes  | 125.20    | 131.67     | 50  | 6.47     | 6A/6B      | SUB
1201  | 1 Suíte   | 108.22    | 113.47     | 22  | 5.25     | 24A/24B    | SUB
1104  | 1 Suíte   | 108.22    | 113.34     | 21  | 5.12     | 23A/23B    | SUB
1103  | 3 Suítes  | 125.20    | 130.43     | 1   | 5.23     | 7A/7B      | SUB
1102  | 3 Suítes  | 125.20    | 130.44     | 48  | 5.24     | 8A/8B      | SUB
1101  | 1 Suíte   | 108.22    | 113.40     | 26  | 5.18     | 47A/47B    | TER
1004  | 1 Suíte   | 108.22    | 113.33     | 36  | 5.11     | 46A/46B    | TER
1003  | 3 Suítes  | 125.20    | 130.31     | 18  | 5.11     | 9A/9B      | SUB
1002  | 3 Suítes  | 125.20    | 130.31     | 17  | 5.11     | 10A/10B    | SUB
1001  | 1 Suíte   | 108.22    | 113.33     | 35  | 5.11     | 45A/45B    | TER
904   | 1 Suíte   | 108.22    | 113.21     | 46  | 4.99     | 44A/44B    | TER
903   | 3 Suítes  | 125.20    | 130.24     | 14  | 5.04     | 11A/11B    | SUB
902   | 3 Suítes  | 125.20    | 130.26     | 7   | 5.06     | 12A/12B    | SUB
901   | 1 Suíte   | 108.22    | 113.24     | 30  | 5.02     | 43A/43B    | TER
804   | 1 Suíte   | 108.22    | 113.17     | 47  | 4.95     | 42A/42B    | TER
803   | 3 Suítes  | 125.20    | 130.18     | 23  | 4.98     | 13A/13B    | SUB
802   | 3 Suítes  | 125.20    | 130.18     | 41  | 4.98     | 14A/14B    | SUB
801   | 1 Suíte   | 108.22    | 113.18     | 40  | 4.96     | 41A/41B    | TER
704   | 1 Suíte   | 108.22    | 113.12     | 12  | 4.90     | 40A/40B    | TER
703   | 3 Suítes  | 125.20    | 130.10     | 6   | 4.90     | 15A/15B    | SUB
702   | 3 Suítes  | 125.20    | 130.12     | 31  | 4.92     | 16A/16B    | SUB
701   | 1 Suíte   | 108.22    | 113.12     | 9   | 4.90     | 39A/39B    | TER
604   | 1 Suíte   | 108.22    | 113.12     | 19  | 4.90     | 38A/38B    | TER
603   | 3 Suítes  | 125.20    | 130.10     | 15  | 4.90     | 4A/4B      | SUB
602   | 3 Suítes  | 125.20    | 130.10     | 13  | 4.90     | 3A/3B      | SUB
601   | 1 Suíte   | 108.22    | 113.12     | 16  | 4.90     | 37A/37B    | TER
504   | 1 Suíte   | 108.22    | 113.12     | 27  | 4.90     | 36A/36B    | TER
503   | 3 Suítes  | 125.20    | 130.10     | 24  | 4.90     | 2A/2B      | SUB
502   | 3 Suítes  | 125.20    | 130.10     | 20  | 4.90     | 1A/1B      | SUB
501   | 1 Suíte   | 108.22    | 113.12     | 25  | 4.90     | 29A/29B    | TER
404   | 1 Suíte   | 108.22    | 113.12     | 33  | 4.90     | 30A/30B    | TER
403   | 3 Suítes  | 125.20    | 130.10     | 29  | 4.90     | 17A/17B    | SUB
402   | 3 Suítes  | 125.20    | 130.10     | 28  | 4.90     | 18A/18B    | SUB
401   | 1 Suíte   | 108.22    | 113.12     | 32  | 4.90     | 31A/31B    | TER
304   | 1 Suíte   | 108.22    | 113.12     | 39  | 4.90     | 32A/32B    | TER
303   | 3 Suítes  | 125.20    | 130.10     | 37  | 4.90     | 19A/19B    | SUB
302   | 3 Suítes  | 125.20    | 130.10     | 34  | 4.90     | 20A/20B    | SUB
301   | 1 Suíte   | 108.22    | 113.12     | 38  | 4.90     | 33A/33B    | TER
204   | 1 Suíte   | 108.22    | 112.91     | 11  | 4.69     | 34A/34B    | TER
203   | 3 Suítes  | 125.20    | 130.06     | 5   | 4.86     | 21A/21B    | SUB
202   | 3 Suítes  | 125.20    | 130.10     | 42  | 4.90     | 22A/22B    | SUB
201   | 1 Suíte   | 108.22    | 112.92     | 10  | 4.70     | 35A/35B    | TER
102   | 3 Suítes  | 158.30    | 162.50     | 43  | 4.20     | 51A/51B    | TER
101   | 3 Suítes  | 135.30    | 140.14     | 4   | 4.84     | 50A/50B    | TER
```

#### Exceções Importantes nas Unidades

- **Apto 102** tem área privativa de **158.30m²** (maior do prédio — diferente das demais 3 Suítes que são 125.20m²)
- **Apto 101** tem área privativa de **135.30m²** (diferente do padrão)
- **Aptos 102 e 101** são do **1º andar** e têm layout diferente (apenas 2 unidades no andar, não 4)
- **O 13º andar NÃO EXISTE** (superstição na construção civil). O prédio vai do 12º direto para o 14º

### 2.2 — Estrutura do Prédio (Fachada)

O prédio tem **2 fachadas** renderizadas como torres lado a lado:

| Fachada | Colunas | Unidades por andar |
|---------|---------|-------------------|
| **FACE SUL** | Coluna 1: 3 Suítes (final 02) / Coluna 2: 1 Suíte (final 01) | 2 unidades |
| **FACE NORTE** | Coluna 1: 1 Suíte (final 04) / Coluna 2: 3 Suítes (final 03) | 2 unidades |

**Lógica de numeração dos apartamentos:**
- Formato: `[ANDAR][UNIDADE]` → ex: `1402` = 14º andar, unidade 02
- Final `01` e `04` = 1 Suíte
- Final `02` e `03` = 3 Suítes
- **Exceção:** 1º andar tem apenas `101` e `102`, ambos 3 Suítes

**Andares:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14 (total: 13 andares habitáveis, **sem 13º**)

### 2.3 — Mapeamento da Garagem

Os mapas de garagem reproduzem os **projetos oficiais da engenharia**. Não altere a ordem das vagas.

#### Térreo (Vagas 29A–58)
```
Fileira Superior:  35A, 34B, 34A, 33B, 33A, 32B, 32A, 31B, 31A, 30B, 30A, 29B, 29A
Ilha Superior:     35B, 36A, 36B, 37A, 37B, 38A, 38B, 39A, 39B, 40A, 40B, 41A, 41B
Ilha Inferior:     48A, 47B, 47A, 46B, 46A, 45B, 45A, 44B, 44A, 43B, 43A, 42B, 42A
Fileira Inferior:  48B, 49A, 49B, 50A, 50B, 51A, 51B, 52
Lateral Direita:   58, 57, 56, 55, 54, 53
```

#### Subsolo (Vagas 1A–28)
```
Fileira Superior:  23B, 24A, 24B, 25A, 25B, 26A, 26B, 27A, 27B, 28
Ilha Superior:     23A, 22B, 22A, 21B, 21A, 20B, 20A, 19B, 19A, 18B, 18A, 17B, 17A
Ilha Inferior:     10B, 11A, 11B, 12A, 12B, 13A, 13B, 14A, 14B, 15A, 15B, 16A, 16B
Fileira Inf. Esq.: 10A, 9B, 9A, 8B, 8A, 7B, 7A, 6B    [ELEVADOR]    6A, 5B, 5A
Lateral Direita:   1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B
```

#### Escaninhos (1º Pavimento) — 50 escaninhos
```
Fileira Superior:  35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11
Fileira Inf. Esq.: 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48    [HALL]    1, 2, 3, 4, 5, 6, 7, 8, 9, 10
```

---

## 3. REGRAS DE NEGÓCIO DO SIMULADOR

### 3.1 — Fórmula de Preço

```
Preço Final = valor_base_da_unidade × globalMultiplier
```

O `globalMultiplier` começa em `1.0` e é alterado pelo admin via reajuste percentual:
```
novo_multiplier = multiplier_atual × (1 + percentual/100)
```

### 3.2 — Planos de Pagamento

| Plano | Sinal (%) | Mensais (%) | Balões (%) | Chaves (%) |
|-------|-----------|-------------|------------|------------|
| Mensal 20% | 10 | 20 | 0 | 70 |
| Balão 20% | 10 | 0 | 20 | 70 |
| Misto Completo | 10 | 10 | 10 | 70 |
| Personalizado | Livre | Livre | Livre | Restante |

### 3.3 — Cálculo de Parcelas

```
Parcelas de Sinal    = (Preço × %Sinal / 100) / nº_parcelas_sinal
Parcelas Mensais     = (Preço × %Mensal / 100) / meses_até_entrega
Parcelas Balão       = (Preço × %Balão / 100) / nº_balões
Valor da Chave       = Preço × %Chaves / 100
```

- **Meses até entrega:** calculado dinamicamente a partir da data atual até **Julho/2027**
- **Nº de Balões:** `Math.ceil(meses / 6)` — mínimo 1
- **Parcelas do Sinal:** escolhido pelo usuário (1x, 2x ou 3x)
- **Soma das porcentagens** (Sinal + Mensal + Balão) **NUNCA pode ultrapassar 100%**
  - A normalização é centralizada em `AppSim.normalizePercents(s, m, b)`. Se Mensal+Balão excede 100, ambos são recortados proporcionalmente; o Sinal é então limitado ao espaço restante.
  - Garante que `pChaves >= 0` sempre.
- **Trava mínima de 30% de entrada (V354 — regra única em TODO lugar):** se a soma (Sinal + Mensal + Balão) for < 30%, o sistema ajusta o Sinal para completar 30%.
  - Vive **dentro de `AppSim.normalizePercents`**, então simulador, tabela, PDF, Excel e WhatsApp aplicam a mesma trava e mostram o **mesmo preço** (antes da V354 a trava só existia na tabela, causando divergência tabela × PDF).
  - No simulador, se o corretor digita < 30%, o valor é bumpado e um toast avisa ("entrada mínima 30%, total máximo 100%").
- **Propostas especiais abatem do Saldo a Financiar (V354):** o total de `state.specialPayments` (permuta/FGTS/carta de crédito/etc.) é subtraído do Valor Total, e o cronograma (sinal/mensais/balões/chaves) é distribuído sobre esse **Saldo a Financiar**. `AppSim._currentPrice()` retorna o saldo (base de toda distribuição em %); `AppSim._valorTotal()` retorna o preço cheio. O breakdown/PDF/Excel/WhatsApp exibem "(−) Permuta/FGTS = Saldo a Financiar".

### 3.4 — Cláusula Contratual para o PDF

> "Correção de INCC até a entrega das chaves. As parcelas serão reajustadas mensalmente pelo INCC (Índice Nacional da Construção Civil) até a data prevista de entrega do empreendimento; após a entrega da obra, parcelas não pagas serão reajustadas pelo IPCA + 1% a.m. As despesas para financiamento do imóvel são de responsabilidade do Adquirente."

---

## 4. SISTEMA DE PERMISSÕES

### 4.1 — Hierarquia de Roles

| Role | Pode ver tabela | Pode simular | Pode mudar status | Pode reajustar preço | Pode gerir equipe |
|------|:-:|:-:|:-:|:-:|:-:|
| **Master** (EMAILS_MASTER) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gestor** (role=gestor) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Corretor** (role=corretor) | ✅ (só livres) | ✅ (só livres) | ❌ | ❌ | ❌ |

### 4.2 — Controle de Visibilidade

- Elementos com classe `admin-only` ficam **ocultos** via CSS quando `body` não tem `data-admin="true"`
- Corretores veem **apenas unidades com status `livre`** na tabela e mapa
- Corretores **não podem selecionar** unidades reservadas ou vendidas no simulador

### 4.3 — Auto-cadastro COM APROVAÇÃO (desde V388)

**A pessoa cria a própria conta; o acesso depende do gestor.** Pedido do dono:
"quero que a pessoa consiga criar um login sozinha mas precise da minha confirmação
para acessar a tabela e da minha autorização para que ela se torne um gestor".

Fluxo:
1. Tela de login → "Criar conta" (nome, WhatsApp, e-mail, senha) → `createUserWithEmailAndPassword`.
2. O pedido é gravado em `madrid_data/leads_inbox` com `interesse: 'ACESSO_APP'`
   (único nó com criação liberada nas rules).
3. Sem papel em `madrid_data/permissions/<email_encoded>`, o app mostra
   `#pendingOverlay` ("Acesso aguardando liberação") — que escuta a PRÓPRIA permissão
   e destrava sozinho quando o gestor aprova. **Não faz mais signOut imediato.**
4. Gestor: aba EQUIPE → "Solicitações de acesso" → *Liberar como corretor* / *Recusar*
   (a recusa é carimbada no `audit_log`; um pedido novo depois dela reaparece).
5. **Virar gestor é sempre promoção manual** na lista da equipe.

Os masters são lidos exclusivamente do nó `master_admins` do Firebase — não há fallback no código.
Configure os masters direto no console do Firebase para que não fiquem expostos no repositório.

**Por que a defesa continua de pé:** quem cria conta NÃO lê a tabela — as rules exigem
entrada em `permissions` para `units`/`statusMap`. A conta pendente só enxerga a tela de espera.

---

## 5. ESTRUTURA DO FIREBASE REALTIME DATABASE

```
madrid_data/
├── units/                    # Dados das 50 unidades (espelho de DEFAULT_UNITS)
│   ├── 1404/                 # { tipo, area, areaTotal, esc, areaEsc, vagas, pav, valor }
│   ├── 1403/
│   └── ...
├── statusMap/                # Status de venda de cada unidade
│   ├── 1404: "livre"         # Valores: "livre" | "reservado" | "vendido"
│   ├── 1403: "vendido"
│   └── ...
├── globalMultiplier: 1.0     # Fator multiplicador global de preço
├── previousMultiplier: 1.0   # Último multiplicador (para undo)
├── lastPriceUpdate: "..."    # Timestamp do último reajuste
├── lastSaleUpdate: "..."     # Timestamp da última venda
├── permissions/              # Controle de acesso por usuário
│   ├── email_encoded/        # { email: "...", role: "corretor"|"gestor" }
│   └── ...
├── proposals/                # Histórico de propostas por corretor
│   ├── email_encoded/
│   │   ├── timestamp_id/     # { client, cpf, phone, unit, value, plan, date, ... }
│   │   └── ...
│   └── ...
├── logs/                     # Logs de acesso diários
│   ├── YYYY-MM-DD/
│   │   ├── email_encoded/    # { email, lastLogin }
│   │   └── ...
│   └── ...
├── master_admins/            # Lista de e-mails master (cadastrada no console do Firebase)
│   ├── 0: "<email_do_master_1@dominio.com>"
│   └── ...                   # Nunca commite e-mails reais aqui — use placeholders.
├── leads/                    # CRM kanban de leads (apenas admin)
│   ├── <pushKey>             # { nome, telefone, email, origem,
│   └── ...                   #   status, notes, createdAt, updatedAt }
│                             # status ∈ { 'novo','conversa','visita',
│                             #            'proposta','fechado','perdido' }
│                             # V354: marcar a proposta vinculada como 'aceita'
│                             #   (cycleProposalStatus) move o lead -> 'fechado'.
└── audit_log/                # Trilha de auditoria (50 últimos via showAuditLog)
    ├── <timestamp_id>        # { action, ... , user, date, timestamp }
    └── ...                   # action ∈ { "status_change", "price_adjustment" }
```

### 5.1 — Encoding de E-mails

Firebase não aceita `.`, `#`, `$`, `[`, `]` em chaves. Todo e-mail é sanitizado com:
```javascript
email.replace(/[.#$[\]]/g, '_')
```

### 5.2 — Sincronização em Tempo Real

O sistema usa `database.ref().on('value')` para 6 referências simultâneas:
- `units`, `statusMap`, `globalMultiplier`, `previousMultiplier`, `lastPriceUpdate`, `lastSaleUpdate`

Todas disparam `renderAll()` com **debounce de 150ms** para evitar re-renders em cascata.

---

## 6. APIS EXTERNAS

| API | Endpoint | Uso |
|-----|----------|-----|
| INCC-DI (BCB) | `https://api.bcb.gov.br/dados/serie/bcdata.sgs.192/dados/ultimos/1?formato=json` | Índice de construção civil |
| Dólar (AwesomeAPI) | `https://economia.awesomeapi.com.br/last/USD-BRL` | Cotação USD/BRL |

Ambas são exibidas no painel admin. Falhas são silenciosas (não quebram a interface).

---

## 7. MÓDULOS DO SISTEMA

| Módulo | Responsabilidade |
|--------|-----------------|
| `AppUtils` | Máscaras (CPF/CNPJ, Telefone), `escapeHTML`, `escapeJSAttr` |
| `AppUI` | Tema (dark/light), modais, toasts, tooltips, salvamento de estado na sessão |
| `AppAuthManager` | CRUD de usuários/permissões, reset de senha, tabela de equipe |
| `AppDB` | Logs de acesso, gravação de propostas, carregamento de dados, sync, reset |
| `AppSim` | Simulação de pagamento, cálculos, validação de campos |
| `AppAuth` | Login/logout Firebase Auth, inicialização do app |
| `AppCore` | Renderização (tabela, fachada, garagem, gráfico), PDFs, filtros, ordenação, trilha de auditoria |
| `AppLeads` | Pipeline kanban de leads: cards arrastáveis entre 6 colunas de status, modal add/edit, integração WhatsApp click-to-chat, importação CSV. **Apenas admin** (aba tem `admin-only`; cada função revalida `state.isAdmin`). |

---

## 8. SISTEMA DE STATUS DAS UNIDADES

Cada unidade tem exatamente 3 estados possíveis:

| Status | Cor | Hex | Comportamento |
|--------|-----|-----|---------------|
| `livre` | Verde | `#059669` | Visível para todos, pode ser simulada |
| `reservado` | Laranja/Âmbar | `#B47721` | Invisível para corretores, admin pode simular |
| `vendido` | Azul | `#1D4ED8` | Invisível para corretores, linha riscada na tabela admin |

**Alterações de status** são feitas via Firebase Transaction para evitar race conditions.

---

## 9. GERAÇÃO DE PDF

### 9.1 — PDF da Tabela (`downloadTablePDF`)
- Biblioteca: jsPDF + AutoTable
- Orientação: Paisagem A4
- Respeita todos os filtros ativos (tipologia, andar, status)
- Inclui logo da Madrid, texto contratual, e validade da tabela
- Colunas dinâmicas baseadas no plano de pagamento selecionado

### 9.2 — PDF Espelho de Vendas (`downloadEspelhoPDF`)
- Orientação: Retrato A4
- Mapa de todas as unidades por andar com cores por status
- Inclui legenda de cores (Disponível/Reservado/Vendido)

---

## 10. DESIGN SYSTEM — VARIÁVEIS CSS

```css
--brand-primary: #1F3324;     /* Verde escuro principal */
--brand-secondary: #2E4A35;   /* Verde secundário */
--brand-gold: #C5A065;        /* Dourado premium */
--brand-gold-dark: #A68550;   /* Dourado escuro */
--radius-btn: 8px;            /* Border-radius dos botões */
```

### 10.1 — Dark Mode
- Ativa automaticamente entre 18h e 6h
- Pode ser alternado manualmente (persiste no `localStorage`)
- Troca logos: `MADRID LOGO MUSGO` (light) ↔ `MADRID LOGO BRANCA` (dark)

---

## 10.5 — SEGURANÇA (defesas no código, V322)

| Camada | Como | Onde |
|---|---|---|
| **CSP** (`Content-Security-Policy`) | meta tag no `<head>` restringindo origens de script/style/connect; `frame-ancestors 'none'` impede iframe | linha ~10 do `index.html` |
| **Frame-buster JS** | redundante ao CSP; força `window.top.location = window.self.location` se a página for embedada | bloco inicial do `<script>` |
| **SRI** (`integrity="sha384-..."`) | hashes cravados em Font Awesome, Chart.js, jsPDF, jsPDF-AutoTable. Se a CDN servir bytes diferentes, browser bloqueia | `<head>` |
| **Versão fixa de Chart.js** | `chart.js@4.4.0` em vez de `npm/chart.js` (que pegaria a última release sem aviso) | `<head>` |
| **`crossorigin="anonymous"`** | Em todos os `<link>` e `<script>` de CDN; pré-requisito para SRI | `<head>` |
| **`noopener,noreferrer`** em `window.open` | impede que a aba do WhatsApp acesse `window.opener` e remove o `Referer` | `AppSim.sendWhatsApp`, `AppLeads.openWhatsApp` |
| **`credentials: 'omit'` + `referrerPolicy: 'no-referrer'`** nos fetches BCB/AwesomeAPI | não envia cookies nem domínio para APIs externas | `AppCore.fetchAPIs` |
| **Mensagem de login uniforme** | "E-mail ou senha incorretos" para qualquer erro de credencial; só `network-request-failed` e `too-many-requests` ficam distintos. Evita user enumeration | `AppAuth.login` |
| **Auto-logout por inatividade (30 min)** | timer reset em mousemove/keydown/scroll/click; ao estourar, `signOut` + toast | `AppAuth.startIdleTimer` |
| **Limpa `sessionStorage` no logout** | remove `madrid_app_state` (CPF/telefone/nome do simulador) | `AppAuth.logout` |
| **Sem auto-cadastro** | `logAccess` não cria mais `permissions/<email>` automaticamente; sem entrada manual em EQUIPE, login é deslogado | `AppDB.logAccess` + bloqueio em `AppDB.load` |
| **Sem fallback master hardcoded** | `EMAILS_MASTER = []` se nó `master_admins` do Firebase estiver vazio | `AppDB.load` |
| **`escapeHTML` / `escapeJSAttr`** | sanitização de toda string vinda do Firebase antes de virar HTML/JS | `AppUtils` |
| **Limites de tamanho em leads** | `_MAX = { nome:120, telefone:25, email:120, origem:60, notes:2000 }`; CSV cap em 5000 linhas. Anti-DoS por payload gigante | `AppLeads._MAX` |
| **Validação de formato** | telefone ≥ 10 dígitos; e-mail por regex; status entre os 6 oficiais | `AppLeads.saveLead` |
| **Confirmação em transições terminais** | mover para "Perdido" ou "Fechado" pede `confirm()`. Reverte o card se cancelar | `AppLeads.changeStatus` |
| **Audit log de leads** | `lead_create`, `lead_update`, `lead_status_change`, `lead_delete` em `madrid_data/audit_log` | `AppLeads._audit` |

### Pendências de configuração no console do Firebase (fora do código)

1. **Authentication → Sign-in method → Email/Password**: desabilitar signup público
2. **Realtime Database → Rules**: aplicar regras que checam role no servidor (template no relatório do pentest)
3. **App Check**: ativar com reCAPTCHA v3
4. **Google Cloud Console → Credentials**: restringir API key por HTTP referrer
5. **Cada master**: ativar MFA (verificação em 2 passos) na conta Google associada

---

## 11. VERSIONAMENTO

- A versão atual é controlada pela constante `CURRENT_APP_VERSION` no início do `<script>`
- O sistema força redirecionamento com `?v=VERSION` para cache busting
- Ao atualizar, **mude apenas o número** na constante e no `<title>`

---

## 12. RESTRIÇÕES PARA AGENTES IA

1. **NUNCA altere os valores de `DEFAULT_UNITS`** sem instrução explícita do gestor
2. **NUNCA remova a lógica de pular o 13º andar** (`if (f === 13) continue`)
3. **NUNCA altere a ordem das vagas no mapeamento da garagem** — ela reflete a planta baixa real
4. **NUNCA remova a sanitização XSS** (`escapeHTML`, `escapeJSAttr`)
5. **NUNCA exponha credenciais adicionais** — a API Key do Firebase já é pública por design
6. **NUNCA altere as fórmulas de cálculo** (Sinal, Mensais, Balões, Chaves) sem validar com o gestor
7. **NUNCA remova o debounce** nos listeners do Firebase — sem ele, o sistema renderiza dezenas de vezes
8. **SEMPRE mantenha os 3 status** (`livre`, `reservado`, `vendido`) com as mesmas cores hexadecimais
9. **SEMPRE teste o login**, a tabela e o simulador após qualquer alteração
10. **SEMPRE verifique** se as funções de PDF continuam gerando corretamente após mudanças no layout
11. **NUNCA reintroduza** o auto-cadastro de `permissions` no `logAccess` — é vetor de invasão público
12. **NUNCA hardcode** e-mails reais no fonte — masters vêm do Firebase, sem fallback
13. **NUNCA remova** o CSP `<meta http-equiv="Content-Security-Policy">` no `<head>` sem substituí-lo por header HTTP equivalente
14. **NUNCA remova** o frame-buster (`window.self !== window.top`) — defesa em profundidade contra clickjacking
15. **NUNCA volte** a mensagem de erro de login que diferencia "usuário não existe" de "senha errada" — facilita enumeration
16. **AO TROCAR versão de CDN**, recalcule o hash SRI e atualize o `integrity=` correspondente
