# Conectar por terminal
docker exec -it strudel_postgres psql -U postgres -d strudel

# Ver todos los scripts
SELECT * FROM scripts;

# Ver solo código y títulos
SELECT title, code FROM scripts;

# Contar scripts
SELECT COUNT(*) FROM scripts;