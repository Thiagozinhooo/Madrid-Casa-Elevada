@echo off
chcp 65001 >nul
REM ============================================================
REM  BACKUP COMPLETO DO BANCO DO MADRID
REM  Basta dar dois cliques neste arquivo. Uma vez por mes.
REM
REM  Por que ele existe: o plano gratuito do Firebase NAO faz
REM  copia automatica. Sem isto, um apagamento (de preco, de
REM  proposta, de contrato) e IRREVERSIVEL.
REM
REM  O que vai acontecer:
REM   1) Login no Firebase (a conta Google dona do projeto).
REM      A conta certa aparece na tela se o arquivo conta.local.txt
REM      existir nesta pasta - ele fica so nesta maquina.
REM   2) Baixa o banco INTEIRO para um arquivo com a data de hoje em
REM      Documentos\Backups Madrid  (FORA do site - o arquivo tem
REM      nome, CPF e valor de contrato: NUNCA copie ele para a
REM      pasta do projeto, que e publica).
REM   3) Confere se o arquivo nasceu com conteudo.
REM
REM  Depois: suba o arquivo para o seu Google Drive. Duas copias
REM  em lugares diferentes = backup de verdade.
REM ============================================================
setlocal
cd /d "%~dp0"
set "PATH=%PATH%;%APPDATA%\npm"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set "HOJE=%%i"
set "PASTA=%USERPROFILE%\Documents\Backups Madrid"
set "ARQ=%PASTA%\madrid-backup-%HOJE%.json"

echo.
echo === MADRID CASA ELEVADA - backup do banco (%HOJE%) ===
echo.

where firebase >nul 2>&1
if errorlevel 1 (
    echo [ERRO] O Firebase CLI nao foi encontrado.
    echo Instale com:  npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

if not exist "%PASTA%" mkdir "%PASTA%"

echo [1/3] Login no programa do Firebase...
echo   Se o navegador abrir: ESCOLHA A CONTA DONA DO PROJETO e autorize.
if exist "%~dp0conta.local.txt" (
    echo   Conta a escolher:
    type "%~dp0conta.local.txt"
    echo.
)
echo   Se ja estiver logado, ele so avisa e segue direto.
echo   Escolheu a conta errada? Rode  firebase logout  e execute de novo.
echo.
call firebase login
if errorlevel 1 (
    echo.
    echo [ERRO] O login nao foi concluido. Rode este arquivo de novo.
    pause
    exit /b 1
)

echo.
echo [2/3] Baixando o banco inteiro (leva alguns segundos)...
call firebase database:get / -o "%ARQ%"
if errorlevel 1 (
    echo.
    echo [ERRO] O download falhou. Leia a mensagem acima e rode de novo.
    pause
    exit /b 1
)

echo.
echo [3/3] Conferindo o arquivo...
for %%A in ("%ARQ%") do set "TAM=%%~zA"
if not defined TAM set "TAM=0"
if %TAM% LSS 1000 (
    echo [ERRO] O arquivo nasceu vazio ou quase vazio ^(%TAM% bytes^).
    echo Causa comum: a conta logada nao e dona do projeto madrid-casa-elevada.
    echo Para trocar de conta: rode  firebase logout  e execute este arquivo de novo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  PRONTO! Backup de hoje salvo em:
echo    %ARQ%
echo    (%TAM% bytes)
echo.
echo  FALTA UM PASSO SEU: suba este arquivo para o Google Drive.
echo  E NUNCA copie ele para a pasta do site - o site e publico
echo  e o arquivo tem nome, CPF e valor de cada comprador.
echo ============================================================
echo.
pause
