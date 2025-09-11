@echo off
REM Script para levantar la infraestructura de desarrollo en Windows

echo 🐳 Levantando servicios Docker...
docker compose up -d

echo ⏳ Esperando a que Postgres esté listo...
:wait_loop
docker compose exec postgres pg_isready -U postgres >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 1 /nobreak >nul
    goto wait_loop
)

echo ✅ Postgres está listo
echo 📊 pgAdmin disponible en: http://localhost:8081
echo    Email: admin@example.com
echo    Password: admin
echo.
echo 🔗 Para conectar a Postgres desde pgAdmin:
echo    Host: postgres
echo    Port: 5432
echo    User: postgres
echo    Password: pass
echo    Database: strudel
echo.
echo 🚀 Servicios corriendo:
docker compose ps
