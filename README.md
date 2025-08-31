
# Strudel — resumen del proyecto y guía rápida

Este README reúne instrucciones verificadas del repositorio sobre cómo compilar la aplicación de escritorio, ejecutar el REPL en modo desarrollo y una referencia concisa de la sintaxis usada en el REPL/Live-sessions.

## Resumen (rápido)

- Repositorio: colección de paquetes y utilidades para un REPL de audio/ patrones (ver `packages/` y `website/`).
- Ejemplos interactivos y páginas explicativas se encuentran en `strudel/website/src/pages/understand/` y `strudel/website/src/repl/`.

---

## Requisitos

- Node.js (16+ recomendado)
- pnpm (para instalar dependencias y ejecutar scripts)
- Rust + Cargo (solo si quieres compilar/ejecutar la app de escritorio basada en Tauri)
- ffmpeg (opcional, para recortar/convertir samples)

## Instalación

1. Instala dependencias de JavaScript desde la raíz del paquete `strudel`:

```powershell
pnpm install
```

2. (Opcional) Si vas a trabajar con la app de escritorio, asegúrate de tener Rust toolchain y las dependencias nativas instaladas.

---

## Desarrollo (REPL / sitio)

- Ejecutar el entorno de desarrollo (REPL / sitio):

```powershell
pnpm dev [--port <PUERTO>]
```

Nota: algunos scripts aceptan la opción `--port`; revisa `package.json` en la raíz del paquete para confirmar los flags disponibles.

## Aplicación de escritorio

Comando documentado en `./.github/instructions/commands.instructions.md`.

- Compilar/ejecutar la app de escritorio (ejemplo genérico cuando la app usa Tauri/Rust):

```powershell
cargo run --release
```

Nota: este comando indica que la app de escritorio puede usar Rust/Tauri; revisa `src-tauri/` o `packages/desktopbridge/` para confirmar la configuración y pasos concretos.

---

## Ejemplos de uso: samples y patrones

Los ejemplos siguientes ilustran cómo cargar samples y crear patrones desde el REPL (extraídos de la documentación interna):

```javascript
await samples({ 'aaahh': 'aaahh.mp3' }, 'https://raw.githubusercontent.com/gamurigm/samples/main/')
setcps(120/60/4)
test_aaahh: n("<0 1 2>").s("aaahh").gain(0.9)
```

Ejemplo usando un servidor local de samples:

```javascript
await samples({ 'aaahh': 'aaahh.mp3' }, 'http://172.18.224.1:5432/')
setcps(120/60/4)
test_aaahh: n("<0 1 2>").s("aaahh").gain(0.9)
```

Recorte/conversión rápida con ffmpeg:

```powershell
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

Ejemplo mínimo:

```javascript
setcpm(60)
samples({ 'moog': { 'g3': 'moog/005_Mighty%20Moog%20G3.wav' } }, 'github:tidalcycles/dirt-samples')
note("g3 [bb3 c4]").s('moog').clip(1).gain(.5)
```

Para detalles ampliados (voicings, pitch, compases y ejemplos interactivos) revisa `strudel/website/src/pages/understand/` y `strudel/website/src/repl/`.

---




