// Questions are generated once on the server and retained in each saved run.
const {randomInt} = require('node:crypto');
const gcd = (a, b) => b ? gcd(b, a % b) : a;
function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
function generateQuestions(mode) {
  if (mode === 'percentages') {
    return shuffle(Array.from({length: 99}, (_, i) => i + 1)).slice(0, 8).map((percent, i) => {
      const factor = gcd(percent, 100);
      return {id: `percent-${i + 1}`, n: percent / factor, d: 100 / factor, slices: 100};
    });
  }
  const used = new Set();
  const questions = [];
  // Build confidence with small denominators, then introduce equivalents and finer circles.
  const stages = [
    {denominators: [2, 3, 4, 5, 6, 8], count: 6},
    {denominators: [6, 8, 9, 10, 12, 16], count: 7},
    {denominators: [7, 9, 12, 14, 16, 20, 21, 24, 28, 32], count: 7}
  ];
  stages.forEach((stage, level) => {
    const pool = shuffle(stage.denominators.flatMap(d =>
      Array.from({length: d}, (_, i) => ({n: i + 1, d}))));
    let added = 0;
    for (const fraction of pool) {
      const factor = gcd(fraction.n, fraction.d);
      const n = fraction.n / factor, d = fraction.d / factor;
      const key = `${n}/${d}`;
      if (used.has(key)) continue;
      used.add(key);
      const multipliers = [1, 2, 3].filter(m => fraction.d * m <= 32);
      const slices = fraction.d * (level === 0 ? 1 : multipliers[randomInt(multipliers.length)]);
      // Sometimes show an unsimplified equivalent, independently of the circle subdivisions.
      const displayFactor = level === 0 ? 1 : 1 + randomInt(3);
      questions.push({id: `foundation-${questions.length + 1}`, n: n * displayFactor, d: d * displayFactor, slices});
      if (++added === stage.count) break;
    }
  });
  return questions;
}
module.exports = {generateQuestions};
