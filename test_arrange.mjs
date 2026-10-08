import { note, stack, arrange } from './packages/core/index.mjs';

try {
  const pat = arrange(
    [1, note("c")],
    [1, note("d")]
  );
  console.log('Arrange successful');
  const haps = pat.query({ span: { begin: 0, end: 2 }, context: {} });
  console.log('Haps:', haps.map(h => h.value.note));
} catch (e) {
  console.error('Arrange failed:', e.message);
}
