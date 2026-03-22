
function roll(){
 let r=Math.random();
 let result=document.getElementById("result");
 if(r>0.98){ result.innerText="LEGENDARY"; unlock(19); }
 else if(r>0.9){ result.innerText="EPIC"; unlock(18); }
 else if(r>0.6){ result.innerText="RARE"; unlock(17); }
 else{ result.innerText="COMMON"; unlock(15); }
}
