@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "LOCAL_ENV=%PROJECT_DIR%.env.cmd"

if not exist "%LOCAL_ENV%" (
    echo [ERREUR] Le fichier .env.cmd est absent.
    echo Copie .env.cmd.example vers .env.cmd et renseigne GROQ_API_KEY.
    exit /b 1
)

call "%LOCAL_ENV%"

if not defined GROQ_API_KEY (
    echo [ERREUR] GROQ_API_KEY n'est pas definie dans .env.cmd.
    exit /b 1
)

set "JAVA_TOOL_OPTIONS="

echo Verification de Java et Maven...
java -version || exit /b 1
call mvn -version || exit /b 1

echo Demarrage du backend...
cd /d "%PROJECT_DIR%backend"
call mvn spring-boot:run
