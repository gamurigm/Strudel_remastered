# Anotación detallada de `ameliewaltz.mjs`

Este documento contiene el código original de `ameliewaltz.mjs` seguido de comentarios en español que explican cada fragmento de sintaxis y su propósito, referenciando la implementación y la gramática del proyecto Strudel donde procede.

---

```javascript
setDefaultVoicings('legacy')
```
- `setDefaultVoicings('legacy')`:
  - Define el diccionario de "voicings" por defecto que usará la función `voicing()` más abajo.
  - `'legacy'` es el nombre de un conjunto predefinido de reglas/plantillas de voicing (vease `packages/tonal/voicings.mjs`).
  - Efecto: cambia cómo se resuelven las inversiones y la distribución de las notas en los acordes.

  Nota adicional (por qué importa): elegir un diccionario de voicings afecta directamente al color armónico y al rango ocupado por las voces. Un diccionario "legacy" normalmente prioriza raíces bajas y distribuciones conservadoras; un diccionario alternativo podría dar inversiones más abiertas o priorizar terceras en la mano derecha en contextos de piano.

```javascript
stack(
  n("[0@2 ~, ~ [[1,2,3] ~]!2]")
  .chord("<[Dm Am]!2 [F C]!2>/4")
  .anchor("<[B3 G3]!2 [C4 B3]!2>/4")
  .voicing().velocity(0.5)
  ,
  n("<[3@5.5 2@0.5 1@3 0@3] [3@3.5 [4 3 2 1 2]@2.5 1@3 0@3] [2@5.5 1@0.5 -3@6]!2>/4")
  .scale("a4:minor")
  
).s("piano").lpf(4000).clip(1)
  .attack(0.1).release(0.1)
  .room(1.5)
  .cpm(64).gain(.6)
```

A continuación desgloso cada línea / operación en el `stack(...)`.

## 1) `stack(...)`
- `stack(...)` (ver `packages/core/pattern.mjs`) combina varios `Pattern` en paralelo.
- Resultado: las pistas internas se reproducen simultáneamente — por ejemplo, una pista de acordes (voicings) y otra de melodía/escala.

Comentario musical: usar `stack` es la forma idiomática de construir arreglos en Strudel: cada sub-patrón puede tratarse como una "pista" (voice) con su propio timbre y control, mientras que los efectos aplicados al `stack` actúan como bus/master.

## 2) Primera pista — construcción del acorde/voicing

```javascript
n("[0@2 ~, ~ [[1,2,3] ~]!2]")
```
- `n(...)` crea un patrón numérico a partir de mini-notation (string).
- El contenido de la mini-notation contiene operadores y grupos:
  - `[` `]` agrupan elementos en un subciclo o colección.
  - `0` `1` `2` ... son índices (interpretados luego según `.chord()` / `.scale()`).
  - `@X` es un modificador numérico adjunto al elemento (en la gramática se conoce como operador `op_weight`).
    - Interpretación práctica: es un parámetro adicional que el constructor de patterns puede usar como *peso*, *desplazamiento de tiempo* o *valor auxiliar* según el contexto.
    - Nota: el efecto exacto depende del consumidor del patrón; en contextos de nota puede representar un pequeño desplazamiento temporal o una acentuación. (Asumimos esto porque la mini-grammar registra `@` como "weight"; en Strudel su uso concreto depende del controlador que lo lea.)
  - `~` es un placeholder de "sustain/rest" en mini-notation: marca un silencio o continuidad de la nota anterior según el contexto del slice.
  - La coma `,` separa elementos dentro de un grupo (el significado semántico depende del contexto: puede indicar alternativas o pasos consecutivos en el subciclo).
  - `[[1,2,3] ~]!2` significa: el grupo `[1,2,3]` seguido por `~`, replicado `!2` (operador de replicación).
    - `!2` duplica la secuencia anterior (repetición), definido por la gramática `op_replicate`.

En resumen: este string define un patrón rítmico/melódico con valores numéricos, rests y repeticiones; esos números se usarán más abajo para construir acordes vía `.chord()`.

Ejemplo rítmico (manual) — primer elemento interpretado:
- Si la rejilla base es 1/16 y no hay `/` modificadores, el primer ciclo podría mapear: `0@2` (evento con índice 0 y peso 2), `~` (sustain), `,` (separa), `~` (otro sustain), luego la subsecuencia replicada `[[1,2,3] ~]` dos veces.

Esto produce una sensación de frase con un ataque inicial (índice 0), pausas de sostenido, y luego una frase rápida en el lugar replicado.

```javascript
.chord("<[Dm Am]!2 [F C]!2>/4")
```
- `.chord(...)` asocia al patrón numérico una lista de símbolos de acorde (mini-notation dentro de `<>` indica una secuencia lenta/polimétrica o subciclos según la sintaxis).
- Contenido explicado:
  - `< ... >` — envoltura que puede indicar una secuencia "slow/shift" o un grupo polimétrico (el parser reconoce operadores `<` `>` y `/4` aplicado después).
  - `[Dm Am]!2` — el par 'Dm' y 'Am' agrupados y replicados 2 veces.
  - `[F C]!2` — el par 'F' y 'C' replicado 2 veces.
  - `/4` fuera del `>` es un modificador de tiempo: ralentiza o divide la densidad (equivalente a `.slow(4)` en la API JS).
- Efecto: cada valor numérico del `n(...)` mapeará a uno de los acordes en esta secuencia; `.chord()` transforma índices en símbolos de acordes y prepara la resolución a notas mediante `.voicing()`.

Ejemplo práctico de mapeo: si la secuencia de acordes expandida es [Dm, Am, Dm, Am, F, C, F, C] y el `n(...)` produce los índices [0, 1, 0, 1, 0, 1, 0, 1], entonces los acordes reproducidos serán Dm, Am, Dm, Am, F, C, F, C en ese orden. El `/4` hace que cada acorde dure 4 veces la resolución base, por lo que la progresión completa se estira.

```javascript
.anchor("<[B3 G3]!2 [C4 B3]!2>/4")
```
- `.anchor(...)` define el registro / notas "ancla" para las voicings — un punto de referencia para el voicing engine.
- Similar a `.chord(...)`, aquí se dan listas de notas concretas (por ejemplo `B3`, `G3`), replicadas y ralentizadas `/4`.
- Efecto: cuando `voicing()` resuelve las notas de cada acorde, utilizará estas notas como referencia de octava/posición para mantener coherencia en el voice-leading.

Cómo afecta al oído: anclar en B3/G3 (registro medio-bajo) tenderá a que las voces inferiores del acorde ocupen esa franja, dando un carácter más cálido y menos brillante que si el anchor fuera C5/G4.

```javascript
.voicing().velocity(0.5)
```
- `.voicing()` transforma la especificacin de acorde + anchor en un `stack` de notas reales (cada acorde → múltiples notas) siguiendo las reglas del diccionario seleccionado (`'legacy'` arriba) y la lógica de voice-leading.
- `.velocity(0.5)` aplica un multiplicador de velocidad (dinámica) a la pista de voicings: la intensidad de cada nota se escala por 0.5.

Paso a paso simplificado (cómo el motor podría resolver un acorde Dm con anchor B3):
1. Acorde simbólico: Dm → grados [D, F, A].
2. Anchor: B3 sugiere que la nota central o la voz más baja debe situarse cerca de B3.
3. Selección de voicing "legacy": plantilla decide número de voces (ej. 3) y preferencia de inversiones (root position preferida).
4. Octavación: el motor coloca D3 (cercano a B3), F3, A3 si cabe, o sube A3→A4 si es necesario para evitar solapamientos.
5. Voice-leading: al cambiar al siguiente acorde (p. ej. Am), el motor minimiza la distancia de cada voz (mueve F3→E3 o similar) para producir transiciones suaves.

Esta explicación es un ejemplo ilustrativo; la implementación exacta está en `packages/tonal/voicings.mjs`.

## 3) Segunda pista — línea melódica/escala

```javascript
n("<[3@5.5 2@0.5 1@3 0@3] [3@3.5 [4 3 2 1 2]@2.5 1@3 0@3] [2@5.5 1@0.5 -3@6]!2>/4")
.scale("a4:minor")
```
- `n(...)` aquí contiene tres bloques entre `[]` separados por espacios: cada bloque es un subciclo melódico. Los `@` siguen siendo parámetros auxiliares (ver nota sobre `@` arriba); por ejemplo `3@5.5` significa el elemento `3` con ese parámetro `5.5`.
- `-3` indica un índice negativo (por ejemplo, una nota por debajo del punto base del mapa de escala).
- `!2` al final replica el conjunto completo 2 veces.
- `/4` ralentiza la ejecución general del bloque (divide la velocidad por 4).
- `.scale("a4:minor")` mapea los índices numéricos a notas concretas dentro de la escala de La menor con tónica `A4`. Ejemplo: `0` → `A4`, `1` → `B4` (dependiendo de la implementación de `packages/tonal/tonal.mjs` y su registro de escalas).

Mapeo ejemplo (asunción razonable basada en convenciones comunes):
- `scale("a4:minor")` → grados de A menor con tónica en A4.
  - 0 => A4
  - 1 => B4
  - 2 => C5
  - 3 => D5
  - 4 => E5
  - -1 => G#3 / (o G3 dependiendo si se usa natural/harmonic minor) — notar que la implementación del repo define exactamente la alteración y la octavación.

Consejo: verifica `packages/tonal/tonal.mjs` si necesitas el mapeo exacto de semitonos y cómo se manejan modos menores (natural, harmonic, melodic).

Efecto: esta pista produce una melodía en la escala A minor empezando en A4, con micro-parametrizaciones por `@` y repeticiones.

## 4) Propiedades globales del `stack`

```javascript
.s("piano").lpf(4000).clip(1)
  .attack(0.1).release(0.1)
  .room(1.5)
  .cpm(64).gain(.6)
```
- `.s("piano")` selecciona el banco/sonido "piano" para todas las pistas dentro del `stack` (si alguna pista define su propio `.s(...)` lo sobreescribe localmente).
- `.lpf(4000)` configura un filtro pasa-bajos con corte a 4000 Hz — suaviza/agrega calidez a la mezcla.
- `.clip(1)` aplica recorte (limiting) con umbral 1 (previene picos mayores a 1.0).
- `.attack(0.1)` / `.release(0.1)` definen la envolvente ADSR (al menos ADSR parcial) con ataque 0.1 s y release 0.1 s.
- `.room(1.5)` aplica un efecto de reverb/espacio con parámetro `room` (1.5 = tamaño/tiempo relativo del espacio reverberante).
- `.cpm(64)` fija el tempo en "cycles per minute" (ciclos por minuto); en este contexto `64` indica cuántos ciclos de patrón se consideran por minuto. (Nota: `cpm` es un atajo/operador de tempo en la API de patterns).
- `.gain(.6)` multiplica la ganancia de salida por 0.6 (reducción de volumen).

Sugerencia de mezcla rápida: si notas en el playback que el piano suena demasiado brillante respecto a una voz sintética, prueba reducir `.lpf()` a 3000 y bajar `.gain()` a 0.5; para más presencia incrementa `.room()` ligeramente para separar planos.

---

## Notas técnicas y suposiciones razonables
- Mini-notation operators (`@`, `!`, `/`, `[]`, `<>`) son parseados por `packages/mini/krill.pegjs` y traducidos a operaciones sobre `Pattern`.
- `@` en la gramática se denomina `op_weight` — su semántica exacta depende del consumidor; habitualmente se usa para dar un *peso*, *desplazamiento temporal* o *parametro auxiliar* al elemento.
  - Asunción: donde aparece junto a índices numéricos en `n(...)` se usará como desplazamiento o característica de interpretación rítmica por el motor de pattern.
- `~` es un placeholder de sustain/rest según la gramática; su comportamiento final depende del contexto del pattern (puede representar silencio o la continuación de la nota anterior).
- Los modificadores `/4` se traducen a `.slow(4)` internamente y cambian la resolución temporal del slice.

Limitación importante: las explicaciones y mapeos numéricos anteriores son parciales y en algunos puntos heurísticos. Son exactos en la intención, pero la implementación definitiva (por ejemplo, si `scale` usa melodic vs natural minor, o si `@` se mapea por defecto a velocity vs offset) está en los módulos del código fuente; para una validación 100% exacta habría que ejecutar o inspeccionar esas funciones concretas (`packages/tonal/tonal.mjs`, `packages/mini/*` y `packages/tonal/voicings.mjs`).

Ejemplo de "simulación manual" de primer ciclo (interpretación razonable):
- Suposiciones: rejilla base = semicorchea (1/16) referencia, `/4` alarga a negras (1/4), `n(...)` produce secuencia [0, ~, ~, 1,2,3, ~] replicada.
- Resultado estimado (primer compás):
  1. Tiempo 0.0s: Acorde Dm (resuelto a D3-F3-A3), velocity 0.5
  2. Tiempo 0.5s: sustain
  3. Tiempo 1.0s: subsecuencia rápida [1,2,3] (notas/índices mappeadas a acordes), etc.

Este "firstCycle" es ilustrativo; para obtener la lista real de haps sería necesario ejecutar `pattern.firstCycle()` con el runtime de Strudel.

## Referencias en el repo
- Implementación `Pattern` y `stack`: `packages/core/pattern.mjs`
- Registro de controles (s, n, chord, anchor, voicing, scale, etc.): `packages/core/controls.mjs`
- Voicings y `setDefaultVoicings`: `packages/tonal/voicings.mjs`
- Gramática mini-notation: `packages/mini/krill.pegjs`
- Documentación de REPL y ejemplos: `website/src/pages/technical-manual/repl.mdx`, `website/src/pages/understand/voicings.mdx`.

---

Si quieres que comente aún más fino (por ejemplo: explicar exactamente cómo `voicing()` distribuye las notas en octavas para el diccionario `'legacy'`, o generar el `firstCycle()` con eventos concretos y tiempos), dime qué prefieres y ejecuto la siguiente iteración.

## Explicación profunda — componente por componente

Usaré las páginas de `website/src/pages/learn` como referencia directa (mini-notation, time-modifiers, tonal, effects). Cada subsección describe la función/sintaxis, su rol en la pieza y cómo se implementa/consume en Strudel.

### `setDefaultVoicings(name)`
- Qué hace: selecciona el diccionario por defecto para resolver símbolos de acordes a listas de notas (voicings). Referencia: `website/src/pages/learn/tonal.mdx` (voicing docs) y `packages/tonal/voicings.mjs`.
- Por qué importa musicalmente: cambia inversión, octavación y densidad del acorde. Un diccionario "legacy" prioriza compatibilidad/expectativas previas.
- Recomendación: si quieres alternar color, prueba `setDefaultVoicings('ireal')` u otros si existen en el repo.

### `stack(...)`
- Qué hace: mezcla varios `Pattern` en paralelo (equivalente a pistas en un bus). Ver `packages/core/pattern.mjs`.
- Rol en la pieza: permite que la pista armónica y la melódica funcionen simultáneamente y compartan efectos globales.
- Consideración práctica: efectos aplicados al `stack` actúan como master bus; efectos aplicados dentro de cada pista actúan por voz.

### `n(string)`
- Qué hace: parsea mini-notation como una secuencia de eventos numéricos. Ver `website/src/pages/learn/mini-notation.mdx` y `packages/mini/krill.pegjs`.
- Uso en la pieza: define índices que luego se mapean mediante `.chord()` o `.scale()`.
- Detalle: los tokens `@`, `!`, `~`, `[]`, `<>`, `*`, `/`, `(p,s,o)` (euclid) son interpretados aquí y colocados en la estructura AST de Pattern.

### `.chord(str)`
- Qué hace: asocia cada índice de `n(...)` a un símbolo de acorde en `str`. `str` puede contener mini-notation para definir secuencias, replicaciones y división temporal.
- Ejemplo en la pieza: `"<[Dm Am]!2 [F C]!2>/4"` → crea una progresión Dm, Am, Dm, Am, F, C, F, C (expandida) y la ralentiza (`/4`).
- Referencia: `website/src/pages/learn/tonal.mdx` (voicing and chord helpers).

### `.anchor(str)`
- Qué hace: provee notas de referencia para ubicar las voces al resolver voicings; guía la octavación y el color.
- Musical: mover anchor hacia registros bajos da cuerpo; hacia altos aporta brillo.

### `.voicing()`
- Qué hace: resuelve símbolos de acorde (ej. Dm) y anchor en eventos de nota concretos (pitches) aplicando reglas del diccionario seleccionado (ver `setDefaultVoicings`).
- Algoritmo (resumen): 1) expandir acorde a grados; 2) seleccionar plantilla de voicing; 3) asignar octavas minimizando movimiento (voice-leading); 4) producir un `stack` de notas (cada voz como evento propio).
- Ver archivos: `packages/tonal/voicings.mjs` y `website/src/pages/learn/tonal.mdx`.

### `.velocity(x)` / `.gain(x)` / `.clip(x)` / `.lpf(freq)`
- `.velocity(x)`: multiplica la velocidad (intensidad) de eventos; útil para balance micro-dinámico.
- `.gain(x)`: ganancia general.
- `.clip(1)`: limitar la señal a ±1, evitar saturación.
- `.lpf(4000)`: filtro pasa-bajos. Referencia: `website/src/pages/learn/effects.mdx` (audio effects y filtros).

### `.scale(name)`
- Mapea índices numéricos a notas en la escala indicada. Ej.: `a4:minor` especifica la tónica y el modo.
- Detalle: el repo usa tonal helpers (`tonaljs`) para resolver nombres de escala y grados. Ver `website/src/pages/learn/tonal.mdx`.

### `.s("piano")` / selector de sonido
- Selecciona un preset/patch. Puede ser un sample o synth. Ver `website/src/pages/learn/sounds.mdx` y `website/src/pages/learn/synths.mdx`.

### `.attack()` / `.release()` / `.room()` / `.cpm()`
- `.attack()`/`.release()` controlan la envolvente ADSR (ver effects.mdx: Amplitude Envelope).
- `.room()` controla reverb global (ver effects.mdx: Reverb / room parameters).
- `.cpm()` ajusta la escala temporal del pattern (cycles per minute). Equivalente práctica: tempo global.

## Mini-notation — semántica completa y ejemplos aplicados

Basado en `mini-notation.mdx`:

- Espacios: separan eventos dentro del ciclo; cuantos más eventos, más cortos son individualmente.
- `*n` (multiplicación): acelera la secuencia (repite dentro del ciclo). Ej.: `*2` → dos iteraciones por ciclo.
- `/n` (división): divide la secuencia sobre n ciclos (`/2` → se reproduce en 2 ciclos).
- `<>` ángulo: define la longitud del ciclo por número de eventos; útil para construir patrones que mantienen una densidad fija cuando añades eventos.
- `[]` corchetes: subdivisión; los elementos dentro invaden el espacio de un único elemento exterior.
- `@w` peso/elongación: hace que el elemento ocupe w veces la duración relativa (ej.: `@2` dobla la duración relativa del elemento en su contenedor).
- `!n` replicación: repite la secuencia sin cambiar la duración total del contenedor.
- `(beats,segments,offset)` euclid: genera patrones rítmicos distribuidos. Ver `mini-notation.mdx` sección Euclidian rhythms.
- `~` rest: silencio.
- `,` coma: en eventos polifónicos crea acordes.

Ejemplo aplicado a `ameliewaltz.mjs`:
- `n("[0@2 ~, ~ [[1,2,3] ~]!2]")` se puede leer como: evento principal índice 0 con peso 2 (más largo), un sustain, y una subsecuencia [1,2,3] seguida de sustain, replicada 2 veces — crea una frase que acentúa el primer ataque y luego una figura secundaria.

## Time modifiers y equivalencias JS

- En mini-notation `/4` ≈ `.slow(4)` en API (ver `time-modifiers.mdx`).
- `*2` ≈ `.fast(2)`.
- `(...)` euclid ≈ `.euclid(beats,segments,offset)`.
- Otros métodos útiles: `.early()`, `.late()`, `.rev()`, `.palindrome()`, `.iter()`, `.ply()` — ver `time-modifiers.mdx` para su referencia API.




