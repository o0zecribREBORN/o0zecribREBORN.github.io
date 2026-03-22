/* ============================
    ACHIEVEMENT SYSTEM
   ============================ */

// Achievement List (Name, XP reward)
const ACH_LIST = [
  ["First Visit",50, "Visit the site for the first time"],
  ["First Rename",50, "Change your username"],
  ["First Game Played",50, "Open any game"],
  ["First Music Play",50, "Play any song"],
  ["First Proxy Used",50, "Use any proxy"],

  ["Level 1 Reached",100, "Reach Level 1"],
  ["Level 3 Reached",100, "Reach Level 3"],
  ["Level 5 Reached",150, "Reach Level 5"],

  ["Daily Claimer I",100, "Claim the daily reward once"],
  ["Daily Claimer II",150, "Claim the daily reward 5 times"],
  ["Daily Claimer III",200, "Claim the daily reward 10 times"],

  ["Explorer I",100, "Visit 5 pages"],
  ["Explorer II",150, "Visit 20 pages"],
  ["Explorer III",200, "Visit 50 pages"],

  ["Site Grinder",200, "Reach 500 total XP"],
  ["XP Farmer",250, "Reach 1500 total XP"],
  ["No Life Mode",300, "Reach 3000 total XP"],

  ["Secret Finder",200, "Find a hidden secret"],
  ["Lucky Clicker",150, "Click a rare effect"],
  ["Fast Clicker",150, "Click very fast"],

  ["Music Addict",150, "Play 10 songs"],
  ["Game Addict",150, "Play 10 games"],
  ["Proxy Master",200, "Use 10 proxies"],

  ["Early Supporter",300, "Use the site before 2026"],
  ["Veteran",300, "Use the site 30 times"],
  ["OG User",300, "Use the site 100 times"],

  ["Hidden Legend",400, "Unlock 20 achievements"],
  ["Final Boss",500, "Unlock 25 achievements"],
  ["Ultimate User",750, "Unlock ALL achievements"]
];

// Load unlocked achievements from localStorage
function getUnlocked() {
  return JSON.parse(localStorage.getItem("unlocked") || "[]");
}

// Save updated achievements
function setUnlocked(list) {
  localStorage.setItem("unlocked", JSON.stringify(list));
}

// Award XP
function addXP(amount) {
  let xp = parseInt(localStorage.getItem("xp") || "0");
  xp += amount;
  localStorage.setItem("xp", xp);
}

// Unlock an achievement by name
function unlockAchievement(name) {
  let unlocked = getUnlocked();

  if (unlocked.includes(name)) return false;

  unlocked.push(name);
  setUnlocked(unlocked);

  // Give XP reward
  const ach = ACH_LIST.find(a => a[0] === name);
  if (ach) addXP(ach[1]);

  return true;
}

// Build Achievements UI
function loadAchievementsPage() {
  const grid = document.getElementById("achGrid");
  if (!grid) return; // Only run on achievements.html

  const unlocked = getUnlocked();
  grid.innerHTML = "";

  ACH_LIST.forEach(a => {
    let unlockedState = unlocked.includes(a[0]);
    
    let div = document.createElement("div");
    div.className = "ach-card " + (unlockedState ? "unlocked" : "locked");

    div.innerHTML = `
      <div class="ach-title">${a[0]}</div>
      <div class="ach-desc">${a[2]}</div>
      <div class="ach-xp">+${a[1]} XP</div>
      ${
        unlockedState 
        ? "<div style='color:#00ff88'>UNLOCKED</div>" 
        : `<button class='ach-btn' onclick="unlockAchievementAndReload('${a[0]}')">Claim</button>`
      }
    `;

    grid.appendChild(div);
  });
}

function unlockAchievementAndReload(name) {
  unlockAchievement(name);
  loadAchievementsPage();
}

// Update achievement count on Home page
function updateAchCount() {
  let box = document.getElementById("stat_ach");
  if (box) box.innerText = getUnlocked().length;
}

// Initialize when page loads
window.addEventListener("load", () => {
  loadAchievementsPage();
  updateAchCount();
});
