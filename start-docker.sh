#!/bin/bash
# Script para levantar la infraestructura de desarrollo

echo "🐳 Levantando servicios Docker..."
docker compose up -d

echo "⏳ Esperando a que Postgres esté listo..."
timeout 30s bash -c 'until docker compose exec postgres pg_isready -U postgres; do sleep 1; done'

if [ $? -eq 0 ]; then
    echo "✅ Postgres está listo"
    echo "📊 pgAdmin disponible en: http://localhost:8081"
    echo "   Email: admin@example.com"
    echo "   Password: admin"
    echo ""
    echo "🔗 Para conectar a Postgres desde pgAdmin:"
    echo "   Host: postgres"
    echo "   Port: 5432"
    echo "   User: postgres"
    echo "   Password: pass"
    echo "   Database: strudel"
    echo ""
    echo "🚀 Servicios corriendo:"
    docker compose ps
else
    echo "❌ Error: Postgres no pudo iniciarse correctamente"
    echo "📋 Logs de Postgres:"
    docker compose logs postgres
fi
