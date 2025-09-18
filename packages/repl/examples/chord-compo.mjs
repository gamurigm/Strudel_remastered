import * as strudel from '@strudel/core';
import '@strudel/tidal';
import '@strudel/tonal';

const { stack, note, silence } = strudel;

export const compo = stack(
  // Chord progression: I V vi IV in C major, voiced for piano
  "<C G Am F>".voicing('ireal').s('piano').gain(0.3).room(0.5),
  // Bass line following root notes
  "<C3 G2 A2 F2>".note().s('sawtooth').gain(0.2).lpf(400),
  // Simple melody on top
  n("0 2 4 7 9").scale("C:major").note().s('triangle').gain(0.1).fast(4)
).slow(2);  // Slow to control tempo, approx 120 BPM cycles

// To play: compo.play()