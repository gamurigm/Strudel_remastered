# “Il Vento Caldo Dell'Estate” (WIP) – Anotación Técnica (Ampliada)

Autor script: eefano  
Framework: Strudel  
Fuente: 2_current_session.mjs  

---

## 1. Objetivo y Enfoque
Recrear la macro–forma y texturas evolutivas de la canción usando:
- Gramática de patrones de larga escala (pickRestart) como “partitura temporal”.
- Codificación compacta multi‑campo (chord:anchor@control) desempaquetada con `split`.
- Capa armónica generativa (wind + synt) vs capas narrativas/directas (voic, bass, drums).
- Introducción y retirada de densidad (silencios largos planeados) para arco dinámico.

---

## 2. Leyenda de Notación (DSL Strudel)
| Símbolo | Significado |
|---------|-------------|
| `<a b c>` | Secuencia cíclica de sub‑patrones. |
| `a@N` | Repite ‘a’ N ciclos completos antes de avanzar. |
| `[a,b]` | Superposición (a y b simultáneos). |
| `~` | Silencio. |
| `x*4` | Repetición interna (multiplicación de eventos). |
| `x!4` | Repetición forzada (clonado exacto, sin transformación). |
| `[...]@2` | Repite el bloque entero 2 veces. |
| `note("...")` | Notas absolutas. |
| `n("...").scale("c#:major")` | Grados → notas. |
| `.fast(k)` | Comprime duración (más eventos en mismo ciclo). |
| `.slow(k)` | Expande duración (menos densidad). |
| `.pickRestart([a,b,c])` | Selecciona variante; reinicia su fase al cambiar. |
| `.split([defaults], fn)` | Desempaqueta tokens multi‑campo y llama a `fn`. |
| `.anchor("g#2")` | Recentra voicing alrededor de nota. |
| `.mode('above')` | Construye voicings solo por encima del anchor. |
| `.voicing()` | Aplica diccionario/inversión por defecto vigente. |
| `.superimpose(f)` | Duplica patrón y mezcla versión transformada. |
| `.when(cond, f)` | Aplica f solo si cond produce valor “truthy”. |
| `:dur` (en nota) | Articulación micro (override de duración local). |

---

## 3. Cronología Global (Resumen Reforzado)
Los pickRestart definen “secciones largas” (macro‑slots). Silencios (~@N) no vacíos accidentales: son respiraciones estructurales que permiten foco alternado.

| Parte | Orden | Efecto Dramático |
|-------|-------|------------------|
| synt | a → b → b → sil → b → b → sil → sil → sil | Motor repetitivo; se apaga para abrir espacio a capas tardías. |
| bass | a → b → a → b → c → sil | Confirma tonalidad (a), introduce cromatismo (b), tensión ostinata (c). |
| wind | sil → a → sil → a → b → sil | Entrada retardada → colorea medio registro sin enturbiar inicio. |
| voic | sil → a → sil → a → b → sil | Melodía aparece junto al colchón (wind) para primera exposición clara. |
| drums | Escalonado a → [a,b] → [a,b,c] … → h → sil | Construcción incremental + clímax fill (h). |

---

## 4. Gramática de Token Multi‑Campo
Formato flexible (campos opcionales):

```
Token := Chord ( ":" Anchor )? ( ":" Selector )? ( "@" MacroDur )?
Ejemplos:
C#            -> chord = C#
C#:g#2        -> + anchor
C#:g#2:1      -> + selector numérico (control arpegio / gating)
C#:g#2:1@6    -> + duración macro (usada por pickRestart o clip contextual)
```

`split` asigna:
- s[0] → Chord symbol
- s[1] → Anchor (nota base para voicing)
- s[2] → Selector / control (número, índice, truthy/falsy)

Defaults rellenan campos faltantes.

---

## 5. Anatomía de `split` (Paso a Paso)
1. Itera índices i sobre lista de defaults.
2. Para cada evento del patrón original:
   - Extrae valor primario (si es objeto con `.value` conserva metadatos).
   - Si el valor es array → selecciona posición i (o default d).
   - Si es escalar:
     - i=0 ⇒ valor original.
     - i>0 ⇒ toma default.
3. Devuelve nueva lista de sub‑patrones (s[0], s[1], s[2]) paralelos, sincronizados.

Ventaja: Evita mantener 3 patrones manuales (acordes, anchors, selectores) y elimina riesgo de desalineación temporal.

---

## 6. Flujo de Datos por Capa

1. wind:
   - Token → split → (chordSymbol, anchor, selector)
   - selector decide qué arpegio `n(selector.pickRestart([...]))`
   - chordSymbol + anchor + voicing → vector notas
   - n(...) produce índices locales → mapeados a notas de chord
   - superimpose añade segunda síntesis (saw) condicional.

2. synt:
   - Patrones rítmicos (índices) → pickRestart rítmico → mapeo a grados → escala C# mayor → note() → órgano filtrado.

3. bass:
   - Token → split → note(s[0]) produce pitch
   - clip(s[1]) aplica articulación (duración exacta)
   - Variantes b y c modifican densidad / cromatismo / velocidad.

4. voic:
   - Pre‑escritura melódica (no generativa) → set de notas + silencios -> cambio timbre entre secciones.

5. drums:
   - Plantilla jerárquica de bloques a…h
   - Combinaciones `[a,b]` acumulan capas sin redefinir
   - pickOut mapea símbolos → voces procesadas (bd, sd, hh, cr)
   - fill h acelerado -> energía de transición.

---

## 7. Arpegio y Voicing (wind)
| Paso | Transformación | Motivo |
|------|----------------|--------|
| chord() | Construye conjunto base | Material armónico limpio |
| anchor() | Translada centro | Evita saltos registro |
| mode('above') | Filtra notas bajo anchor | Limpieza en graves |
| voicing() | Aplica disposiciones | Cohesión vertical |
| n(selector...) | Patrones de índices (ej: “0 1 ~ 2 3 …”) | Movimiento interno |
| superimpose/when | Capa serrada intermitente | Crescendo textural sin saturar todo el ciclo |

---

## 8. Armonía (Ampliada)
Conjunto referencial de acordes detectados (wind + basso):
- Primarios: C#, G#, A#m, D# (I, V, ii, VI en C# mayor reinterpretado parcialmente).
- Excursiones: Cm (modal shift ♭III relativo) / F7 (♭VII/V tritón de B, color dominante alterada).
- Bajo variante b introduce notas puente (c natural, f natural) → fricción Lydian / Mixolydian prestada.
Función: Amplía paleta sin abandonar centro auditivo C# (sostenido por dron recurrente del bass a).

---

## 9. Registro y Separación Espectral (Detalle)
| Registro MIDI | Instrumento principal | Estrategia |
|---------------|----------------------|-----------|
| 36–55 (grave) | bass (a,b,c) + bd | Grave ordenado, filtro < 400Hz |
| 55–72 (medio) | wind organ base / synt | Acordes y motivos rítmicos amortiguados (lpf 1200) |
| 72–84 (alto) | wind saw layer / voic (oboe) | Brillo moderado; evita choque con hats filtrados arriba |
| >84 (aire) | hh, crash, parciales sierra | Altos filtrados (hpf 7–8k) para aire sin cuerpo |

---

## 10. Dinámica Narrativa (Curva)
| Fase | Ciclos Dominantes | Capas Activas | Sensación |
|------|-------------------|---------------|-----------|
| Intro | 0–27 | bass(a) + synt(a) | Plano, estable |
| Expansión 1 | 27–172 | synt(b) + bass(a/b) + drums construcción | Pulso creciente |
| Aparición Armonía Alta | 172–228 | wind(a) + voic(a) | Apertura espacial |
| Respiro | 228–373 | silencios intercalados | Contraste / anticipación |
| Clímax | sección b/h | wind(b fast), bass(c), drums(h), voic(b) | Máxima densidad |
| Cierre | final silencios | Residuo armónico | Descarga / decay |

---

## 11. Articulación y Micro–Timing
- Uso combinado de sufijos `:dur` (nota local) + `.clip(global)` en bajo ⇒ jerarquía de articulación (macro vs micro).
- Arpegio irregular (holes `~`) evita sensación mecánica.
- `.fast(1.2)` aplicado solo a secciones intensivas para no erosionar pulso macro.

---

## 12. Performance / CPU
| Fuente | Costo potencial | Mitigación |
|--------|-----------------|------------|
| drums h | Anidación profunda / parsing | Congelar estructura si estable |
| superimpose wind | Duplicación render | Activación condicional (when) reduce tiempo activo |
| Largos pickRestart | Gestión eficiente (interno) | OK; evitar añadir mutación dentro de bloques muy largos |

Optimización adicional: aplicar `.gain()` modulada lenta en vez de duplicar variantes si se busca evolución tímbrica suave.

---

## 13. Extensión Segura (Recetas)
| Objetivo | Acción Concreta |
|----------|-----------------|
| Añadir nueva sección “d” | Incluir `d@Dur` en cada pickRestart + definir variante d en cada parte relevante |
| Tensión previa a clímax | Insertar `.fast(1.05)` sólo en 8 ciclos previos |
| Nueva capa shimmer | superimpose sobre wind con `p => p.s('sine').octave(2).gain(.25)` y filtro alto |
| Humanizar drums | Añadir `.pan(perlin.slow(32).range(.45,.55))` a hi-hats |
| Reducción final | Sustituir última aparición de wind(b) por wind(a).slow(2) |

---

## 14. Posibles Mejoras (Detalladas)
| Área | Mejora | Beneficio |
|------|--------|----------|
| Token Grammar | Crear helper `chTok("C#:g#2:1@6")` que devuelva objeto estructurado | Legibilidad |
| Arpegios | Parametrizar sets de índices (`const arpSets = {...}`) | Reuso / variación controlada |
| Dinámica Global | `.gain(perlin.slow(128).range(.75,.95))` en synt | Micro-respiración |
| Fill Gestión | Reemplazar fill h con variante generada: `.density(perlin.slow(16).range(1,2))` | Variación infinita |
| Master Glue | `all(x=>x.room(.22).size(.85))` con límite CPU | Cohesión espacial |
| Loudness | Normalizar: usar `.gain()` final calibrado vs multiples parciales | Evitar clipping interno |

---

## 15. Tabla de Dependencias
| Capa | Depende de | Motivo |
|------|------------|--------|
| wind | split / chord / anchor / voicing / n | Construcción modulable |
| voic | Sólo note + timeline | Control absoluto melodía |
| synt | scale + pickRestart dual | Motor tonal base |
| bass | split + clip | Articulación y cromatismo |
| drums | pickOut + combinaciones | Orquestación rítmica incremental |

---
