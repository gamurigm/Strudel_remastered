
# Strudel — resumen del proyecto y guía rápida

Este README recopila los pasos de arranque, scripts reales del monorepo y una referencia de sintaxis que evoluciona desde lo básico hasta técnicas avanzadas, alineado con los archivos de documentación y composiciones del repo.

## Resumen (rápido)

- Monorepo con paquetes en `packages/` y el REPL/sitio en `website/`.
- La documentación y ejemplos interactivos viven en `website/src/pages/` y el editor REPL en `website/src/repl/`.

---

## Requisitos

- Node.js LTS
- pnpm (gestor de paquetes usado por el repo)
- Rust + Cargo (solo si compilas la app de escritorio/Tauri)
- ffmpeg (opcional para manipular audio)

## Quick Start (REPL / sitio)

Desde la carpeta `strudel/`:

```powershell
pnpm run setup     # instala dependencias (equivale a pnpm i)
pnpm run repl      # inicia el REPL/sitio en modo dev
```

Build y preview del sitio:

```powershell
pnpm run build     # construye website y docs estáticas
pnpm run preview   # sirve el build para pruebas locales
```

### Scripts útiles (paquete raíz)

- `pnpm run test` / `test-ui` / `test-coverage`
- `pnpm run bench` y `snapshot` (actualiza snapshots de tests)
- `pnpm run osc` (servidor OSC en `packages/osc`)
- `pnpm run sampler` (sirve la carpeta `samples/`)
- `pnpm run lint` / `codeformat` / `check`

---

## Cómo funciona el default tune del REPL

El REPL carga por defecto el contenido de `website/src/repl/live-sessions/1_current_session.mjs`. Para cambiar lo que aparece al inicio, edita ese archivo.

---

## Sintaxis Esencial y Uso de Samples

### Samples: uso rápido

- Carpeta de trabajo: `strudel/samples/`.
- Iniciar servidor local de samples: `pnpm run sampler`

En el REPL:
```javascript
await samples({ aaahh: 'aaahh.mp3' }) // Carga desde el servidor local por defecto
setcps(120/60/4)
n("<0 1 2>").s("aaahh").gain(0.9)
```

### Sintaxis de Patrones (extracto)

- `s("...")`: define un patrón.
- Tokens: `bd`, `sd`, `hh`, etc.
- Secuencia: ` ` (espacio).
- Paralelo: `,`.
- Silencio: `~`.
- Repetición: `*n`.
- Agrupación: `[...]`.
- Alternancia: `< ... >`.
- Tempo: `setcpm(...)` o `setcps(...)`.

Ejemplo mínimo afinado:
```javascript
setcpm(60)
samples({ moog: { g3: 'moog/005_Mighty%20Moog%20G3.wav' } }, 'github:tidalcycles/dirt-samples')
note("g3 [bb3 c4]").s('moog').clip(1).gain(.5)
```

---

## Técnicas Avanzadas y Composición

A medida que exploras, puedes combinar funciones para crear piezas más complejas y dinámicas.

### 1. Modulación de Parámetros (LFOs y Envolventes)

Para evitar que los sonidos sean estáticos, puedes modular sus parámetros usando señales como `sine`, `tri` o `perlin`.

- **LFO en filtro o paneo**: `cutoff(sine.slow(8).range(800, 2500))` o `pan(sine.slow(6).range(0.1, 0.9))`
- **Envolvente en un parámetro**: `.lpf_e(perlin.slow(8).range(1, 5))` aplica una envolvente al filtro.
- **Patrón de ganancia**: `.patt("1 0.5 0.8 0.4")` crea un ritmo interno en la ganancia.

### 2. Composición Estructural con `arrange`

En lugar de un único `stack`, puedes definir diferentes secciones (`intro`, `verso`, `coro`) y organizarlas con `arrange`.

```javascript
const intro = stack(drums, bass);
const fullSection = stack(drums, bass, harmony, melody);

arrange([
  [4, intro],       // Toca la intro por 4 ciclos
  [8, fullSection]  // Luego la sección completa por 8 ciclos
]);
```

### 3. Polirritmia y Polimetría

Crea ritmos complejos superponiendo patrones de diferentes longitudes. La forma más sencilla es con `.slow()` o ajustando el número de eventos.

```javascript
// Batería con un patrón de 4/4 contra uno de 7/8
const drums = stack(
  s("bd ~ sd ~"), // 4/4
  s("hh*7").slow(8/7) // 7 golpes en el espacio de un ciclo de 8
);
```

### 4. Efectos Globales con `all()`

Aplica un efecto a toda la mezcla para unificar el sonido.

```javascript
stack(drums, harmony, melody, bass)
  .all(x => x.room(0.2)) // Aplica una reverb del 20% a todo
```

### Ejemplos de Estudio

Para ver estas técnicas en acción, revisa las siguientes composiciones documentadas:

-   `composition_docs/opus_synthesis.md`: Un estudio sobre composición modular, capas y voicings.
-   `composition_docs/polyrhythmic_study.md`: Un ejemplo práctico de polirritmia, modulación con LFOs y estructura con `arrange`.
-   `composition_docs/ameliewaltz_annotated.md`
-   `composition_docs/keys_drums_synths_annotated.md`
-   `composition_docs/rhythmofthenight_annotated.md`

---

## Enlaces útiles

- REPL online y tutorial: https://strudel.cc
- Issues: https://codeberg.org/uzu/strudel/issues
- Paquetes publicados: `packages/README.md`





