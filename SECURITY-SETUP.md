# 🔒 Configurações de Segurança no Firebase (Madrid Casa Elevada)

Este documento lista **todas as configurações que precisam ser feitas no console** (Firebase + Google Cloud) para complementar as defesas que estão no código (V322).

O código sozinho protege contra ~70% dos ataques. Os 30% restantes (e mais graves) só fecham aqui.

> **Antes de aplicar qualquer mudança abaixo:** garanta que você consegue logar como Master no sistema atualmente. Se algo der errado nas Rules, você pode ficar trancado para fora — basta voltar para Rules abertas que recupera.

---

## 1. Desabilitar signup público no Firebase Auth

**Severidade:** 🔴 Crítica
**Tempo:** 30 segundos

### Por que

A API key do Firebase está pública no GitHub. Qualquer pessoa consegue criar conta via:
```js
firebase.auth().createUserWithEmailAndPassword("invasor@gmail.com", "senha")
```

O V320 já bloqueou o **auto-cadastro como corretor** no nosso código, mas o atacante ainda consegue criar a conta no Auth e usá-la para tentar atacar pela API REST direta do Realtime Database.

### Como

1. Abra: <https://console.firebase.google.com/project/madrid-casa-elevada/authentication/providers>
2. Clique no provider **Email/Senha**
3. Em **"Ações do usuário"** desmarque **"Ativar criação (inscrição)"**
4. Clique em **Salvar**

A partir daqui, **só você (no console) consegue criar contas novas**. Quando precisar cadastrar um novo corretor:
- Console Firebase → Authentication → Users → "Adicionar usuário" (cria a conta)
- Depois, no seu próprio sistema (aba EQUIPE), adicione o e-mail e defina como Corretor/Gestor

---

## 2. Aplicar as Rules robustas do Realtime Database

**Severidade:** 🔴 Crítica
**Tempo:** 2 minutos

### Por que

Sem Rules robustas, qualquer usuário logado (mesmo um atacante anônimo que criou conta na Fase 1) pode **ler e escrever** em todos os nós via API REST direta:
```bash
curl "https://madrid-casa-elevada-default-rtdb.firebaseio.com/madrid_data.json?auth=<token>"
```

### Caminho rápido (CLI — recomendado)

Já existem `firebase.json` e `.firebaserc` configurados neste repo. Você só precisa rodar 2 comandos no PowerShell:

```powershell
cd "C:\Projetos\Tabela Madri"
npx --yes firebase-tools login
npx --yes firebase-tools deploy --only database
```

- O `login` abre o browser, você autoriza com sua conta Google → fecha a aba quando aparecer "Success".
- O `deploy` envia o `database.rules.json` para o Firebase. Em ~5 segundos: "Deploy complete!"

### Caminho alternativo (Console UI)

1. Abra: <https://console.firebase.google.com/project/madrid-casa-elevada/database/madrid-casa-elevada-default-rtdb/rules>
2. **Apague todo** o conteúdo do editor
3. Abra o arquivo `database.rules.json` deste repositório
4. **Copie todo o conteúdo** e cole no editor do Firebase
5. Clique em **Publicar**

### Caminho onde **eu** rodo o deploy por você (se preferir delegar)

1. Você roda no PowerShell:
   ```powershell
   cd "C:\Projetos\Tabela Madri"
   npx --yes firebase-tools login:ci
   ```
2. Browser abre, você autoriza, e o CLI imprime um token longo no terminal
3. Você cola o token no chat
4. Eu rodo o deploy usando esse token (não preciso da sua senha)
5. **Logo após o deploy**, recomendo você rodar `npx firebase-tools logout` no seu terminal para invalidar o token

### Validação pós-deploy

- Logue como Master → tudo deve continuar funcionando
- Logue como Corretor → não deve ver Gestão/Equipe/Leads (já era assim, mas agora é defendido também no servidor)
- Tente acessar via curl sem auth → deve dar **401 Unauthorized**

### Como funcionam essas Rules

| Quem | O que pode |
|---|---|
| Anônimo (sem login) | **Nada** |
| Logado mas sem entrada em `/permissions` | **Nada** (defesa contra signup público) |
| Corretor | Lê preços/status; lê e escreve só **suas próprias** propostas |
| Gestor | Tudo, exceto `master_admins` e leitura de propostas alheias (a permissão de leitura geral inclui propostas de todos) |
| Master | Tudo |
| **Ninguém via app** | Editar `master_admins` (só pelo console) |

---

## 3. Ativar App Check com reCAPTCHA v3

**Severidade:** 🟡 Alta
**Tempo:** 5 minutos

### Por que

App Check garante que **só requisições vindas do seu site real** sejam aceitas pelo Firebase. Sem ele, scripts de bot e ferramentas como `curl`/`Postman` conseguem falar diretamente com seu DB (assumindo que tenham um token de auth válido).

### Como

#### 3.1) Gerar o site key do reCAPTCHA v3

1. Abra: <https://console.cloud.google.com/security/recaptcha?project=madrid-casa-elevada>
2. Clique em **+ CRIAR CHAVE**
3. Preencha:
   - **Nome:** `Madrid Casa Elevada`
   - **Tipo:** **reCAPTCHA v3**
   - **Domínios:** adicione `madridcasaelevada.com` e `www.madridcasaelevada.com`
4. Clique em **Criar**
5. **Copie o "Chave do site"** (site key) — começa com `6Lc...`

#### 3.2) Registrar o site no App Check

1. Abra: <https://console.firebase.google.com/project/madrid-casa-elevada/appcheck/apps>
2. Clique no seu **Web App** (Madrid Casa Elevada)
3. Escolha provedor: **reCAPTCHA v3**
4. Cole o **site key** que você copiou
5. Salvar

#### 3.3) Plugar o site key no código

1. Abra `index.html` localmente
2. Procure por `const APP_CHECK_SITE_KEY = "";` (~linha 1226)
3. Cole o site key entre as aspas: `const APP_CHECK_SITE_KEY = "6Lc..."`
4. Faça commit + push

#### 3.4) Ativar "Enforce" gradualmente

> **NÃO ATIVE "Enforce" na primeira meia hora.** Antes, deixe em **"Não aplicado / Monitorar"** por algumas horas para confirmar que as requisições legítimas estão chegando com token válido.

1. Em Firebase Console → App Check → **APIs**
2. Para cada API (Realtime Database, Authentication), marque **"Aplicar"** apenas depois de monitorar tráfego.

---

## 4. Restringir a API key por HTTP referrer

**Severidade:** 🟡 Média
**Tempo:** 1 minuto

### Por que

A API key do Firebase é "pública por design", mas se ela **só funciona quando a request vem do `madridcasaelevada.com`**, fica muito mais difícil de ser abusada via scripts maliciosos hospedados em outros domínios.

### Como

1. Abra: <https://console.cloud.google.com/apis/credentials?project=madrid-casa-elevada>
2. Procure a chave `AIzaSyAMoE5JkohMp632zSUSublIuSx_JL1rxv4` (Browser key)
3. Clique no nome dela para editar
4. Em **"Restrições do aplicativo"**, selecione **"Referenciadores HTTP (sites)"**
5. Em **"Restrições do site"**, adicione:
   - `https://madridcasaelevada.com/*`
   - `https://www.madridcasaelevada.com/*`
   - `http://localhost:*/*` (opcional, para desenvolvimento local)
6. Salvar

> **Cuidado:** depois disso, requests vindas do GitHub Pages preview, de Codespaces, ou de qualquer outro domínio vão falhar com `API_KEY_HTTP_REFERRER_BLOCKED`. Use o `localhost:*` para dev local.

---

## 5. Ativar MFA (verificação em 2 passos) nas contas Master

**Severidade:** 🔴 Crítica
**Tempo:** 5 minutos por conta

### Por que

Sem 2FA, uma senha vazada em qualquer outro serviço (dump de mega-vazamentos, phishing) dá acesso total ao Master. Com 2FA, mesmo com a senha o atacante precisa do segundo fator (SMS, app autenticador, chave física).

### Como (cada master deve fazer no próprio Google account)

1. Cada master abre: <https://myaccount.google.com/signinoptions/twosv>
2. Clique em **Começar**
3. Escolha o método (recomendo **Google Authenticator** ou **chave de segurança**)
4. Siga o assistente

> **Não use SMS como único 2FA.** Ataques de SIM swap são comuns. Use app autenticador ou chave física.

---

## ✅ Checklist final

Marque conforme for fazendo:

- [ ] **#1** Desabilitei signup público no Firebase Auth
- [ ] **#2** Apliquei `database.rules.json` no Realtime Database e publiquei
- [ ] **#2.1** Testei: anônimo não acessa, corretor vê só o que deve, master vê tudo
- [ ] **#3.1** Gerei site key do reCAPTCHA v3
- [ ] **#3.2** Registrei o app no App Check com o site key
- [ ] **#3.3** Plugei o site key em `APP_CHECK_SITE_KEY` no `index.html` e fiz push
- [ ] **#3.4** Monitorei tráfego algumas horas e **só depois** ativei "Enforce"
- [ ] **#4** Restringi a API key por HTTP referrer no Google Cloud Console
- [ ] **#5** Cada master ativou 2FA na conta Google dele

---

## Teste de invasão pós-config

Depois de aplicar tudo, **rode estes 2 comandos** num terminal qualquer. Ambos devem **FALHAR** (401 ou bloqueio):

```bash
# Teste 1: criar conta nova via API (deve falhar com OPERATION_NOT_ALLOWED)
curl -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyAMoE5JkohMp632zSUSublIuSx_JL1rxv4" \
  -H "Content-Type: application/json" \
  -d '{"email":"pwn@test.com","password":"Test123!","returnSecureToken":true}'

# Teste 2: ler o DB sem auth (deve falhar com Permission denied)
curl "https://madrid-casa-elevada-default-rtdb.firebaseio.com/madrid_data.json"
```

Se **algum dos dois retornar JSON com dados**, alguma config acima ficou para trás.
