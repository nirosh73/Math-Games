(function (root) {
  const raw = [[1,3,3],[1,1,3],[1,16,16],[2,32,16],[1,4,16],[4,16,16],[1,2,16],[15,16,16],[8,16,16],[3,4,16],[1,3,9],[1,1,9],[9,9,9],[1,3,9],[1,9,9],[3,9,9],[1,3,21],[1,7,21],[2,7,21],[31,31,21]];
  const worksheet = raw.map(([n,d,slices],i) => ({id:`worksheet-${i+1}`,n,d,slices}));
  const percentages = [[1,10],[1,4],[1,2],[3,4],[9,10],[7,100],[33,100],[99,100]].map(([n,d],i)=>({id:`percent-${i+1}`,n,d,slices:100}));
  const data = {worksheet, percentages};
  if (typeof module !== 'undefined') module.exports = data;
  else root.QUESTIONS = data;
})(globalThis);
