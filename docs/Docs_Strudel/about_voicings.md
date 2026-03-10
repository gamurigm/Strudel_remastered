## Resumen

Este documento explica cómo funciona el sistema de "voicings" (distribución de notas de un acorde) en Strudel.

## Contrato (inputs / outputs / errores)

- Inputs principales:
  - `chord` (string): símbolo de acorde, p. ej. `C`, `Am`, `G7#11` o `<C^7 A7 Dm7 G7>` cuando se usa en patrones.
  - `dictionary` / `dict` (string o objeto): nombre del diccionario de voicings (ej. `'legacy'`, `'ireal'`, `'lefthand'`) o un diccionario personalizado.
  - `anchor` (nota): nota de referencia para ubicar las voces (ej. `c5`, `F4`).
  - `mode` (string): cómo se coloca el voicing relativo al `anchor`. Valores: `below`, `above`, `duck`, `root`.
  - `offset` (entero): desplaza la inversión seleccionada hacia arriba o abajo.
  - `n` (número o patrón): si se usa, el voicing puede comportarse como una escala (indexado).
  - `octaves` (opcional): controla octavación de las notas.

  Detalles adicionales (contrato expandido):

  - `dictionary` puede ser una cadena (nombre registrado) o un objeto literal que describa el diccionario de voicings. Si es objeto, se usará tal cual y se aplicarán valores por defecto para `mode` y `anchor` cuando falten.
  - `anchor` acepta tanto nombres de nota (`c5`) como números MIDI (`72`). Si el valor no es válido la función puede lanzar una advertencia y caer a un ancla por defecto (`c5`).
  - `n` puede ser un número único, una lista, o un patrón; cuando se provee, la salida puede comportarse como selección por índice dentro del voicing (útil para melodías derivados de la estructura del acorde).

- Output:
  - Una lista/pila de notas (por ejemplo `['D3','F3','A3']` o un `stack` transformado en notas MIDI) lista para reproducir.

- Modo de fallo:
  - Si el símbolo de acorde no se reconoce, la implementación hace logger y devuelve `silence`.
  - `lastVoicing` es estado global: si hay concurrencia o ejecución inesperada, el voice-leading puede comportarse de forma dependiente del historial.

Errores y señales:

- Cuando `renderVoicing` lanza excepción, el código captura el error y registra: `[voicing]: unknown chord "<chord>"` (ver `voicing` en `voicings.mjs`).
- Si el diccionario apuntado por `dictionary` no existe, se usa `defaultDict` (por defecto `'ireal'`) y se registra una advertencia.


## Explicación técnica (bloques importantes en `packages/tonal/voicings.mjs`)

- `voicingRegistry`:
  - Objeto que contiene diccionarios predefinidos como `lefthand`, `triads`, `guidetones`, `legacy`.
  - Cada entrada: `{ dictionary, range?, mode?, anchor? }`.

- `defaultDict` y `setDefaultVoicings(name)`:
  - `defaultDict` indica qué conjunto usar por defecto (por defecto `'ireal'`).
  - `setDefaultVoicings('legacy')` fuerza que `voicing()` use el diccionario `'legacy'` si no se especifica otro.

- `addVoicings(name, dictionary, range)` / `registerVoicings(name, dictionary, options)`:
  - Permiten añadir diccionarios personalizados. `dictionary` mapea símbolos de acorde a una o varias plantillas de intervalos (p. ej. `'m7': ['3m 5P 7m 9M', ...]`).
  - `range` limita la búsqueda de inversiones (p. ej. `['F3','A4']`).

Line-by-line / bloque-by-block (resumen ejecutivo):

- Importaciones: `stack`, `register`, `silence`, `logger` vienen de `@strudel/core`. `renderVoicing` es la rutina que convierte plantillas (intervalos, modos, anchor) en notas concretas. La dependencia `chord-voicings` expone `dictionaryVoicing` y `minTopNoteDiff` usados para seleccionar inversiones según heurística de mínima diferencia en la nota superior.

- Diccionarios (`lefthand`, `guidetones`, `triads`, `defaultDictionary`): contienen plantillas expresadas como intervalos (p. ej. `3m 5P 7m 9M`) que `renderVoicing` parsea y transforma en offsets absolutos según la raíz y la octavación.

- `voicingRegistry` y funciones de registro: `addVoicings` y `registerVoicings` añaden entradas al `voicingRegistry`. `registerVoicings` acepta `options` para pasar `mode`, `anchor` y `range` junto al `dictionary`.

- `lastVoicing`: variable de estado global que guarda la última inversión elegida para favorecer voice-leading. Esto significa que la salida depende del orden de evaluación; útil para progresiones, pero peligroso en tests paralelos.

- `voicings` (plural): wrapper deprecado que usa `dictionaryVoicing` directamente, retorna un `stack` a partir del resultado. Mantiene compatibilidad con patrones antiguos.

- `rootNotes(octave)`: función utilitaria para mapear acordes a notas raíz en una octava dada (útil para líneas de bajo).

- `voicing` (singular): la API principal. Extrae controles (dictionary, chord, anchor, offset, mode, n, octaves, ...rest), resuelve `dictionary` (buscando en `voicingRegistry` o aceptando un objeto literal), llama a `renderVoicing({ ...dictionary, chord, anchor, offset, mode, n, octaves })` y empaqueta la salida como `stack(...notes).note().set(rest)`.

- Gestión de errores: `voicing` captura excepciones de `renderVoicing`, llama a `logger` y devuelve `silence` evitando que una progresión completa falle por un símbolo desconocido.

- `getVoicing(chord, dictionaryName, lastVoicing)`:
  - Usa `dictionaryVoicing` (de la dependencia `chord-voicings`) con un `picker` llamado `minTopNoteDiff` para seleccionar la inversión que minimiza el salto respecto a la nota superior previa (voice-leading suave).

- `voicings` (DEPRECATED):
  - Devuelve un `stack` con las notas resultantes basadas en un diccionario. Está marcado como deprecado en favor de `.voicing()`.

- `rootNotes(octave)`:
  - Mapea símbolos de acorde a la nota raíz en la octava dada (útil para bajo).

- `voicing` (registro principal, llamado desde patrones):
  - Firma principal: `.voicing()` aplicada sobre un patrón que contiene `chord` u objetos con propiedades `chord` y demás controles.
  - Descompone controles: `{ dictionary = defaultDict, chord, anchor, offset, mode, n, octaves, ...rest }`.
  - Si `dictionary` es string: lo busca en `voicingRegistry`; si es objeto, usa `{ dictionary, mode: 'below', anchor: 'c5' }` por defecto.
  - Llama a `renderVoicing({ ...dictionary, chord, anchor, offset, mode, n, octaves })`.
  - `renderVoicing` (en `tonleiter.mjs`) construye la lista de notas reales, usando internamente `dictionaryVoicing` y la lógica de octavación.
  - Resultado: `stack(...notes).note().set(rest)` — se preservan controles residuales (por ejemplo `gain`, `s`, `color`).
  - En caso de error: loggea `[voicing]: unknown chord "<chord>"` y devuelve `silence`.

## Puntos clave de implementación (programador)

- Estado global `lastVoicing`:
  - Guarda el último voicing generado para conseguir voice-leading; por tanto, el comportamiento es dependiente del orden de evaluación y del estado global. Reseteable con `resetVoicings()`.
  - Riesgo: en ejecución paralela o en tests, puede provocar diferencias en resultados.

- Dependencias externas:
  - `chord-voicings` (variable local `dictionaryVoicing`, `minTopNoteDiff`) es la librería que hace la selección de inversiones.
  - `renderVoicing` en `tonleiter.mjs` realiza la traducción de plantillas de intervalos a notas concretas y octavación según `anchor` y `mode`.

- Selectores y estrategia:
  - El `picker` `minTopNoteDiff` intenta minimizar la diferencia entre la nota superior del voicing anterior y la actual; esto es la heurística principal de voice-leading.

Consideraciones de rendimiento y concurrencia:

- `lastVoicing` hace que las funciones de voicing no sean puras. En escenarios con múltiples hilos o workers (o en tests que se ejecutan en paralelo), conviene llamar a `resetVoicings()` entre casos o usar instancias aisladas del motor.
- `renderVoicing` y `dictionaryVoicing` pueden ser costosos si se evalúan en cada tick; para patrones muy densos, cachear resultados por clave `{chord,dictionary,anchor,mode,offset}` reduce cálculo.

## Ejemplos prácticos (corto y claro)

- Para músicos (REPL-friendly):
  - Usar el REPL/website (ver `website/src/pages/understand/voicings.mdx` y ejemplos incluidos) con ejemplos listos:

```javascript
// ejemplo simple: símbolos de acorde y voicing automático
chord("<Am C D F Am E Am E>").voicing().room(.5)

// usar diccionario personalizado
addVoicings('house', {
  '': ['7 12 16','0 7 16','4 7 12'],
  'm': ['0 3 7']
})
chord('<Am C D F>').dict('house').anchor(66).voicing()
```

- Para programadores:
  - Añadir diccionario:

```javascript
addVoicings('mydict', {
  7: ['3M 7m 9M 12P 15P'],
  '^7': ['3M 6M 9M 12P 14M']
}, ['C3','C6']);

// luego en patrón
"<C^7 A7 Dm7 G7>".voicing(); // usa el default o especifica `.dict('mydict')`
```

## Variaciones y trucos creativos

- Cambiar `anchor`: mueve el rango donde los voicings se colocan. Ejemplo: `.anchor('c5')` coloca las notas alrededor de C5 (mano derecha alta).
- `mode`:
  - `below`: la nota más alta del voicing queda ≤ anchor (útil para acompañamientos de piano por debajo de la melodía).
  - `above`: la nota más baja del voicing queda ≥ anchor (útil para pads que deben estar por encima).
  - `duck`: parecido a `below` pero excluye el anchor (evita pisar una nota exacta del anchor).
  - `root`: fuerza que la nota raíz sea la más baja cerca del anchor.
- `offset`: desplaza la inversión (prueba con `offset: 1` o `-1` para invertir el voicing).
- `n` controla selección por índice: piénsalo como elegir una nota del voicing como si fuera una escala.

Variaciones operativas (inspiradas en `voicings.mdx`):

- Layered dictionaries: puedes encadenar diccionarios y dejar que el motor resuelva entradas faltantes desde diccionarios previos. Esto es útil para superponer reglas específicas para un estilo (por ejemplo, `house`) sobre una base general (`ireal`).
- Anchor dinámico: actualizar `anchor` en tiempo real (p. ej. por control de UI o automatización) permite generar arreglos que suben/bajan dinámicamente en el rango del intérprete.
- Uso de `n` para generar melodías: reusar la misma estructura de acordes para generar líneas melódicas indexando posiciones dentro del voicing (ver ejemplo avanzado abajo).

## Cómo ejecutar / probar (rápido)

1. Usar la página de aprendizaje REPL integrada en `website` (hay muchos ejemplos listos bajo `website/src/pages/learn/`, p. ej. `tonal.mdx` y `understand/voicings.mdx`).
2. Desde la raíz del paquete `website` arrancar el dev server (PowerShell):

```powershell
cd 'c:\Users\gamur\Downloads\strudel-main\strudel\website'
npx pnpm@10.15.0 dev
```

3. En el REPL o en un script de Strudel, prueba ejemplos mostrados arriba. Verás los acordes convertidos en notas y puedes cambiar `anchor`, `dict`, `mode`, `offset`.

## Testing / notas para desarrolladores (vitest)

- `vitest.config.mjs` (archivo del proyecto) utiliza el plugin `vite-plugin-bundle-audioworklet` y configura:
  - `isolate: false` (las pruebas comparten estado si no se limpian explícitamente),
  - `silent: true`, `reporters: 'verbose'`.
- Importante: por el uso de `lastVoicing` global, las pruebas unitarias que ejecuten `voicing()` deben limpiar estado entre casos con `resetVoicings()` o `setDefaultVoicings(...)` para asegurar independencia.

Ejemplo de test rápido (pseudo-vitest):

```javascript
import { resetVoicings, registerVoicings } from '../../packages/tonal/voicings.mjs';

beforeEach(() => resetVoicings());

test('generates voicing for simple progression', () => {
  registerVoicings('test', { '': ['1P 3M 5P'] }, { anchor: 'c4' });
  const result = /* invocar renderVoicing indirectamente vía API de Pattern */ null;
  // assert sobre estructura del result: top-note cerca de C4, etc.
});
```

Nota: ajustar el test de integración para ejecutar en el entorno `website` si se necesita la pila completa de REPL/renderer.

## Edge cases y advertencias

- `lastVoicing` hace que la función sea stateful: el mismo patrón puede generar resultados distintos según lo que se haya ejecutado antes.
- Si un símbolo no está en el diccionario activo, se intenta resolver con el diccionario por defecto (`ireal`) o se loggea y se devuelve silencio.
- Algunas plantillas en los diccionarios usan intervalos inusuales o aumentados (`A`, `d`)—podrían sonar disonantes si se usan sin cuidado.

Notas finales / inspiración del `voicings.mdx`:

- El documento de la web (`voicings.mdx`) contiene ejemplos REPL listos para pegar en la página de aprendizaje (MiniRepl). Son útiles para validar anchuras de voicings y voice-leading de forma audible.
- Si buscas consistencia total entre runs (por ejemplo para tests):
  - establece `defaultDict` a un valor conocido con `setDefaultVoicings('legacy')`.
  - llama `resetVoicings()` antes de cada prueba.

Si quieres, puedo crear ejemplos adicionales para insertar en `website/src/repl/live-sessions/` que muestren: (1) cómo varía un voicing al cambiar `anchor`, (2) efecto de `mode: 'root'`, (3) uso de `n` para melodía. Indica cuál prefieres y lo añado.


