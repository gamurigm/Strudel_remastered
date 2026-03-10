# Invención a tres voces (Andante) — anotada

## Resumen
Una invención a tres voces en Do menor con un tempo "Andante" (lento, para caminar). Las dos voces superiores (Soprano y Alto) se imitan en canon, mientras que una tercera voz (Bajo) proporciona un fundamento melódico más lento que entra más tarde.

## Contrato
- Inputs: `setcpm(84/4)` para el tempo, `scale("c:minor")`, patrones de sujeto y bajo, `late()` para las entradas escalonadas.
- Output: Patrón polifónico de tres voces apiladas y paneadas para mayor claridad.
- Fallos esperados: Ninguno, la estructura es robusta.

## Explicación
```javascript
// SESSION 14 — TRIO INVENTION (Andante)
// Tres voces en un estilo contrapuntístico, con un tempo más lento.
setcpm(84/4); // Tempo Andante

const baroqueOrgan = p => p.s('square')
  .attack(0.01).decay(0.1).sustain(0.7).release(0.2)
  .lpf(2000).gain(0.6).room(0.1);

// Sujeto (melodía principal) en Do menor
const subject = n("0 2 3 5 4 3 2 1 0 -1 2 0")
  .scale("c4:minor")
  .fast(2)
  .apply(baroqueOrgan);

// Voz 1 (Soprano): Sujeto en la tónica, paneado a la derecha.
const voice1 = subject.pan(0.8);

// Voz 2 (Alto): Respuesta en la dominante, entra 1 ciclo después, paneado a la izquierda.
const voice2 = subject.scaleTranspose(4).late(1).pan(0.2);

// Voz 3 (Bajo): Línea de bajo melódica que entra 2 ciclos después, centrada.
const bassLine = n("0 -3 -4 -5 0 -3 -4 -5")
  .scale("c3:minor")
  .slow(0.5) // Se mueve a la mitad de la velocidad del sujeto
  .late(2)
  .apply(baroqueOrgan)
  .pan(0.5)
  .gain(0.8);

// Mezcla final de las tres voces
stack(voice1, voice2, bassLine)
  ._pianoroll({fold:1, labels:1})
```
- `setcpm(84/4)`: Establece un tempo más lento, característico del "Andante".
- `bassLine`: La tercera voz es una línea de bajo simple y melódica que se mueve a la mitad de la velocidad (`slow(0.5)`) de las voces superiores, creando una base sólida y un contraste rítmico.
- `late(1)` y `late(2)`: Organizan las entradas de las voces de forma escalonada, un pilar del contrapunto.
- `pan()`: Se utiliza para posicionar cada voz en el espectro estéreo, mejorando la percepción de la polifonía.

## Variaciones
- **Cambiar la línea de bajo**: Prueba con `n("0 4 3 2 1 0 -1 -2").scale("c2:minor")` para una línea de bajo más melódica y escalonada.
- **Añadir un contrasujeto**: En lugar de que la segunda voz imite exactamente a la primera, podrías escribir una melodía completamente nueva para que suene junto al sujeto, creando un contrapunto más complejo.
- **Modulación**: Después de 4 u 8 ciclos, puedes cambiar la escala de una o todas las voces a un relativo mayor (Eb mayor) o a la dominante menor (G menor) para añadir interés armónico.

## Cómo ejecutar
1.  Abre `website/src/repl/live-sessions/1_current_session.mjs`.
2.  Asegúrate de que el código de la "SESSION 14 — TRIO INVENTION (Andante)" esté activo.
3.  Ejecuta el código en el REPL de Strudel. Escucharás tres voces entrando una tras otra, con las dos superiores moviéndose más rápido que la del bajo.

## Notas
Este tipo de pieza, con dos voces rápidas sobre una más lenta, es común en el Barroco y se conoce como "Sonata a trío". Aunque esto es solo un boceto, captura la esencia de esa textura.