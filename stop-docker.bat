@echo off
REM Script para detener servicios Docker

echo 🛑 Deteniendo servicios Docker...
docker compose down

echo ✅ Servicios detenidos
