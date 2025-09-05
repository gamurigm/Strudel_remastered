# Opus Synthesis - Composición Anotada

## Resumen

`Opus Synthesis` es una pieza de estudio creada para demostrar la integración de técnicas avanzadas de Strudel, basándose en el análisis de la documentación del repositorio y composiciones existentes como `ameliewaltz`, `rhythmofthenight` y `keys_drums_synths`.

Esta composición modular incluye:
1.  **Presets de Síntesis (`const`)**: Para `pads`, `leads` y `bajos`, promoviendo la consistencia tímbrica.
2.  **Batería (`drums`)**: Un ritmo inspirado en el house, con síncopas mediante `.mask()` y humanización con `.patt()`.
3.  **Armonía (`harmony`)**: Una progresión de acordes con voicings automáticos y un ancla móvil para crear inversiones interesantes.
4.  **Melodía (`melody`)**: Un arpegio que usa `.layer()` para crear una textura polifónica y escalonada a partir de una sola línea de notas.
5.  **Bajo (`bass`)**: Una línea de bajo que sigue las raíces de la armonía, con un ritmo sincopado.
6.  **Mezcla Final**: Un `stack` que combina todas las partes, aplicando `.slow()` para establecer el tempo final y `.pianoroll()` para la visualización.

## Código Completo

```javascript
// Fija el tempo base: 125 BPM, con 4 pulsos por ciclo.
// Ref: cycles.mdx
setcpm(125/4);

// Establece el diccionario de voicings para un comportamiento predecible.
// Ref: voicings.mdx, ameliewaltz_annotated.md
setDefaultVoicings('legacy');

// --- PRESETS DE SÍNTESIS ---
// Un preset para pads suaves y atmosféricos.
const padKeys = p => p.s('triangle').cutoff(1800).gain(0.6)
  .attack(0.2).decay(0.4).sustain(0.5).release(0.8)
  .room(0.4).delay(0.5).dfb(0.4).dt(3/8);

// Un preset para leads/arpegios, más brillante y percusivo.
const leadKeys = p => p.s('sawtooth').cutoff(2500).gain(0.4)
  .attack(0.01).decay(0.15).sustain(0.2).release(0.25)
  .lpf(4000).lpr(0.2); // Filtro con resonancia para carácter.

// Un preset para el bajo, profundo y con pegada.
const bassSynth = p => p.s('sub').cutoff(600).gain(0.9)
  .attack(0.01).decay(0.2).sustain(0.1).release(0.2)
  .clip(0.9); // Ligera saturación para más cuerpo.

// --- SECCIONES MUSICALES ---

// 1. BATERÍA (DRUMS)
// Inspirado en drum_patterns.mjs y keys_drums_synths_annotated.md
const drums = stack(
  // Bombo four-on-the-floor con una máscara para crear síncopa en el último pulso.
  s("bd*4").mask("x*3 [x ~ x ~]").gain(0.9),
  
  // Caja en los pulsos 2 y 4, con un golpe fantasma.
  s("~ sd ~ [sd sd]").velocity("<0.9 0.5>").gain(0.8),
  
  // Hi-hats cerrados con un patrón de ganancia para humanizar el ritmo.
  s("hh*8").patt("0.8 0.6 1 0.7").gain(0.5),

  // Hi-hat abierto en el off-beat.
  s("~ oh").every(2, rev).gain(0.6)
).color('coral');


// 2. ARMONÍA (HARMONY)
// Progresión de acordes con voicings automáticos.
// Ref: voicings.mdx, rhythmofthenight_annotated.md
const harmony = chord("<Am G C F>/2")
  .anchor("<c4 g3 e4 d4>/4") // Ancla móvil para guiar las inversiones.
  .voicing()
  .apply(padKeys) // Aplica el preset de pad.
  .color('skyblue');


// 3. MELODÍA (MELODY)
// Arpegio en capas, técnica de rhythmofthenight y keys_drums_synths.
const melody = n("0 2 3 5 7 5 3 2")
  .scale("a:minor") // Fija la escala a La menor.
  .layer(
    // Capa 1: Melodía principal.
    x => x.scaleTranspose(0).early(0),
    // Capa 2: Una tercera arriba, ligeramente adelantada.
    x => x.scaleTranspose(2).early(1/16).gain(0.7),
    // Capa 3: Una octava arriba, para dar brillo.
    x => x.transpose(12).early(1/8).gain(0.6)
  )
  .apply(leadKeys) // Aplica el preset de lead.
  .mask("<x*4 ~*4>/2") // Toca durante la primera mitad de cada ciclo de 2 compases.
  .color('mediumseagreen');


// 4. BAJO (BASS)
// Sigue las notas raíz de la progresión armónica.
const bass = harmony.rootNotes()
  .struct("[x ~]!4 [x x ~ x]") // Patrón rítmico para el bajo.
  .apply(bassSynth)
  .color('goldenrod');


// --- MEZCLA FINAL ---
// Apila todas las partes y aplica transformaciones globales.
stack(
  drums,
  harmony,
  melody,
  bass
).slow(2) // Ralentiza todo el conjunto a la mitad para un tempo final de 62.5 BPM.
 .pianoroll({fold:1}) // Activa la visualización.
```

## Cómo ejecutar esta pieza

1.  **Inicia el REPL de Strudel** desde la raíz del proyecto:
    ```powershell
    pnpm run repl
    ```
2.  **Copia y pega** el código completo de arriba en el editor del REPL.
3.  El REPL debería evaluar el código y empezar a reproducir el audio. La visualización del `.pianoroll()` te mostrará las notas que se están tocando.

## Análisis detallado de las técnicas utilizadas

*   **Modularidad y Presets**: Al igual que en `keys_drums_synths_annotated.md`, se definen `const` para los sonidos (`padKeys`, `leadKeys`, `bassSynth`). Esto facilita la reutilización y mantiene un sonido coherente.
*   **Ritmo y `mask`**: La batería usa `mask` para crear variaciones rítmicas complejas a partir de patrones simples, una técnica vista en varias de las composiciones. El `s("bd*4").mask("x*3 [x ~ x ~]")` es un buen ejemplo: un bombo 4x4 que se rompe en el último tiempo.
*   **Armonía y `voicing`**: La sección `harmony` utiliza `chord()` para definir la progresión y `.voicing()` para generar las notas automáticamente. El `.anchor()` móvil es una técnica avanzada inspirada en `voicings.mdx` para crear conducciones de voces más interesantes.
*   **Textura con `.layer()`**: La melodía es un claro ejemplo del poder de `.layer()`, inspirado en `rhythmofthenight`. Una simple secuencia de notas se convierte en un arpegio rico y armonizado gracias a `scaleTranspose` (transposición diatónica) y `early` (desplazamiento temporal).
*   **Interconexión de partes**: El bajo (`bass`) no es independiente; extrae las notas raíz de la armonía con `harmony.rootNotes()`. Esto asegura que la base armónica siempre esté sincronizada, una práctica robusta para composiciones complejas.
*   **Control de Tempo**: `setcpm(125/4)` establece un ciclo de 4 pulsos a 125 BPM. Luego, `.slow(2)` al final ralentiza todo el `stack`, resultando en un tempo percibido de 62.5 BPM. Esta es una forma idiomática en Strudel de trabajar a una resolución alta y luego ajustar el tempo global, como se explica en `cycles.mdx`.
