# keys_drums_synths_annotated

## Resumen

Esta composición combina un diseño de "keys" (parámetros de sintetizador reutilizables), una sección de baterías rítmicas (`drums`) y un conjunto de sintetizadores (`synths`) apilados y procesados. Usa técnicas de enmascaramiento rítmico (`mask`), estructuras (`struct`), capas (`layer`) y efectos (delay, filtro, ganancia) para crear una textura polirrítmica y armónica con movimientos lento/rápido y variaciones tonales.

El carácter sonoro es orgánico y polifónico: low-end contundente (bd), texturas percusivas (sd, hh), y pads/voz de sintetizadores con transposición en capas y filtros suaves.

## Contrato

- Entrada: ninguna entrada externa obligatoria (la pieza es un objeto de definición para el REPL de Strudel). Opciones implícitas: tempo global (BPM), escala por defecto y sample set si se usan samples (`s()` puede referirse a osciladores o samples dependiendo del entorno).
- Salida: eventos de audio/nota/disparo y procesamientos de efectos (sonido audible cuando se ejecuta en el REPL/engine de Strudel).
- Modos de fallo esperados:
  - Métodos no definidos en la versión local de Strudel (por ejemplo, `.pianoroll()` o `.scaleTranspose()` si pertenecen a extensiones) -> la pieza puede lanzar errores en tiempo de evaluación.
  - Nombres de samples/voices no encontrados en la paleta (`s('bd')` sin sample definido) -> silencio o error de carga.
- Criterio de éxito: la pieza produce sonido consistente con 3 capas principales (drums, synths y keys aplicadas) y respeta las máscaras rítmicas y transposiciones descritas.

## Código (original)

```javascript
const keys = x => x.s('sawtooth').cutoff(1200).gain(.5)
  .attack(0).decay(.16).sustain(.3).release(.1);

const drums = stack(
  s("bd*2").mask("<x@7 ~>/8").gain(.8),
  s("~ <sd!7 [sd@3 ~]>").mask("<x@7 ~>/4").gain(.5),
  s("[~ hh]*2").delay(.3).delayfeedback(.5).delaytime(.125).gain(.4)
);

const synths = stack(
  
  "<eb4 d4 c4 b3>/2"
  .scale("<C:minor!3 C:melodic:minor>/2")
  .struct("[~ x]*2")
  .layer(
    x=>x.scaleTranspose(0).early(0),
    x=>x.scaleTranspose(2).early(1/8),
    x=>x.scaleTranspose(7).early(1/4),
    x=>x.scaleTranspose(8).early(3/8)
  ).note().apply(keys).mask("<~ x>/16")
  .color('darkseagreen'),
  
  note("<C2 Bb1 Ab1 [G1 [G2 G1]]>/2")
  .struct("[x [~ x] <[~ [~ x]]!3 [x x]>@2"/2.fast(2))
  .s('sawtooth').attack(0.001).decay(0.2).sustain(1).cutoff(500)
  .color('brown'),
  chord("<Cm7 Bb7 Fm7 G7b13>/2")
  .struct("~ [x@0.2 ~]".fast(2))
  .dict('lefthand').voicing()
  .every(2, early(1/8))
  .apply(keys).sustain(0)
  .delay(.4).delaytime(.12)
  .mask("<x@7 ~>/8".early(1/4))
).add(note("<-1 0>/8"))
stack(
  drums.fast(2).color('tomato'), 
  synths
).slow(2)
  .pianoroll({fold:1})
```

## Explicación línea a línea / bloques funcionales

Esta composición funciona como un sistema modular donde cada parte contribuye a una textura sonora rica y polirrítmica. El flujo general es: definir presets reutilizables (`keys`), construir ritmos percusivos (`drums`), crear capas armónicas y melódicas (`synths`), y finalmente mezclar todo con ajustes de tempo y visualización. La pieza usa conceptos de live coding como patrones cíclicos, enmascaramiento rítmico y transformación funcional para generar variaciones orgánicas.

1) `const keys = x => x.s('sawtooth').cutoff(1200).gain(.5).attack(0).decay(.16).sustain(.3).release(.1);`
- Define una función `keys` que toma un objeto `x` (normalmente una voz/synth) y encadena parámetros típicos de un sintetizador:
  - `.s('sawtooth')`: selecciona forma de onda o timbre. 'sawtooth' produce un sonido brillante y agresivo, ideal para pads o leads en géneros electrónicos.
  - `.cutoff(1200)`: filtro pasa bajos cuyo corte se sitúa en 1200 Hz. Esto atenúa frecuencias altas, dando un sonido más cálido y muffled, típico de sintetizadores vintage.
  - `.gain(.5)`: nivel de salida. Reduce el volumen general para evitar clipping cuando se apila con otras voces.
  - ADSR: ataque 0s (ataque instantáneo para un sonido punchy), decay 0.16s (caída rápida de volumen), sustain 0.3 (nivel sostenido), release 0.1s (liberación corta para evitar colas largas).
- Uso: se puede `apply(keys)` a una voz para reutilizar este preset de síntesis. Esto crea consistencia tímbrica en las voces que lo usan, como un "preset" de sintetizador.

2) `const drums = stack(...);`
- `stack` mezcla/agrupa varias voces percutivas en paralelo, creando un ritmo compuesto. Cada voz suena simultáneamente pero con sus propios patrones rítmicos.
- Cada elemento dentro de `stack` es una voz creada con `s(...)` (probablemente sample u oscilador) con transformaciones rítmicas y de ganancia. `s()` en Strudel puede referir a samples (como 'bd' para bass drum) o sintetizadores.

  a) `s("bd*2").mask("<x@7 ~>/8").gain(.8)`
  - `"bd*2"`: patrón de bass drum duplicado. El `*2` indica repetición, creando un patrón como "bd bd" en cada ciclo. Esto genera un ritmo de bombo constante y pulsante.
  - `.mask("<x@7 ~>/8")`: aplica una máscara rítmica que filtra cuándo suena el patrón. `<x@7 ~>` es un patrón cíclico que rota cada 8 pasos: 7 eventos 'x' (sonido) y 1 '~' (silencio). `/8` indica resolución de octavos (cada paso es 1/8 de negra). En práctica: el bombo suena en 7 de cada 8 octavos, creando un ritmo casi constante con breves pausas, lo que añade groove y evita monotonía.
  - `.gain(.8)`: nivela la salida de la BD a 80% para dejar espacio a otras voces.

  b) `s("~ <sd!7 [sd@3 ~]>").mask("<x@7 ~>/4").gain(.5)`
  - Patrón complejo para caja/side (sd). `~` es silencio, `<sd!7 [sd@3 ~]>` es un grupo polirrítmico: 'sd' suena 7 veces seguido de un patrón anidado `[sd@3 ~]` (sd suena 3 veces, luego silencio). `!7` puede indicar variación probabilística o accent.
  - La máscara `<x@7 ~>/4` usa resolución de cuartos (cada paso es 1/4 de negra), filtrando el patrón para que suene en 7 de cada 8 cuartos. Esto crea un ritmo de caja más esporádico y syncopado, contrastando con el bombo constante.
  - `.gain(.5)`: volumen más bajo para la caja, manteniendo el bombo como elemento dominante.

  c) `s("[~ hh]*2").delay(.3).delayfeedback(.5).delaytime(.125).gain(.4)`
  - Hi-hat con patrón `[~ hh]*2`: alterna silencio y hh, duplicado. Crea un ritmo de charles constante pero sutil.
  - Procesamiento por delay: `.delay(.3)` envía 30% de la señal al delay; `.delayfeedback(.5)` controla cuánto se retroalimenta (50%, creando ecos moderados); `.delaytime(.125)` tiempo de retardo (aprox. 1/8 de negra a 120 BPM, añadiendo textura rítmica).
  - `.gain(.4)`: volumen bajo para que actúe como relleno percusivo sin dominar.

  En conjunto, `drums` crea un ritmo de batería groovy con bombo pulsante, caja syncopada y hh con delay, típico de géneros como house o techno.

3) `const synths = stack(...).add(note("<-1 0>/8"))`
- `synths` contiene varias capas armónicas y melódicas apiladas. Al final se añade `note("<-1 0>/8")` como ornamentación rítmica: notas bajas (-1 semitono abajo de la raíz, y raíz) cada 1/8, añadiendo punctuations armónicos.
- Las capas se ejecutan en paralelo, creando densidad y movimiento.

  Bloque A (primer item - capa melódica principal):
  - `"<eb4 d4 c4 b3>/2"`: secuencia de notas (eb4, d4, c4, b3) dividida por 2, haciendo cada nota durar el doble (de negra a blanca). Crea un motif descendente melancólico.
  - `.scale("<C:minor!3 C:melodic:minor>/2")`: aplica escala que alterna entre C menor (sonido oscuro, menor natural) y C melódico menor (más brillante con 6ª y 7ª mayores) cada 2 ciclos. `!3` puede indicar variación o probabilidad. Esto cambia el color armónico dinámicamente.
  - `.struct("[~ x]*2")`: estructura rítmica: `[~ x]` es silencio-evento, duplicado. Crea un patrón de 4 pasos: ~ x ~ x, haciendo que las notas suenen en posiciones 2 y 4.
  - `.layer(...)`: crea 4 capas paralelas, cada una aplicando transformaciones:
    - `x=>x.scaleTranspose(0).early(0)`: capa base, sin transposición, sin offset temporal.
    - `x=>x.scaleTranspose(2).early(1/8)`: transpone 2 grados arriba en la escala (ej. de do a re en menor), offset temprano de 1/8 para adelanto rítmico.
    - `x=>x.scaleTranspose(7).early(1/4)`: transpone 7 grados (quinta arriba), offset de 1/4.
    - `x=>x.scaleTranspose(8).early(3/8)`: transpone 8 grados (octava arriba), offset de 3/8.
    Esto crea armonizaciones en paralelo con micro-desfases, generando movimiento y riqueza polifónica.
  - `.note().apply(keys).mask("<~ x>/16")`: convierte a eventos de nota, aplica preset `keys`, enmascara a resolución de 1/16 (filtrando finamente cuándo suena).
  - `.color('darkseagreen')`: etiqueta visual para el piano-roll.

  Bloque B (segundo item - bajo/melodía):
  - `note("<C2 Bb1 Ab1 [G1 [G2 G1]]>/2")`: línea de bajo con grupos: C2, Bb1, Ab1, luego grupo [G1 [G2 G1]] (G1, G2, G1 anidados). `/2` alarga duraciones.
  - `.struct("[x [~ x] <[~ [~ x]]!3 [x x]>@2]/2".fast(2))`: estructura compleja acelerada x2. Incluye probabilidades (`!3`), rotaciones (`@2`), creando variaciones rítmicas orgánicas.
  - `.s('sawtooth').attack(0.001).decay(0.2).sustain(1).cutoff(500)`: timbre brillante con sustain total y filtro más abierto (500Hz), ideal para bajo sostenido.
  - `.color('brown')`: etiqueta visual.

  Bloque C (tercer item - acordes):
  - `chord("<Cm7 Bb7 Fm7 G7b13>/2")`: progresión de acordes jazzísticos (Cm7, Bb7, Fm7, G7b13) cada 2 ciclos.
  - `.struct("~ [x@0.2 ~]".fast(2))`: estructura con silencios y acentos (`@0.2` indica duración reducida), acelerada x2.
  - `.dict('lefthand').voicing()`: usa diccionario 'lefthand' para voicing (disposición de notas en registro bajo).
  - `.every(2, early(1/8))`: cada 2 ciclos, adelanta 1/8 para swing.
  - `.apply(keys).sustain(0)`: aplica preset pero anula sustain para sonido staccato.
  - `.delay(.4).delaytime(.12)`: añade delay con mezcla 40%, tiempo 0.12s (aprox. 1/8 a 120 BPM).
  - `.mask("<x@7 ~>/8".early(1/4))`: máscara con offset temprano de 1/4, creando polirritmia.

4) `stack(drums.fast(2).color('tomato'), synths).slow(2).pianoroll({fold:1})`
- Mezcla `drums` y `synths` en un único `stack` maestro, ejecutándose en paralelo.
- `.fast(2)` acelera `drums` x2 (ritmo doble velocidad), creando contraste con `synths` que van a velocidad normal.
- `.slow(2)` ralentiza todo el stack combinado a la mitad, compensando parcialmente el fast de drums y creando un tempo general moderado.
- `.pianoroll({fold:1})`: activa visualización de piano-roll con plegado de octava (fold:1 agrupa octavas para mejor vista).

En conjunto, la composición genera un paisaje sonoro donde los drums proporcionan groove pulsante, mientras las synths crean capas armónicas que evolucionan con transposiciones y offsets, todo unificado por presets comunes y efectos. El enmascaramiento añade imprevisibilidad, y las transformaciones de tempo crean tensión/dinámica.

## Variaciones sugeridas (rápidas)

- Intensidad/tempo:
  - Cambiar `.fast(2)` a `.fast(1.5)` o `.slow(1.5)` para micro-tiempos no binarios.
- Escala / Transposición:
  - En `.scale("<C:minor!3 C:melodic:minor>/2")` probar `G:minor` o `C:major` para cambiar color armónico.
  - En `layer(...)` cambiar transposiciones a `-12, 0, 7, 12` para variaciones en octavas.
- Efectos:
  - Incrementar `.delayfeedback(.7)` para colas largas.
  - Añadir `.reverb(0.3)` a `synths` si la API la soporta.
- Dinámica:
  - Cambiar `.gain(.8)` de BD a `.gain(1.0)` y compresión ligera si está disponible (`.compressor()`).
- Simplificar máscaras para obtener compases 3:2 o 5:4 experimentando con `/<n>` en `.mask()`.

## Cómo ejecutar (rápido)

Asumo que tienes el REPL del proyecto Strudel (carpeta `website`) funcionando localmente.

1) Abrir el REPL web y pegar el bloque en el editor (por ejemplo en `website/src/repl/tunes.mjs` o en la interfaz del REPL): normalmente el REPL evalúa el código y lanza el sonido.

2) Pasos locales básicos si no está en ejecución (PowerShell):

```powershell
# desde la raíz 'strudel' (si usas pnpm)
pm install
pnpm --filter website install
cd website
pnpm dev
```

3) En el REPL: pega el bloque de código y ejecútalo; ajusta BPM/tempo según el control de la UI.

## Notas y supuestos

- Suposiciones hechas:
  - Funciones como `s()`, `note()`, `chord()`, `stack()` y encadenados (`.mask()`, `.struct()`) son la API estándar de Strudel REPL. Si tu versión del motor cambia nombres o firma, hay que adaptar llamadas.
  - `.pianoroll()` y `.color()` son metadatos de visualización; no afectan el audio directamente.
  - `.scaleTranspose(n)` transpone respecto a la escala actual, no en semitonos absolutos (esto es común en APIS musicales basadas en escala).
- Edge cases:
  - Si alguna voz refiere a un sample ausente, se puede caer la voz o producir silencio.
  - Máscaras (`mask`) complejas con `@` y `!` pueden depender de la versión de Strudel.
- Pruebas realizadas (recomendadas):
  - Pegar sólo `keys` y un `note("C4")` con `apply(keys)` para verificar el preset de sintetizador.
  - Renderizar `drums` solo para comprobar patrones y delays.

## Detalle técnico ampliado (vinculado a `website/src/pages/learn`)

Aquí relaciono los elementos del fragmento con páginas concretas de la carpeta `website/src/pages/learn` e indico cómo se comportan en la práctica y cómo probar/ajustar cada parámetro.

### Notación y patrones
- Mini-notation (`mini-notation.mdx`): tokens como `x`, `~`, `[]`, `<>`, `*`, `/n` y agrupaciones anidadas se rigen por esta sintaxis. En el código:
  - `"<eb4 d4 c4 b3>/2"` usa `<>` para agrupación y `/2` para alargar duraciones. Para experimentar, cambia `/2` a `/4` para doblar la duración.
  - `[~ x]*2` duplica el patrón de silencio-evento; para verificar, sustituye `.struct("[~ x]*2")` por `.struct("[x x]*2")` y escucha que la voz pasa de contratiempo a continuo.

### Estructura y paso a paso
- `stepwise.mdx` y `factories.mdx`: `.struct()` define cuándo se materializa cada nota dentro del ciclo. `.layer()` crea variantes paralelas a partir de la misma fuente.
  - Prueba: quita temporalmente `.layer(...)` y escucha la pérdida de riqueza armónica; vuelve a añadir capas una por una para oír el efecto de cada `scaleTranspose` y `early`.

### Tiempo y modificadores
- `time-modifiers.mdx`: `.fast(n)`, `.slow(n)`, `.early(t)` y `.delaytime(t)` manipulan escala temporal y offsets.
  - Ejemplo práctico: `drums.fast(2)` + `.slow(2)` en el stack final efectivamente deja los drums con doble densidad interna pero el conjunto a velocidad normal; comenta `.slow(2)` para oír los drums más rápidos.
  - `early(1/8)` adelanta eventos 1/8 — útil para swing.

### Probabilidades y rotaciones
- `random-modifiers.mdx` y `conditional-modifiers.mdx`: símbolos `!n` y `@n` controlan probabilidad y rotación/offset en patrones. En `"<x@7 ~>/8"`, `@7` rota el patrón para crear desplazamientos cíclicos.
  - Prueba: sustituye `@7` por `@0` para eliminar rotación y comparar.

### Tonalidad y escalas
- `tonal.mdx` y `synths.mdx`: `.scale()`, `.scaleTranspose()` y `chord()` dependen del sistema tonal de Strudel.
  - `.scale("<C:minor!3 C:melodic:minor>/2")` alterna entre escalas; para verificar el efecto, aplica `.scale("C:minor")` fija y compara el color armónico.
  - `scaleTranspose(n)` normalmente transpone en grados de la escala (no semitonos). Para comprobarlo, añade una capa con `scaleTranspose(12)` y escucha si sube doce grados de escala (posiblemente una octava más algún grado según convención).

### Síntesis y presets
- `synths.mdx` y `sounds.mdx`: `.s('sawtooth')`, `.cutoff()`, `.attack()/decay()/sustain()/release()` definen el timbre.
  - Test rápido: `note("C4").apply(keys)` — debería sonar con la envolvente y filtro descritos. Ajusta `.cutoff(1200)` a `800` para notar atenuación de agudos.

### Samples y cajas de sonido
- `samples.mdx`: `s("bd*2")` puede referirse a un sample de bass drum si existe en el set de samples; si no, `s()` puede crear un oscilador.
  - Verificación: reemplaza `s("bd*2")` por `note("C2")` temporalmente para comprobar que el patrón rítmico está correcto aunque falte el sample.

### Efectos
- `effects.mdx`: `.delay()`, `.delayfeedback()`, `.delaytime()` y (si está) `.reverb()` controlan la espacialidad.
  - Ajustes: aumentar `.delayfeedback` a `0.7` crea colas más largas; reducir `.delaytime` a `0.06` produce ecos más cercanos.

### Visualización y depuración
- `visual-feedback.mdx`: `.pianoroll({fold:1})` y `.color()` son herramientas visuales del REPL.
  - Depura patrones encendiendo/desactivando `.pianoroll()` o cambiando `fold` para ver rangos de octava.

### Pruebas rápidas recomendadas (checklist de verificación)
- [ ] Ejecutar solo `keys` con `note("C4").apply(keys)` para validar ADSR y filtro.
- [ ] Ejecutar `drums` por separado y observar máscaras: primero sin `.mask()` luego con `.mask()` para entender filtrado temporal.
- [ ] Desactivar `.layer()` en el primer synth para oír cada transposición individual.
- [ ] Aislar `chord(...)` y alternar `.sustain()` entre `0` y `1` para percibir su efecto.
- [ ] Remplazar `s('bd*2')` por `note('C2')` si el sample no se carga.

### Errores comunes y debug
- Si ves silencio en `s('bd')`, comprueba `samples.mdx` y la carpeta `samples/` para asegurar que el sample existe.
- Si `.scaleTranspose()` no tiene efecto, revisa qué escala está activa; fija `.scale('C:minor')` antes de llamar `.scaleTranspose()` para eliminar ambigüedad.
- Para patrones que parecen no rotar o no variar, prueba a ajustar los parámetros `@n` y `!n` a valores obvios (`@0`, `!1`) y observa el cambio.

---
Archivo creado en `composition_docs/keys_drums_synths_annotated.md`.
