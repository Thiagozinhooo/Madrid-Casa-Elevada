# 🔍 Refatoração + Auditoria de Segurança Semanal — Madrid Casa Elevada

Você é o engenheiro de qualidade do sistema **Madrid Casa Elevada** (SPA em `index.html` + landing pública em `landing.html`, backend Firebase RTDB). Faça uma análise **completa, honesta e específica** do código nesta semana.

**REGRAS INQUEBRÁVEIS DA SUA ANÁLISE:**

1. **Sem preguiça**: leia o código de verdade. Não dê opinião sobre arquivos que não abriu.
2. **Sem alucinação**: cite **arquivo:linha** em cada achado. Se não tem certeza, marca como "⚠️ verificar".
3. **Sem reescrever nada** automaticamente — só **propor**. O dono decide o que aplicar.
4. **Respeite o `agents.md`** (regras inquebráveis das unidades, garagem, fórmulas, etc.).
5. **Priorize**: cada achado recebe severidade 🔴 (crítico) / 🟡 (médio) / 🟢 (nice-to-have).
6. Compare com o **último relatório local** (pasta `Documents\Revisoes Madrid` na máquina do gestor — é a pasta que o Windows exibe como "Documentos"; o nome real no disco é `Documents`) — não repita achados já dispensados/arquivados.
7. **O relatório NUNCA vai para a issue pública** — este prompt é publicado toda semana numa issue aberta; o relatório que ele gera lista falhas com arquivo e linha e fica **só na máquina do gestor**.

---

## Escopo da análise

### 1️⃣ Qualidade de código & refatoração

Procure especificamente:

- **Duplicação** entre `landing.html` e `index.html` (CSS, lógica de carrossel, helpers de formato)
- **Funções gigantes** (>150 linhas) — candidatas a quebrar (ex.: `renderGarageMap`, `saveProposalPDF`)
- **Código morto**: classes CSS órfãs (ex.: `.via-asfalto` que virou alias inert), funções não chamadas
- **Inconsistência de naming**: variáveis em PT/EN misturadas, snake_case vs camelCase
- **Magic numbers**: alturas hardcoded, cores fora do design system
- **Error handling**: `.catch(() => {})` silencioso onde deveria logar
- **Modularidade**: o `index.html` continua monolítico (4800+ linhas) — vale quebrar?
- **Comentários desatualizados**: comentários V330 falando de algo que mudou em V336

Para cada achado: `arquivo:linha` + 1 frase do problema + 1 frase da proposta de fix.

### 2️⃣ Segurança — checklist semanal

Refaça toda esta lista, **sem confiar em revisões anteriores** (regras podem ter mudado):

- **Firebase Rules** (`database.rules.json`):
  - Toda escrita pública (`leads_inbox`) ainda tem validação de schema rigorosa?
  - Algum nó novo entrou em `madrid_data/` sem rule explícita?
  - As regras compilam? (validar JSON estruturalmente)
- **XSS**:
  - Toda string vinda do Firebase passa por `escapeHTML` antes de virar HTML?
  - Atributos JS inline (`onclick="foo('${x}')"`) usam `escapeJSAttr`?
  - `innerHTML =` direto em qualquer lugar com dado de usuário?
- **CSP** (`<meta http-equiv="Content-Security-Policy">`):
  - Adicionamos algum CDN novo (Google Maps, fonts, etc.) sem liberar em `script-src`/`connect-src`?
  - Algum `'unsafe-eval'` ainda necessário?
- **SRI**: hashes Font Awesome / Chart.js / jsPDF ainda batem? (Se versão mudou, recalcule)
- **Auth bypass**:
  - Toda função admin checa `state.isAdmin` no início?
  - Cadastro automático segue desativado em `AppDB.logAccess`?
- **Vazamento de dados**:
  - `console.log` com dados sensíveis (e-mail, telefone, CPF, valor de proposta)?
  - URLs com query string contendo PII?
- **Credenciais**: nenhum e-mail real, nenhuma chave de API a mais do que a pública do Firebase
- **Audit log**: ainda usa `push().key` (não `Date.now()`)?
- **Idle timer**: 30 min ainda configurado? `_idleTeardown` é limpo?
- **App Check**: a site key está configurada e válida?

### 3️⃣ Performance

- **Listeners do Firebase**: todos passam por `AppDB._track`? (senão, leak no logout)
- **Debounce de render**: ainda 150ms? Ainda é suficiente?
- **Bundle de imagens**: alguma PNG nova não otimizada? (PNG > 5 MB é red flag)
- **Re-renders desnecessários**: `renderAll` chamado mais vezes do que deveria?
- **DOM com muitos elementos**: alguma tabela/lista sem virtualização que cresce sem limite?

### 4️⃣ UX / acessibilidade

- Botões sem `aria-label`?
- Formulários sem `<label>`?
- Cores com contraste < 4.5:1 (no dark mode também)?
- `prefers-reduced-motion` respeitado nas animações novas?
- Foco visível em todos os interativos?

### 5️⃣ Dependências & infra

- CDNs travadas em versão fixa? (Font Awesome 6.4.0, Chart.js 4.4.0, jsPDF 2.5.1)
- Alguma versão minor/patch nova disponível com fix de segurança?
- Firebase SDK 9.22.0 ainda é recomendada pela Google?
- `database.rules.json` validado? (`firebase database:rules:validate`)

### 6️⃣ Documentação

- `agents.md` reflete o estado **atual** do código? (Versão batendo? Estrutura do RTDB atualizada?)
- Funções públicas (`window.AppX`) sem comentário JSDoc?
- Os itens do `SECURITY-SETUP.md` estão com o status real refletido no checklist?

---

## Formato do relatório

Salve o relatório em `"$USERPROFILE/Documents/Revisoes Madrid/revisao-AAAA-MM-DD.md"` (data no formato `2026-08-28`; a pasta fica **FORA do repositório** — jamais grave o relatório dentro da pasta do projeto, que é pública). **NUNCA cole como comentário na issue pública** — nela só entra "revisão feita, N achados tratados". Formato exato (markdown):

```markdown
## 📋 Relatório de Revisão — <data>

**Resumo executivo:** <1-2 frases sobre a saúde geral do código>

### 🔴 Crítico (X achados)

<lista — vazio se nenhum>

### 🟡 Médio (X achados)

<lista>

### 🟢 Nice-to-have (X achados)

<lista>

### ✅ Coisas que estão BEM (X destaques)

<importante reconhecer o que funciona — evita reforma desnecessária>

### 🔄 Status dos achados de semanas anteriores

<para cada achado dos últimos 3 relatórios locais (`Documents\Revisoes Madrid`):
  - "Fix aplicado em commit `abc1234`" / "Ainda aberto" / "Dispensado pelo gestor">
```

**Cada achado individual deve ter:**

- `arquivo:linha` (link clicável se possível)
- **O quê:** 1 frase
- **Por quê é problema:** 1 frase
- **Sugestão de fix:** 1-2 frases (pode ser snippet curto se ajudar)
- **Esforço estimado:** ⏱ <1h / 1-4h / >4h

---

## Áreas que **NÃO** precisa revisar essa semana

Pra economizar tempo, **pule** se não mudou desde o último relatório:

- `DEFAULT_UNITS` (50 unidades — congelado)
- Arrays de vagas (`tRowTop`, `sRow*`, `eRow*` — congelado, regra inquebrável)
- Helpers básicos `AppUtils.maskCPF` / `maskPhone`
- A cláusula INCC do PDF (texto jurídico, congelado)

Se algo dessas áreas **mudou** desde a última revisão, então revise.

---

## Comandos úteis pra você (Claude) durante a análise

```bash
# Conta linhas dos arquivos principais
wc -l index.html landing.html agents.md database.rules.json

# Última versão registrada
grep -E "CURRENT_APP_VERSION|Versão Premium V" index.html | head -3

# Pesquisar potencial XSS direto
grep -n "innerHTML\s*=" index.html landing.html

# Pesquisar listeners não-track
grep -nE "database\.ref\([^)]+\)\.on\(" index.html

# Validar Firebase rules
node -e "JSON.parse(require('fs').readFileSync('database.rules.json','utf8')); console.log('JSON OK')"

# Listar relatórios anteriores (ficam locais, fora do repositório)
ls "$USERPROFILE/Documents/Revisoes Madrid"
```

---

**Fim do prompt.** Comece a análise lendo `agents.md` primeiro (pra entender as regras inquebráveis), depois mergulhe no código.
