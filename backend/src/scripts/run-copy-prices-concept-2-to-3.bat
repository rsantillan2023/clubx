@echo off
REM Copiar precios concepto 2 -> concepto 3 (con datos de conexion de .env)
set MYSQL_EXE=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe
set MYSQL_HOST=127.0.0.1
set MYSQL_PORT=3307
set MYSQL_USER=desarrollo
set MYSQL_PASS=desarrollo
set MYSQL_DB=degira_develop

cd /d "%~dp0..\.."
"%MYSQL_EXE%" -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_USER% -p%MYSQL_PASS% %MYSQL_DB% < "src\scripts\copy-prices-concept-2-to-concept-3.sql"
if %ERRORLEVEL% equ 0 (echo. & echo Listo.) else (echo Error al ejecutar MySQL.)
pause
