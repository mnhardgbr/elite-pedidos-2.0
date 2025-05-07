@echo off
echo Instalando o Sistema Elite Pedidos...
echo.

REM Verificar se o Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js nao encontrado! Por favor, instale o Node.js primeiro.
    echo Baixe em: https://nodejs.org/
    pause
    exit /b
)

REM Verificar se o npm está instalado
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo npm nao encontrado! Por favor, instale o Node.js primeiro.
    echo Baixe em: https://nodejs.org/
    pause
    exit /b
)

REM Instalar dependências
echo Instalando dependencias...
npm install

REM Construir o projeto
echo Construindo o projeto...
npm run build

echo.
echo Instalacao concluida!
echo Para iniciar o sistema, execute o arquivo 'start.bat'
echo.
pause 