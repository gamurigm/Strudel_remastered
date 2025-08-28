# Strudel — resumen del proyecto y guía rápida

Este README reúne instrucciones verificadas del repositorio sobre cómo compilar la aplicación de escritorio y un resumen conciso de la sintaxis usada en el REPL/Live-sessions.

---

## Compilación y ejecución

Comandos documentados en `./.github/instructions/commands.instructions.md`.

- Compilar la app de escritorio (según la instrucción del repositorio):

```powershell
cargo run --release
```

Nota: este comando sugiere que la app de escritorio usa Rust/Tauri o similar y que `cargo` forma parte del flujo de build. Revisa `src-tauri/` o `packages/desktopbridge/` para confirmar la configuración específica y scripts adicionales.

- Ejecutar el REPL en development (puerto documentado):

```powershell
pnpm dev --port xxxx
```

- Ejemplos de uso del sampler (extraídos de `commands.instructions.md`):

```javascript
await samples({ 'aaahh': 'aaahh.mp3' }, 'https://raw.githubusercontent.com/gamurigm/samples/main/')
setcps(120/60/4)
test_aaahh: n("<0 1 2>").s("aaahh").gain(0.9)
```

Esto demuestra cargar samples remotos y probar su reproducción.

También se muestra un ejemplo para cargar samples desde una red local (dirección IP en documentación):

```javascript
await samples({ 'aaahh': 'aaahh.mp3' }, 'http://172.18.224.1:5432/')
setcps(120/60/4)
test_aaahh: n("<0 1 2>").s("aaahh").gain(0.9)
```

Y una utilidad de procesamiento de audio documentada:

```bash
ffmpeg -i input.wav -ss 00:00:00 -t 00:00:15 output.wav
```

---

## Resumen de la sintaxis esencial (extracto)

- s("...") — define un patrón ejecutable en el REPL.
- Tokens comunes: `bd`, `sd`, `rim`, `hh`, `oh`, `misc`, etc.
- Separador temporal: espacios separan eventos; coma `,` separa capas simultáneas.
- Silencio: `~` indica silencio en una posición del ciclo.
- Repetición/distribución: `token*n` reparte `n` instancias del token a lo largo del ciclo.
- Agrupación: `[...]` agrupa subpatrones.
- Alternancia por ciclo: `< ... >` define variantes por ciclo.
- Parámetros dinámicos: `rim*<1 2>` aplica multiplicadores que varían entre ciclos.
- Selección de variantes: `.n("0 1 2")` o `token:idx` para variantes de muestra.
- Bancos: `.bank("Name")` aplica un prefijo de banco a tokens.
- Tempo: `setcpm(...)`, `setcps(...)` controlan la relación temporal; ejemplo `setcpm(60)`.

Ejemplo mínimo (tal como aparece en la documentación):

```javascript
setcpm(60)
samples({ 'moog': { 'g3': 'moog/005_Mighty%20Moog%20G3.wav' } }, 'github:tidalcycles/dirt-samples')
note("g3 [bb3 c4]").s('moog').clip(1).gain(.5)
```

Para detalles ampliados (voicings, pitch, compases y ejemplos interactivos) revisa `strudel/website/src/pages/understand/` y `strudel/website/src/repl/`.

---



