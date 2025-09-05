# drums_synths_layered_annotated

## Resumen

Este estudio documenta una pieza con tres componentes principales: un preset de síntesis reutilizable (`keys`), una batería con enmascarado rítmico (`drums`) y un conjunto de sintetizadores apilados con capas armónicas y desplazamientos temporales (`synths`). Se emplean técnicas de mini-notation, `mask`, `struct`, `layer`, transposición por grados de escala y efectos (delay, filtro, ADSR).

## Código (original)

```javascript
const keys = x => x.s('sawtooth').cutoff(1200).gain(.5)
  .attack(0).decay(.16).sustain(.3).release(.25);

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
    .struct("[x [~ x] <[~ [~ x]]!3 [x x]>@2]/2".fast(2))
    .s('sawtooth').attack(0.01).decay(0.2).sustain(1).cutoff(500)
    .color('brown'),

  chord("<Cm7 Bb7 Fm7 [G7#9 G7b9 G7b13]>/2")
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
  .pianoroll({})
```

## Explicación por bloques

- keys (preset)
  - `s('sawtooth')` + `cutoff(1200)` + ADSR corto -> stabs cálidos y definidos.
  - Se reutiliza con `.apply(keys)` para mantener consistencia tímbrica.

- drums (ritmo con máscaras)
  - `bd*2` con `mask("<x@7 ~>/8")`: bombo casi constante con una pausa cada 8 pasos (síncopa leve).
  - `~ <sd!7 [sd@3 ~]>` con `mask("<x@7 ~>/4")`: caja con variación/rotación a resolución de negras; aporta contratiempos.
  - `"[~ hh]*2"` con delay (feedback 0.5, tiempo 1/8) -> textura percusiva en el background.

- synths (capas armónicas y bajo)
  1) Motivo melódico: `"<eb4 d4 c4 b3>/2"` -> alterna `C:minor` y `C:melodic:minor`; `struct("[~ x]*2")` y `layer` con `scaleTranspose(0,2,7,8)` + `early` (0, 1/8, 1/4, 3/8) generan armonización escalonada. Después `note().apply(keys)` y `mask("<~ x>/16")` filtran eventos para precisión rítmica.
  2) Bajo: `note("<C2 Bb1 Ab1 [G1 [G2 G1]]>/2")` con `struct(...).fast(2)`: línea con silencios y rellenos; filtro a 500 Hz para grosor.
  3) Acordes: `chord("<Cm7 Bb7 Fm7 [G7#9 G7b9 G7b13]>/2")` con `.dict('lefthand').voicing()`; `every(2, early(1/8))` añade empuje; `sustain(0)` los vuelve percutivos; `mask` y `delay` dan aire.
  - `add(note("<-1 0>/8"))`: micro-variación en semitonos a resolución de 1/8.

- mezcla/tempo/visualización
  - `stack(drums.fast(2), synths).slow(2)`: compensa densidad de drums manteniendo el conjunto estable.
  - `pianoroll({})`: feedback visual para depurar registro y timing.

## Puntos clave

- `mask(patrón)` actúa como puerta: sólo pasan eventos donde el patrón tiene actividad.
- `scaleTranspose(n)` transpone por grados de la escala activa (no semitonos).
- Alternar escalas (menor natural / melódica) cambia el color armónico sin cambiar el motivo base.
- `early(t)` desplaza capas para generar entrada escalonada (stagger) y sensación polirrítmica.

## Cómo ejecutarla (local REPL)

1) Inicia el REPL local desde `strudel/`:

```powershell
pnpm run repl
```

2) En el editor del REPL, pega el bloque y ejecútalo (o colócalo en `website/src/repl/live-sessions/1_current_session.mjs` si quieres que aparezca como default).

3) Ajusta `setcps/setcpm` en la UI o añade una línea al inicio para fijar tempo, p. ej.: `setcps(120/60/4)`.

## Variaciones rápidas

- Reducir densidad: cambia `mask("<~ x>/16")` a `"/8"` o elimina una capa del `layer`.
- Bajo más seco: `release(0.12)` y `clip(0.95)` en la voz del bajo.
- Acordes más abiertos: usa otro diccionario (`.dict('house')`) o sube `anchor` si está disponible.
- Tempo feel: comenta `.slow(2)` para escuchar la versión más densa/rápida.

## Referencias

- Sintaxis y mini-notation: `.github/formateo/sintaxis.instructions.md`
- Funciones tonales: `website/src/pages/learn/tonal.mdx`
- Composiciones relacionadas: `composition_docs/ameliewaltz_annotated.md`, `composition_docs/rhythmofthenight_annotated.md`, `composition_docs/keys_drums_synths_annotated.md`
