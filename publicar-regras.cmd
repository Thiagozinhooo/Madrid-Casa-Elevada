@echo off
REM ============================================================
REM  PUBLICAR AS REGRAS DE SEGURANCA DO FIREBASE
REM  Basta dar dois cliques neste arquivo.
REM
REM  O que vai acontecer:
REM   1) Abre o navegador pedindo para escolher a conta Google.
REM      >>> ESCOLHA A CONTA DONA DO PROJETO: ngblem2016@gmail.com
REM   2) Publica o arquivo database.rules.json no Firebase.
REM
REM  Se ja estiver logado, ele pula direto para a publicacao.
REM ============================================================
setlocal
cd /d "%~dp0"
set "PATH=%PATH%;%APPDATA%\npm"

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

echo Verificando login...
call firebase login:list >nul 2>&1
if errorlevel 1 (
    echo.
    echo Voce ainda nao esta logado. Vou abrir o navegador.
    echo IMPORTANTE: escolha a conta ngblem2016@gmail.com
    echo.
    call firebase login
    if errorlevel 1 (
        echo.
        echo [ERRO] O login nao foi concluido. Rode este arquivo de novo.
        pause
        exit /b 1
    )
)

echo.
echo Publicando as regras...
echo.
call firebase deploy --only database
if errorlevel 1 (
    echo.
    echo [ERRO] A publicacao falhou. Leia a mensagem acima.
    echo Causa comum: a conta escolhida nao e dona do projeto madrid-casa-elevada.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  PRONTO! As regras foram publicadas.
echo  Avise o Claude para ele conferir o efeito no app.
echo ============================================================
echo.
pause
