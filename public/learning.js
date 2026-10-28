(function(root) {
  function gcd(a,b) {return b ? gcd(b,a%b) : a;}
  function percentage(n,d) {
    const value=n/d*100, rounded=Math.round(value*100)/100;
    return `${Math.abs(value-rounded)>1e-9?'≈ ':''}${rounded}%`;
  }
  function explain(q) {
    const factor=gcd(q.n,q.d), n=q.n/factor, d=q.d/factor;
    const group=q.slices/d, target=group*n;
    const steps=[];
    if(factor>1) steps.push({title:'Find a simpler fraction',text:`Divide the top and bottom by ${factor}. ${q.n}/${q.d} is the same amount as ${n}/${d}.`,math:`${q.n}/${q.d} = ${n}/${d}`});
    steps.push({title:`Split the whole into ${d} equal group${d===1?'':'s'}`,text:`There are ${q.slices} slices altogether. Each ${d===1?'whole':'group'} contains ${group} slice${group===1?'':'s'}.`,math:`${q.slices} ÷ ${d} = ${group}`});
    steps.push({title:`Take ${n} group${n===1?'':'s'}`,text:`We want ${n}/${d} of the circle, so take ${n} group${n===1?'':'s'} of ${group} slice${group===1?'':'s'}.`,math:`${group} × ${n} = ${target}`});
    return {steps,target,summary:`Shade ${target} of the ${q.slices} slices.`,equivalent:`${q.n}/${q.d} = ${target}/${q.slices}`,percent:percentage(q.n,q.d)};
  }
  const learning={explain,percentage};
  if(typeof module!=='undefined') module.exports=learning;
  else root.LEARNING=learning;
})(globalThis);
