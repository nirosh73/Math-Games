const {test}=require('node:test');
const assert=require('node:assert/strict');
const {explain,percentage}=require('../public/learning');
const {generateQuestions}=require('../public/questions');
test('explains a different denominator using groups, without fractional slice counts',()=>{
  const lesson=explain({n:3,d:4,slices:16});
  assert.equal(lesson.target,12);
  assert.deepEqual(lesson.steps.map(s=>s.math),['16 ÷ 4 = 4','4 × 3 = 12']);
  assert.equal(lesson.equivalent,'3/4 = 12/16');
  assert.equal(lesson.percent,'75%');
});
test('simplifies first when the original denominator exceeds the circle slices',()=>{
  const lesson=explain({n:2,d:32,slices:16});
  assert.equal(lesson.target,1);
  assert.deepEqual(lesson.steps.map(s=>s.math),['2/32 = 1/16','16 ÷ 16 = 1','1 × 1 = 1']);
  assert.equal(lesson.summary,'Shade 1 of the 16 slices.');
});
test('whole circles, matching denominators and repeating percentages are explained correctly',()=>{
  assert.equal(explain({n:31,d:31,slices:21}).target,21);
  assert.deepEqual(explain({n:3,d:8,slices:8}).steps.map(s=>s.math),['8 ÷ 8 = 1','1 × 3 = 3']);
  assert.equal(percentage(1,3),'≈ 33.33%');
  assert.equal(percentage(1,8),'12.5%');
  assert.equal(percentage(1,1),'100%');
});
test('worked explanations agree with the answer for every generated question',()=>{
  for(const mode of ['worksheet','percentages'])for(let i=0;i<20;i++){
    for(const q of generateQuestions(mode)){
      const lesson=explain(q);
      assert.ok(Number.isInteger(lesson.target));
      assert.equal(lesson.target,q.n*q.slices/q.d);
      assert.ok(lesson.steps.every(s=>!s.math.includes('NaN')));
    }
  }
});
