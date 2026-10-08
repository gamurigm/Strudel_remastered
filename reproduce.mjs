import { note, stack, silence, register, Pattern } from './packages/core/index.mjs';
import * as tonal from './packages/tonal/index.mjs';

const p = "Cmaj7";
try {
  // Simulate pianoSinth(p)
  let pat = note(p).chord(); // BUG: chord: undefined
  pat = pat.set({ dictionary: 'lefthand', anchor: 'C4' });
  pat = tonal.voicing(pat); // This should fail during query if it's called as standalone
  
  console.log('Pattern created successfully');
  const haps = pat.query({ span: { begin: 0, end: 1 }, context: {} });
  console.log('Query successful, haps:', haps.length);
} catch (e) {
  console.error('Error in reproduction:', e.message);
  console.error(e.stack);
}
