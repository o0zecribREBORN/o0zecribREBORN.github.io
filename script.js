/* CLEAR RECENT UNWANTED */
localStorage.removeItem('recent');
/* AUTO GENERATED FROM FOOOD.txt */
const DATA = {"index.html":[],"games.html":[],"fnf.html":[],"music.html":[{"name":"Chromakopia","url":"https://drive.google.com/drive/folders/10S0fc3F6JQ4JXqWZLVwGe-HOL2xEzH9M?usp=sharing","img":"auto","launcher":true},{"name":"Hit Me Hard and Soft","url":"https://drive.google.com/drive/folders/1nnOAnqiDy678xshHH_BJaluUgKDd2mzD?usp=sharing","img":"auto","launcher":true},{"name":"The Party Never Ends","url":"https://drive.google.com/drive/folders/1-9pGsmGzyNMJ2JER4bKmxhvSWssTQquy?usp=sharing","img":"auto","launcher":true},{"name":"Flower Boy","url":"https://drive.google.com/drive/folders/1dRvN6zSRowZdgYgrKvAsfaNqY7M6BhEJ?usp=sharing","img":"auto","launcher":true},{"name":"Goodbye and Good Riddance","url":"https://drive.google.com/drive/folders/10xvrgVwXti_4usyHD0vL0jG2gNXcrj_b?usp=sharing","img":"auto","launcher":true},{"name":"Graduation","url":"https://drive.google.com/drive/folders/10xvrgVwXti_4usyHD0vL0jG2gNXcrj_b?usp=sharing","img":"auto","launcher":true},{"name":"Call me if you get lost","url":"https://drive.google.com/drive/folders/14-cDI6ASH6xJRNpohELPoHPtzAoe8gpT?usp=sharing","img":"auto","launcher":true},{"name":"Igor","url":"https://drive.google.com/drive/u/1/folders/1N2TB-_NDhz3l8eBeugN6Q-VfJwnZVTdK","img":"auto","launcher":true},{"name":"Funk","url":"https://drive.google.com/drive/u/1/folders/1MuC7z0Yx2ssWTbirUKj6X69ULXWFsZNl","img":"auto","launcher":true},{"name":"Dont tap the glass","url":"https://drive.google.com/drive/u/1/folders/13VRbKf8DLwZtlZJS50hfE90vEhX3zYiu","img":"auto","launcher":true},{"name":"Thriller","url":"https://drive.google.com/drive/folders/1oa75kt3Z8MrdkfXUSht6_f4vC-eQg6WG?usp=sharing","img":"auto","launcher":true},{"name":"For nothing nine vicious","url":"https://drive.google.com/drive/folders/1nli-4fFM4vZ9AbkGn0fMrMDdZc9jAz1H?usp=drive_link","img":"auto","launcher":true},{"name":"Double Whammy xaviersobased","url":"https://drive.google.com/file/d/1AwYNHkkmL-Cq-kOgU_H1tE8XseFpuXJX/view?usp=drive_link","img":"auto","launcher":true}],"apps.html":[{"name":"Lunch menu https","url":"//resources.finalsite.net/images/v1760980205/cfisdnet/qcomazmxwdb14xcdpnce/MSNovember2025Menu.pdf","img":"auto","launcher":true}],"proxies.html":[{"name":"Utopia","url":"https://adam.loves.gandhi.spacejamhd.com/","img":"auto","launcher":true}],"movies.html":[]};
const angelSentences = ["litterly folow my tictac ples it is o0ze34", "Thomas THE DANK ENGINE ahahahhahahhahahahahahahahahahaahhahahahahahahahaahahhaahahahahahhaha", "9+10 = 21", "brother noah hahahahahah", "counting or not counting gang violence", "shut yo pasty chicken bone google chrome no home flip phone disowned ice cream cone garden gnome metronome final chrome student loan underground flintstone", "yo who put the mIchEal JaCkSon In Teh FrEzER😂 no? alr ill leave", "i typed this on christmas eve btw", "smart phones stupid people", "yo who was getting cracked in the bathroom?", "aw sh*t here we go again", "i fixed movies btw check that out", "ellllll primoooooooooooooo", "tell me your school is ghetto without telling me", "what the f*ck", "code edit", "watkins is gheeeetooooo", "ur welcomed to join the OOZE club!", "fet's luck ;)", "you can break these cuffs", "283", "dont search up drake leak", "Share this website", "vitch migger", "You found the dev message", "EZ", "Poop", "Fortnite loves", "boooohooo niggaaa", "omelin garduno is cringe", "meet me in the bathroom then >:(", "metro boomin", "stay hydrated nga", "yo eat breakfest", "if u got skechers on get out my face bro", "do u know da way?", "skibidii toiilett", "FaAhhahh", "whut", "mamah", "blueryai is underrated (u dont know who that is)", "go on bus 3117 for a suprise", "GOBLIN MACHIIIINEEE", "MEGA KNIGHT", "RRAHHHHH", "ez duuude"];

/* === STARFIELDS === */
function sf(id,count,speed){
 const c=document.getElementById(id),x=c.getContext('2d');
 let w=c.width=innerWidth,h=c.height=innerHeight;
 let s=[...Array(count)].map(()=>({x:Math.random()*w,y:Math.random()*h,z:Math.random()*speed+1}));
 function draw(){
  x.clearRect(0,0,w,h);
  s.forEach(o=>{x.fillStyle="#fff";x.fillRect(o.x,o.y,2,2);o.y+=o.z;if(o.y>h)o.y=0;});
  requestAnimationFrame(draw);
 }
 draw();
}
sf("stars",260,2);
sf("stars2",200,4);

/* === CURSOR TRAIL === */
document.addEventListener("mousemove",e=>{
 let d=document.createElement("div");
 d.className="cursor-trail";
 d.style.left=e.pageX+"px";
 d.style.top=e.pageY+"px";
 document.body.appendChild(d);
 setTimeout(()=>d.remove(),900);
});

/* === AUTO GRID === */
document.addEventListener("DOMContentLoaded", () => {
 let page = location.pathname.split("/").pop() || "index.html";
 let grid = document.querySelector(".grid");
 if (DATA[page]) {
   DATA[page].forEach(item => {
     let div = document.createElement("a");
     div.className = "btn";
     let img = item.img === "auto"
       ? `https://www.google.com/s2/favicons?domain=${item.url}&sz=128`
       : item.img;
     div.innerHTML = `<img class="thumb" src="${img}"><span>${item.name}</span>`;
     div.href = item.url;
     div.target = "_blank";
     grid.appendChild(div);
   });
 }
});


/* === RANDOM GAME ONLY === */
document.addEventListener("DOMContentLoaded", () => {
    let page = location.pathname.split("/").pop();
    if (page === "games.html") {
        let main = document.querySelector(".main");
        let rng = document.createElement("button");
        rng.id = "randomGame";
        rng.innerText = "🎲 Random Game";
        rng.style.padding = "14px 20px";
        rng.style.background = "rgba(255,255,255,0.15)";
        rng.style.borderRadius = "14px";
        rng.style.border = "none";
        rng.style.cursor = "pointer";
        rng.style.fontSize = "18px";
        rng.style.fontWeight = "700";
        rng.style.marginBottom = "20px";
        rng.onclick = () => {
            let cards = Array.from(document.querySelectorAll(".btn"));
            if(cards.length>0){
                let r = Math.floor(Math.random()*cards.length);
                window.open(cards[r].href,"_blank");
            }
        };
        main.insertBefore(rng, main.querySelector(".grid"));
    }
});

/* === SEARCH === */
function filterCards(){
 let q=document.getElementById("search").value.toLowerCase();
 document.querySelectorAll(".btn").forEach(b=>{
  b.style.display = b.textContent.toLowerCase().includes(q) ? "block" : "none";
 });
}

/* === RANDOM SENTENCE === */
document.addEventListener("DOMContentLoaded",()=>{
 let msg=angelSentences[Math.floor(Math.random()*angelSentences.length)];
 document.querySelector(".typewriter").innerText=msg;
});

/* Ripple FX */

document.addEventListener("click", e=>{
    let r=document.createElement("span");
    r.className="trailDot";
    r.style.left=e.pageX+"px";
    r.style.top=e.pageY+"px";
    document.body.appendChild(r);
    setTimeout(()=>r.remove(),700);
});

/* TYPEWRITER JS */

/* TYPEWRITER JS */
document.addEventListener("DOMContentLoaded", ()=>{
    let el=document.querySelector(".typewriter");
    if(!el) return;
    let txt=el.innerText;
    el.innerText="";

    // Create hidden measurer
    let meas=document.createElement("span");
    meas.style.visibility="hidden";
    meas.style.whiteSpace="nowrap";
    meas.style.fontSize=window.getComputedStyle(el).fontSize;
    meas.innerText=txt;
    document.body.appendChild(meas);

    let fullWidth = meas.offsetWidth + 4;
    document.body.removeChild(meas);

    let i=0;
    function tick(){
        el.style.width = (i===0?0: "auto");
        el.innerText = txt.substring(0,i);
        if(i<txt.length){
            i++;
            setTimeout(tick, 35);
        } else {
            el.innerText = txt;
        }
    }
    tick();
});


/* === FAVICON FALLBACK FOR BUTTON IMAGES === */
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".btn").forEach(btn=>{
        let img = btn.querySelector(".thumb");
        let href = btn.getAttribute("href");
        if(!img) return;

        let src = img.getAttribute("src");

        // If img src missing or set to 'auto', use favicon
        if(!src || src.trim()==="" || src.trim().toLowerCase()==="auto"){
            try{
                let domain = new URL(href).hostname;
                img.src = "https://www.google.com/s2/favicons?domain=" + domain + "&sz=128";
            }catch(e){}
        }
    });
});

/* === CLOCK === */
setInterval(()=>{
 let c=new Date();
 let t=c.toLocaleTimeString();
 localStorage.setItem("clock",t);
},1000);

/* === THEMES === */
function setTheme(t){
 document.body.dataset.theme=t;
 localStorage.setItem("theme",t);
}
let savedTheme=localStorage.getItem("theme");
if(savedTheme) document.body.dataset.theme=savedTheme;

/* ACH REMOVED */
function addFavorite(name,url,img){ let f=JSON.parse(localStorage.getItem('favorites')||'[]'); f.push({name,url,img}); localStorage.setItem('favorites',JSON.stringify(f)); }
function clearFavorites(){localStorage.removeItem('favorites');}
/* favorites")||"[]");
 f.push({name:name,url:url,img:img});
 localStorage.setItem("favorites",JSON.stringify(f));
 unlockAch("Added to Favorites");
}
function clearFavorites(){ localStorage.removeItem("favorites"); }
function clearAchievements(){ localStorage.removeItem("achUnlocked"); }

document.addEventListener("DOMContentLoaded",()=>{
 if(location.pathname.includes("favorites")){
   let f=JSON.parse(localStorage.getItem("favorites")||"[]");
   let grid=document.getElementById("favGrid");
   f.forEach(x=>{
     grid.innerHTML += "<a class='btn' href='"+x.url+"'><img class='thumb' src='"+x.img+"'><span>"+x.name+"</span></a>";
   });
 }
});

/* CLOCK TOP RIGHT */
setInterval(()=>{
 document.getElementById("clock").innerText = new Date().toLocaleTimeString();
},1000);


/* === GAME OF THE DAY === */
function pickGameOfTheDay() {
    try {
        let saved = JSON.parse(localStorage.getItem("GOTD") || "{}");
        let today = new Date().toLocaleDateString();

        if (saved.date === today) return saved.game;

        let allGames = DATA["games.html"];
        if (!allGames || allGames.length === 0) return null;

        let randomGame = allGames[Math.floor(Math.random() * allGames.length)];

        localStorage.setItem("GOTD", JSON.stringify({
            date: today,
            game: randomGame
        }));

        return randomGame;
    } catch(e){ return null; }
}

function showGOTD() {
    let gotd = pickGameOfTheDay();
    if (!gotd) return;

    let box = document.getElementById("gotdBox");
    if (!box) return;

    let domain = "";
    try { domain = new URL(gotd.url).hostname; } catch(e){}

    let img = gotd.img === "auto"
        ? "https://www.google.com/s2/favicons?domain=" + domain + "&sz=128"
        : gotd.img;

    
box.innerHTML = `
    <a class="btn" href="${gotd.url}" target="_blank">
        <img class="thumb" src="${img}">
        <span>${gotd.name}</span>
    </a>
    
`;

}

document.addEventListener("DOMContentLoaded", showGOTD);

/* === OPEN ALL LINKS IN ABOUT:BLANK FULLSCREEN === */
function openInBlank(url) {
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;

    const win = window.open("about:blank", "_blank");
    win.document.write(`
        <style>
            html, body {
                margin: 0;
                padding: 0;
                height: 100%;
                overflow: hidden;
                background: #000;
            }
            iframe {
                width: 100vw;
                height: 100vh;
                border: none;
            }
        </style>
        <iframe src="${url}"></iframe>
    `);
}


function toggleTheme(){document.body.classList.toggle("light-theme");localStorage.setItem("theme",document.body.classList.contains("light-theme")?"light":"dark");}
function moveSidebar(){document.body.classList.toggle("sidebar-right");localStorage.setItem("sidebarPos",document.body.classList.contains("sidebar-right")?"right":"left");}
function resetSettings(){localStorage.clear();location.reload();}
window.onload=()=>{if(localStorage.getItem("theme")==="light")document.body.classList.add("light-theme");if(localStorage.getItem("sidebarPos")==="right")document.body.classList.add("sidebar-right");};


// SETTINGS WORKING FULLY

function toggleTheme(){
    const isLight = document.body.classList.toggle("light-theme");
    localStorage.setItem("theme", isLight ? "light" : "dark");
}

function moveSidebar(){
    const right = document.body.classList.toggle("sidebar-right");
    localStorage.setItem("sidebarPos", right ? "right" : "left");
}

function resetSettings(){
    localStorage.clear();
    location.reload();
}

window.addEventListener("DOMContentLoaded", () => {
    if(localStorage.getItem("theme")==="light"){
        document.body.classList.add("light-theme");
    }
    if(localStorage.getItem("sidebarPos")==="right"){
        document.body.classList.add("sidebar-right");
    }
});


// === EXTRA SETTINGS & FEATURES ===

// General toggle
function toggleExtra(key){
 let cur = localStorage.getItem(key)==="true";
 localStorage.setItem(key, (!cur).toString());
 applyExtraSettings();
}

// Apply extra settings
function applyExtraSettings(){
 const b=document.body;
 const map={
    "blurBG":"blur-bg",
    "glassUI":"glass-ui",
    "megaGlow":"mega-glow",
    "thickBorders":"thick-borders",
    "thinBorders":"thin-borders",
    "superCompact":"super-compact",
    "wideLayout":"wide-layout",
    "bigTitles":"big-titles",
    "ultraNeon":"ultra-neon",
    "winXPMode":"winxp-mode"
 };
 for(let k in map){
    b.classList.toggle(map[k], localStorage.getItem(k)==="true");
 }
}

document.addEventListener("DOMContentLoaded",applyExtraSettings);