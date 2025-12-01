
let g=document.getElementById("trail-grid");
for(let i=0;i<20;i++){
 let d=document.createElement("div");
 d.style.padding="10px";
 d.style.background="#222";
 d.style.margin="10px";
 d.style.borderRadius="10px";
 d.innerText="Trail "+(i+1);
 d.onclick=()=>unlock(20);
 g.appendChild(d);
}
