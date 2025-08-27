// grouping_swing_4_4.mjs
// Ejemplo: compás 4/4 con swing (adelanto/atraso para sensación de "swing")
// - Objetivo: mostrar cómo aplicar `early()` para crear swing entre subdivisiones.

export const name = "grouping_swing_4_4";

export function applySession() {
  // preset de síntesis reutilizable
  const keys = x => x.s('sawtooth').cutoff(900).gain(.5)
    .attack(0.01).decay(0.12).sustain(.6).release(.15);

  // Drums con swing: hi-hat desplazado en la segunda subdivisión
  const drums = stack(
    s('bd*4').mask('<x ~ x ~>/4').gain(.95),
    s('sd').mask('<~ ~ x ~>/4').gain(.6),
    // hh con early para crear swing: segundo y cuarto subdivision adelantadas 1/16
    s('hh').mask('[x x x x]/4').early(1/16).gain(.35)
  );

  // Melodía corta con swing aplicado en capas
  const melody = "<E4 D4 C4 B3>/2"
    .struct('[x x x x]')
    .layer(
      x=>x.early(0),
      x=>x.early(1/16)
    ).note().apply(keys).mask('<~ x>/16');

  const session = stack(drums, melody).pianoroll({fold:1});

  // Devolver la sesión por si el caller quiere manipularla o aplicar efectos
  return session;
}
