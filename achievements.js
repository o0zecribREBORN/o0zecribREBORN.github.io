
const achievements = [{"id": "a1", "name": "Welcome to OOZE", "desc": "Visit the site"}, {"id": "a2", "name": "Daily Returner", "desc": "Come back the next day"}, {"id": "a3", "name": "Traveler", "desc": "Visit from phone"}, {"id": "a4", "name": "Desktop Lord", "desc": "Visit from PC"}, {"id": "a5", "name": "OOZE GOD", "desc": "Unlock all achievements"}, {"id": "a6", "name": "Home Visitor", "desc": "Visit Home"}, {"id": "a7", "name": "Games Explorer", "desc": "Visit Games"}, {"id": "a8", "name": "Proxy User", "desc": "Visit Proxies"}, {"id": "a9", "name": "Music Listener", "desc": "Visit Music"}, {"id": "a10", "name": "Movie Watcher", "desc": "Visit Movies"}, {"id": "a11", "name": "Apps User", "desc": "Visit Apps"}, {"id": "a12", "name": "Settings User", "desc": "Visit Settings"}, {"id": "a13", "name": "Rename Master", "desc": "Rename your profile"}, {"id": "a14", "name": "Sidebar Opener", "desc": "Open the sidebar"}, {"id": "a15", "name": "Clicker", "desc": "Click 25 buttons"}, {"id": "a16", "name": "Click Demon", "desc": "Click 50 buttons"}, {"id": "a17", "name": "Search User", "desc": "Use Proxy Search"}, {"id": "a18", "name": "Fullscreen Movie", "desc": "Open full movie view"}, {"id": "a19", "name": "Music Enjoyer", "desc": "Open Music 10 times"}, {"id": "a20", "name": "Movie Enjoyer", "desc": "Open Movies 10 times"}, {"id": "a21", "name": "Quick Visitor", "desc": "Stay 1 minute"}, {"id": "a22", "name": "Chill Session", "desc": "Stay 5 minutes"}, {"id": "a23", "name": "Addict", "desc": "Stay 10 minutes"}, {"id": "a24", "name": "Early Bird", "desc": "Visit before 8AM"}, {"id": "a25", "name": "Night Owl", "desc": "Visit after midnight"}, {"id": "a26", "name": "Page Hopper", "desc": "Visit 5 pages"}, {"id": "a27", "name": "Page God", "desc": "Visit 10 pages"}, {"id": "a28", "name": "Navigator", "desc": "Visit 20 pages"}, {"id": "a29", "name": "App Tester", "desc": "Open 3 apps"}, {"id": "a30", "name": "App Collector", "desc": "Open 10 apps"}, {"id": "a31", "name": "Double Movie", "desc": "Open Movies twice in a row"}, {"id": "a32", "name": "Double Music", "desc": "Open Music twice in a row"}, {"id": "a33", "name": "Proxy Grinder", "desc": "Open Proxies 10 times"}, {"id": "a34", "name": "Proxy Demon", "desc": "Open Proxies 25 times"}, {"id": "a35", "name": "Holiday Visitor", "desc": "Visit during December"}, {"id": "a36", "name": "Spooky Visitor", "desc": "Visit during October"}, {"id": "a37", "name": "Spring Bloom", "desc": "Visit during April"}, {"id": "a38", "name": "Summer Heat", "desc": "Visit during July"}, {"id": "a39", "name": "New Year Arrival", "desc": "Visit on January 1st"}, {"id": "a40", "name": "Winter Chill", "desc": "Visit during January"}];

function getUnlocked() {
  return JSON.parse(localStorage.getItem("ach_unlocked")||"[]");
}
function saveUnlocked(list){
  localStorage.setItem("ach_unlocked", JSON.stringify(list));
}
function unlock(id){
  let list=getUnlocked();
  if(!list.includes(id)){
    list.push(id);
    saveUnlocked(list);
    showPopup(id);
    updateAchStats();
  }
}
function showPopup(id){
  const a = achievements.find(x=>x.id===id);
  let box=document.createElement("div");
  box.className="ach_popup";
  box.innerHTML = "<strong>"+a.name+"</strong><br>"+a.desc;
  document.body.appendChild(box);
  setTimeout(()=>box.remove(),3000);
}
function updateAchStats(){
  let unlocked=getUnlocked().length;
  let total=achievements.length;
  localStorage.setItem("ach_total", total);
  localStorage.setItem("ach_count", unlocked);
}

// PAGE VISITS
const page = location.pathname.toLowerCase();
if(page.includes("index")) unlock("a6");
if(page.includes("games")) unlock("a7");
if(page.includes("proxies")) unlock("a8");
if(page.includes("music")) unlock("a9");
if(page.includes("movies")) unlock("a10");
if(page.includes("apps")) unlock("a11");
if(page.includes("settings")) unlock("a12");

// TIME OF DAY
let h=new Date().getHours();
if(h<8) unlock("a24");
if(h>=0 && h<5) unlock("a25");

// SEASONAL
let m=new Date().getMonth()+1;
if(m===12) unlock("a35");
if(m===10) unlock("a36");
if(m===4) unlock("a37");
if(m===7) unlock("a38");
if(m===1) unlock("a40");

let d=new Date().getDate();
if(m===1 && d===1) unlock("a39");

// SESSION TIMERS
setTimeout(()=>unlock("a21"),60000);
setTimeout(()=>unlock("a22"),300000);
setTimeout(()=>unlock("a23"),600000);

updateAchStats();
