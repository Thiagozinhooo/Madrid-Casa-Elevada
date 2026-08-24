@echo off
chcp 65001 >nul
REM ============================================================
REM  PUBLICAR AS REGRAS DE SEGURANCA DO FIREBASE
REM  Basta dar dois cliques neste arquivo.
REM
REM  O que vai acontecer:
REM   1) Abre o navegador pedindo para escolher a conta Google.
REM      >>> ESCOLHA A CONTA DONA DO PROJETO no seletor do navegador.
REM      A conta certa aparece na tela se o arquivo conta.local.txt
REM      existir nesta pasta - ele fica so nesta maquina.
REM   2) Publica o arquivo database.rules.json no Firebase.
REM   3) Confere sozinho se o site continua funcionando.
REM
REM  Se ja estiver logado, ele pula direto para a publicacao.
REM ============================================================
setlocal
cd /d "%~dp0"
set "PATH=%PATH%;%APPDATA%\npm"
set "DB=https://madrid-casa-elevada-default-rtdb.firebaseio.com"

echo.
echo === MADRID CASA ELEVADA - publicar regras de seguranca ===
echo.

where firebase >nul 2>&1
if errorlevel 1 (
    echo [ERRO] O Firebase CLI nao foi encontrado.
    echo Instale com:  npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

echo [1/4] Conferindo o arquivo de regras antes de subir...
call node validar.js
if errorlevel 1 (
    echo.
    echo [PAREI] O validador reprovou. NAO publique assim - avise o Claude.
    echo.
    pause
    exit /b 1
)

echo.
echo [2/4] Login no programa do Firebase...
echo.
echo   ATENCAO: estar logado no SITE do Firebase nao basta. O "firebase" e um
echo   programa instalado no computador e tem login proprio.
echo.
echo   Se aparecer a pergunta sobre coletar dados de uso, responda o que quiser.
echo   Depois o navegador abre: ESCOLHA A CONTA DONA DO PROJETO e autorize.
if exist "%~dp0conta.local.txt" (
    echo   Conta a escolher:
    type "%~dp0conta.local.txt"
    echo.
)
echo   Se ja estiver logado, ele so avisa e segue direto.
echo   Escolheu a conta errada? Rode  firebase logout  e execute de novo.
echo.
REM NAO usar "firebase login:list" para decidir: ele sai com SUCESSO mesmo sem
REM conta nenhuma (so imprime um aviso), e o script pulava o login e falhava
REM na publicacao. "firebase login" ja e idempotente: se houver sessao, ele
REM apenas responde "Already logged in as ..." e continua.
call firebase login
if errorlevel 1 (
    echo.
    echo [ERRO] O login nao foi concluido. Rode este arquivo de novo.
    pause
    exit /b 1
)

echo.
echo Conta autenticada:
call firebase login:list

echo.
echo [3/4] Publicando as regras...
echo.
call firebase deploy --only database
if errorlevel 1 (
    echo.
    echo [ERRO] A publicacao falhou. Leia a mensagem acima.
    echo Causa comum: a conta escolhida nao e dona do projeto madrid-casa-elevada.
    echo Para trocar de conta: rode  firebase logout  e execute este arquivo de novo.
    echo.
    pause
    exit /b 1
)

echo.
echo [4/4] Conferindo se o site continua funcionando...
echo.
echo   O cronograma da obra PRECISA aparecer (a landing le ele sem login):
curl -s "%DB%/madrid_data/cronograma.json?shallow=true"
echo.
echo.
echo   Os precos das unidades PRECISAM dar "Permission denied":
curl -s "%DB%/madrid_data/units.json?shallow=true"
echo.
echo.
echo   Os contratos PRECISAM dar "Permission denied":
curl -s "%DB%/proposals/zz_vendas_reais.json?shallow=true"
echo.

echo.
echo ============================================================
echo  PRONTO! As regras foram publicadas.
echo.
echo  Confira as 3 linhas acima:
echo    - a primeira tem que mostrar etapas/percentual
echo    - as outras duas tem que dizer "Permission denied"
echo.
echo  Se bater, esta tudo certo. Avise o Claude que ele confere
echo  o resto sozinho e segue para as proximas pendencias.
echo ============================================================
echo.
pause
