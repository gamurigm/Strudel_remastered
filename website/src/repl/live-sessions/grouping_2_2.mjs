// grouping_2_2.mjs
// Ejemplo: agrupación 2+2 en compás 4/4
// - Objetivo: mostrar cómo agrupar eventos en 2+2 usando máscara y struct.

const keys = x => x.s('sawtooth').cutoff(900).gain(.5)
  .attack(0.01).decay(0.12).sustain(.6).release(.15);

// Drums: patrón 2+2 en 4/4
const drums = stack(
  // bd agrupado 2+2: "<x x ~ ~>/4" = en cada compás suenan 2 golpes seguidos, silencio en tiempos 3 y 4
  s('bd*4').mask('<x x ~ ~>/4').gain(.95),
  // caja en los tiempos 2 y 4 para marcar el backbeat
  s('sd').mask('<~ x ~ x>/4').gain(.6),
  // hh subdivisión constante
  s('hh').mask('[x x x x]/4').gain(.35)
);

// Bajo que acentúa la agrupación 2+2
const bass = note('<C2 C2 ~ ~>/4')
  .struct('[x x ~ ~]')
  .s('sawtooth').attack(0.01).decay(0.15).sustain(0.7).release(0.2)
  .cutoff(700).gain(.6);

const session = stack(drums, bass).pianoroll({fold:1});

export default session;
