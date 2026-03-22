/* ═══════════════════════════════════════════════════════════════
   O0ZE34's CRIB REBORN — shared.js  MEGA REBUILD v4.0
   - Username prompt on first visit
   - 100 mouse trails
   - Working theme injection
   - Chat: reactions, replies, GIF picker, image upload, bot commands
   - 20 admin features (owner can disable individual ones)
   - 30 owner features incl. live "who's on site" with last seen
   - Weather widget (Open-Meteo, Houston coords)
   - Poll results in admin
   - Game of the Day fix
═══════════════════════════════════════════════════════════════ */

const _fbConfig = {
  apiKey: "AIzaSyChqpSNRAXDCV9TfjNFxKun2DmPDA_1LTs",
  authDomain: "oozecrib.firebaseapp.com",
  databaseURL: "https://oozecrib-default-rtdb.firebaseio.com",
  projectId: "oozecrib",
  storageBucket: "oozecrib.firebasestorage.app",
  messagingSenderId: "234391927329",
  appId: "1:234391927329:web:87bfc502802643970d4160"
};

let _fb = null;
const _fbReady = (async () => {
  try {
    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js");
    const { getDatabase, ref, set, get, push, remove, update, onValue, query, orderByChild, limitToLast }
      = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js");
    const app = getApps().length ? getApps()[0] : initializeApp(_fbConfig);
    _fb = { db: getDatabase(app), ref, set, get, push, remove, update, onValue, query, orderByChild, limitToLast };
    _initOnlinePresence();
    _listenGlobalEvents();
    _listenGlobalMessages();
    _listenPolls();
    _listenAdminDrops();
    _listenAdminList();
    _listenAdminPerms();
    _listenDMNotifs();
  } catch(e) { console.warn("Firebase failed:", e); }
})();

/* ══ UTILS ══ */
function ls(k) { try { return localStorage.getItem(k); } catch(e) { return null; } }
function lsSet(k,v) { try { localStorage.setItem(k,v); } catch(e) {} }
function escHtml(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function getUsername() { return ls("username") || "Guest"; }
function getColor() { return ls("chatColor") || "#3cff9a"; }
function getUserId() {
  let id = ls("oozecrib_uid");
  if (!id) { id = "u_" + Math.random().toString(36).slice(2,11) + Date.now().toString(36); lsSet("oozecrib_uid", id); }
  return id;
}

/* ══ ADMIN PERMISSIONS (owner-controlled) ══ */
// Owner can disable any admin feature key by setting admin_perms/<key> = false in Firebase
let _adminPerms = {};
async function _listenAdminPerms() {
  await _fbReady; if (!_fb) return;
  _fb.onValue(_fb.ref(_fb.db, "admin_perms"), snap => {
    _adminPerms = snap.exists() ? (snap.val() || {}) : {};
  });
}
function _adminCan(feature) {
  if (_isOwner()) return true; // owner always can
  if (!_isAdmin()) return false;
  return _adminPerms[feature] !== false; // default true unless explicitly disabled
}

/* ══ USERNAME PROMPT ══ */
function _checkFirstVisitUsername() {
  if (!ls("username") && !ls("username_set")) _showUsernamePrompt();
}
function _showUsernamePrompt() {
  if (document.getElementById("usernamePromptModal")) return;
  const m = document.createElement("div");
  m.id = "usernamePromptModal";
  m.style.cssText = "position:fixed;inset:0;z-index:9999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.92);backdrop-filter:blur(16px);";
  m.innerHTML = `<div style="background:linear-gradient(135deg,#0a0a1a,#0d0d2a);border:1px solid rgba(60,255,154,.35);border-radius:28px;padding:40px 36px;width:min(420px,92vw);text-align:center;box-shadow:0 0 80px rgba(60,255,154,.15);">
    <div style="font-size:3.5rem;margin-bottom:12px;">👋</div>
    <h2 style="margin:0 0 8px;font-size:1.6rem;font-weight:900;color:#3cff9a;">Welcome to O0ZE34's Crib!</h2>
    <p style="opacity:.7;font-size:.95rem;margin:0 0 28px;">Pick a username to get started. You can always change it in Settings.</p>
    <input id="firstUsernameInput" type="text" maxlength="20" placeholder="Your username..." autocomplete="off"
      style="width:100%;padding:14px 18px;border-radius:16px;border:1.5px solid rgba(60,255,154,.3);background:rgba(255,255,255,.07);color:#fff;font-size:1.1rem;outline:none;margin-bottom:12px;box-sizing:border-box;text-align:center;"/>
    <div id="firstUsernameError" style="color:#ff6b6b;font-size:.85rem;min-height:1.2em;margin-bottom:10px;"></div>
    <button onclick="window._saveFirstUsername()" style="width:100%;padding:14px;border-radius:16px;background:linear-gradient(135deg,#3cff9a,#6b48ff);border:none;color:#000;font-weight:900;font-size:1.1rem;cursor:pointer;">Enter the Crib 🚀</button>
    <p style="opacity:.35;font-size:.78rem;margin-top:14px;">No account needed — stored locally on your device</p>
  </div>`;
  document.body.appendChild(m);
  const inp = m.querySelector("#firstUsernameInput");
  inp.focus();
  inp.addEventListener("keydown", e => { if (e.key === "Enter") window._saveFirstUsername(); });
  window._saveFirstUsername = function() {
    const val = inp.value.trim();
    const err = document.getElementById("firstUsernameError");
    if (!val || val.length < 2) { err.textContent = "At least 2 characters!"; return; }
    if (val.length > 20) { err.textContent = "Max 20 characters!"; return; }
    if (!/^[\w\s\-!?.]+$/.test(val)) { err.textContent = "Letters, numbers, spaces only!"; return; }
    lsSet("username", val); lsSet("username_set", "1");
    m.style.opacity = "0"; m.style.transition = "opacity .4s";
    setTimeout(() => { m.remove(); saveLeaderboard(); }, 400);
    document.querySelectorAll("#greet_txt").forEach(el => {
      const h = new Date().getHours();
      const t = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : h < 21 ? "Good Evening" : "Good Night";
      el.textContent = t + ", " + val + " 🎄";
    });
    showEventToast("✅ Welcome, " + val + "! 🎉", "#3cff9a");
  };
}

/* ══ COINS ══ */
async function getCoins() {
  await _fbReady;
  if (_fb) { try {
    const snap = await _fb.get(_fb.ref(_fb.db, "coins/" + getUserId()));
    if (snap.exists()) { const s = snap.val().amount || 0; const l = parseInt(ls("coins") || "0"); const m = Math.max(s, l); lsSet("coins", m); return m; }
  } catch(e) {} }
  return parseInt(ls("coins") || "0");
}
async function addCoins(amount) {
  let coins = parseInt(ls("coins") || "0") + Math.max(0, Math.round(amount)); lsSet("coins", coins); _refreshCoinDisplay();
  await _fbReady;
  if (_fb) { try { await _fb.set(_fb.ref(_fb.db, "coins/" + getUserId()), { amount: coins, username: getUsername(), updatedAt: Date.now() }); } catch(e) {} }
  return coins;
}
async function spendCoins(amount) {
  const coins = await getCoins(); if (coins < amount) return false;
  const n = coins - amount; lsSet("coins", n); _refreshCoinDisplay();
  await _fbReady;
  if (_fb) { try { await _fb.set(_fb.ref(_fb.db, "coins/" + getUserId()), { amount: n, username: getUsername(), updatedAt: Date.now() }); } catch(e) {} }
  return true;
}
async function adminGiveCoinsByName(targetName, amount) {
  if (!_isAdmin()) return; await _fbReady;
  if (_fb) {
    const snap = await _fb.get(_fb.ref(_fb.db, "coins"));
    if (snap.exists()) snap.forEach(c => {
      const d = c.val();
      if ((d.username || "").toLowerCase() === targetName.toLowerCase())
        _fb.set(_fb.ref(_fb.db, "coins/" + c.key), { ...d, amount: (d.amount || 0) + amount, updatedAt: Date.now() });
    });
  }
}
function _refreshCoinDisplay() {
  const c = parseInt(ls("coins") || "0");
  document.querySelectorAll(".coins_display,#coins_display,#coinsDisplay").forEach(el => el.textContent = c.toLocaleString());
}

/* ══ INVENTORY ══ */
async function getInventory() {
  await _fbReady;
  if (_fb) { try { const snap = await _fb.get(_fb.ref(_fb.db, "inventory/" + getUserId())); if (snap.exists()) { const inv = snap.val(); lsSet("inventory", JSON.stringify(inv)); return inv; } } catch(e) {} }
  return JSON.parse(ls("inventory") || "{}");
}
async function addInventoryItem(type, itemId, data = {}) {
  const inv = await getInventory(); if (!inv[type]) inv[type] = {}; inv[type][itemId] = { ...data, acquiredAt: Date.now() }; lsSet("inventory", JSON.stringify(inv));
  await _fbReady; if (_fb) { try { await _fb.set(_fb.ref(_fb.db, "inventory/" + getUserId()), inv); } catch(e) {} } return inv;
}
async function hasInventoryItem(type, itemId) { const inv = await getInventory(); return !!(inv[type] && inv[type][itemId]); }

/* ══ ONLINE PRESENCE (with last-seen) ══ */
async function _initOnlinePresence() {
  await _fbReady; if (!_fb) return;
  const uid = getUserId();
  const presRef = _fb.ref(_fb.db, "online/" + uid);
  const ping = () => _fb.set(presRef, { username: getUsername(), ts: Date.now(), page: location.pathname, uid });
  ping();
  setInterval(ping, 20000);
  _fb.onValue(_fb.ref(_fb.db, "online"), snap => {
    if (!snap.exists()) return;
    const now = Date.now(); let c = 0;
    snap.forEach(ch => { if ((ch.val().ts || 0) > now - 60000) c++; });
    document.querySelectorAll(".online_count,#onlineCount").forEach(el => el.textContent = c);
  });
}

/* ══ LEADERBOARD ══ */
async function saveLeaderboard() {
  const name = getUsername(); if (!name || name === "Guest") return;
  const xpNum = Number(BigInt(ls("xp") || "0")); const lvl = Math.floor(xpNum / 100); const coins = parseInt(ls("coins") || "0");
  await _fbReady;
  if (_fb) { try { await _fb.set(_fb.ref(_fb.db, "leaderboard/" + name.replace(/[.#$[\]/]/g, "_")), { username: name, xp: xpNum, level: lvl, coins, uid: getUserId(), updatedAt: Date.now() }); } catch(e) {} }
}
window.saveToLeaderboard = saveLeaderboard;
async function renderLeaderboard() {
  const el = document.getElementById("leaderboardList"); if (!el) return;
  el.innerHTML = `<div style="text-align:center;padding:16px;opacity:.5;">Loading...</div>`;
  await saveLeaderboard(); await _fbReady;
  let entries = [];
  if (_fb) { try { const snap = await _fb.get(_fb.query(_fb.ref(_fb.db, "leaderboard"), _fb.orderByChild("xp"), _fb.limitToLast(50))); if (snap.exists()) { snap.forEach(c => entries.push(c.val())); entries.sort((a, b) => (b.xp || 0) - (a.xp || 0)); } } catch(e) {} }
  if (!entries.length) { el.innerHTML = `<div style="text-align:center;padding:16px;opacity:.5;">No players yet!</div>`; return; }
  const myName = getUsername(); el.innerHTML = "";
  entries.slice(0, 50).forEach((row, i) => {
    const div = document.createElement("div"); div.className = "lb-row" + (row.username === myName ? " lb-me" : "");
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "#" + (i + 1);
    div.innerHTML = `<span class="lb-rank">${medal}</span><span class="lb-name">${escHtml(row.username)}</span><span class="lb-lvl">Lv.${(row.level || 0).toLocaleString()}</span><span class="lb-coins">🪙${(row.coins || 0).toLocaleString()}</span>`;
    el.appendChild(div);
  });
}

/* ══ THEMES (injects real CSS — fixes themes not working) ══ */
const THEME_CSS = {
  default: ``,
  neon: `body{background:#04011a!important;}
    .sidebar{background:rgba(4,1,26,.97)!important;border-right:1px solid rgba(0,200,255,.35)!important;}
    .main,.home-card,.xp_card,.daily_card{background:rgba(0,10,40,.7)!important;border-color:rgba(0,200,255,.25)!important;}
    h1,h2,.sidebar a{color:#00c8ff!important;}
    .save-btn,#chatSend{background:#00c8ff!important;color:#000!important;}
    :root{--accent:#00c8ff!important;}
    *{font-family:'Courier New',monospace!important;}`,
  pastel: `body{background:linear-gradient(135deg,#1a0a2e,#2d1b45)!important;}
    h1,h2{color:#ff9bdb!important;} .save-btn,#chatSend{background:linear-gradient(135deg,#ff9bdb,#c97eff)!important;color:#000!important;}
    :root{--accent:#ff9bdb!important;}`,
  retro: `body{background:#0a0000!important;} *{font-family:'Courier New',monospace!important;}
    .sidebar{background:#130000!important;border-right:2px solid #ff4400!important;}
    h1,h2{color:#ff4400!important;text-shadow:0 0 10px #ff4400!important;}
    .save-btn,#chatSend{background:#ff4400!important;} :root{--accent:#ff4400!important;}`,
  beach: `body{background:linear-gradient(180deg,#001a3a,#0066cc)!important;}
    h1,h2{color:#7dd8ff!important;} :root{--accent:#7dd8ff!important;}`,
  glitch: `body{background:#000!important;} *{font-family:'Courier New',monospace!important;}
    h1{color:#ff0080!important;text-shadow:3px 0 #00ff41,-3px 0 #ff0080!important;animation:glitchTxt 2s infinite!important;}
    h2{color:#00ff41!important;} :root{--accent:#ff0080!important;}
    @keyframes glitchTxt{0%,100%{text-shadow:3px 0 #00ff41,-3px 0 #ff0080}50%{text-shadow:-3px 0 #00ff41,3px 0 #ff0080}}`,
  midnight: `body{background:#000510!important;}
    h1,h2{color:#8899ff!important;} :root{--accent:#8899ff!important;}`,
  forest: `body{background:linear-gradient(135deg,#001a00,#002800)!important;}
    h1,h2{color:#80ff80!important;} :root{--accent:#80ff80!important;}`,
  sakura: `body{background:linear-gradient(135deg,#1a0011,#2a0020)!important;}
    h1,h2{color:#ffb3d1!important;} .save-btn,#chatSend{background:linear-gradient(135deg,#ff69b4,#ff1493)!important;}
    :root{--accent:#ff69b4!important;}`,
  volcano: `body{background:linear-gradient(180deg,#0a0000,#1a0500)!important;}
    h1,h2{color:#ff6600!important;text-shadow:0 0 20px #ff4400!important;}
    .save-btn,#chatSend{background:linear-gradient(135deg,#ff6600,#ff0000)!important;}
    :root{--accent:#ff6600!important;}`,
  ice: `body{background:linear-gradient(135deg,#000d1a,#001428)!important;}
    h1,h2{color:#a0e8ff!important;} .save-btn,#chatSend{background:linear-gradient(135deg,#a0e8ff,#4090cc)!important;color:#000!important;}
    :root{--accent:#a0e8ff!important;}`,
};
function applyThemeCSS(themeId) {
  let s = document.getElementById("themeStyleSheet");
  if (!s) { s = document.createElement("style"); s.id = "themeStyleSheet"; document.head.appendChild(s); }
  s.textContent = THEME_CSS[themeId] || "";
  document.body.className = document.body.className.replace(/theme-\w+/g, "").trim();
  if (themeId && themeId !== "default") document.body.classList.add("theme-" + themeId);
}
function applyAllSettings() {
  const t = ls("theme"); if (t) applyThemeCSS(t);
  if (ls("sidebarPos") === "right") document.body.classList.add("sidebar-right");
  const bg = ls("bgColor"); if (bg) document.body.style.background = bg;
  const fn = ls("font"); if (fn) document.body.style.fontFamily = fn;
  const ac = ls("accent"); if (ac) document.documentElement.style.setProperty("--accent", ac);
  ["glassUI","blurBG","megaGlow","thickBorders","thinBorders","superCompact","wideLayout","bigTitles","ultraNeon","winXPMode"]
    .forEach(x => { if (ls("extra_" + x) === "1") document.body.classList.add(x); });
  applySidebarSize(); applyEquippedTrail();
}
function applySidebarSize() { const sb = document.querySelector(".sidebar"); if (!sb) return; sb.classList.toggle("sidebar-mini", window.innerWidth < 600); }
window.addEventListener("resize", applySidebarSize);

/* ══ XP ══ */
function _addXPRaw(amount) { let xp = Number(BigInt(ls("xp") || "0")); xp += Math.max(0, Math.round(amount)); lsSet("xp", xp.toString()); _refreshXPDisplay(); }
function addLevels(levels) { _addXPRaw(Math.round(levels) * 100); saveLeaderboard(); checkAchievements(); }
function _refreshXPDisplay() {
  const xpNum = Number(BigInt(ls("xp") || "0")); const lvl = Math.floor(xpNum / 100); const cur = xpNum % 100;
  const lvlEl = document.getElementById("lvl_num"); const xpTxt = document.getElementById("xp_txt"); const xpFill = document.getElementById("xp_fill");
  if (lvlEl) lvlEl.innerText = lvl; if (xpTxt) xpTxt.innerText = `XP: ${cur} / 100`; if (xpFill) xpFill.style.width = cur + "%";
}

/* ══ DAILY ══ */
async function claimDaily() {
  const today = Math.floor(Date.now() / 86400000); const last = Number(ls("lastDaily") || 0);
  const el = document.getElementById("daily_status");
  if (today > last) {
    lsSet("lastDaily", today); let xp = BigInt(ls("xp") || "0"); xp += 50n * 100n; lsSet("xp", xp.toString());
    await addCoins(50); _refreshXPDisplay(); if (el) el.innerText = "Claimed! +50 Levels & 50 Coins 🎉";
    let dc = parseInt(ls("dailyClaims") || "0") + 1; lsSet("dailyClaims", dc); saveLeaderboard();
    if (typeof unlockAchievement === "function") { unlockAchievement("daily_1"); if (dc >= 7) unlockAchievement("daily_7"); if (dc >= 30) unlockAchievement("daily_30"); }
  } else { if (el) el.innerText = "Already claimed today — come back tomorrow!"; }
}

/* ══ WEATHER WIDGET ══ */
async function loadWeatherWidget(containerId) {
  const el = document.getElementById(containerId || "weatherWidget");
  if (!el) return;
  // Cache weather for 15 min to avoid rate limits on Neocities
  const cacheKey = "weatherCache";
  const cacheTs = parseInt(ls("weatherCacheTs") || "0");
  if (Date.now() - cacheTs < 900000) {
    const cached = ls(cacheKey);
    if (cached) { el.innerHTML = cached; return; }
  }
  el.innerHTML = `<div style="text-align:center;padding:12px;opacity:.5;">Loading weather...</div>`;
  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=29.84678&longitude=-95.661693&daily=sunrise,sunset,daylight_duration,sunshine_duration&hourly=temperature_2m,precipitation_probability,precipitation,rain,showers,snowfall,relative_humidity_2m,apparent_temperature&timezone=auto&forecast_days=1";
    const res = await fetch(url);
    const data = await res.json();
    const hour = new Date().getHours();
    const h = data.hourly;
    const temp = h.temperature_2m[hour]; // Celsius
    const feels = h.apparent_temperature[hour];
    const precip = h.precipitation_probability[hour];
    const humidity = h.relative_humidity_2m[hour];
    const rain = h.rain[hour];
    const snow = h.snowfall[hour];
    const tempF = (temp * 9/5 + 32).toFixed(0);
    const feelsF = (feels * 9/5 + 32).toFixed(0);
    const sunrise = new Date(data.daily.sunrise[0]).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
    const sunset = new Date(data.daily.sunset[0]).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
    const icon = snow > 0 ? "❄️" : rain > 0 ? "🌧️" : precip > 50 ? "🌦️" : precip > 20 ? "⛅" : hour >= 6 && hour < 20 ? "☀️" : "🌙";
    const weatherHtml = `
      <div style="background:linear-gradient(135deg,rgba(0,30,60,.8),rgba(0,20,40,.9));border:1px solid rgba(100,180,255,.25);border-radius:18px;padding:16px 18px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div>
            <div style="font-size:.72rem;color:#7dd8ff;font-weight:700;letter-spacing:1px;opacity:.8;">📍 KATY/HOUSTON, TX</div>
            <div style="font-size:2.2rem;font-weight:900;line-height:1.1;">${icon} ${tempF}°F</div>
            <div style="font-size:.82rem;opacity:.6;">Feels like ${feelsF}°F</div>
          </div>
          <div style="text-align:right;font-size:.82rem;opacity:.7;">
            <div>💧 Humidity: ${humidity}%</div>
            <div>🌧️ Rain chance: ${precip}%</div>
            <div>🌅 Rise: ${sunrise}</div>
            <div>🌇 Set: ${sunset}</div>
          </div>
        </div>
        <div style="font-size:.7rem;opacity:.3;text-align:right;">Open-Meteo · Updated ${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</div>
      </div>`;
    el.innerHTML = weatherHtml;
    lsSet("weatherCache", weatherHtml); lsSet("weatherCacheTs", Date.now().toString());
  } catch(e) {
    el.innerHTML = `<div style="text-align:center;padding:12px;opacity:.4;">Weather unavailable</div>`;
  }
}

/* ══ GLOBAL EVENTS ══ */
const _seenEventKeys = new Set();
const _pageLoadTs = Date.now(); // anything older than this is history, ignore it
let _firstEventSnap = true;    // first onValue call is always the current snapshot, skip it
function _listenGlobalEvents() {
  // _fb is already set when this is called from _fbReady, no need to await
  if (!_fb) return;
  _fb.onValue(
    _fb.query(_fb.ref(_fb.db, "global_events"), _fb.orderByChild("ts"), _fb.limitToLast(10)),
    snap => {
      // First callback is always the initial load — mark all existing keys as seen and bail
      if (_firstEventSnap) {
        _firstEventSnap = false;
        if (snap.exists()) snap.forEach(child => _seenEventKeys.add(child.key));
        return;
      }
      if (!snap.exists()) return;
      snap.forEach(child => {
        if (_seenEventKeys.has(child.key)) return;
        _seenEventKeys.add(child.key);
        const ev = child.val();
        // Extra guard: ignore anything pushed before the page loaded (clock skew buffer: 2s)
        if (!ev || (ev.ts && ev.ts < _pageLoadTs - 2000)) return;
        _handleGlobalEvent(ev);
      });
    }
  );
}
function _handleGlobalEvent(ev) {
  if (ev.type === "event") triggerEventClient({ id: ev.id, param: ev.param });
  if (ev.type === "global_msg") showGlobalBanner(ev.msg, ev.from);
  if (ev.type === "kick" && (ev.targetName || "").toLowerCase() === getUsername().toLowerCase()) {
    document.body.innerHTML = `<div style="position:fixed;inset:0;background:#000;display:flex;align-items:center;justify-content:center;z-index:9999999;flex-direction:column;gap:16px;"><div style="font-size:3rem;">🚫</div><div style="color:#ff6b6b;font-size:1.4rem;font-weight:900;">You have been removed.</div><div style="opacity:.5;">${escHtml(ev.reason || "No reason given")}</div></div>`; return;
  }
  if (ev.type === "ban" && (ev.targetName || "").toLowerCase() === getUsername().toLowerCase()) { lsSet("oozecrib_banned", "1"); lsSet("ban_reason", ev.reason || ""); location.reload(); }
  if (ev.type === "give_coins" && (!ev.targetName || ev.targetName.toLowerCase() === getUsername().toLowerCase() || ev.targetName === "all")) { addCoins(ev.amount || 0); showEventToast(`🪙 +${ev.amount} Coins!`, "#ffe600"); }
  if (ev.type === "give_levels" && (!ev.targetName || ev.targetName.toLowerCase() === getUsername().toLowerCase() || ev.targetName === "all")) { addLevels(ev.amount || 0); showEventToast(`⭐ +${ev.amount} Levels!`, "#3cff9a"); }
  if (ev.type === "give_trail") { const inv = JSON.parse(ls("inventory") || "{}"); if (!inv.trails) inv.trails = {}; inv.trails[ev.trailId] = { acquiredAt: Date.now(), gifted: true }; lsSet("inventory", JSON.stringify(inv)); showEventToast(`🎨 New trail: ${ev.trailId}!`, "#ff6bda"); }
  if (ev.type === "give_drop" && (!ev.targetName || ev.targetName.toLowerCase() === getUsername().toLowerCase() || ev.targetName === "all")) { const inv = JSON.parse(ls("inventory") || "{}"); if (!inv.drops) inv.drops = []; for (let i = 0; i < (ev.count || 1); i++) inv.drops.push({ id: "drop_" + Date.now() + i, link: ev.link || "", rarity: ev.rarity || "common", ts: Date.now() }); lsSet("inventory", JSON.stringify(inv)); showEventToast(`🎁 ${ev.count || 1}x Drop received!`, "#ff6bda"); }
  if (ev.type === "direct_link" && (!ev.targetName || ev.targetName.toLowerCase() === getUsername().toLowerCase() || ev.targetName === "all")) _showDirectLink(ev.link, ev.from);
  if (ev.type === "poll") showPoll(ev);
  if (ev.type === "force_theme") { applyThemeCSS(ev.theme); lsSet("theme", ev.theme); }
  if (ev.type === "announcement") _showBigAnnouncement(ev.msg, ev.from, ev.color, ev.icon);
  if (ev.type === "give_admin" && (ev.targetName || "").toLowerCase() === getUsername().toLowerCase()) { lsSet("oozecrib_admin", "1"); showEventToast("🛡️ You have been given Admin!", "#6b48ff"); }
  if (ev.type === "remove_admin" && (ev.targetName || "").toLowerCase() === getUsername().toLowerCase()) { lsSet("oozecrib_admin", "0"); showEventToast("❌ Admin removed.", "#ff6b6b"); }
  if (ev.type === "wipe_user" && (ev.targetName || "").toLowerCase() === getUsername().toLowerCase()) { ["xp","coins","inventory","dailyClaims","unlocked_ach"].forEach(k => localStorage.removeItem(k)); location.reload(); }
  if (ev.type === "redirect" && (!ev.targetName || ev.targetName.toLowerCase() === getUsername().toLowerCase() || ev.targetName === "all")) window.location.href = ev.url;
  if (ev.type === "alert_msg" && (!ev.targetName || ev.targetName.toLowerCase() === getUsername().toLowerCase() || ev.targetName === "all")) alert(ev.msg);
}
function _showDirectLink(link, from) {
  const d = document.createElement("div");
  d.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0d0d1f;border:2px solid #3cff9a;border-radius:20px;padding:28px;z-index:999999;text-align:center;max-width:380px;width:90%;box-shadow:0 0 60px rgba(60,255,154,.3);";
  d.innerHTML = `<div style="font-size:1.5rem;margin-bottom:8px;">🔗 Link from ${escHtml(from || "Admin")}!</div><a href="${escHtml(link)}" target="_blank" rel="noopener" style="display:block;padding:12px;margin:12px 0;background:rgba(60,255,154,.1);border:1px solid rgba(60,255,154,.3);border-radius:12px;color:#3cff9a;word-break:break-all;">${escHtml(link)}</a><button onclick="this.parentElement.remove()" style="padding:10px 24px;border-radius:12px;background:#3cff9a;border:none;color:#000;font-weight:700;cursor:pointer;">Dismiss</button>`;
  document.body.appendChild(d);
}
function _showBigAnnouncement(msg, from, color, icon) {
  document.getElementById("bigAnnouncement")?.remove();
  const c = color || "#3cff9a";
  const fromName = (from || "Admin").toUpperCase();
  const d = document.createElement("div"); d.id = "bigAnnouncement";

  // Outer wrapper: slides down from top, full-width, glassy dark panel
  d.style.cssText = `
    position:fixed;top:0;left:0;right:0;z-index:9999999;
    background:linear-gradient(180deg,rgba(4,4,18,.98) 0%,rgba(8,8,28,.97) 100%);
    border-bottom:2px solid ${c};
    box-shadow:0 0 0 1px ${c}18,0 6px 60px ${c}44,0 2px 12px rgba(0,0,0,.8);
    backdrop-filter:blur(24px);
    transform:translateY(-110%);
    transition:transform .45s cubic-bezier(.34,1.46,.64,1);
    font-family:inherit;
    overflow:hidden;
  `;

  d.innerHTML = `
    <!-- Animated scanline shimmer -->
    <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.012) 3px,rgba(255,255,255,.012) 4px);pointer-events:none;"></div>
    <!-- Glow pulse top edge -->
    <div id="_annGlow" style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${c},${c}cc,${c},transparent);animation:_annPulse 1.6s ease-in-out infinite;"></div>

    <div style="display:flex;align-items:center;gap:0;padding:0;position:relative;">

      <!-- LEFT: sender badge — styled like the clock widget -->
      <div style="
        flex-shrink:0;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        padding:12px 20px;
        background:linear-gradient(135deg,${c}22,${c}0a);
        border-right:1px solid ${c}33;
        min-width:110px;
        gap:4px;
      ">
        <div style="font-size:1.6rem;line-height:1;">${escHtml(icon||"📢")}</div>
        <div style="
          font-size:.6rem;font-weight:900;letter-spacing:3px;
          color:${c};text-transform:uppercase;opacity:.7;
          margin-top:2px;
        ">FROM</div>
        <div id="_annSenderTicker" style="
          font-size:.78rem;font-weight:900;letter-spacing:1px;
          color:${c};text-transform:uppercase;
          white-space:nowrap;overflow:hidden;
          max-width:100px;text-overflow:ellipsis;
          text-shadow:0 0 12px ${c}88;
        ">${escHtml(fromName)}</div>
        <!-- Ticking underline like a clock colon blink -->
        <div id="_annBlink" style="width:28px;height:2px;border-radius:2px;background:${c};opacity:1;transition:opacity .25s;margin-top:3px;"></div>
      </div>

      <!-- CENTER: message -->
      <div style="flex:1;min-width:0;padding:14px 20px;">
        <div style="
          font-size:.65rem;font-weight:800;letter-spacing:3px;
          color:${c};opacity:.65;text-transform:uppercase;margin-bottom:5px;
        ">📣 &nbsp;ANNOUNCEMENT</div>
        <div style="
          font-size:1.15rem;font-weight:900;line-height:1.35;
          color:#fff;
          text-shadow:0 0 20px rgba(255,255,255,.15);
        ">${escHtml(msg)}</div>
      </div>

      <!-- RIGHT: countdown clock block + dismiss -->
      <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 18px;gap:8px;border-left:1px solid ${c}22;">
        <!-- Countdown styled like a digital clock segment -->
        <div style="
          font-size:1.8rem;font-weight:900;
          font-variant-numeric:tabular-nums;
          color:${c};
          text-shadow:0 0 18px ${c}cc;
          letter-spacing:-1px;
          line-height:1;
          font-family:monospace;
        " id="_annCount">3</div>
        <div style="font-size:.55rem;letter-spacing:2px;opacity:.4;color:${c};text-transform:uppercase;">secs</div>
        <button onclick="document.getElementById('bigAnnouncement').remove()" style="
          background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.15);
          color:rgba(255,255,255,.6);
          border-radius:8px;padding:5px 12px;
          cursor:pointer;font-size:.75rem;font-weight:700;
          white-space:nowrap;
          transition:all .2s;
        " onmouseover="this.style.background='rgba(255,255,255,.14)'" onmouseout="this.style.background='rgba(255,255,255,.07)'">✕ Dismiss</button>
      </div>
    </div>

    <!-- Bottom progress bar -->
    <div style="height:3px;background:${c}22;position:relative;">
      <div id="_annBar" style="position:absolute;left:0;top:0;height:100%;width:100%;background:linear-gradient(90deg,${c},${c}aa);transition:width 3s linear;"></div>
    </div>

    <style>
      @keyframes _annPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
    </style>
  `;

  document.body.appendChild(d);

  // Slide in
  requestAnimationFrame(() => { requestAnimationFrame(() => { d.style.transform = "translateY(0)"; }); });

  // Progress bar drain
  const bar = d.querySelector("#_annBar");
  setTimeout(() => { bar.style.width = "0%"; }, 80);

  // Countdown ticking (like a digital clock)
  const countEl = d.querySelector("#_annCount");
  const blinkEl = d.querySelector("#_annBlink");
  const dur = 3000;
  const start = Date.now();
  let blinkState = true;
  const tick = setInterval(() => {
    const elapsed = Date.now() - start;
    const left = Math.max(0, Math.ceil((dur - elapsed) / 1000));
    if (countEl) countEl.textContent = left;
    // blink the underline bar like a clock colon
    blinkState = !blinkState;
    if (blinkEl) blinkEl.style.opacity = blinkState ? "1" : "0.1";
  }, 500);

  setTimeout(() => {
    clearInterval(tick);
    if (d.parentNode) {
      d.style.transform = "translateY(-110%)";
      d.style.transition = "transform .35s ease-in";
      setTimeout(() => d.remove(), 380);
    }
  }, dur);
}

/* ══ GLOBAL MESSAGES ══ */
async function _listenGlobalMessages() {
  await _fbReady; if (!_fb) return;
  _fb.onValue(_fb.query(_fb.ref(_fb.db, "global_messages"), _fb.orderByChild("ts"), _fb.limitToLast(3)), snap => {
    if (!snap.exists()) return; let latest = null; snap.forEach(c => { latest = c.val(); });
    if (latest && latest.ts > parseInt(ls("_lastBannerTs") || "0")) { lsSet("_lastBannerTs", latest.ts); showGlobalBanner(latest.msg, latest.from); }
  });
}
function showGlobalBanner(msg, from = "") {
  let b = document.getElementById("globalBanner");
  if (!b) { b = document.createElement("div"); b.id = "globalBanner"; b.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:999999;background:linear-gradient(135deg,rgba(60,255,154,.15),rgba(107,72,255,.12));backdrop-filter:blur(12px);border-bottom:2px solid rgba(60,255,154,.35);padding:12px 20px;display:flex;justify-content:space-between;align-items:center;"; document.body.appendChild(b); }
  b.innerHTML = `<span style="font-size:1rem;">📢 ${from ? `<strong style="color:#3cff9a">${escHtml(from)}:</strong> ` : ""}${escHtml(msg)}</span><span onclick="this.parentElement.remove()" style="cursor:pointer;margin-left:12px;opacity:.6;font-size:1.3rem;">✕</span>`;
  setTimeout(() => { if (b.parentNode) { b.style.opacity = "0"; b.style.transition = "opacity .5s"; setTimeout(() => b.remove(), 600); } }, 12000);
}

/* ══ POLLS ══ */
async function _listenPolls() {
  await _fbReady; if (!_fb) return;
  _fb.onValue(_fb.query(_fb.ref(_fb.db, "polls"), _fb.orderByChild("ts"), _fb.limitToLast(1)), snap => {
    if (!snap.exists()) return;
    snap.forEach(child => { const poll = { ...child.val(), key: child.key }; const seen = JSON.parse(ls("seen_polls") || "[]"); if (!seen.includes(poll.key)) showPoll(poll); });
  });
}
function showPoll(poll) {
  if (!poll || !poll.question) return;
  document.getElementById("pollWidget")?.remove();
  const div = document.createElement("div"); div.id = "pollWidget";
  div.style.cssText = "position:fixed;bottom:80px;right:20px;width:300px;background:rgba(5,5,20,.97);border:1px solid rgba(60,255,154,.4);border-radius:20px;padding:18px;z-index:99998;box-shadow:0 0 40px rgba(60,255,154,.2);";
  const myVote = ls("poll_vote_" + poll.key);
  if (myVote) { _renderPollResults(div, poll, myVote); }
  else {
    div.innerHTML = `<div style="font-weight:800;margin-bottom:4px;color:#3cff9a;font-size:.85rem;">📊 POLL</div><div style="font-weight:700;margin-bottom:14px;font-size:.95rem;">${escHtml(poll.question)}</div><div id="pollOpts"></div><div style="display:flex;justify-content:space-between;margin-top:10px;"><span style="font-size:.75rem;opacity:.5;">from ${escHtml(poll.from || "Admin")}</span><button onclick="document.getElementById('pollWidget').remove()" style="background:transparent;border:none;color:#ff6b6b;cursor:pointer;font-size:.85rem;">Dismiss</button></div>`;
    const optsDiv = div.querySelector("#pollOpts");
    (poll.options || ["Yes", "No"]).forEach(opt => {
      const btn = document.createElement("button");
      btn.style.cssText = "width:100%;padding:9px 14px;margin-bottom:7px;border-radius:12px;border:1px solid rgba(60,255,154,.3);background:rgba(60,255,154,.07);color:#fff;cursor:pointer;text-align:left;font-size:.9rem;transition:all .2s;";
      btn.textContent = opt;
      btn.onclick = async () => {
        lsSet("poll_vote_" + poll.key, opt);
        await _fbReady; if (_fb) try { await _fb.set(_fb.ref(_fb.db, `poll_votes/${poll.key}/${getUserId()}`), { vote: opt, username: getUsername(), ts: Date.now() }); } catch(e) {}
        _renderPollResults(div, poll, opt);
        const seen = JSON.parse(ls("seen_polls") || "[]"); if (!seen.includes(poll.key)) { seen.push(poll.key); lsSet("seen_polls", JSON.stringify(seen)); }
      };
      optsDiv.appendChild(btn);
    });
  }
  document.body.appendChild(div);
}
async function _renderPollResults(div, poll, myVote) {
  div.innerHTML = `<div style="font-weight:800;margin-bottom:4px;color:#3cff9a;font-size:.85rem;">📊 POLL RESULTS</div><div style="font-weight:700;margin-bottom:14px;font-size:.95rem;">${escHtml(poll.question)}</div><div id="pollResultBars"></div><div style="display:flex;justify-content:space-between;margin-top:12px;"><span style="font-size:.75rem;opacity:.5;">Your vote: <strong style="color:#3cff9a">${escHtml(myVote)}</strong></span><button onclick="document.getElementById('pollWidget').remove()" style="background:transparent;border:none;color:#ff6b6b;cursor:pointer;font-size:.85rem;">Close</button></div>`;
  const barsDiv = div.querySelector("#pollResultBars"); let votes = {};
  await _fbReady; if (_fb) try { const snap = await _fb.get(_fb.ref(_fb.db, `poll_votes/${poll.key}`)); if (snap.exists()) snap.forEach(c => { const v = c.val().vote; votes[v] = (votes[v] || 0) + 1; }); } catch(e) {}
  const total = Object.values(votes).reduce((a, b) => a + b, 0) || 1;
  (poll.options || ["Yes", "No"]).forEach(opt => {
    const count = votes[opt] || 0; const pct = Math.round(count / total * 100); const isMyVote = opt === myVote;
    const bar = document.createElement("div"); bar.style.marginBottom = "8px";
    bar.innerHTML = `<div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:.85rem;"><span>${isMyVote ? "✓ " : ""}${escHtml(opt)}</span><span style="color:${isMyVote ? "#3cff9a" : "rgba(255,255,255,.6)"};">${pct}% (${count})</span></div><div style="height:8px;background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:${isMyVote ? "#3cff9a" : "rgba(107,72,255,.7)"};border-radius:99px;transition:width .8s ease;"></div></div>`;
    barsDiv.appendChild(bar);
  });
  if (total > 1) barsDiv.innerHTML += `<div style="font-size:.75rem;opacity:.4;text-align:right;margin-top:4px;">${total} total votes</div>`;
}

/* ══ DROPS ══ */
const DROP_RARITIES = {
  common:    { label:"Common",    weight:50, color:"#a0a0a0", glow:"rgba(160,160,160,.4)", xp:50,   coins:25,   links:1 },
  rare:      { label:"Rare",      weight:28, color:"#6baeff", glow:"rgba(107,174,255,.4)", xp:150,  coins:80,   links:2 },
  epic:      { label:"Epic",      weight:14, color:"#c97eff", glow:"rgba(201,126,255,.4)", xp:350,  coins:200,  links:3 },
  legendary: { label:"Legendary", weight:6,  color:"#ffc93c", glow:"rgba(255,201,60,.4)",  xp:800,  coins:500,  links:4 },
  mythic:    { label:"Mythic",    weight:2,  color:"#ff79b0", glow:"rgba(255,121,176,.4)", xp:2000, coins:1500, links:6 },
};
async function _listenAdminDrops() {
  await _fbReady; if (!_fb) return;
  _fb.onValue(_fb.query(_fb.ref(_fb.db, "ooze_drop_events"), _fb.orderByChild("ts"), _fb.limitToLast(1)), snap => {
    if (!snap.exists()) return;
    snap.forEach(child => { const ev = child.val(); const seen = JSON.parse(ls("seen_drops") || "[]"); if (!seen.includes(child.key)) { seen.push(child.key); lsSet("seen_drops", JSON.stringify(seen)); showOozeDropEvent({ ...ev, key: child.key }); } });
  });
}
async function openOozeDrop(cid, adminLinks = []) {
  const weights = Object.entries(DROP_RARITIES).map(([id, r]) => ({ id, weight: r.weight }));
  const total = weights.reduce((s, r) => s + r.weight, 0); let r = Math.random() * total, rarity = "common";
  for (const w of weights) { r -= w.weight; if (r <= 0) { rarity = w.id; break; } }
  const rd = DROP_RARITIES[rarity]; let chosenLinks = [];
  if (adminLinks.length > 0) for (let i = 0; i < rd.links; i++) chosenLinks.push(adminLinks[Math.floor(Math.random() * adminLinks.length)]);
  _addXPRaw(rd.xp); await addCoins(rd.coins);
  const inv = JSON.parse(ls("inventory") || "{}"); if (!inv.opened_drops) inv.opened_drops = [];
  inv.opened_drops.push({ id: "drop_" + Date.now(), rarity, links: chosenLinks, xp: rd.xp, coins: rd.coins, ts: Date.now() }); lsSet("inventory", JSON.stringify(inv));
  return { rarity, rd, links: chosenLinks };
}
function showOozeDropEvent({ links = [], message = "", key = "" }) {
  document.getElementById("oozeDropEvent")?.remove();
  const d = document.createElement("div"); d.id = "oozeDropEvent";
  d.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0d0d1f;border:2px solid #ff6bda;border-radius:24px;padding:32px;z-index:999999;text-align:center;min-width:280px;max-width:380px;width:90%;box-shadow:0 0 60px rgba(255,107,218,.3);";
  d.innerHTML = `<div style="font-size:3rem;margin-bottom:8px;">🎀</div><h3 style="color:#ff6bda;margin:0 0 6px;">${escHtml(message || "Ooze Drop!")}</h3><p style="opacity:.6;font-size:.85rem;margin:0 0 20px;">Click to open your drop!</p><div id="dropResult" style="display:none;margin-bottom:16px;"></div><button id="openDropBtn" onclick="window._openThisDrop('${key}')" style="padding:14px 32px;background:linear-gradient(135deg,#ff6bda,#6b48ff);border:none;border-radius:16px;color:#fff;font-weight:900;font-size:1.1rem;cursor:pointer;width:100%;">🎁 Open Drop!</button><br><button onclick="document.getElementById('oozeDropEvent').remove()" style="margin-top:10px;background:transparent;border:none;color:rgba(255,255,255,.35);cursor:pointer;font-size:.85rem;">Skip</button>`;
  document.body.appendChild(d);
  window._openThisDrop = async (k) => {
    document.getElementById("openDropBtn").style.display = "none";
    const result = await openOozeDrop(k, links); const { rarity, rd, links: gotLinks } = result;
    const resultDiv = document.getElementById("dropResult"); if (!resultDiv) return;
    resultDiv.style.display = "block";
    resultDiv.innerHTML = `<div style="font-size:2rem;color:${rd.color};text-shadow:0 0 20px ${rd.glow};font-weight:900;margin-bottom:8px;">${rd.label}!</div><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;"><span style="background:rgba(60,255,154,.1);border:1px solid rgba(60,255,154,.3);border-radius:10px;padding:6px 14px;">+${rd.xp} XP</span><span style="background:rgba(255,220,0,.1);border:1px solid rgba(255,220,0,.3);border-radius:10px;padding:6px 14px;">+${rd.coins} 🪙</span></div>${gotLinks.length ? `<div style="font-size:.85rem;opacity:.7;margin-bottom:8px;">Links:</div>${gotLinks.map(l => `<a href="${escHtml(l)}" target="_blank" style="display:block;color:#3cff9a;word-break:break-all;margin-bottom:4px;font-size:.82rem;">${escHtml(l)}</a>`).join("")}` : ""}`;
    const closeBtn = document.createElement("button"); closeBtn.textContent = "Close"; closeBtn.style.cssText = "margin-top:12px;padding:10px 28px;border-radius:14px;background:#3cff9a;border:none;color:#000;font-weight:700;cursor:pointer;width:100%;"; closeBtn.onclick = () => d.remove(); d.appendChild(closeBtn);
    if (typeof unlockAchievement === "function") unlockAchievement("first_drop");
  };
}

/* ══════════════════════════════════════════════
   100 MOUSE TRAILS
══════════════════════════════════════════════ */
const TRAIL_DEFS = {
  none:       { cost:0,       level:0,   label:"None",              rarity:"free" },
  sparkle:    { cost:400,     level:1,   label:"✨ Sparkle Stars",   rarity:"common" },
  dots:       { cost:350,     level:1,   label:"• Polka Dots",       rarity:"free" },
  smiley:     { cost:400,     level:1,   label:"😊 Smileys",         rarity:"free" },
  bubbles:    { cost:500,     level:2,   label:"🫧 Bubbles",         rarity:"common" },
  pizza:      { cost:500,     level:2,   label:"🍕 Pizza Slices",    rarity:"common" },
  snow:       { cost:600,     level:3,   label:"❄️ Snow Drift",      rarity:"common" },
  cherry:     { cost:600,     level:3,   label:"🌸 Cherry Blossoms", rarity:"common" },
  confetti:   { cost:700,     level:4,   label:"🎊 Confetti",        rarity:"common" },
  music:      { cost:800,     level:5,   label:"🎵 Music Notes",     rarity:"common" },
  ooze:       { cost:999,     level:5,   label:"🟢 Ooze Drops",      rarity:"common" },
  hearts:     { cost:900,     level:5,   label:"💖 Love Hearts",     rarity:"common" },
  leaves:     { cost:900,     level:5,   label:"🍃 Falling Leaves",  rarity:"common" },
  paw:        { cost:1100,    level:7,   label:"🐾 Paw Prints",      rarity:"common" },
  stars2:     { cost:1400,    level:8,   label:"⭐ Shooting Stars",  rarity:"common" },
  coins_trail:{ cost:1200,    level:8,   label:"🪙 Coins",           rarity:"common" },
  cat:        { cost:1300,    level:8,   label:"🐱 Cat Paws",        rarity:"common" },
  balloons:   { cost:1600,    level:9,   label:"🎈 Balloons",        rarity:"common" },
  money:      { cost:1000,    level:6,   label:"💵 Money Rain",      rarity:"common" },
  rainbow:    { cost:1800,    level:10,  label:"🌈 Rainbow Comet",   rarity:"rare" },
  ghost:      { cost:2500,    level:15,  label:"👻 Ghost Trail",     rarity:"rare" },
  skull:      { cost:2500,    level:15,  label:"💀 Skulls",          rarity:"rare" },
  bat:        { cost:2800,    level:16,  label:"🦇 Bats",            rarity:"rare" },
  portal:     { cost:2800,    level:14,  label:"🌀 Portal Swirl",    rarity:"rare" },
  neon_pink:  { cost:3000,    level:16,  label:"🌸 Neon Pink",       rarity:"rare" },
  neon_blue:  { cost:3000,    level:16,  label:"💙 Neon Blue",       rarity:"rare" },
  neon_yellow:{ cost:3000,    level:16,  label:"💛 Neon Yellow",     rarity:"rare" },
  wave:       { cost:3200,    level:17,  label:"〰️ Wave Line",       rarity:"rare" },
  smoke:      { cost:3500,    level:18,  label:"💨 Smoke",           rarity:"rare" },
  fire:       { cost:4200,    level:25,  label:"🔥 Fire Blaze",      rarity:"rare" },
  glitter:    { cost:4000,    level:20,  label:"✨ Gold Glitter",    rarity:"rare" },
  spiral:     { cost:4000,    level:21,  label:"🌀 Spiral",          rarity:"rare" },
  butterfly:  { cost:4500,    level:22,  label:"🦋 Butterflies",     rarity:"rare" },
  fire2:      { cost:2000,    level:12,  label:"🔥 Blue Fire",       rarity:"rare" },
  flame_blue: { cost:3800,    level:20,  label:"🔵 Blue Flame",      rarity:"rare" },
  electric:   { cost:2200,    level:13,  label:"⚡ Electric Sparks", rarity:"rare" },
  dragonfire: { cost:5500,    level:26,  label:"🐉 Dragon Fire",     rarity:"rare" },
  aurora:     { cost:6000,    level:28,  label:"🌌 Aurora",          rarity:"epic" },
  plasma:     { cost:7000,    level:30,  label:"🔵 Plasma",          rarity:"epic" },
  lightning:  { cost:8000,    level:35,  label:"⚡ Lightning",       rarity:"epic" },
  dna:        { cost:8500,    level:32,  label:"🧬 DNA Helix",       rarity:"epic" },
  matrix:     { cost:9000,    level:34,  label:"💻 Matrix Code",     rarity:"epic" },
  orbit:      { cost:10000,   level:36,  label:"🪐 Orbit",           rarity:"epic" },
  tornado:    { cost:11000,   level:38,  label:"🌪️ Tornado",         rarity:"epic" },
  cosmic:     { cost:12000,   level:40,  label:"🌠 Cosmic Dust",     rarity:"epic" },
  hologram:   { cost:13000,   level:42,  label:"📡 Hologram",        rarity:"epic" },
  acid:       { cost:14000,   level:45,  label:"🟢 Acid Drip",       rarity:"epic" },
  dagger:     { cost:7500,    level:32,  label:"🗡️ Daggers",         rarity:"epic" },
  cube:       { cost:5000,    level:24,  label:"📦 3D Cubes",        rarity:"epic" },
  sunray:     { cost:16000,   level:48,  label:"☀️ Sun Rays",        rarity:"epic" },
  moonbeam:   { cost:18000,   level:52,  label:"🌙 Moon Beam",       rarity:"epic" },
  shadow:     { cost:20000,   level:55,  label:"🌑 Shadow Clones",   rarity:"epic" },
  crystal:    { cost:22000,   level:58,  label:"💎 Crystal Shards",  rarity:"epic" },
  galaxy:     { cost:15000,   level:50,  label:"🌌 Galaxy",          rarity:"epic" },
  ice:        { cost:25000,   level:60,  label:"❄️ Ice Crystal",     rarity:"epic" },
  tsunami:    { cost:30000,   level:62,  label:"🌊 Tsunami Wave",    rarity:"legendary" },
  supernova:  { cost:35000,   level:65,  label:"💥 Supernova",       rarity:"legendary" },
  lava:       { cost:40000,   level:75,  label:"🌋 Lava Flow",       rarity:"legendary" },
  blackhole:  { cost:42000,   level:70,  label:"⚫ Black Hole",      rarity:"legendary" },
  titan:      { cost:50000,   level:80,  label:"🔱 Titan Force",     rarity:"legendary" },
  inferno:    { cost:55000,   level:82,  label:"🌋 Inferno",         rarity:"legendary" },
  zodiac:     { cost:60000,   level:85,  label:"♐ Zodiac",           rarity:"legendary" },
  phoenix:    { cost:65000,   level:88,  label:"🦅 Phoenix",         rarity:"legendary" },
  crown:      { cost:80000,   level:92,  label:"👑 Gold Crown",      rarity:"legendary" },
  reaper:     { cost:90000,   level:95,  label:"💀 Reaper",          rarity:"legendary" },
  nuclear:    { cost:100000,  level:98,  label:"☢️ Nuclear",         rarity:"legendary" },
  neon_ooze:  { cost:75000,   level:90,  label:"💚 Neon Ooze",       rarity:"legendary" },
  void:       { cost:350000,  level:150, label:"🖤 Void",            rarity:"mythic" },
  omega:      { cost:200000,  level:110, label:"Ω Omega",            rarity:"mythic" },
  nebula:     { cost:250000,  level:120, label:"🌌 Nebula",          rarity:"mythic" },
  timewarp:   { cost:300000,  level:130, label:"⏰ Time Warp",       rarity:"mythic" },
  spirit:     { cost:400000,  level:140, label:"👻 Spirit World",    rarity:"mythic" },
  godray:     { cost:450000,  level:155, label:"✝️ God Ray",         rarity:"mythic" },
  hyperspace: { cost:150000,  level:100, label:"🚀 Hyperspace",      rarity:"legendary" },
  singularity:{ cost:500000,  level:160, label:"⚫ Singularity",     rarity:"mythic" },
  ultraviolet:{ cost:600000,  level:170, label:"🔮 Ultraviolet",     rarity:"mythic" },
  entropy:    { cost:700000,  level:180, label:"♾️ Entropy",         rarity:"mythic" },
  apocalypse: { cost:800000,  level:190, label:"🔥 Apocalypse",      rarity:"mythic" },
  quantum:    { cost:900000,  level:210, label:"⚛️ Quantum",         rarity:"mythic" },
  prismatic:  { cost:750000,  level:200, label:"🔮 Prismatic",       rarity:"mythic" },
  ooze_king:  { cost:1500000, level:250, label:"🟢 Ooze King",       rarity:"mythic" },
  cosmos:     { cost:2000000, level:350, label:"🌐 Cosmos Master",   rarity:"mythic" },
  ooze_god:   { cost:1000000, level:300, label:"👑 Ooze God",        rarity:"mythic" },
};

/* Trail renderers - canvas-based particle effects */
const TRAIL_RENDERERS = {
  sparkle:    (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`hsl(${p.hue},100%,90%)`;ctx.beginPath();ctx.arc(p.x,p.y,p.life/p.maxLife*6,0,Math.PI*2);ctx.fill();ctx.restore(); },
  dots:       (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.8;ctx.fillStyle=`rgba(255,255,255,${p.life/p.maxLife})`;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();ctx.restore(); },
  smiley:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*18}px Arial`;ctx.fillText("😊",p.x,p.y);ctx.restore(); },
  bubbles:    (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.7;ctx.strokeStyle=`rgba(150,220,255,${p.life/p.maxLife})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,p.life/p.maxLife*8,0,Math.PI*2);ctx.stroke();ctx.restore(); },
  pizza:      (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*18}px Arial`;ctx.fillText("🍕",p.x,p.y);ctx.restore(); },
  snow:       (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle="#e8f4ff";ctx.beginPath();ctx.arc(p.x+(Math.random()-.5)*6,p.y+(Math.random()-.5)*6,p.life/p.maxLife*4,0,Math.PI*2);ctx.fill();ctx.restore(); },
  cherry:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*18}px Arial`;ctx.fillText("🌸",p.x,p.y);ctx.restore(); },
  confetti:   (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`hsl(${p.hue},90%,60%)`;ctx.fillRect(p.x-3,p.y-3,6,6);ctx.restore(); },
  music:      (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${12+p.life/p.maxLife*8}px Arial`;const n=["♪","♫","🎵","🎶"];ctx.fillText(n[Math.floor(p.hue/90)%4],p.x,p.y);ctx.restore(); },
  ooze:       (ctx,p)=>{ ctx.save();const t=p.life/p.maxLife;ctx.globalAlpha=t;const ox=p.x+(Math.random()-.5)*4,oy=p.y+(Math.random()-.5)*4,r=t*9;ctx.shadowColor="#3ccc64";ctx.shadowBlur=14;const gr=ctx.createRadialGradient(ox-r*.3,oy-r*.3,0,ox,oy,r*1.2);gr.addColorStop(0,`rgba(100,255,160,${t})`);gr.addColorStop(.5,`rgba(60,200,100,${t})`);gr.addColorStop(1,`rgba(20,120,60,${t*.6})`);ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(ox,oy-r*1.35);ctx.bezierCurveTo(ox+r*1.1,oy-r*.5,ox+r*1.1,oy+r*.7,ox,oy+r*1.2);ctx.bezierCurveTo(ox-r*1.1,oy+r*.7,ox-r*1.1,oy-r*.5,ox,oy-r*1.35);ctx.closePath();ctx.fill();if(Math.random()>.7){ctx.globalAlpha=t*.5;ctx.fillStyle=`rgba(140,255,180,${t})`;ctx.beginPath();ctx.arc(ox-r*.25,oy-r*.4,r*.25,0,Math.PI*2);ctx.fill();}ctx.restore(); },
  hearts:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*20}px Arial`;ctx.fillText("💖",p.x-10,p.y+10);ctx.restore(); },
  leaves:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*18}px Arial`;ctx.fillText("🍃",p.x,p.y);ctx.restore(); },
  paw:        (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*18}px Arial`;ctx.fillText("🐾",p.x,p.y);ctx.restore(); },
  stars2:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`hsl(${p.hue},100%,80%)`;ctx.shadowColor=`hsl(${p.hue},100%,60%)`;ctx.shadowBlur=10;const s=p.life/p.maxLife*5;for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*s,p.y+Math.sin(a)*s,1.5,0,Math.PI*2);ctx.fill();}ctx.restore(); },
  coins_trail:(ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*16}px Arial`;ctx.fillText("🪙",p.x,p.y);ctx.restore(); },
  cat:        (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*18}px Arial`;ctx.fillText("🐱",p.x,p.y);ctx.restore(); },
  balloons:   (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*20}px Arial`;ctx.fillText("🎈",p.x,p.y);ctx.restore(); },
  money:      (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*16}px Arial`;ctx.fillText("💵",p.x,p.y);ctx.restore(); },
  rainbow:    (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.strokeStyle=`hsl(${p.hue},100%,60%)`;ctx.lineWidth=p.life/p.maxLife*5;ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.stroke();ctx.restore(); },
  ghost:      (ctx,p)=>{ ctx.save();const a=p.life/p.maxLife;ctx.globalAlpha=a*.7;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,14);g.addColorStop(0,`rgba(200,200,255,${a})`);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,14,0,Math.PI*2);ctx.fill();ctx.restore(); },
  skull:      (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*17}px Arial`;ctx.fillText("💀",p.x,p.y);ctx.restore(); },
  bat:        (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*18}px Arial`;ctx.fillText("🦇",p.x,p.y);ctx.restore(); },
  portal:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.6;ctx.strokeStyle=`hsl(${p.hue},80%,60%)`;ctx.lineWidth=2;const r=p.life/p.maxLife*14;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,r*.5,0,Math.PI*2);ctx.stroke();ctx.restore(); },
  neon_pink:  (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`rgba(255,100,200,${p.life/p.maxLife})`;ctx.shadowColor="#ff64c8";ctx.shadowBlur=18;ctx.beginPath();ctx.arc(p.x,p.y,p.life/p.maxLife*8,0,Math.PI*2);ctx.fill();ctx.restore(); },
  neon_blue:  (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`rgba(60,150,255,${p.life/p.maxLife})`;ctx.shadowColor="#3c96ff";ctx.shadowBlur=18;ctx.beginPath();ctx.arc(p.x,p.y,p.life/p.maxLife*8,0,Math.PI*2);ctx.fill();ctx.restore(); },
  neon_yellow:(ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`rgba(255,230,30,${p.life/p.maxLife})`;ctx.shadowColor="#ffe61e";ctx.shadowBlur=18;ctx.beginPath();ctx.arc(p.x,p.y,p.life/p.maxLife*8,0,Math.PI*2);ctx.fill();ctx.restore(); },
  wave:       (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.8;ctx.strokeStyle=`hsl(${p.hue},80%,60%)`;ctx.lineWidth=2;const w=p.life/p.maxLife*16;ctx.beginPath();for(let x=-w;x<w;x+=3){ctx.lineTo(p.x+x,p.y+Math.sin(x/4+Date.now()/80)*4);}ctx.stroke();ctx.restore(); },
  smoke:      (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.4;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.life/p.maxLife*18);g.addColorStop(0,"rgba(200,200,200,0.6)");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.life/p.maxLife*18,0,Math.PI*2);ctx.fill();ctx.restore(); },
  fire:       (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`hsl(${20+Math.random()*40},100%,${50+Math.random()*30}%)`;ctx.beginPath();ctx.arc(p.x+(Math.random()-.5)*8,p.y+(Math.random()-.5)*8,p.life/p.maxLife*9,0,Math.PI*2);ctx.fill();ctx.restore(); },
  glitter:    (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`hsl(45,100%,${60+Math.random()*30}%)`;ctx.shadowColor="#ffd700";ctx.shadowBlur=6;const s=Math.random()*4+1;ctx.fillRect(p.x,p.y,s,s);ctx.restore(); },
  spiral:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.8;ctx.strokeStyle=`hsl(${p.hue},80%,65%)`;ctx.lineWidth=1.5;const t=p.life/p.maxLife;ctx.beginPath();for(let i=0;i<30;i++){const a=i*.4+Date.now()/200;const r=t*i*.5;ctx.lineTo(p.x+r*Math.cos(a),p.y+r*Math.sin(a));}ctx.stroke();ctx.restore(); },
  butterfly:  (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*20}px Arial`;ctx.fillText("🦋",p.x,p.y);ctx.restore(); },
  fire2:      (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`hsl(${200+Math.random()*40},100%,${50+Math.random()*30}%)`;ctx.shadowColor="#00aaff";ctx.shadowBlur=12;ctx.beginPath();ctx.arc(p.x+(Math.random()-.5)*8,p.y+(Math.random()-.5)*8,p.life/p.maxLife*8,0,Math.PI*2);ctx.fill();ctx.restore(); },
  flame_blue: (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`hsl(${200+Math.random()*20},100%,${60+Math.random()*20}%)`;ctx.shadowColor="#0088ff";ctx.shadowBlur=14;ctx.beginPath();ctx.arc(p.x+(Math.random()-.5)*7,p.y+(Math.random()-.5)*7,p.life/p.maxLife*8,0,Math.PI*2);ctx.fill();ctx.restore(); },
  electric:   (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.strokeStyle=`rgba(100,200,255,${p.life/p.maxLife})`;ctx.lineWidth=1.5;ctx.shadowColor="#00cfff";ctx.shadowBlur=8;ctx.beginPath();for(let i=0;i<3;i++){ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+(Math.random()-.5)*30,p.y+(Math.random()-.5)*30);}ctx.stroke();ctx.restore(); },
  dragonfire: (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`hsl(${Math.random()*60},100%,50%)`;ctx.shadowColor="#ff6600";ctx.shadowBlur=20;ctx.beginPath();ctx.arc(p.x+(Math.random()-.5)*12,p.y+(Math.random()-.5)*12,p.life/p.maxLife*11,0,Math.PI*2);ctx.fill();ctx.restore(); },
  aurora:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.5;const g=ctx.createLinearGradient(p.x-20,p.y,p.x+20,p.y);g.addColorStop(0,"rgba(0,255,150,0)");g.addColorStop(.5,`hsla(${p.hue},100%,60%,0.8)`);g.addColorStop(1,"rgba(150,0,255,0)");ctx.fillStyle=g;ctx.fillRect(p.x-20,p.y-p.life/p.maxLife*15,40,p.life/p.maxLife*15);ctx.restore(); },
  plasma:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;const t=p.life/p.maxLife;ctx.fillStyle=`rgba(80,180,255,${t})`;ctx.shadowColor="#50b4ff";ctx.shadowBlur=25;ctx.beginPath();ctx.arc(p.x+Math.sin(Date.now()/80)*t*6,p.y+Math.cos(Date.now()/60)*t*6,t*10,0,Math.PI*2);ctx.fill();ctx.restore(); },
  lightning:  (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.strokeStyle="rgba(255,230,80,.9)";ctx.lineWidth=2;ctx.shadowColor="#ffe600";ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+(Math.random()-.5)*22,p.y+(Math.random()-.5)*22);ctx.stroke();ctx.restore(); },
  dna:        (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.strokeStyle=`hsl(${p.hue},80%,60%)`;ctx.lineWidth=1.5;const off=Math.sin(Date.now()/100+p.x/20)*10;ctx.beginPath();ctx.moveTo(p.x-off,p.y-8);ctx.bezierCurveTo(p.x+off,p.y-4,p.x-off,p.y+4,p.x+off,p.y+8);ctx.stroke();ctx.restore(); },
  matrix:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle="#00ff41";ctx.font=`bold ${p.life/p.maxLife*12}px monospace`;ctx.fillText(String.fromCharCode(33+Math.floor(Math.random()*90)),p.x,p.y);ctx.restore(); },
  orbit:      (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;const t=p.life/p.maxLife;const a=Date.now()/200+p.x;ctx.fillStyle=`hsl(${p.hue},80%,65%)`;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*t*14,p.y+Math.sin(a)*t*8,3,0,Math.PI*2);ctx.fill();ctx.restore(); },
  tornado:    (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.7;const t=p.life/p.maxLife;ctx.strokeStyle=`rgba(150,150,200,${t})`;ctx.lineWidth=1;const angle=Date.now()/50+p.x;ctx.beginPath();ctx.arc(p.x+Math.cos(angle)*t*12,p.y,t*12*(1-t*.5),0,Math.PI);ctx.stroke();ctx.restore(); },
  cosmic:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;const t=p.life/p.maxLife;ctx.fillStyle=`hsl(${p.hue+t*180},90%,70%)`;ctx.shadowColor=`hsl(${p.hue},100%,60%)`;ctx.shadowBlur=15;ctx.beginPath();ctx.arc(p.x+Math.random()*t*8-t*4,p.y+Math.random()*t*8-t*4,t*5,0,Math.PI*2);ctx.fill();ctx.restore(); },
  hologram:   (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.6;ctx.strokeStyle=`rgba(0,255,200,${p.life/p.maxLife})`;ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();ctx.rect(p.x-i*3-4,p.y-i*3-4,i*6+8,i*6+8);ctx.stroke();}ctx.restore(); },
  acid:       (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`rgba(${100+Math.floor(p.life/p.maxLife*50)},255,0,${p.life/p.maxLife})`;ctx.shadowColor="#80ff00";ctx.shadowBlur=12;ctx.beginPath();ctx.arc(p.x+(Math.random()-.5)*6,p.y+(Math.random()-.5)*6,p.life/p.maxLife*8,0,Math.PI*2);ctx.fill();ctx.restore(); },
  dagger:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*18}px Arial`;ctx.fillText("🗡️",p.x,p.y);ctx.restore(); },
  cube:       (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;const t=p.life/p.maxLife;const s=t*8;ctx.fillStyle=`hsl(${p.hue},70%,60%)`;ctx.strokeStyle=`hsl(${p.hue},90%,80%)`;ctx.lineWidth=1;ctx.fillRect(p.x-s/2,p.y-s/2,s,s);ctx.strokeRect(p.x-s/2,p.y-s/2,s,s);ctx.restore(); },
  sunray:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.6;ctx.strokeStyle=`rgba(255,200,50,${p.life/p.maxLife})`;ctx.lineWidth=1.5;const n=8;for(let i=0;i<n;i++){const a=i*Math.PI*2/n+Date.now()/400;const r=p.life/p.maxLife*14;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r);ctx.stroke();}ctx.restore(); },
  moonbeam:   (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.5;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.life/p.maxLife*16);g.addColorStop(0,`rgba(200,220,255,${p.life/p.maxLife})`);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.life/p.maxLife*16,0,Math.PI*2);ctx.fill();ctx.restore(); },
  shadow:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.5;ctx.fillStyle="rgba(0,0,0,0.7)";ctx.shadowColor="#000";ctx.shadowBlur=20;ctx.beginPath();ctx.arc(p.x+(Math.random()-.5)*8,p.y+(Math.random()-.5)*8,p.life/p.maxLife*12,0,Math.PI*2);ctx.fill();ctx.restore(); },
  crystal:    (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.strokeStyle=`rgba(180,240,255,${p.life/p.maxLife})`;ctx.lineWidth=1;const r=p.life/p.maxLife*10;for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+r*Math.cos(a),p.y+r*Math.sin(a));ctx.stroke();}ctx.restore(); },
  galaxy:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.9;const cols=["#ff6bda","#6b48ff","#3cff9a","#fff"];ctx.fillStyle=cols[Math.floor(p.hue/90)%4];ctx.beginPath();ctx.arc(p.x+Math.sin(p.life)*6,p.y+Math.cos(p.life)*6,p.life/p.maxLife*5,0,Math.PI*2);ctx.fill();ctx.restore(); },
  ice:        (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.strokeStyle=`rgba(160,230,255,${p.life/p.maxLife})`;ctx.lineWidth=1;const r=p.life/p.maxLife*10;for(let i=0;i<6;i++){const a=Math.PI/3*i;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+r*Math.cos(a),p.y+r*Math.sin(a));ctx.stroke();}ctx.restore(); },
  tsunami:    (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.7;ctx.strokeStyle=`rgba(0,150,255,${p.life/p.maxLife})`;ctx.lineWidth=2;const w=p.life/p.maxLife*20;ctx.beginPath();for(let x=-w;x<w;x+=4){ctx.lineTo(p.x+x,p.y+Math.sin(x/4+Date.now()/100)*4*p.life/p.maxLife);}ctx.stroke();ctx.restore(); },
  supernova:  (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;const t=p.life/p.maxLife;ctx.fillStyle=`hsl(${50+p.hue/4},100%,${60+t*30}%)`;ctx.shadowColor="#ffcc00";ctx.shadowBlur=30;for(let i=0;i<6;i++){const a=i*Math.PI/3+Date.now()/200;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*t*16,p.y+Math.sin(a)*t*16,t*5,0,Math.PI*2);ctx.fill();}ctx.restore(); },
  lava:       (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`hsl(${p.life/p.maxLife*30},100%,${40+p.life/p.maxLife*20}%)`;ctx.shadowColor="#ff4400";ctx.shadowBlur=15;ctx.beginPath();ctx.arc(p.x,p.y,p.life/p.maxLife*12,0,Math.PI*2);ctx.fill();ctx.restore(); },
  blackhole:  (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.8;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.life/p.maxLife*18);g.addColorStop(0,"rgba(0,0,0,1)");g.addColorStop(.7,`hsla(${p.hue},80%,30%,0.8)`);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.life/p.maxLife*18,0,Math.PI*2);ctx.fill();ctx.restore(); },
  titan:      (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.strokeStyle=`rgba(100,100,200,${p.life/p.maxLife})`;ctx.lineWidth=3;ctx.shadowColor="#6464c8";ctx.shadowBlur=20;const t=p.life/p.maxLife;ctx.beginPath();ctx.moveTo(p.x-t*12,p.y);ctx.lineTo(p.x+t*12,p.y);ctx.moveTo(p.x,p.y-t*12);ctx.lineTo(p.x,p.y+t*12);ctx.stroke();ctx.restore(); },
  inferno:    (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;const col=Math.random()>.5?"#ff2200":"#ff6600";ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(p.x+(Math.random()-.5)*14,p.y+(Math.random()-.5)*14,p.life/p.maxLife*13,0,Math.PI*2);ctx.fill();ctx.restore(); },
  zodiac:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;const syms="♈♉♊♋♌♍♎♏♐♑♒♓";ctx.font=`${p.life/p.maxLife*16}px Arial`;ctx.fillStyle=`hsl(${p.hue},70%,65%)`;ctx.fillText(syms[Math.floor(p.hue/30)%12],p.x,p.y);ctx.restore(); },
  phoenix:    (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*22}px Arial`;ctx.fillText("🦅",p.x,p.y);ctx.restore(); },
  crown:      (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*20}px Arial`;ctx.fillText("👑",p.x,p.y);ctx.restore(); },
  reaper:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`rgba(100,0,120,${p.life/p.maxLife})`;ctx.shadowColor="#880088";ctx.shadowBlur=18;ctx.beginPath();ctx.arc(p.x,p.y,p.life/p.maxLife*10,0,Math.PI*2);ctx.fill();ctx.restore(); },
  nuclear:    (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.font=`${p.life/p.maxLife*18}px Arial`;ctx.fillText("☢️",p.x,p.y);ctx.restore(); },
  neon_ooze:  (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`rgba(60,255,154,${p.life/p.maxLife})`;ctx.shadowColor="#3cff9a";ctx.shadowBlur=20;ctx.beginPath();ctx.arc(p.x,p.y,p.life/p.maxLife*10,0,Math.PI*2);ctx.fill();ctx.restore(); },
  void:       (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle="rgba(20,0,40,.8)";ctx.shadowColor="#9900ff";ctx.shadowBlur=25;ctx.beginPath();ctx.arc(p.x,p.y,p.life/p.maxLife*15,0,Math.PI*2);ctx.fill();ctx.fillStyle=`rgba(150,0,255,${p.life/p.maxLife*.5})`;ctx.beginPath();ctx.arc(p.x+Math.sin(p.life)*9,p.y+Math.cos(p.life)*9,3,0,Math.PI*2);ctx.fill();ctx.restore(); },
  omega:      (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`hsl(${280+p.hue/4},100%,60%)`;ctx.shadowColor="#bb00ff";ctx.shadowBlur=22;ctx.font=`bold ${p.life/p.maxLife*18}px serif`;ctx.fillText("Ω",p.x,p.y);ctx.restore(); },
  nebula:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.4;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.life/p.maxLife*20);g.addColorStop(0,`hsla(${p.hue},80%,70%,0.9)`);g.addColorStop(.5,`hsla(${(p.hue+60)%360},70%,50%,0.5)`);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.life/p.maxLife*20,0,Math.PI*2);ctx.fill();ctx.restore(); },
  timewarp:   (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.7;const t=p.life/p.maxLife;for(let i=0;i<3;i++){ctx.strokeStyle=`hsl(${p.hue+i*40},80%,60%)`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,t*(8+i*5),0,Math.PI*(t+i*.3));ctx.stroke();}ctx.restore(); },
  spirit:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.5;const t=p.life/p.maxLife;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,t*18);g.addColorStop(0,`rgba(255,255,255,${t})`);g.addColorStop(.5,`rgba(200,200,255,${t*.5})`);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x+Math.sin(Date.now()/200+p.x)*t*8,p.y-t*4,t*18,0,Math.PI*2);ctx.fill();ctx.restore(); },
  godray:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.4;ctx.fillStyle=`rgba(255,240,180,${p.life/p.maxLife})`;const t=p.life/p.maxLife;ctx.beginPath();ctx.moveTo(p.x-t*4,p.y);ctx.lineTo(p.x+t*4,p.y);ctx.lineTo(p.x+t*2,p.y-t*30);ctx.lineTo(p.x-t*2,p.y-t*30);ctx.closePath();ctx.fill();ctx.restore(); },
  hyperspace: (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.strokeStyle=`hsl(${p.hue},100%,70%)`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(p.hue/57)*20*p.life/p.maxLife,p.y+Math.sin(p.hue/57)*20*p.life/p.maxLife);ctx.stroke();ctx.restore(); },
  singularity:(ctx,p)=>{ ctx.save();const t=p.life/p.maxLife;ctx.globalAlpha=t;for(let i=0;i<5;i++){const a=i*Math.PI*2/5+Date.now()/100;const r=t*(14-i*2);ctx.fillStyle=`hsl(${(p.hue+i*60)%360},100%,60%)`;ctx.shadowColor=`hsl(${p.hue},100%,50%)`;ctx.shadowBlur=15;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,2,0,Math.PI*2);ctx.fill();}ctx.restore(); },
  ultraviolet:(ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=`rgba(120,0,255,${p.life/p.maxLife})`;ctx.shadowColor="#8800ff";ctx.shadowBlur=25;ctx.beginPath();ctx.arc(p.x,p.y,p.life/p.maxLife*11,0,Math.PI*2);ctx.fill();ctx.restore(); },
  entropy:    (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;const cols=["#ff0000","#ff8800","#ffff00","#00ff00","#0000ff","#8800ff"];ctx.fillStyle=cols[Math.floor(Math.random()*cols.length)];ctx.beginPath();ctx.arc(p.x+(Math.random()-.5)*p.life/p.maxLife*20,p.y+(Math.random()-.5)*p.life/p.maxLife*20,Math.random()*p.life/p.maxLife*6,0,Math.PI*2);ctx.fill();ctx.restore(); },
  apocalypse: (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;const t=p.life/p.maxLife;ctx.fillStyle=`hsl(${Math.random()*30},100%,${40+t*20}%)`;ctx.shadowColor="#ff2200";ctx.shadowBlur=22;ctx.beginPath();ctx.arc(p.x+(Math.random()-.5)*16,p.y+(Math.random()-.5)*16,t*14,0,Math.PI*2);ctx.fill();ctx.restore(); },
  quantum:    (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife*.8;const t=p.life/p.maxLife;for(let i=0;i<4;i++){const a=i*Math.PI/2+Date.now()/120;ctx.fillStyle=`hsl(${(p.hue+i*90)%360},100%,65%)`;ctx.shadowColor=`hsl(${p.hue},100%,50%)`;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*t*12,p.y+Math.sin(a)*t*12,t*4,0,Math.PI*2);ctx.fill();}ctx.restore(); },
  prismatic:  (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;const t=p.life/p.maxLife;for(let i=0;i<5;i++){const a=Date.now()/200+i*(Math.PI*2/5);ctx.fillStyle=`hsl(${(p.hue+i*72)%360},100%,65%)`;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*t*10,p.y+Math.sin(a)*t*10,3,0,Math.PI*2);ctx.fill();}ctx.restore(); },
  ooze_king:  (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;const t=p.life/p.maxLife;ctx.fillStyle=`rgba(60,255,100,${t})`;ctx.shadowColor="#3cff64";ctx.shadowBlur=28;ctx.beginPath();ctx.arc(p.x,p.y,t*16,0,Math.PI*2);ctx.fill();for(let i=0;i<6;i++){const a=i*Math.PI/3+Date.now()/180;ctx.fillStyle=`hsl(${120+p.hue/4},100%,60%)`;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*t*24,p.y+Math.sin(a)*t*24,t*4,0,Math.PI*2);ctx.fill();}ctx.restore(); },
  cosmos:     (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;const t=p.life/p.maxLife;for(let i=0;i<8;i++){const a=i*Math.PI/4+Date.now()/100;const r=t*(10+i*3);ctx.fillStyle=`hsl(${(p.hue+i*45)%360},100%,70%)`;ctx.shadowColor=`hsl(${p.hue},100%,50%)`;ctx.shadowBlur=15;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,t*5,0,Math.PI*2);ctx.fill();}ctx.restore(); },
  ooze_god:   (ctx,p)=>{ ctx.save();ctx.globalAlpha=p.life/p.maxLife;const t=p.life/p.maxLife;ctx.fillStyle=`rgba(255,215,0,${t})`;ctx.shadowColor="#ffd700";ctx.shadowBlur=30;ctx.beginPath();ctx.arc(p.x,p.y,t*18,0,Math.PI*2);ctx.fill();for(let i=0;i<8;i++){const a=Date.now()/150+i*Math.PI/4;ctx.fillStyle=`hsl(${(p.hue+i*45)%360},100%,70%)`;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*t*22,p.y+Math.sin(a)*t*22,4,0,Math.PI*2);ctx.fill();}ctx.restore(); },
};

let _trailCanvas = null, _trailCtx = null, _trailParticles = [], _trailHue = 0, _trailRAF = null;
function applyEquippedTrail() { const trail = ls("equippedTrail") || "none"; if (trail === "none" || !TRAIL_RENDERERS[trail]) { _stopTrail(); return; } _startTrail(trail); }
function _startTrail(id) {
  _stopTrail(); _trailCanvas = document.createElement("canvas"); _trailCanvas.id = "trailCanvas";
  _trailCanvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:99999;";
  document.body.appendChild(_trailCanvas); _trailCtx = _trailCanvas.getContext("2d");
  _trailCanvas.width = window.innerWidth; _trailCanvas.height = window.innerHeight;
  window.addEventListener("resize", _resizeTrail);
  document.addEventListener("mousemove", _addTrailParticle);
  _animateTrail(id);
}
function _stopTrail() {
  if (_trailRAF) { cancelAnimationFrame(_trailRAF); _trailRAF = null; }
  document.removeEventListener("mousemove", _addTrailParticle);
  window.removeEventListener("resize", _resizeTrail);
  if (_trailCanvas) { _trailCanvas.remove(); _trailCanvas = null; _trailCtx = null; }
  _trailParticles = [];
}
function _resizeTrail() { if (_trailCanvas) { _trailCanvas.width = window.innerWidth; _trailCanvas.height = window.innerHeight; } }
function _addTrailParticle(e) { _trailHue = (_trailHue + 5) % 360; _trailParticles.push({ x: e.clientX, y: e.clientY, life: 45, maxLife: 45, hue: _trailHue }); }
function _animateTrail(id) {
  const r = TRAIL_RENDERERS[id]; if (!r || !_trailCtx) return;
  _trailCtx.clearRect(0, 0, _trailCanvas.width, _trailCanvas.height);
  _trailParticles = _trailParticles.filter(p => p.life > 0);
  _trailParticles.forEach(p => { r(_trailCtx, p); p.life--; });
  _trailRAF = requestAnimationFrame(() => _animateTrail(id));
}

/* ══ EVENTS ══ */
const EVENTS = {
  double_xp:    { name:"⚡ Double XP",       onStart:()=>{ lsSet("event_double_xp_end",Date.now()+3600000); showEventToast("⚡ DOUBLE XP!","#ffe600"); } },
  xp_storm:     { name:"🌩️ XP Storm",         onStart:()=>{ startXPStorm(); showEventToast("🌩️ XP STORM!","#00cfff"); } },
  gift_drop:    { name:"🎁 Gift Drop",        onStart:()=>{ startGiftRain(); showEventToast("🎁 GIFT DROP!","#ff6bda"); } },
  level_bonus:  { name:"🚀 Level Blast",      onStart:(amt)=>{ addLevels(amt||50); showEventToast(`🚀 +${amt||50} LEVELS!`,"#3cff9a"); } },
  coin_shower:  { name:"🪙 Coin Shower",       onStart:(amt)=>{ addCoins(amt||500); showEventToast(`🪙 +${amt||500} COINS!`,"#ffe600"); } },
  neon_party:   { name:"🌈 Neon Party",        onStart:()=>{ document.body.classList.add("ultraNeon"); setTimeout(()=>document.body.classList.remove("ultraNeon"),600000); showEventToast("🌈 NEON PARTY!","#ff00ff"); } },
  blizzard:     { name:"❄️ Blizzard",         onStart:()=>{ startBlizzard(); showEventToast("❄️ BLIZZARD!","#a0e8ff"); } },
  meteor_shower:{ name:"☄️ Meteor Shower",     onStart:()=>{ startMeteors(); showEventToast("☄️ METEOR SHOWER!","#ffaa00"); } },
  code_rain:    { name:"💻 Code Rain",         onStart:()=>{ startCodeRain(); showEventToast("💻 CODE RAIN!","#00ff41"); } },
  ooze_drop:    { name:"🎀 Ooze Drop Event",   onStart:(links)=>{ _triggerOozeDropEvent(links); } },
  fireworks:    { name:"🎆 Fireworks",         onStart:()=>{ startFireworks(); showEventToast("🎆 FIREWORKS!","#ff9900"); } },
  earthquake:   { name:"🌍 Earthquake",        onStart:()=>{ startEarthquake(); showEventToast("🌍 EARTHQUAKE!","#cc8800"); } },
  disco:        { name:"🪩 Disco Mode",         onStart:()=>{ startDisco(); showEventToast("🪩 DISCO MODE!","#ff00aa"); } },
};
let _pendingEventIds = new Set();
async function triggerEvent(id, param) {
  const ev = EVENTS[id]; if (!ev) return;
  ev.onStart(param); // fire locally immediately for sender
  if (!_fb) return;
  const ref = await _fb.push(_fb.ref(_fb.db, "global_events"), { type:"event", id, param, ts:Date.now(), from:getUsername() });
  if (ref && ref.key) _seenEventKeys.add(ref.key); // mark as seen so we don't double-fire when Firebase echoes it back
}
function triggerEventClient(data) { const ev = EVENTS[data.id]; if (ev) ev.onStart(data.param); }
async function _triggerOozeDropEvent(links = []) {
  await _fbReady; if (_fb) await _fb.push(_fb.ref(_fb.db, "ooze_drop_events"), { links, message:"An Ooze Drop is here!", ts:Date.now(), from:getUsername() });
  showOozeDropEvent({ links, message:"An Ooze Drop is here!", key:"local_"+Date.now() });
}
function showEventToast(msg, color) {
  const t = document.createElement("div");
  t.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#0d0d1f;border:2px solid ${color||"#3cff9a"};border-radius:20px;padding:14px 28px;z-index:99999;font-weight:900;font-size:1.1rem;box-shadow:0 0 30px ${color||"#3cff9a"}88;color:#fff;pointer-events:none;transition:opacity .5s;`;
  t.innerText = msg; document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 600); }, 4000);
}
let xpStormInt = null;
function startXPStorm() {
  if (xpStormInt) clearInterval(xpStormInt); const end = Date.now() + 300000;
  xpStormInt = setInterval(() => {
    if (Date.now() > end) { clearInterval(xpStormInt); return; }
    const b = Math.floor(Math.random() * 30) + 5; _addXPRaw(b);
    const el = document.createElement("div");
    el.style.cssText = `position:fixed;left:${Math.random()*(window.innerWidth-100)}px;top:${Math.random()*(window.innerHeight-60)}px;color:#ffe600;font-weight:900;z-index:99999;pointer-events:none;animation:floatUp 1.5s forwards;`;
    el.textContent = `+${b} XP ⚡`; document.body.appendChild(el); setTimeout(() => el.remove(), 1500);
  }, 2000);
}
function startGiftRain() { const end = Date.now() + 120000; const i = setInterval(() => { if (Date.now() > end) { clearInterval(i); return; } spawnFallingGift(); }, 1500); }
function spawnFallingGift() {
  const g = document.createElement("div"); g.style.cssText = `left:${Math.random()*(window.innerWidth-60)}px;top:-60px;position:fixed;font-size:3rem;cursor:pointer;z-index:99999;transition:top 4s linear;user-select:none;`;
  g.textContent = ["🎁","🎀","🎊","🎉"][Math.floor(Math.random()*4)]; document.body.appendChild(g);
  requestAnimationFrame(() => { g.style.top = window.innerHeight + "px"; });
  g.onclick = () => { const x = Math.floor(Math.random()*200)+50; addLevels(x/100); addCoins(20); showEventToast(`🎁 +${x} XP!`,"#ff6bda"); g.remove(); };
  setTimeout(() => g.remove(), 5000);
}
function startBlizzard() { const end = Date.now() + 300000; const i = setInterval(() => { if (Date.now() > end) { clearInterval(i); return; } for(let j=0;j<5;j++){const s=document.createElement("div");s.className="snowflake";s.style.left=Math.random()*window.innerWidth+"px";s.style.top="-10px";document.body.appendChild(s);setTimeout(()=>s.remove(),4000);}},100);}
function startMeteors() { const end = Date.now() + 300000; const i = setInterval(() => { if (Date.now() > end) { clearInterval(i); return; } const m=document.createElement("div");m.style.cssText=`left:${Math.random()*window.innerWidth}px;top:0;position:fixed;width:3px;height:80px;background:linear-gradient(transparent,#ffaa00);z-index:9999;pointer-events:none;animation:meteorFall 1.5s linear forwards;`;document.body.appendChild(m);setTimeout(()=>m.remove(),2000);},600);}
function startCodeRain() {
  let c = document.getElementById("codeRainCanvas"); if (!c) { c = document.createElement("canvas"); c.id = "codeRainCanvas"; c.style.cssText = "position:fixed;inset:0;z-index:9998;pointer-events:none;opacity:.35"; document.body.appendChild(c); }
  c.width = window.innerWidth; c.height = window.innerHeight; const ctx = c.getContext("2d");
  const cols = Math.floor(c.width/16); const drops = Array(cols).fill(1); const chars = "01アイウエオOOZE34";
  let raf; function draw(){ctx.fillStyle="rgba(0,0,0,.05)";ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle="#00ff41";ctx.font="15px monospace";drops.forEach((y,i)=>{const ch=chars[Math.floor(Math.random()*chars.length)];ctx.fillText(ch,i*16,y*16);if(y*16>c.height&&Math.random()>.975)drops[i]=0;drops[i]++;});raf=requestAnimationFrame(draw);}
  draw(); setTimeout(()=>{cancelAnimationFrame(raf);c.remove();},180000);
}
function startFireworks() {
  const end = Date.now() + 30000; const i = setInterval(() => { if (Date.now() > end) { clearInterval(i); return; } const fx = Math.random()*window.innerWidth, fy = Math.random()*window.innerHeight*.6; for(let j=0;j<16;j++){const p=document.createElement("div");const a=j/16*Math.PI*2,r=Math.random()*80+40;p.style.cssText=`position:fixed;left:${fx}px;top:${fy}px;width:4px;height:4px;border-radius:50%;background:hsl(${Math.random()*360},100%,70%);z-index:99999;pointer-events:none;transition:all 1.2s ease-out;`;document.body.appendChild(p);requestAnimationFrame(()=>{p.style.transform=`translate(${Math.cos(a)*r}px,${Math.sin(a)*r}px)`;p.style.opacity="0";});setTimeout(()=>p.remove(),1300);}},600);
}
function startEarthquake() { const el = document.body; let i = 0; const shake = setInterval(()=>{el.style.transform=`translate(${(Math.random()-.5)*10}px,${(Math.random()-.5)*10}px)`;if(++i>20){clearInterval(shake);el.style.transform="";}},50);}
function startDisco() { const d = document.createElement("div"); d.id = "discoOverlay"; d.style.cssText = "position:fixed;inset:0;z-index:9998;pointer-events:none;mix-blend-mode:overlay;"; document.body.appendChild(d); let i = 0; const int = setInterval(()=>{d.style.background=`hsl(${i*15},100%,50%)`;d.style.opacity="0.3";i++;},200); setTimeout(()=>{clearInterval(int);d.remove();},60000);}

/* ══ GAME OF THE DAY ══ */
const GAMES_LIST = [
  {name:"1v1.lol",          url:"https://ixl-learning.thedaedals.com/gamefile/1v1.html",         img:"https://ixl-learning.thedaedals.com/png/games/1v1.webp"},
  {name:"2048",             url:"https://ixl-learning.thedaedals.com/games/2048/index.html",     img:"https://ixl-learning.thedaedals.com/png/games/2048.webp"},
  {name:"ADOFAI",           url:"https://ixl-learning.thedaedals.com/games/a-dance-of-fire-and-ice/index.html",img:"https://ixl-learning.thedaedals.com/png/games/adofai.webp"},
  {name:"Slope",            url:"https://ixl-learning.thedaedals.com/games/slope/index.html",    img:"https://ixl-learning.thedaedals.com/png/games/slope.webp"},
  {name:"Retro Bowl",       url:"https://ixl-learning.thedaedals.com/games/retrobowl/index.html",img:"https://ixl-learning.thedaedals.com/png/games/retrobowl.webp"},
  {name:"Cookie Clicker",   url:"https://ixl-learning.thedaedals.com/games/cookieclicker/index.html",img:"https://ixl-learning.thedaedals.com/png/games/cookieclicker.webp"},
  {name:"Shell Shockers",   url:"https://shellshock.io",img:"https://www.google.com/s2/favicons?domain=shellshock.io&sz=128"},
  {name:"Krunker.io",       url:"https://krunker.io",   img:"https://www.google.com/s2/favicons?domain=krunker.io&sz=128"},
  {name:"Bloxd.io",         url:"https://bloxd.io",     img:"https://www.google.com/s2/favicons?domain=bloxd.io&sz=128"},
  {name:"Geometry Dash",    url:"https://ixl-learning.thedaedals.com/games/geometrydash/index.html",img:"https://ixl-learning.thedaedals.com/png/games/gd.webp"},
  {name:"Among Us",         url:"https://ixl-learning.thedaedals.com/games/amogus/index.html",   img:"https://ixl-learning.thedaedals.com/png/games/amogus.webp"},
  {name:"Subway Surfers",   url:"https://ixl-learning.thedaedals.com/games/subwaysurf/index.html",img:"https://ixl-learning.thedaedals.com/png/games/subsurf.webp"},
  {name:"Stickman Hook",    url:"https://ixl-learning.thedaedals.com/games/stickmanhook/index.html",img:"https://ixl-learning.thedaedals.com/png/games/stickmanhook.webp"},
  {name:"Smash Karts",      url:"https://smashkarts.io",img:"https://www.google.com/s2/favicons?domain=smashkarts.io&sz=128"},
  {name:"Drift Boss",       url:"https://ixl-learning.thedaedals.com/games/driftboss/index.html",img:"https://ixl-learning.thedaedals.com/png/games/drift.webp"},
];
function _getGameOfDay() { const custom = ls("gotd_custom"); if (custom) try { return JSON.parse(custom); } catch(e) {} return GAMES_LIST[Math.floor(Date.now()/86400000) % GAMES_LIST.length]; }
function loadGameOfDay() {
  const box = document.getElementById("gotdBox"); if (!box) return;
  const game = _getGameOfDay();
  box.innerHTML = `<div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,rgba(60,255,154,.1),rgba(107,72,255,.08));border:1px solid rgba(60,255,154,.3);border-radius:16px;padding:14px 18px;cursor:pointer;transition:all .2s;max-width:500px;" onclick="openInBlank('${escHtml(game.url)}')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform=''">
    <img src="${escHtml(game.img)}" onerror="this.src='https://www.google.com/s2/favicons?domain=oozecrib.pages.dev&sz=128'" style="width:60px;height:60px;border-radius:12px;object-fit:cover;flex-shrink:0;">
    <div><div style="font-size:.75rem;color:#3cff9a;font-weight:700;letter-spacing:1px;margin-bottom:2px;">🎮 GAME OF THE DAY</div><div style="font-size:1.15rem;font-weight:900;">${escHtml(game.name)}</div><div style="font-size:.8rem;opacity:.6;margin-top:2px;">Click to play · Refreshes daily</div></div>
    <div style="margin-left:auto;font-size:1.8rem;">▶️</div></div>`;
}
window.openInBlank = function(url) {
  window.open(url, "_blank");
  if (typeof unlockAchievement === "function") unlockAchievement("first_game");
  const gCount = parseInt(ls("gamesOpened") || "0") + 1; lsSet("gamesOpened", gCount);
  _addXPRaw(10); checkAchievements();
  // Track play count (find name from nearby .btn)
  const name = document.querySelector(`.btn[onclick*="${CSS.escape ? CSS.escape(url.split('/').pop()) : url.split('/').pop()}"] span`)?.textContent || url.split('/').pop();
  trackGamePlay(url, name);
};


/* ══ GAME RATINGS, STATS & FAVORITES ══ */
// Firebase paths: game_ratings/{gameKey}/{userId} = {up:1} or {down:1}
//                 game_plays/{gameKey} = {count: N}
//                 admin_perms/game_ratings = false to disable

async function _getGameKey(url) {
  // Create a short stable key from the URL
  return btoa(url).replace(/[^a-zA-Z0-9]/g,'').slice(0,24);
}

async function trackGamePlay(url, name) {
  if (!url) return;
  const key = await _getGameKey(url);
  await _fbReady; if (!_fb) return;
  try {
    const ref = _fb.ref(_fb.db, "game_plays/" + key);
    const snap = await _fb.get(ref);
    const current = snap.exists() ? (snap.val().count || 0) : 0;
    await _fb.set(ref, { count: current + 1, name, url, lastPlayed: Date.now() });
  } catch(e) {}
}

async function getGameStats(url) {
  const key = await _getGameKey(url);
  await _fbReady; if (!_fb) return { plays:0, up:0, down:0, myVote:null };
  try {
    const [playsSnap, ratingsSnap] = await Promise.all([
      _fb.get(_fb.ref(_fb.db, "game_plays/" + key)),
      _fb.get(_fb.ref(_fb.db, "game_ratings/" + key))
    ]);
    const plays = playsSnap.exists() ? (playsSnap.val().count || 0) : 0;
    let up = 0, down = 0, myVote = null;
    if (ratingsSnap.exists()) {
      ratingsSnap.forEach(c => {
        const v = c.val();
        if (v.up) up++;
        if (v.down) down++;
        if (c.key === getUserId()) myVote = v.up ? "up" : "down";
      });
    }
    return { plays, up, down, myVote };
  } catch(e) { return { plays:0, up:0, down:0, myVote:null }; }
}

async function rateGame(url, vote) { // vote = 'up' or 'down'
  // Check if ratings are disabled
  if (_adminPerms.game_ratings === false) return;
  const key = await _getGameKey(url);
  await _fbReady; if (!_fb) return;
  try {
    const uid = getUserId();
    const ref = _fb.ref(_fb.db, "game_ratings/" + key + "/" + uid);
    const snap = await _fb.get(ref);
    if (snap.exists() && ((snap.val().up && vote==="up") || (snap.val().down && vote==="down"))) {
      // Toggle off
      await _fb.remove(ref);
    } else {
      await _fb.set(ref, vote === "up" ? { up: true, ts: Date.now() } : { down: true, ts: Date.now() });
    }
  } catch(e) {}
}

// Favorites: stored in localStorage only (per-user/device)
function getFavoriteGames() { return JSON.parse(ls("favoriteGames") || "[]"); }
function toggleFavoriteGame(url, name, img) {
  let favs = getFavoriteGames();
  const idx = favs.findIndex(f => f.url === url);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.unshift({ url, name, img });
    if (favs.length > 50) favs = favs.slice(0, 50);
  }
  lsSet("favoriteGames", JSON.stringify(favs));
  return idx < 0; // returns true if now favorited
}
function isGameFavorited(url) { return getFavoriteGames().some(f => f.url === url); }

// Inject game overlays onto all .btn cards on the games page
async function _initGameCards() {
  const isAdmin = _isAdmin();
  const ratingsEnabled = _adminPerms.game_ratings !== false;
  const btns = document.querySelectorAll(".btn[onclick]");
  if (!btns.length) return;

  for (const btn of btns) {
    const onclick = btn.getAttribute("onclick") || "";
    const urlMatch = onclick.match(/openInBlank\(['"](.+?)['"]/);
    if (!urlMatch) continue;
    const url = urlMatch[1];
    const nameEl = btn.querySelector("span");
    const imgEl = btn.querySelector("img");
    const name = nameEl ? nameEl.textContent.trim() : "";
    const img = imgEl ? imgEl.src : "";

    // Make btn relative for overlay
    btn.style.position = "relative";
    btn.style.overflow = "visible";

    // Remove old overlay if any
    btn.querySelector(".game-overlay")?.remove();

    const isFav = isGameFavorited(url);
    const overlay = document.createElement("div");
    overlay.className = "game-overlay";
    overlay.style.cssText = "position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:3px 5px;background:rgba(0,0,0,.75);border-radius:0 0 10px 10px;z-index:10;gap:3px;";

    overlay.innerHTML = `
      <button class="gfav-btn" title="Favorite" style="background:none;border:none;cursor:pointer;font-size:1rem;padding:2px;line-height:1;flex-shrink:0;" onclick="event.stopPropagation();event.preventDefault();">${isFav?"⭐":"☆"}</button>
      ${ratingsEnabled ? `
      <div style="display:flex;gap:3px;flex:1;justify-content:center;">
        <button class="gup-btn" title="👍" style="background:rgba(60,255,154,.12);border:1px solid rgba(60,255,154,.25);border-radius:8px;cursor:pointer;font-size:.75rem;padding:2px 6px;color:#3cff9a;display:flex;align-items:center;gap:3px;" onclick="event.stopPropagation();event.preventDefault();">👍 <span class="gup-count">-</span></button>
        <button class="gdn-btn" title="👎" style="background:rgba(255,100,100,.1);border:1px solid rgba(255,100,100,.2);border-radius:8px;cursor:pointer;font-size:.75rem;padding:2px 6px;color:#ff6b6b;display:flex;align-items:center;gap:3px;" onclick="event.stopPropagation();event.preventDefault();">👎 <span class="gdn-count">-</span></button>
      </div>` : "<div style='flex:1'></div>"}
      ${isAdmin ? `<span class="gplays-badge" title="Total plays" style="font-size:.65rem;color:rgba(255,255,255,.4);white-space:nowrap;flex-shrink:0;">...</span>` : ""}
    `;
    btn.appendChild(overlay);

    // Favorite button
    const favBtn = overlay.querySelector(".gfav-btn");
    if (favBtn) {
      favBtn.onclick = (e) => {
        e.stopPropagation(); e.preventDefault();
        const nowFav = toggleFavoriteGame(url, name, img);
        favBtn.textContent = nowFav ? "⭐" : "☆";
        _renderFavoritesSection();
        showEventToast(nowFav ? "⭐ Added to favorites!" : "Removed from favorites", nowFav ? "#ffe600" : "#888");
      };
    }

    // Load stats async
    getGameStats(url).then(stats => {
      const upBtn = overlay.querySelector(".gup-btn");
      const dnBtn = overlay.querySelector(".gdn-btn");
      const playsEl = overlay.querySelector(".gplays-badge");
      if (upBtn) {
        const upCount = upBtn.querySelector(".gup-count");
        if (upCount) upCount.textContent = stats.up;
        if (stats.myVote === "up") upBtn.style.background = "rgba(60,255,154,.35)";
        upBtn.onclick = async (e) => {
          e.stopPropagation(); e.preventDefault();
          await rateGame(url, "up");
          const ns = await getGameStats(url);
          if (upCount) upCount.textContent = ns.up;
          const dnCount = dnBtn?.querySelector(".gdn-count");
          if (dnCount) dnCount.textContent = ns.down;
          upBtn.style.background = ns.myVote === "up" ? "rgba(60,255,154,.35)" : "rgba(60,255,154,.12)";
          if (dnBtn) dnBtn.style.background = ns.myVote === "down" ? "rgba(255,100,100,.3)" : "rgba(255,100,100,.1)";
        };
      }
      if (dnBtn) {
        const dnCount = dnBtn.querySelector(".gdn-count");
        if (dnCount) dnCount.textContent = stats.down;
        if (stats.myVote === "down") dnBtn.style.background = "rgba(255,100,100,.3)";
        dnBtn.onclick = async (e) => {
          e.stopPropagation(); e.preventDefault();
          await rateGame(url, "down");
          const ns = await getGameStats(url);
          const upCount = upBtn?.querySelector(".gup-count");
          const dnCount2 = dnBtn.querySelector(".gdn-count");
          if (upCount) upCount.textContent = ns.up;
          if (dnCount2) dnCount2.textContent = ns.down;
          if (upBtn) upBtn.style.background = ns.myVote === "up" ? "rgba(60,255,154,.35)" : "rgba(60,255,154,.12)";
          dnBtn.style.background = ns.myVote === "down" ? "rgba(255,100,100,.3)" : "rgba(255,100,100,.1)";
        };
      }
      if (playsEl && isAdmin) playsEl.textContent = stats.plays > 0 ? `▶ ${stats.plays}` : "▶ 0";
    });
  }

  // Render favorites section
  _renderFavoritesSection();
}

function _renderFavoritesSection() {
  const grid = document.querySelector(".grid"); if (!grid) return;
  let favSection = document.getElementById("favoritesSection");
  const favs = getFavoriteGames();

  if (!favs.length) { favSection?.remove(); return; }

  if (!favSection) {
    favSection = document.createElement("div"); favSection.id = "favoritesSection";
    favSection.style.cssText = "width:100%;margin-bottom:18px;";
    grid.parentElement.insertBefore(favSection, grid);
  }

  favSection.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:0 2px;">
      <span style="font-size:1.1rem;">⭐</span>
      <span style="font-weight:800;font-size:1rem;color:#ffe600;">Favorites</span>
      <span style="font-size:.75rem;opacity:.4;">(${favs.length})</span>
    </div>
    <div id="favGrid" style="display:flex;flex-wrap:wrap;gap:10px;"></div>
    <div style="height:1px;background:rgba(255,255,255,.08);margin-top:16px;"></div>
  `;

  const favGrid = favSection.querySelector("#favGrid");
  favs.forEach(fav => {
    const a = document.createElement("a");
    a.className = "btn";
    a.style.position = "relative";
    a.onclick = (e) => { e.preventDefault(); window.openInBlank(fav.url); };
    a.innerHTML = `<img class="thumb" src="${escHtml(fav.img)}" onerror="this.src='https://www.google.com/s2/favicons?domain=${encodeURIComponent(fav.url)}&sz=128'"><span>${escHtml(fav.name)}</span>
      <button title="Remove from favorites" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.7);border:none;color:#ffe600;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:.85rem;display:flex;align-items:center;justify-content:center;z-index:20;" onclick="event.stopPropagation();event.preventDefault();toggleFavoriteGame('${escHtml(fav.url)}','${escHtml(fav.name)}','${escHtml(fav.img)}');_renderFavoritesSection();_initGameCards();">⭐</button>`;
    favGrid.appendChild(a);
  });
}


/* ══ CHAT BOT COMMANDS ══ */
const CHAT_COMMANDS = {
  "/roll":  ()=>`🎲 rolled a ${Math.floor(Math.random()*6)+1}!`,
  "/flip":  ()=>`🪙 ${Math.random()>.5?"Heads":"Tails"}!`,
  "/8ball": (q)=>{ const a=["Yes!","No.","Maybe...","Definitely!","Ask again later.","I doubt it.","Absolutely!","No way!","Signs point to yes!","Outlook not so good."]; return `🎱 "${q}" → ${a[Math.floor(Math.random()*a.length)]}`; },
  "/rps":   (choice)=>{ const opts=["rock","paper","scissors"]; const bot=opts[Math.floor(Math.random()*3)]; const c=(choice||"").toLowerCase(); if(!opts.includes(c))return `✊ /rps rock|paper|scissors`; const wins={rock:"scissors",paper:"rock",scissors:"paper"}; const res=wins[c]===bot?"You win! 🏆":c===bot?"Tie! 🤝":"Bot wins! 🤖"; return `✊ ${c} vs ${bot} → ${res}`; },
  "/hi":    ()=>`👋 Hey ${getUsername()}!`,
  "/level": ()=>`📊 ${getUsername()} is Level ${Math.floor(Number(BigInt(ls("xp")||"0"))/100).toLocaleString()}`,
  "/coins": ()=>`🪙 ${getUsername()} has ${parseInt(ls("coins")||"0").toLocaleString()} coins`,
  "/time":  ()=>`🕐 ${new Date().toLocaleTimeString()}`,
  "/date":  ()=>`📅 ${new Date().toLocaleDateString()}`,
  "/joke":  ()=>{ const j=["Why don't scientists trust atoms? They make up everything!","I'm reading about anti-gravity. Impossible to put down!","Why did the math book look sad? Too many problems."]; return `😂 ${j[Math.floor(Math.random()*j.length)]}`; },
  "/shrug": ()=>`¯\\_(ツ)_/¯`,
  "/tableflip":()=>`(╯°□°）╯︵ ┻━┻`,
  "/lenny": ()=>`( ͡° ͜ʖ ͡°)`,
  "/hype":  ()=>`🔥🔥🔥 LET'S GOOO 🔥🔥🔥`,
  "/gg":    ()=>`✅ GG WP!`,
  "/help":  ()=>`📖 Commands: /roll /flip /8ball /rps /hi /level /coins /time /date /joke /shrug /tableflip /lenny /hype /gg`,
};
function _processCommand(text) { const parts = text.trim().split(" "); const cmd = parts[0].toLowerCase(); const arg = parts.slice(1).join(" "); if (CHAT_COMMANDS[cmd]) return CHAT_COMMANDS[cmd](arg); return null; }

/* ══ GIF PICKER ══ */
async function searchGifs(query) {
  try {
    const res = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=AIzaSyAyimkuYQYF_FXVALexPmv19-LAs2RMHPU&limit=12&media_filter=gif`);
    const data = await res.json();
    return (data.results || []).map(r => r.media_formats?.gif?.url || r.media_formats?.tinygif?.url).filter(Boolean);
  } catch(e) { return []; }
}
function _showGifPicker(onSelect) {
  document.getElementById("gifPicker")?.remove();
  const d = document.createElement("div"); d.id = "gifPicker";
  d.style.cssText = "position:fixed;bottom:120px;right:20px;width:340px;background:rgba(5,5,20,.98);border:1px solid rgba(60,255,154,.3);border-radius:16px;padding:12px;z-index:999999;box-shadow:0 0 30px rgba(0,0,0,.5);";
  d.innerHTML = `<div style="display:flex;gap:8px;margin-bottom:10px;"><input id="gifSearchInput" placeholder="Search GIFs..." style="flex:1;padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-size:.9rem;outline:none;"><button id="gifSearchBtn" style="padding:8px 14px;border-radius:10px;background:#3cff9a;border:none;color:#000;font-weight:700;cursor:pointer;">Go</button><button onclick="document.getElementById('gifPicker').remove()" style="padding:8px;border-radius:10px;background:transparent;border:1px solid rgba(255,100,100,.3);color:#ff6b6b;cursor:pointer;">✕</button></div><div id="gifGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-height:220px;overflow-y:auto;"></div><div style="font-size:.7rem;opacity:.3;margin-top:8px;text-align:right;">Powered by Tenor</div>`;
  document.body.appendChild(d);
  const input = d.querySelector("#gifSearchInput"), btn = d.querySelector("#gifSearchBtn"), grid = d.querySelector("#gifGrid");
  async function doSearch() {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:16px;opacity:.5;">Searching...</div>`;
    const gifs = await searchGifs(input.value || "funny");
    if (!gifs.length) { grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:16px;opacity:.5;">No results</div>`; return; }
    grid.innerHTML = "";
    gifs.forEach(url => { const img = document.createElement("img"); img.src = url; img.style.cssText = "width:100%;height:80px;object-fit:cover;border-radius:8px;cursor:pointer;"; img.onclick = () => { onSelect(url); d.remove(); }; grid.appendChild(img); });
  }
  btn.onclick = doSearch; input.addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); }); doSearch();
}

/* ══ CHAT FULL INIT ══ */
const EMOJI_REACTIONS = ["👍","❤️","😂","🔥","💯","😮","😢","👑"];
function _initFullChat(chatRef) {
  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const chatSend = document.getElementById("chatSend");
  const chatStatus = document.getElementById("chatStatus");
  if (!chatMessages || !chatInput) return;

  // Inject toolbar
  if (!document.getElementById("chatToolbar")) {
    const toolbar = document.createElement("div"); toolbar.id = "chatToolbar";
    toolbar.style.cssText = "display:flex;gap:4px;padding:6px 12px 0;align-items:center;flex-wrap:wrap;";
    toolbar.innerHTML = `<button title="GIF" onclick="window._openGifPicker()" style="background:rgba(60,255,154,.1);border:1px solid rgba(60,255,154,.2);color:#3cff9a;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:.8rem;font-weight:700;">GIF</button>
      <button title="Image" onclick="window._openImageUpload()" style="background:rgba(107,72,255,.1);border:1px solid rgba(107,72,255,.2);color:#8b68ff;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:.8rem;">🖼️</button>
      <button title="DM" onclick="window._openDMPanel()" style="background:rgba(255,200,0,.1);border:1px solid rgba(255,200,0,.2);color:#ffc800;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:.8rem;font-weight:700;">✉️ DM</button>
      <span id="replyIndicator" style="display:none;flex:1;min-width:0;padding:4px 8px;background:rgba(60,255,154,.08);border-radius:8px;font-size:.78rem;color:#3cff9a;align-items:center;gap:6px;">
        <span id="replyText" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">Replying...</span>
        <button onclick="window._clearReply()" style="background:none;border:none;color:#ff6b6b;cursor:pointer;font-size:.9rem;padding:0;flex-shrink:0;">✕</button>
      </span>
      <span style="font-size:.7rem;opacity:.25;margin-left:auto;">/help for commands</span>`;
    chatInput.parentElement?.parentElement?.insertBefore(toolbar, chatInput.parentElement);
  }

  const seenKeys = new Set();
  const sessionId = sessionStorage.getItem("chatSessionId") || (()=>{ const id="sess-"+Math.random().toString(36).slice(2,11); sessionStorage.setItem("chatSessionId",id); return id; })();
  window._activeReply = null;
  window._clearReply = function() { window._activeReply = null; const ri = document.getElementById("replyIndicator"); if (ri) ri.style.display = "none"; };
  window._openGifPicker = function() { _showGifPicker(url => { _fb.push(chatRef, { user:getUsername(), msg:"", gif:url, color:getColor(), ts:Date.now(), sessionId, type:"gif" }); if (typeof trackChatMsg === "function") trackChatMsg(); }); };
  window._openImageUpload = function() { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.onchange = (e) => { const file = e.target.files[0]; if (!file || file.size > 5000000) { alert("Max 5MB"); return; } const reader = new FileReader(); reader.onload = (r) => { _fb.push(chatRef, { user:getUsername(), msg:"", img:r.target.result, color:getColor(), ts:Date.now(), sessionId, type:"image" }); if (typeof trackChatMsg === "function") trackChatMsg(); }; reader.readAsDataURL(file); }; inp.click(); };

  _fb.onValue(_fb.query(chatRef, _fb.orderByChild("ts"), _fb.limitToLast(80)), snap => {
    const msgs = []; snap.forEach(c => { const v = c.val(); v._key = c.key; msgs.push(v); }); msgs.sort((a,b)=>(a.ts||0)-(b.ts||0));
    msgs.forEach(msg => { if (seenKeys.has(msg._key)) return; seenKeys.add(msg._key); _renderChatMessage(msg, chatMessages, sessionId, chatRef); });
    const atBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 100;
    if (atBottom) chatMessages.scrollTop = chatMessages.scrollHeight;
    if (chatStatus) chatStatus.textContent = "🟢 live";
  }, () => { if (chatStatus) chatStatus.textContent = "🔴 error"; });

  function sendChat() {
    const text = chatInput.value.trim(); if (!text) return;
    const cmdResult = _processCommand(text);
    if (cmdResult) { _fb.push(chatRef, { user:"🤖 OozeBot", msg:cmdResult, color:"#ffcc00", ts:Date.now(), sessionId:"bot", type:"bot" }); chatInput.value = ""; return; }
    const msgData = { user:getUsername(), msg:text, color:getColor(), ts:Date.now(), sessionId, replyTo:window._activeReply ? { user:window._activeReply.user, msg:(window._activeReply.msg||"").slice(0,60) } : null };
    _fb.push(chatRef, msgData); chatInput.value = ""; window._clearReply();
    if (typeof trackChatMsg === "function") trackChatMsg();
  }
  if (chatSend) chatSend.onclick = sendChat;
  chatInput.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } });
}


/* ══ DM SYSTEM ══ */
function _openDMPanel() {
  document.getElementById("dmPanel")?.remove();
  const panel = document.createElement("div"); panel.id = "dmPanel";
  panel.style.cssText = "position:fixed;bottom:20px;right:400px;width:330px;height:460px;z-index:9991;background:rgba(5,5,20,.98);border:1px solid rgba(255,200,0,.3);border-radius:20px;box-shadow:0 0 30px rgba(255,200,0,.15);display:flex;flex-direction:column;overflow:hidden;";
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0;background:rgba(5,5,20,.98);">
      <span style="font-weight:800;color:#ffc800;">✉️ Direct Messages</span>
      <button onclick="document.getElementById('dmPanel').remove()" style="background:transparent;border:none;color:#ff6b6b;font-size:1.2rem;cursor:pointer;">✕</button>
    </div>
    <div id="dmConvList" style="flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:6px;"></div>
    <div id="dmChatArea" style="display:none;flex-direction:column;flex:1;min-height:0;"></div>
    <div style="padding:8px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0;">
      <div style="display:flex;gap:6px;">
        <input id="dmTargetInput" placeholder="Send DM to username..." style="flex:1;padding:7px 11px;background:rgba(255,255,255,.07);border:1px solid rgba(255,200,0,.2);border-radius:12px;color:#fff;font-size:.85rem;outline:none;"/>
        <button onclick="window._startDM(document.getElementById('dmTargetInput').value.trim())" style="padding:7px 12px;background:#ffc800;color:#000;border:none;border-radius:12px;font-weight:700;cursor:pointer;">Go</button>
      </div>
    </div>`;
  document.body.appendChild(panel);
  _loadDMConversations();
}

async function _loadDMConversations() {
  const el = document.getElementById("dmConvList"); if (!el) return;
  await _fbReady; if (!_fb) { el.innerHTML = "<div style='opacity:.4;font-size:.8rem;padding:8px;'>Firebase not available</div>"; return; }
  const myId = getUserId();
  const snap = await _fb.get(_fb.ref(_fb.db, "dms/" + myId));
  if (!snap.exists()) { el.innerHTML = "<div style='opacity:.4;font-size:.85rem;padding:12px;text-align:center;'>No DMs yet.<br>Enter a username above to start.</div>"; return; }
  el.innerHTML = "";
  const convos = snap.val();
  Object.entries(convos).sort((a,b) => (b[1].lastTs||0) - (a[1].lastTs||0)).forEach(([otherId, data]) => {
    const div = document.createElement("div");
    div.style.cssText = "display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(255,255,255,.04);border-radius:12px;cursor:pointer;border:1px solid rgba(255,255,255,.07);transition:all .2s;";
    div.onmouseover = () => div.style.background = "rgba(255,200,0,.08)";
    div.onmouseout = () => div.style.background = "rgba(255,255,255,.04)";
    const unread = data.unread || 0;
    div.innerHTML = `<div style="width:34px;height:34px;border-radius:50%;background:#6b48ff;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;">${escHtml((data.otherName||"?")[0].toUpperCase())}</div><div style="flex:1;min-width:0;"><div style="font-weight:700;font-size:.88rem;">${escHtml(data.otherName||otherId)}</div><div style="font-size:.75rem;opacity:.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml((data.lastMsg||"").slice(0,30))}</div></div>${unread > 0 ? `<span style="background:#ff4444;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0;">${unread}</span>` : ""}`;
    div.onclick = () => _openDMChat(otherId, data.otherName || otherId);
    el.appendChild(div);
  });
}

async function _startDM(targetName) {
  if (!targetName) return;
  await _fbReady; if (!_fb) return;
  // Find user by name in online or leaderboard
  const snap = await _fb.get(_fb.ref(_fb.db, "leaderboard"));
  let targetId = null;
  if (snap.exists()) snap.forEach(c => { if ((c.val().username||"").toLowerCase() === targetName.toLowerCase()) targetId = c.val().uid; });
  if (!targetId) { alert("User not found. They need to have visited the site first."); return; }
  _openDMChat(targetId, targetName);
}

function _openDMChat(otherId, otherName) {
  const convList = document.getElementById("dmConvList"); if (convList) convList.style.display = "none";
  let chatArea = document.getElementById("dmChatArea"); if (!chatArea) return;
  chatArea.style.display = "flex"; chatArea.style.flexDirection = "column"; chatArea.style.flex = "1"; chatArea.style.minHeight = "0";
  chatArea.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0;background:rgba(5,5,20,.98);">
      <button onclick="document.getElementById('dmConvList').style.display='flex';document.getElementById('dmChatArea').style.display='none';_loadDMConversations();" style="background:transparent;border:none;color:#ffc800;cursor:pointer;font-size:1rem;padding:0;">←</button>
      <div style="width:28px;height:28px;border-radius:50%;background:#6b48ff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.85rem;flex-shrink:0;">${escHtml(otherName[0].toUpperCase())}</div>
      <span style="font-weight:700;font-size:.9rem;">${escHtml(otherName)}</span>
    </div>
    <div id="dmMsgList" style="flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:6px;min-height:0;"></div>
    <div style="padding:8px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0;display:flex;gap:6px;">
      <input id="dmMsgInput" placeholder="Message..." style="flex:1;padding:8px 12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:14px;color:#fff;font-size:.88rem;outline:none;"/>
      <button id="dmSendBtn" style="padding:8px 14px;background:#ffc800;color:#000;border:none;border-radius:14px;font-weight:700;cursor:pointer;">Send</button>
    </div>`;

  const myId = getUserId(); const myName = getUsername();
  // Deterministic conversation ID (sorted so both sides use same path)
  const convId = [myId, otherId].sort().join("_");
  const msgsRef = _fb.ref(_fb.db, "dm_msgs/" + convId);
  const msgList = document.getElementById("dmMsgList");
  const seenDm = new Set();

  // Mark read
  _fb.set(_fb.ref(_fb.db, "dms/" + myId + "/" + otherId + "/unread"), 0);
  _fb.set(_fb.ref(_fb.db, "dms/" + myId + "/" + otherId), { otherName, otherId, unread:0, lastTs: Date.now(), lastMsg:"" });

  _fb.onValue(_fb.query(msgsRef, _fb.orderByChild("ts"), _fb.limitToLast(50)), snap => {
    if (!snap.exists()) return;
    const msgs = []; snap.forEach(c => { const v = c.val(); v._key = c.key; msgs.push(v); });
    msgs.sort((a,b) => (a.ts||0)-(b.ts||0));
    msgs.forEach(msg => {
      if (seenDm.has(msg._key)) return;
      seenDm.add(msg._key);
      const isMe = msg.senderId === myId;
      const div = document.createElement("div");
      div.style.cssText = `max-width:82%;padding:8px 12px;border-radius:14px;align-self:${isMe?"flex-end":"flex-start"};background:${isMe?"#6b48ff":"rgba(255,255,255,.08)"};color:#fff;font-size:.88rem;word-wrap:break-word;`;
      const t = msg.ts ? new Date(msg.ts).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "";
      div.innerHTML = `<span style="font-weight:700;font-size:.78rem;display:block;margin-bottom:2px;color:${isMe?"rgba(255,255,255,.6)":"#ffc800"}">${escHtml(msg.senderName||"?")}${isMe?" (you)":""}</span>${escHtml(msg.text||"")}<span style="font-size:.65rem;opacity:.4;display:block;text-align:right;margin-top:2px;">${t}</span>`;
      msgList.appendChild(div);
    });
    msgList.scrollTop = msgList.scrollHeight;
    // clear unread
    _fb.set(_fb.ref(_fb.db, "dms/" + myId + "/" + otherId + "/unread"), 0);
  });

  function sendDM() {
    const inp = document.getElementById("dmMsgInput"); if (!inp) return;
    const text = inp.value.trim(); if (!text) return;
    const ts = Date.now();
    const msgData = { senderId: myId, senderName: myName, text, ts };
    _fb.push(msgsRef, msgData);
    inp.value = "";
    // Update conversation index for both sides
    const lastSnip = text.slice(0, 40);
    _fb.set(_fb.ref(_fb.db, "dms/" + myId + "/" + otherId), { otherName, otherId, unread:0, lastTs:ts, lastMsg:lastSnip });
    _fb.set(_fb.ref(_fb.db, "dms/" + otherId + "/" + myId), { otherName: myName, otherId: myId, lastTs:ts, lastMsg:lastSnip, unread: 1 });
    // DM notification event
    _fb.push(_fb.ref(_fb.db, "dm_notifs/" + otherId), { from: myName, preview: lastSnip, ts });
  }
  document.getElementById("dmSendBtn").onclick = sendDM;
  document.getElementById("dmMsgInput").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendDM(); } });
}

// Listen for incoming DM notifications
async function _listenDMNotifs() {
  await _fbReady; if (!_fb) return;
  const myId = getUserId();
  _fb.onValue(_fb.query(_fb.ref(_fb.db, "dm_notifs/" + myId), _fb.orderByChild("ts"), _fb.limitToLast(1)), snap => {
    if (!snap.exists()) return;
    snap.forEach(child => {
      const n = child.val();
      if (!n || !n.ts) return;
      if (n.ts < Date.now() - 30000) return; // only notify if < 30s old
      if (sessionStorage.getItem("dmNotif_" + child.key)) return;
      sessionStorage.setItem("dmNotif_" + child.key, "1");
      _showDMNotif(n.from, n.preview);
      _fb.remove(child.ref);
    });
  });
}
function _showDMNotif(from, preview) {
  const t = document.createElement("div");
  t.style.cssText = "position:fixed;bottom:24px;left:20px;background:#0d0d1f;border:2px solid #ffc800;border-radius:16px;padding:12px 18px;z-index:99999;display:flex;align-items:center;gap:12px;box-shadow:0 0 30px rgba(255,200,0,.3);cursor:pointer;max-width:280px;";
  t.innerHTML = `<span style="font-size:1.4rem;">✉️</span><div><div style="font-weight:800;color:#ffc800;font-size:.88rem;">DM from ${escHtml(from)}</div><div style="opacity:.65;font-size:.78rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;">${escHtml(preview)}</div></div>`;
  t.onclick = () => { _openDMPanel(); t.remove(); };
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity="0"; t.style.transition="opacity .4s"; setTimeout(()=>t.remove(),450); }, 6000);
}


function _renderChatMessage(msg, container, sessionId, chatRef) {
  const isYou = msg.sessionId === sessionId; const isBot = msg.type === "bot";
  const div = document.createElement("div"); div.dataset.key = msg._key;
  div.style.cssText = `max-width:85%;padding:9px 13px;border-radius:16px;line-height:1.4;word-wrap:break-word;align-self:${isYou?"flex-end":"flex-start"};background:${isBot?"rgba(255,200,0,.1)":isYou?"#6b48ff":"rgba(255,255,255,.08)"};color:#fff;position:relative;margin-bottom:2px;`;
  const t = msg.ts ? new Date(msg.ts).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "";
  let content = "";
  if (msg.replyTo) content += `<div style="background:rgba(255,255,255,.06);border-left:3px solid #3cff9a;border-radius:6px;padding:4px 8px;margin-bottom:6px;font-size:.78rem;opacity:.7;"><strong>${escHtml(msg.replyTo.user||"?")}</strong>: ${escHtml(msg.replyTo.msg||"")}</div>`;
  content += `<span style="font-weight:700;font-size:.82rem;display:block;margin-bottom:3px;color:${msg.color||"#3cff9a"}">${escHtml(msg.user||"Anon")}${isYou?" (you)":""}</span>`;
  if (msg.type === "gif" && msg.gif) content += `<img src="${escHtml(msg.gif)}" style="max-width:200px;max-height:150px;border-radius:10px;display:block;margin:4px 0;" loading="lazy">`;
  else if (msg.type === "image" && msg.img) content += `<img src="${escHtml(msg.img)}" style="max-width:200px;max-height:200px;border-radius:10px;display:block;margin:4px 0;cursor:zoom-in;" onclick="window.open(this.src,'_blank')">`;
  else content += `<span>${escHtml(msg.msg||"")}</span>`;
  content += `<span style="font-size:.68rem;opacity:.45;display:block;text-align:right;margin-top:3px;">${t}</span>`;
  if (msg.reactions && Object.keys(msg.reactions).length) {
    content += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;">`;
    Object.entries(msg.reactions).forEach(([emoji, users]) => { const count = Object.keys(users).length; const mine = users[getUserId()]; content += `<span onclick="window._toggleReaction('${escHtml(msg._key)}','${escHtml(emoji)}')" style="background:${mine?"rgba(60,255,154,.25)":"rgba(255,255,255,.08)"};border:1px solid ${mine?"rgba(60,255,154,.5)":"rgba(255,255,255,.15)"};border-radius:999px;padding:2px 8px;font-size:.82rem;cursor:pointer;">${escHtml(emoji)} ${count}</span>`; });
    content += `</div>`;
  }
  div.innerHTML = content;
  div.addEventListener("contextmenu", e => { e.preventDefault(); _showMsgContextMenu(e.clientX, e.clientY, msg, chatRef); });
  container.appendChild(div);
}
window._toggleReaction = async function(msgKey, emoji) {
  await _fbReady; if (!_fb) return;
  const uid = getUserId(); const path = `chat/${msgKey}/reactions/${emoji}/${uid}`;
  const snap = await _fb.get(_fb.ref(_fb.db, path));
  if (snap.exists()) await _fb.remove(_fb.ref(_fb.db, path)); else await _fb.set(_fb.ref(_fb.db, path), true);
};
function _showMsgContextMenu(x, y, msg, chatRef) {
  document.getElementById("chatContextMenu")?.remove();
  const menu = document.createElement("div"); menu.id = "chatContextMenu";
  menu.style.cssText = `position:fixed;left:${Math.min(x,window.innerWidth-200)}px;top:${Math.min(y,window.innerHeight-300)}px;background:rgba(5,5,20,.98);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:8px;z-index:9999999;min-width:180px;box-shadow:0 8px 32px rgba(0,0,0,.6);`;
  const emojiRow = document.createElement("div"); emojiRow.style.cssText = "display:flex;gap:4px;padding:6px;margin-bottom:4px;border-bottom:1px solid rgba(255,255,255,.08);";
  EMOJI_REACTIONS.forEach(emoji => { const btn = document.createElement("button"); btn.textContent = emoji; btn.style.cssText = "background:transparent;border:none;font-size:1.1rem;cursor:pointer;padding:4px;border-radius:8px;"; btn.onclick = () => { window._toggleReaction(msg._key, emoji); menu.remove(); }; emojiRow.appendChild(btn); });
  menu.appendChild(emojiRow);
  const items = [
    { label:"↩️ Reply", action:()=>{ window._activeReply = msg; const ri = document.getElementById("replyIndicator"); const rt = document.getElementById("replyText"); if (ri) ri.style.display = "flex"; if (rt) rt.textContent = `${msg.user||"?"}: ${(msg.msg||"").slice(0,30)}`; document.getElementById("chatInput")?.focus(); } },
    { label:"📋 Copy",  action:()=>navigator.clipboard?.writeText(msg.msg||"") },
  ];
  if (_isAdmin()) items.push({ label:"🗑️ Delete (Admin)", action:async()=>{ await _fbReady; if (_fb) await _fb.remove(_fb.ref(_fb.db,"chat/"+msg._key)); } });
  items.forEach(item => { const btn = document.createElement("button"); btn.textContent = item.label; btn.style.cssText = "display:block;width:100%;padding:8px 12px;background:transparent;border:none;color:#fff;cursor:pointer;text-align:left;font-size:.9rem;border-radius:8px;"; btn.onmouseover = () => btn.style.background = "rgba(255,255,255,.08)"; btn.onmouseout = () => btn.style.background = "transparent"; btn.onclick = () => { item.action(); menu.remove(); }; menu.appendChild(btn); });
  document.body.appendChild(menu);
  setTimeout(() => { document.addEventListener("click", function rm() { menu.remove(); document.removeEventListener("click", rm); }, { once:true }); }, 50);
}

/* ══ ADMIN LIST LISTENER ══ */
async function _listenAdminList() {
  await _fbReady; if (!_fb) return;
  _fb.onValue(_fb.ref(_fb.db, "admin_list"), snap => {
    if (!snap.exists()) return;
    const list = snap.val() || {}; const myName = getUsername().toLowerCase();
    if (list[myName] === true) lsSet("oozecrib_admin", "1");
    else if (list[myName] === false) lsSet("oozecrib_admin", "0");
  });
}

/* ══ AUTH ══ */
const OWNER_CODE = "oozes2019adminsystemwiththekittyonthesideofyomamaslefttoenail";
const OWNER_NAMES = ["ooze","ooze34"];
const MAX_OWNER_SLOTS = 2;
function _isOwner() { return ls("oozecrib_owner") === "1"; }
function _isAdmin() { return ls("oozecrib_admin") === "1" || _isOwner(); }

async function tryActivateOwner(code) {
  if (code !== OWNER_CODE) return { ok:false, msg:"Wrong code." };
  const name = getUsername().toLowerCase().trim();
  if (!OWNER_NAMES.includes(name)) return { ok:false, msg:"Username not allowed." };
  await _fbReady;
  if (_fb) { try { const snap = await _fb.get(_fb.ref(_fb.db,"owner_slots")); const slots = snap.exists() ? snap.val() : {}; const entries = Object.entries(slots); const alreadyIn = entries.find(([,v]) => v.uid === getUserId()); if (!alreadyIn) { if (entries.length >= MAX_OWNER_SLOTS) return { ok:false, msg:`Owner slots full.` }; await _fb.set(_fb.ref(_fb.db,"owner_slots/"+getUserId()), { username:getUsername(), uid:getUserId(), ts:Date.now() }); } } catch(e) {} }
  lsSet("oozecrib_owner","1"); lsSet("oozecrib_admin","1"); return { ok:true };
}
async function tryActivateAdmin(code) {
  await _fbReady;
  if (_fb) { try { const snap = await _fb.get(_fb.ref(_fb.db,"admin_code")); const adminCode = snap.exists() ? snap.val() : "oozecrib_admin_2026"; if (code === adminCode) { lsSet("oozecrib_admin","1"); return { ok:true }; } } catch(e) {} }
  return { ok:false, msg:"Invalid admin code." };
}

/* ── Admin panel trigger (press - 10 times) ── */
let _dp = 0, _dt = null;
document.addEventListener("keydown", e => {
  if (e.key === "-") { _dp++; clearTimeout(_dt); _dt = setTimeout(() => _dp = 0, 3000); if (_dp >= 10) { _dp = 0; openAdminPanel(); } }
});

function openAdminPanel() { if (!_isAdmin() && !_isOwner()) { _showCodeEntry(); return; } _buildAdminPanel(); }
function _showCodeEntry() {
  const existing = document.getElementById("adminCodeModal"); if (existing) { existing.remove(); return; }
  const m = document.createElement("div"); m.id = "adminCodeModal";
  m.style.cssText = "position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.85);backdrop-filter:blur(10px);";
  m.innerHTML = `<div style="background:#080818;border:1px solid rgba(60,255,154,.3);border-radius:20px;padding:32px;width:min(400px,92vw);text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">🛡️</div>
    <h2 style="margin-bottom:20px;">Admin / Owner Access</h2>
    <input id="adminCodeInput" type="password" placeholder="Enter access code..." autocomplete="off" style="width:100%;padding:12px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;font-size:1rem;margin-bottom:12px;outline:none;box-sizing:border-box;"/>
    <div style="display:flex;gap:10px;">
      <button onclick="tryAdminLogin('admin')" style="flex:1;padding:12px;border-radius:14px;background:#6b48ff;border:none;color:#fff;font-weight:700;cursor:pointer;">Admin</button>
      <button onclick="tryAdminLogin('owner')" style="flex:1;padding:12px;border-radius:14px;background:linear-gradient(135deg,#ffe600,#ff9900);border:none;color:#000;font-weight:700;cursor:pointer;">Owner</button>
    </div>
    <div id="adminLoginMsg" style="margin-top:12px;font-size:.9rem;min-height:1.2em;"></div>
    <button onclick="document.getElementById('adminCodeModal').remove()" style="margin-top:16px;padding:8px 20px;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:transparent;color:#fff;cursor:pointer;opacity:.5;">Cancel</button>
  </div>`;
  document.body.appendChild(m);
}
window.tryAdminLogin = async function(type) {
  const code = document.getElementById("adminCodeInput")?.value.trim(); const msg = document.getElementById("adminLoginMsg");
  if (!code) { if (msg) msg.textContent = "Enter a code first."; return; }
  let result; if (type === "owner") result = await tryActivateOwner(code); else result = await tryActivateAdmin(code);
  if (result.ok) { document.getElementById("adminCodeModal")?.remove(); _buildAdminPanel(); }
  else { if (msg) msg.innerHTML = `<span style="color:#ff6b6b;">${result.msg}</span>`; }
};

/* ══ ADMIN PANEL (20 features + owner can disable each) ══ */
async function _buildAdminPanel() {
  document.getElementById("adminPanel")?.remove();
  const isOwner = _isOwner();
  const p = document.createElement("div"); p.id = "adminPanel";
  p.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:min(820px,97vw);max-height:94vh;overflow-y:auto;background:#07071a;border:1px solid rgba(60,255,154,.25);border-radius:24px;padding:24px;z-index:999998;box-shadow:0 0 80px rgba(60,255,154,.1);";

  // Load current admin code, drop links, disabled features
  let adminCode = "oozecrib_admin_2026", dropLinks = [], disabledFeatures = {};
  await _fbReady;
  if (_fb) {
    try { const s = await _fb.get(_fb.ref(_fb.db,"admin_code")); if (s.exists()) adminCode = s.val(); } catch(e) {}
    try { const s = await _fb.get(_fb.ref(_fb.db,"drop_links")); if (s.exists()) dropLinks = s.val() || []; } catch(e) {}
    try { const s = await _fb.get(_fb.ref(_fb.db,"admin_perms")); if (s.exists()) { const v = s.val(); Object.keys(v).forEach(k => { if (v[k] === false) disabledFeatures[k] = true; }); } } catch(e) {}
  }

  // Get online users with last-seen
  let onlineUsers = [];
  if (_fb) { try { const snap = await _fb.get(_fb.ref(_fb.db,"online")); if (snap.exists()) { const now = Date.now(); snap.forEach(c => { const v = c.val(); if ((v.ts||0) > now - 300000) onlineUsers.push({ username:v.username||"?", ts:v.ts||0, page:v.page||"/" }); }); onlineUsers.sort((a,b)=>b.ts-a.ts); } } catch(e) {} }

  const evOpts = Object.entries(EVENTS).map(([k,v]) => `<option value="${k}">${v.name}</option>`).join("");
  const trailOpts = Object.entries(TRAIL_DEFS).filter(([k]) => k !== "none").map(([k,v]) => `<option value="${k}">${v.label}</option>`).join("");
  const rarOpts = Object.keys(DROP_RARITIES).map(r => `<option value="${r}">${r}</option>`).join("");
  const themeOpts = ["default","neon","pastel","retro","beach","glitch","midnight","forest","sakura","volcano","ice"].map(t=>`<option value="${t}">${t}</option>`).join("");

  const now = Date.now();
  function timeSince(ts) { const s = Math.floor((now - ts)/1000); if (s < 60) return s+"s ago"; if (s < 3600) return Math.floor(s/60)+"m ago"; return Math.floor(s/3600)+"h ago"; }

  // Build online users HTML
  const onlineHtml = onlineUsers.length ? onlineUsers.map(u => {
    const active = now - u.ts < 60000;
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(255,255,255,.03);border-radius:10px;margin-bottom:5px;">
      <span style="width:8px;height:8px;border-radius:50%;background:${active?"#3cff9a":"rgba(255,255,255,.25)"};flex-shrink:0;${active?"box-shadow:0 0 8px #3cff9a":""}"></span>
      <span style="font-weight:700;flex:1;">${escHtml(u.username)}</span>
      <span style="font-size:.75rem;opacity:.45;">${timeSince(u.ts)}</span>
      <span style="font-size:.72rem;opacity:.35;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(u.page)}</span>
    </div>`;
  }).join("") : `<div style="opacity:.4;font-size:.85rem;">No recent visitors</div>`;

  p.innerHTML = `
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.08);">
  <div><span style="font-size:1.3rem;font-weight:900;color:${isOwner?"#ffe600":"#3cff9a"};">${isOwner?"👑 Owner Panel":"🛡️ Admin Panel"}</span><span style="font-size:.8rem;opacity:.4;margin-left:12px;">${getUsername()}</span></div>
  <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:.8rem;opacity:.5;">🌐 ${onlineUsers.filter(u=>now-u.ts<60000).length} Online</span><button onclick="document.getElementById('adminPanel').remove()" style="background:transparent;border:none;color:#ff6b6b;font-size:1.5rem;cursor:pointer;">✕</button></div>
</div>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
  <button class="atab active" onclick="apTab('admin')">🛡️ Admin</button>
  <button class="atab" onclick="apTab('online')">🌐 Who's Online</button>
  ${isOwner?`<button class="atab" onclick="apTab('owner')">👑 Owner</button>`:""}
</div>

<!-- ADMIN TAB (20 features, some may be disabled by owner) -->
<div id="aptab-admin" class="aptabcontent">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">

    ${!disabledFeatures.send_global ? `
    <div class="apc"><h3>📢 Global Message</h3>
      <input id="ap_gm" placeholder="Message to all users..." class="api"/>
      <button onclick="ap_sendGlobal()" class="apb green">📡 Send to All</button>
    </div>` : `<div class="apc apc-disabled"><h3>📢 Global Message</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.announcement ? `
    <div class="apc"><h3>📣 Announcement</h3>
      <input id="ap_ann" placeholder="Announcement text..." class="api" style="margin-bottom:6px"/>
      <div style="display:flex;gap:6px;margin-bottom:6px;"><input id="ap_ann_icon" placeholder="Icon" class="api" style="flex:1;margin:0" value="📢"/><input id="ap_ann_color" type="color" class="api" style="width:44px;margin:0;padding:2px;" value="#3cff9a"/></div>
      <button onclick="ap_sendAnnouncement()" class="apb purple">📣 Announce</button>
    </div>` : `<div class="apc apc-disabled"><h3>📣 Announcement</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.give_levels ? `
    <div class="apc"><h3>⭐ Give Levels</h3>
      <input id="ap_pn" placeholder="Username (blank = all)" class="api" style="margin-bottom:6px"/>
      <input id="ap_pl" type="number" placeholder="Amount" class="api"/>
      <button onclick="ap_giveLevels()" class="apb purple">Give Levels</button>
    </div>` : `<div class="apc apc-disabled"><h3>⭐ Give Levels</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.give_coins ? `
    <div class="apc"><h3>🪙 Give Coins</h3>
      <input id="ap_cpn" placeholder="Username (blank = all)" class="api" style="margin-bottom:6px"/>
      <input id="ap_cpa" type="number" placeholder="Amount" class="api"/>
      <button onclick="ap_giveCoins()" class="apb gold">Give Coins</button>
    </div>` : `<div class="apc apc-disabled"><h3>🪙 Give Coins</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.spawn_event ? `
    <div class="apc"><h3>⚡ Spawn Event</h3>
      <select id="ap_ev" class="api">${evOpts}</select>
      <input id="ap_ep" placeholder="Param (optional)" class="api" style="margin-top:6px"/>
      <button onclick="ap_spawnEvent()" class="apb orange">Spawn</button>
    </div>` : `<div class="apc apc-disabled"><h3>⚡ Spawn Event</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.give_trail ? `
    <div class="apc"><h3>🎨 Give Trail</h3>
      <input id="ap_trail_user" placeholder="Username (blank = all)" class="api" style="margin-bottom:6px"/>
      <select id="ap_trail_id" class="api">${trailOpts}</select>
      <button onclick="ap_giveTrailPerson()" class="apb pink">Give Trail</button>
    </div>` : `<div class="apc apc-disabled"><h3>🎨 Give Trail</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.give_drop ? `
    <div class="apc"><h3>🎁 Give Drop</h3>
      <input id="ap_du" placeholder="Username (blank = all)" class="api" style="margin-bottom:6px"/>
      <div style="display:flex;gap:6px;margin-bottom:6px"><input id="ap_dc" type="number" placeholder="Count" class="api" style="margin:0"/><select id="ap_dr" class="api" style="margin:0">${rarOpts}</select></div>
      <input id="ap_dlink" placeholder="Link (optional)" class="api"/>
      <button onclick="ap_giveDrop()" class="apb pink">Give Drop</button>
    </div>` : `<div class="apc apc-disabled"><h3>🎁 Give Drop</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.send_poll ? `
    <div class="apc"><h3>📊 Send Poll</h3>
      <input id="ap_pq" placeholder="Question..." class="api" style="margin-bottom:6px"/>
      <input id="ap_po" placeholder="Option1, Option2, ..." class="api"/>
      <button onclick="ap_sendPoll()" class="apb cyan">Send Poll</button>
    </div>` : `<div class="apc apc-disabled"><h3>📊 Send Poll</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.poll_results ? `
    <div class="apc"><h3>📊 Poll Results</h3>
      <div id="ap_poll_results" style="max-height:130px;overflow-y:auto;font-size:.82rem;"></div>
      <button onclick="ap_loadPollResults()" class="apb" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);margin-top:8px;">Load Results</button>
    </div>` : `<div class="apc apc-disabled"><h3>📊 Poll Results</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.direct_link ? `
    <div class="apc"><h3>🔗 Direct Link</h3>
      <input id="ap_dl" placeholder="https://..." class="api" style="margin-bottom:6px"/>
      <input id="ap_dlu" placeholder="Username (blank = all)" class="api"/>
      <button onclick="ap_giveDirectLink()" class="apb green">Send Link</button>
    </div>` : `<div class="apc apc-disabled"><h3>🔗 Direct Link</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.force_theme ? `
    <div class="apc"><h3>🎨 Force Theme</h3>
      <select id="ap_theme_all" class="api">${themeOpts}</select>
      <button onclick="ap_forceTheme()" class="apb purple">Force Theme</button>
    </div>` : `<div class="apc apc-disabled"><h3>🎨 Force Theme</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.kick ? `
    <div class="apc"><h3>🚫 Kick User</h3>
      <input id="ap_kick_u" placeholder="Username" class="api" style="margin-bottom:6px"/>
      <input id="ap_kick_r" placeholder="Reason" class="api"/>
      <button onclick="ap_kick()" class="apb red">Kick</button>
    </div>` : `<div class="apc apc-disabled"><h3>🚫 Kick User</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.ban ? `
    <div class="apc"><h3>🔨 Ban User</h3>
      <input id="ap_ban_u" placeholder="Username" class="api" style="margin-bottom:6px"/>
      <input id="ap_ban_r" placeholder="Reason" class="api"/>
      <button onclick="ap_ban()" class="apb red">Ban</button>
    </div>` : `<div class="apc apc-disabled"><h3>🔨 Ban User</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.clear_chat ? `
    <div class="apc"><h3>💬 Chat Controls</h3>
      <input id="ap_bot_msg" placeholder="Send as OozeBot..." class="api"/>
      <button onclick="ap_sendBotMsg()" class="apb cyan" style="margin-bottom:6px">Send Bot Msg</button>
      <button onclick="ap_clearChat()" class="apb red">🗑️ Clear All Chat</button>
    </div>` : `<div class="apc apc-disabled"><h3>💬 Chat Controls</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.gotd ? `
    <div class="apc"><h3>🎮 Set Game of Day</h3>
      <input id="ap_gotd_name" placeholder="Game name" class="api" style="margin-bottom:6px"/>
      <input id="ap_gotd_url" placeholder="Game URL" class="api" style="margin-bottom:6px"/>
      <input id="ap_gotd_img" placeholder="Thumbnail URL (optional)" class="api"/>
      <div style="display:flex;gap:6px"><button onclick="ap_setGOTD()" class="apb green" style="flex:1">Set</button><button onclick="ap_resetGOTD()" class="apb orange" style="flex:1">Auto</button></div>
    </div>` : `<div class="apc apc-disabled"><h3>🎮 Game of Day</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.drop_links ? `
    <div class="apc" style="grid-column:1/-1"><h3>🎀 Ooze Drop Links</h3>
      <div id="ap_dll">${(dropLinks||[]).map((l,i)=>`<div style="display:flex;gap:6px;margin-bottom:4px"><input value="${escHtml(l)}" onchange="window._adl[${i}]=this.value" class="api" style="flex:1;margin:0"/><button onclick="window._adl.splice(${i},1);ap_rebuildLinks()" style="padding:4px 10px;border:1px solid rgba(255,100,100,.4);border-radius:8px;background:transparent;color:#ff6b6b;cursor:pointer">✕</button></div>`).join("")}</div>
      <div style="display:flex;gap:8px;margin-top:8px"><button onclick="window._adl.push('https://');ap_rebuildLinks()" class="apb" style="background:rgba(60,255,154,.1);border:1px solid rgba(60,255,154,.3);flex:1">+ Add</button><button onclick="ap_saveDropLinks()" class="apb green" style="flex:1">💾 Save</button><button onclick="ap_triggerOozeDrop()" class="apb pink" style="flex:1">🎀 Trigger</button></div>
    </div>` : `<div class="apc apc-disabled" style="grid-column:1/-1"><h3>🎀 Drop Links</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.give_admin ? `
    <div class="apc"><h3>🛡️ Give/Remove Admin</h3>
      <input id="ap_give_admin" placeholder="Username" class="api" style="margin-bottom:6px"/>
      <div style="display:flex;gap:6px"><button onclick="ap_giveAdmin()" class="apb green" style="flex:1">Give</button><button onclick="ap_removeAdmin()" class="apb red" style="flex:1">Remove</button></div>
    </div>` : `<div class="apc apc-disabled"><h3>🛡️ Give/Remove Admin</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.redirect ? `
    <div class="apc"><h3>🚀 Redirect URL</h3>
      <input id="ap_red_url" placeholder="https://..." class="api" style="margin-bottom:6px"/>
      <input id="ap_red_u" placeholder="Username (blank = all)" class="api"/>
      <button onclick="ap_redirect()" class="apb orange">Redirect</button>
    </div>` : `<div class="apc apc-disabled"><h3>🚀 Redirect</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

    ${!disabledFeatures.mute ? `
    <div class="apc"><h3>🔕 Mute / Unmute</h3>
      <input id="ap_mute_u" placeholder="Username" class="api"/>
      <div style="display:flex;gap:6px;margin-top:6px"><button onclick="ap_muteUser()" class="apb orange" style="flex:1">Mute</button><button onclick="ap_unmuteUser()" class="apb green" style="flex:1">Unmute</button></div>
    </div>` : `<div class="apc apc-disabled"><h3>🔕 Mute / Unmute</h3><div class="disabled-msg">🚫 Disabled by owner</div></div>`}

  </div>
</div>

<!-- WHO'S ONLINE TAB -->
<div id="aptab-online" class="aptabcontent" style="display:none">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <span style="font-weight:700;">🌐 Visitors in Last 5 Minutes</span>
    <span style="font-size:.8rem;opacity:.4;">${onlineUsers.filter(u=>now-u.ts<60000).length} active right now</span>
  </div>
  <div id="ap_online_list" style="max-height:400px;overflow-y:auto;">${onlineHtml}</div>
  <div style="display:flex;gap:8px;margin-top:12px;">
    <button onclick="ap_refreshOnline()" class="apb" style="background:rgba(60,255,154,.07);border:1px solid rgba(60,255,154,.2);flex:1">🔄 Refresh</button>
    <button onclick="ap_clearOnlineList()" class="apb red" style="flex:1">🗑️ Clear Online List</button>
  </div>
</div>

${isOwner ? `
<!-- OWNER TAB (30 features) -->
<div id="aptab-owner" class="aptabcontent" style="display:none">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">

    <div class="apc" style="grid-column:1/-1;border-color:rgba(255,220,0,.2);background:rgba(255,220,0,.03);">
      <h3 style="color:#ffe600;">🚫 Disable Admin Features</h3>
      <p style="font-size:.8rem;opacity:.6;margin-bottom:12px;">Toggle OFF to prevent admins from using that feature. You (owner) can always use everything.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;" id="ap_feature_toggles"></div>
      <button onclick="ap_saveFeatureToggles()" class="apb gold" style="margin-top:12px;">💾 Save Permissions</button>
    </div>

    <div class="apc"><h3>🔑 Change Admin Code</h3>
      <input id="ap_nac" placeholder="New code..." class="api" value="${escHtml(adminCode)}"/>
      <button onclick="ap_saveAdminCode()" class="apb gold">Save</button>
    </div>
    <div class="apc"><h3>🗑️ Reset Leaderboard</h3>
      <p style="font-size:.8rem;opacity:.5;margin-bottom:10px;">Wipes all player scores.</p>
      <button onclick="ap_resetBoard()" class="apb red">⚠️ Reset All</button>
    </div>
    <div class="apc"><h3>💣 Wipe User Data</h3>
      <input id="ap_wipe_u" placeholder="Username" class="api"/>
      <button onclick="ap_wipeUser()" class="apb red">Wipe</button>
    </div>
    <div class="apc" style="border-color:rgba(255,100,100,.3);background:rgba(255,50,50,.04);">
      <h3 style="color:#ff6b6b;">🔄 Reset Everyone's Levels</h3>
      <p style="font-size:.8rem;opacity:.5;margin-bottom:10px;">Wipes XP for ALL users — even if they're offline. Takes effect the next time each user visits.</p>
      <button onclick="ap_resetAllLevels()" class="apb red">⚠️ Reset All Levels</button>
    </div>
    <div class="apc"><h3>🎁 Mass XP Boost</h3>
      <input id="ap_mass_xp" type="number" placeholder="Levels to give" class="api"/>
      <button onclick="ap_massXP()" class="apb gold">Give All</button>
    </div>
    <div class="apc"><h3>📣 Alert Popup</h3>
      <input id="ap_alert_msg" placeholder="Alert message..." class="api" style="margin-bottom:6px"/>
      <input id="ap_alert_u" placeholder="Username (blank = all)" class="api"/>
      <button onclick="ap_sendAlert()" class="apb orange">Send Alert</button>
    </div>
    <div class="apc"><h3>🔒 Lock Site</h3>
      <input id="ap_lock_msg" placeholder="Message to show..." class="api"/>
      <div style="display:flex;gap:6px"><button onclick="ap_lockSite()" class="apb red" style="flex:1">Lock</button><button onclick="ap_unlockSite()" class="apb green" style="flex:1">Unlock</button></div>
    </div>
    <div class="apc"><h3>🌐 Force Reload All</h3>
      <p style="font-size:.8rem;opacity:.5;margin-bottom:10px;">Reloads every connected user.</p>
      <button onclick="ap_forceReload()" class="apb orange">Force Reload</button>
    </div>
    <div class="apc"><h3>🎨 Accent Color</h3>
      <div style="display:flex;gap:8px;align-items:center;"><input id="ap_accent" type="color" value="#3cff9a" style="width:50px;height:36px;border:none;background:none;cursor:pointer;"/><button onclick="ap_setAccent()" class="apb purple" style="flex:1">Apply</button></div>
    </div>
    <div class="apc"><h3>📝 MOTD Banner</h3>
      <input id="ap_motd" placeholder="Today's message..." class="api"/>
      <button onclick="ap_setMOTD()" class="apb cyan">Set MOTD</button>
    </div>
    <div class="apc"><h3>🗓️ Next Update Note</h3>
      <input id="ap_next_update" placeholder="What's coming next..." class="api"/>
      <button onclick="ap_setNextUpdate()" class="apb purple">Set</button>
    </div>
    <div class="apc"><h3>👑 Admin List</h3>
      <div id="ap_admin_list_view" style="font-size:.82rem;opacity:.7;max-height:100px;overflow-y:auto;"></div>
      <button onclick="ap_loadAdminList()" class="apb" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);margin-top:8px;">View</button>
    </div>
    <div class="apc"><h3>📊 Site Stats</h3>
      <div id="ap_stats" style="font-size:.82rem;opacity:.7;"></div>
      <button onclick="ap_loadStats()" class="apb" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);margin-top:8px;">Load</button>
    </div>
    <div class="apc"><h3>👑 Owner Slots</h3>
      <div id="ap_owner_slots" style="font-size:.82rem;opacity:.7;"></div>
      <button onclick="ap_loadOwnerSlots()" class="apb" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);margin-top:8px;">View</button>
    </div>
    <div class="apc"><h3>🎯 Set XP → Person</h3>
      <input id="ap_set_xp_u" placeholder="Username" class="api" style="margin-bottom:6px"/>
      <input id="ap_set_xp_v" type="number" placeholder="XP amount" class="api"/>
      <button onclick="ap_setXP()" class="apb gold">Set XP</button>
    </div>
    <div class="apc"><h3>🔓 Unlock All Trails</h3>
      <p style="font-size:.8rem;opacity:.5;margin-bottom:10px;">Unlocks all trails for yourself locally.</p>
      <button onclick="ap_unlockAllTrails()" class="apb gold">Unlock All</button>
    </div>
    <div class="apc"><h3>💾 Export Data</h3>
      <p style="font-size:.8rem;opacity:.5;margin-bottom:10px;">Download leaderboard as JSON.</p>
      <button onclick="ap_exportData()" class="apb gold">Export JSON</button>
    </div>
    <div class="apc"><h3>🎨 Force Theme → All</h3>
      <select id="ap_ow_theme" class="api">${themeOpts}</select>
      <button onclick="ap_forceThemeAll()" class="apb purple">Force to All</button>
    </div>
    <div class="apc"><h3>🚫 Ban Management</h3>
      <input id="ap_unban_u" placeholder="Username to unban" class="api"/>
      <button onclick="ap_unban()" class="apb green">Unban</button>
    </div>
    <div class="apc"><h3>🌐 Redirect All</h3>
      <input id="ap_redir_all" placeholder="https://..." class="api"/>
      <button onclick="ap_redirectAll()" class="apb orange">Redirect All</button>
    </div>
    <div class="apc"><h3>🌤️ Weather Widget</h3>
      <div id="ap_weather_preview" style="font-size:.82rem;"></div>
      <button onclick="loadWeatherWidget('ap_weather_preview')" class="apb cyan" style="margin-top:8px">Load Weather</button>
    </div>
    <div class="apc"><h3>🔢 Reset Visit Counter</h3>
      <input id="ap_reset_u" placeholder="Username" class="api"/>
      <button onclick="ap_resetVisits()" class="apb orange">Reset</button>
    </div>
    <div class="apc"><h3>📋 View Recent Chat</h3>
      <div id="ap_chatLog" style="max-height:100px;overflow-y:auto;font-size:.8rem;opacity:.7;background:rgba(0,0,0,.2);border-radius:8px;padding:6px;"></div>
      <button onclick="ap_loadChatLog()" class="apb" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);margin-top:8px;">Load</button>
    </div>
    <div class="apc"><h3>📱 Custom MOTD Color</h3>
      <input id="ap_motd_text" placeholder="Message..." class="api" style="margin-bottom:6px"/>
      <input id="ap_motd_color" type="color" value="#3cff9a" style="width:44px;height:30px;border:none;background:none;cursor:pointer;margin-bottom:6px"/>
      <button onclick="ap_setColorMOTD()" class="apb green">Set Banner</button>
    </div>
    <div class="apc"><h3>🌟 Mass Give Trails</h3>
      <select id="ap_mass_trail" class="api">${trailOpts}</select>
      <button onclick="ap_massGiveTrail()" class="apb pink">Give to All</button>
    </div>
    <div class="apc"><h3>🎆 Trigger Fireworks</h3>
      <button onclick="triggerEvent('fireworks');apMsg('🎆 Fireworks!')" class="apb orange">Launch!</button>
    </div>
    <div class="apc"><h3>💻 Code Rain</h3>
      <button onclick="triggerEvent('code_rain');apMsg('💻 Code Rain!')" class="apb green">Start</button>
    </div>
    <div class="apc"><h3>🪩 Disco Mode</h3>
      <button onclick="triggerEvent('disco');apMsg('🪩 Disco!')" class="apb pink">Start</button>
    </div>

  </div>
</div>
` : ""}

<div id="ap_msg" style="text-align:center;min-height:1.5em;font-size:.9rem;padding:8px;border-radius:10px;margin-top:14px;"></div>

<style>
.apc{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:14px;}
.apc h3{font-size:.78rem;opacity:.5;margin:0 0 10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;}
.apc-disabled{opacity:.4!important;pointer-events:none;}
.disabled-msg{font-size:.85rem;color:#ff6b6b;opacity:.7;padding:8px 0;}
.api{width:100%;padding:9px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-size:.9rem;outline:none;margin-bottom:8px;box-sizing:border-box;}
.apb{width:100%;padding:10px;border-radius:12px;border:none;font-weight:700;cursor:pointer;font-size:.9rem;color:#fff;transition:opacity .2s;}
.apb:hover{opacity:.82;}.apb.green{background:#3cff9a;color:#000}.apb.purple{background:#6b48ff}.apb.gold{background:#ffe600;color:#000}.apb.orange{background:#ff9900;color:#000}.apb.pink{background:#ff6bda}.apb.cyan{background:#00cfff;color:#000}.apb.red{background:#ff4444}
.atab{padding:8px 16px;border-radius:20px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#fff;cursor:pointer;font-size:.85rem;font-weight:600;transition:all .2s;}
.atab.active,.atab:hover{background:rgba(60,255,154,.15);border-color:rgba(60,255,154,.4);color:#3cff9a;}
.aptabcontent{animation:fadeInTab .2s ease;}
@keyframes fadeInTab{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
</style>`;

  document.body.appendChild(p);
  window._adl = [...(dropLinks || [])];

  window.apTab = function(id) {
    document.querySelectorAll(".aptabcontent").forEach(el => el.style.display = "none");
    document.querySelectorAll(".atab").forEach(el => el.classList.remove("active"));
    const el = document.getElementById("aptab-" + id); if (el) el.style.display = "";
    document.querySelectorAll(".atab").forEach(el => { if (el.getAttribute("onclick")?.includes(`'${id}'`)) el.classList.add("active"); });
  };

  function apMsg(msg, ok = true) { const el = document.getElementById("ap_msg"); if (!el) return; el.innerHTML = `<span style="color:${ok?"#3cff9a":"#ff6b6b"}">${msg}</span>`; el.style.background = ok?"rgba(60,255,154,.07)":"rgba(255,100,100,.07)"; setTimeout(()=>{ if(el){el.innerHTML="";el.style.background="transparent";}},4000); }

  // Build feature toggles in owner panel
  if (isOwner) {
    const toggleContainer = document.getElementById("ap_feature_toggles");
    if (toggleContainer) {
      const features = ["send_global","announcement","give_levels","give_coins","spawn_event","give_trail","give_drop","send_poll","poll_results","direct_link","force_theme","kick","ban","clear_chat","gotd","drop_links","give_admin","redirect","mute","unlock_trails","game_ratings"];
      const labels = {send_global:"📢 Global Message",announcement:"📣 Announcement",give_levels:"⭐ Give Levels",give_coins:"🪙 Give Coins",spawn_event:"⚡ Events",give_trail:"🎨 Trails",give_drop:"🎁 Drops",send_poll:"📊 Polls",poll_results:"📊 Poll Results",direct_link:"🔗 Direct Link",force_theme:"🎨 Force Theme",kick:"🚫 Kick",ban:"🔨 Ban",clear_chat:"💬 Chat Controls",gotd:"🎮 Game of Day",drop_links:"🎀 Drop Links",give_admin:"🛡️ Give Admin",redirect:"🚀 Redirect",mute:"🔕 Mute",unlock_trails:"🔓 Unlock Trails",game_ratings:"👍 Game Ratings"};
      window._featureStates = {};
      features.forEach(f => {
        window._featureStates[f] = !disabledFeatures[f];
        const row = document.createElement("div"); row.style.cssText = "display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.03);border-radius:10px;padding:8px 12px;";
        row.innerHTML = `<span style="font-size:.82rem;">${labels[f]||f}</span><button id="ftoggle_${f}" onclick="window._toggleFeature('${f}')" style="width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;font-size:.8rem;font-weight:700;background:${window._featureStates[f]?"#3cff9a":"rgba(255,100,100,.4)"};color:${window._featureStates[f]?"#000":"#fff"}">${window._featureStates[f]?"ON":"OFF"}</button>`;
        toggleContainer.appendChild(row);
      });
      window._toggleFeature = function(f) { window._featureStates[f] = !window._featureStates[f]; const btn = document.getElementById("ftoggle_"+f); if (btn) { btn.style.background = window._featureStates[f]?"#3cff9a":"rgba(255,100,100,.4)"; btn.style.color = window._featureStates[f]?"#000":"#fff"; btn.textContent = window._featureStates[f]?"ON":"OFF"; } };
      window.ap_saveFeatureToggles = async function() { const perms = {}; Object.keys(window._featureStates).forEach(k => { if (!window._featureStates[k]) perms[k] = false; }); await _fbReady; if (_fb) await _fb.set(_fb.ref(_fb.db,"admin_perms"), perms); apMsg("✅ Permissions saved!"); };
    }
  }

  window.ap_rebuildLinks = function() { const el = document.getElementById("ap_dll"); if (!el) return; el.innerHTML = (window._adl||[]).map((l,i)=>`<div style="display:flex;gap:6px;margin-bottom:4px"><input value="${escHtml(l)}" onchange="window._adl[${i}]=this.value" class="api" style="flex:1;margin:0"/><button onclick="window._adl.splice(${i},1);ap_rebuildLinks()" style="padding:4px 10px;border:1px solid rgba(255,100,100,.4);border-radius:8px;background:transparent;color:#ff6b6b;cursor:pointer">✕</button></div>`).join(""); };
  window.ap_sendGlobal = async()=>{ const m=document.getElementById("ap_gm")?.value.trim(); if(!m)return; showGlobalBanner(m,getUsername()); await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_messages"),{msg:m,from:getUsername(),ts:Date.now()}); document.getElementById("ap_gm").value=""; apMsg("✅ Global message sent!"); };
  window.ap_sendAnnouncement = async()=>{ const m=document.getElementById("ap_ann")?.value.trim(); const icon=document.getElementById("ap_ann_icon")?.value||"📢"; const color=document.getElementById("ap_ann_color")?.value||"#3cff9a"; if(!m)return; _showBigAnnouncement(m,getUsername(),color,icon); if(_fb){ const ref=await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"announcement",msg:m,from:getUsername(),color,icon,ts:Date.now()}); if(ref&&ref.key)_seenEventKeys.add(ref.key); } document.getElementById("ap_ann").value=""; apMsg("✅ Announcement sent!"); };
  window.ap_giveLevels = async()=>{ const n=document.getElementById("ap_pn")?.value.trim(); const a=parseInt(document.getElementById("ap_pl")?.value)||0; if(!a)return; await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"give_levels",amount:a,targetName:n||undefined,from:getUsername(),ts:Date.now()}); if(!n||n.toLowerCase()===getUsername().toLowerCase())addLevels(a); apMsg(`✅ Gave ${a} levels${n?" to "+n:"to all"}!`); };
  window.ap_giveCoins = async()=>{ const n=document.getElementById("ap_cpn")?.value.trim(); const a=parseInt(document.getElementById("ap_cpa")?.value)||0; if(!a)return; if(n)await adminGiveCoinsByName(n,a); else{ await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"give_coins",amount:a,from:getUsername(),ts:Date.now()}); } if(!n||n.toLowerCase()===getUsername().toLowerCase())await addCoins(a); apMsg(`✅ Gave ${a} coins!`); };
  window.ap_spawnEvent = async()=>{ const id=document.getElementById("ap_ev")?.value; const p2=document.getElementById("ap_ep")?.value.trim(); if(!id)return; await triggerEvent(id,p2||undefined); apMsg(`✅ Event: ${id}`); };
  window.ap_giveTrailPerson = async()=>{ const n=document.getElementById("ap_trail_user")?.value.trim(); const t=document.getElementById("ap_trail_id")?.value; if(!t)return; await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"give_trail",trailId:t,targetName:n||"all",from:getUsername(),ts:Date.now()}); apMsg(`✅ Trail given!`); };
  window.ap_giveDrop = async()=>{ const u=document.getElementById("ap_du")?.value.trim(); const c=parseInt(document.getElementById("ap_dc")?.value)||1; const r=document.getElementById("ap_dr")?.value||"common"; const l=document.getElementById("ap_dlink")?.value.trim()||""; await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"give_drop",count:c,rarity:r,link:l,targetName:u||"all",from:getUsername(),ts:Date.now()}); apMsg(`✅ Gave ${c}x ${r} drops!`); };
  window.ap_sendPoll = async()=>{ const q=document.getElementById("ap_pq")?.value.trim(); const opts=document.getElementById("ap_po")?.value.split(",").map(s=>s.trim()).filter(Boolean); if(!q||!opts?.length)return; await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"polls"),{question:q,options:opts,from:getUsername(),ts:Date.now()}); document.getElementById("ap_pq").value=""; document.getElementById("ap_po").value=""; apMsg("✅ Poll sent!"); };
  window.ap_loadPollResults = async()=>{ const el=document.getElementById("ap_poll_results"); if(!el)return; await _fbReady; if(!_fb){el.innerHTML="No Firebase";return;} const psnap=await _fb.get(_fb.ref(_fb.db,"polls")); if(!psnap.exists()){el.innerHTML="<span style='opacity:.5'>No polls</span>";return;} let html=""; const pollKeys=[]; psnap.forEach(c=>{const p=c.val();pollKeys.push({key:c.key,q:p.question,opts:p.options||[]});}); await Promise.all(pollKeys.map(async({key,q,opts})=>{ let votes={}; try{const vsnap=await _fb.get(_fb.ref(_fb.db,`poll_votes/${key}`));if(vsnap.exists())vsnap.forEach(c=>{const v=c.val().vote;votes[v]=(votes[v]||0)+1;});}catch(e){} const total=Object.values(votes).reduce((a,b)=>a+b,0)||1; html+=`<div style="margin-bottom:8px;padding:8px;background:rgba(255,255,255,.03);border-radius:8px;"><strong>${escHtml(q)}</strong><br>${opts.map(opt=>`<span style="font-size:.8rem;"> ${escHtml(opt)}: ${votes[opt]||0} (${Math.round((votes[opt]||0)/total*100)}%)</span>`).join(" · ")}</div>`; })); el.innerHTML=html||"No data"; };
  window.ap_giveDirectLink = async()=>{ const l=document.getElementById("ap_dl")?.value.trim(); const u=document.getElementById("ap_dlu")?.value.trim(); if(!l)return; await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"direct_link",link:l,targetName:u||"all",from:getUsername(),ts:Date.now()}); apMsg("✅ Link sent!"); };
  window.ap_forceTheme = async()=>{ const t=document.getElementById("ap_theme_all")?.value; if(!t)return; applyThemeCSS(t); lsSet("theme",t); await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"force_theme",theme:t,from:getUsername(),ts:Date.now()}); apMsg(`✅ Theme: ${t}!`); };
  window.ap_kick = async()=>{ const n=document.getElementById("ap_kick_u")?.value.trim(); const r=document.getElementById("ap_kick_r")?.value.trim(); if(!n)return; await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"kick",targetName:n,reason:r||"Kicked by admin",from:getUsername(),ts:Date.now()}); apMsg(`✅ Kicked ${n}!`); };
  window.ap_ban = async()=>{ const n=document.getElementById("ap_ban_u")?.value.trim(); const r=document.getElementById("ap_ban_r")?.value.trim(); if(!n)return; if(!confirm(`Ban ${n}?`))return; await _fbReady; if(_fb){await _fb.set(_fb.ref(_fb.db,"bans/"+n.toLowerCase()),{reason:r||"Banned",by:getUsername(),ts:Date.now()});await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"ban",targetName:n,reason:r||"Banned",from:getUsername(),ts:Date.now()});} apMsg(`✅ Banned ${n}!`); };
  window.ap_sendBotMsg = async()=>{ const m=document.getElementById("ap_bot_msg")?.value.trim(); if(!m)return; await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"chat"),{user:"🤖 OozeBot",msg:m,color:"#ffcc00",ts:Date.now(),sessionId:"bot",type:"bot"}); document.getElementById("ap_bot_msg").value=""; apMsg("✅ Bot message sent!"); };
  window.ap_clearChat = async()=>{ if(!confirm("Clear all chat?"))return; await _fbReady; if(_fb)await _fb.remove(_fb.ref(_fb.db,"chat")); const cm=document.getElementById("chatMessages"); if(cm)cm.innerHTML=""; apMsg("✅ Chat cleared!"); };
  window.ap_setGOTD = ()=>{ const name=document.getElementById("ap_gotd_name")?.value.trim(); const url=document.getElementById("ap_gotd_url")?.value.trim(); const img=document.getElementById("ap_gotd_img")?.value.trim(); if(!name||!url)return; lsSet("gotd_custom",JSON.stringify({name,url,img:img||""})); loadGameOfDay(); apMsg(`✅ GOTD: "${name}"!`); };
  window.ap_resetGOTD = ()=>{ localStorage.removeItem("gotd_custom"); loadGameOfDay(); apMsg("✅ GOTD reset!"); };
  window.ap_saveDropLinks = async()=>{ await _fbReady; if(_fb)await _fb.set(_fb.ref(_fb.db,"drop_links"),window._adl||[]); apMsg("✅ Drop links saved!"); };
  window.ap_triggerOozeDrop = async()=>{ await _triggerOozeDropEvent(window._adl||[]); apMsg("✅ Ooze Drop triggered!"); };
  window.ap_giveAdmin = async()=>{ const n=document.getElementById("ap_give_admin")?.value.trim(); if(!n)return; await _fbReady; if(_fb){await _fb.set(_fb.ref(_fb.db,"admin_list/"+n.toLowerCase()),true);await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"give_admin",targetName:n,from:getUsername(),ts:Date.now()});} apMsg(`✅ Admin given to ${n}!`); };
  window.ap_removeAdmin = async()=>{ const n=document.getElementById("ap_give_admin")?.value.trim()||document.getElementById("ap_remove_admin")?.value.trim(); if(!n)return; await _fbReady; if(_fb){await _fb.set(_fb.ref(_fb.db,"admin_list/"+n.toLowerCase()),false);await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"remove_admin",targetName:n,from:getUsername(),ts:Date.now()});} apMsg(`✅ Admin removed from ${n}!`); };
  window.ap_redirect = async()=>{ const url=document.getElementById("ap_red_url")?.value.trim(); const u=document.getElementById("ap_red_u")?.value.trim(); if(!url)return; await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"redirect",url,targetName:u||"all",from:getUsername(),ts:Date.now()}); apMsg("✅ Redirect sent!"); };
  window.ap_muteUser = async()=>{ const n=document.getElementById("ap_mute_u")?.value.trim(); if(!n)return; await _fbReady; if(_fb)await _fb.set(_fb.ref(_fb.db,"muted/"+n.toLowerCase()),true); apMsg(`✅ Muted ${n}!`); };
  window.ap_unmuteUser = async()=>{ const n=document.getElementById("ap_mute_u")?.value.trim(); if(!n)return; await _fbReady; if(_fb)await _fb.remove(_fb.ref(_fb.db,"muted/"+n.toLowerCase())); apMsg(`✅ Unmuted ${n}!`); };
  // Reset ALL users' levels (works for offline users — they get reset on next visit)
  window.ap_resetAllLevels = async()=>{
    if(!confirm("⚠️ This will reset XP/levels for EVERY user, including those offline. They will see the reset the next time they visit. Continue?"))return;
    await _fbReady; if(!_fb)return;
    const ts = Date.now();
    await _fb.set(_fb.ref(_fb.db,"reset_levels_ts"), ts);
    // Also wipe the leaderboard in Firebase so it's clean
    await _fb.remove(_fb.ref(_fb.db,"leaderboard"));
    // Apply to self immediately
    localStorage.removeItem("xp");
    lsSet("last_level_reset_ack", ts.toString());
    _refreshXPDisplay();
    apMsg("✅ All levels reset! Offline users will be reset on their next visit.");
  };

  // Clear the online presence list (removes stale/test accounts)
  window.ap_clearOnlineList = async()=>{
    if(!confirm("Clear the entire online presence list? This removes all entries including test accounts."))return;
    await _fbReady; if(!_fb)return;
    await _fb.remove(_fb.ref(_fb.db,"online"));
    // Re-register self so you still show as online
    const uid = getUserId();
    const presRef = _fb.ref(_fb.db,"online/"+uid);
    await _fb.set(presRef,{username:getUsername(),ts:Date.now(),page:location.pathname,uid});
    // Refresh the list UI
    const el = document.getElementById("ap_online_list");
    if(el) el.innerHTML="<div style='opacity:.4;text-align:center;padding:12px;'>Cleared. Only you are shown now.</div>";
    document.querySelectorAll(".online_count,#onlineCount").forEach(el=>el.textContent="1");
    apMsg("✅ Online list cleared! Test accounts removed.");
  };

  window.ap_refreshOnline = async()=>{ const el=document.getElementById("ap_online_list"); if(!el)return; el.innerHTML="<div style='opacity:.4;text-align:center;padding:12px;'>Loading...</div>"; await _fbReady; if(!_fb)return; const snap=await _fb.get(_fb.ref(_fb.db,"online")); if(!snap.exists()){el.innerHTML="<div style='opacity:.4'>No data</div>";return;} const now2=Date.now(); let rows=[]; snap.forEach(c=>{const v=c.val();if((v.ts||0)>now2-300000)rows.push(v);}); rows.sort((a,b)=>b.ts-a.ts); el.innerHTML=rows.map(u=>{const active=now2-u.ts<60000;const s=Math.floor((now2-u.ts)/1000);const since=s<60?s+"s ago":s<3600?Math.floor(s/60)+"m ago":Math.floor(s/3600)+"h ago";return`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(255,255,255,.03);border-radius:10px;margin-bottom:5px;"><span style="width:8px;height:8px;border-radius:50%;background:${active?"#3cff9a":"rgba(255,255,255,.25)"};flex-shrink:0;${active?"box-shadow:0 0 8px #3cff9a":""}"></span><span style="font-weight:700;flex:1;">${escHtml(u.username||"?")}</span><span style="font-size:.75rem;opacity:.45;">${since}</span><span style="font-size:.72rem;opacity:.35;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(u.page||"/")}</span></div>`;}).join("")||"<div style='opacity:.4'>No recent visitors</div>"; apMsg("✅ Refreshed!"); };

  // Owner-only functions
  if (isOwner) {
    window.ap_saveAdminCode = async()=>{ const c=document.getElementById("ap_nac")?.value.trim(); if(!c)return; await _fbReady; if(_fb)await _fb.set(_fb.ref(_fb.db,"admin_code"),c); apMsg("✅ Admin code updated!"); };
    window.ap_resetBoard = async()=>{ if(!confirm("Reset leaderboard for EVERYONE?"))return; await _fbReady; if(_fb)try{await _fb.remove(_fb.ref(_fb.db,"leaderboard"));}catch(e){} apMsg("✅ Leaderboard reset!"); };
    window.ap_wipeUser = async()=>{ const n=document.getElementById("ap_wipe_u")?.value.trim(); if(!n)return; if(!confirm(`Wipe all data for ${n}?`))return; await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"wipe_user",targetName:n,from:getUsername(),ts:Date.now()}); apMsg(`✅ Wiped ${n}!`); };
    window.ap_massXP = async()=>{ const a=parseInt(document.getElementById("ap_mass_xp")?.value)||0; if(!a)return; await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"give_levels",amount:a,from:getUsername(),ts:Date.now()}); addLevels(a); apMsg(`✅ Mass XP: +${a} levels!`); };
    window.ap_sendAlert = async()=>{ const m=document.getElementById("ap_alert_msg")?.value.trim(); const u=document.getElementById("ap_alert_u")?.value.trim(); if(!m)return; await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"alert_msg",msg:m,targetName:u||"all",from:getUsername(),ts:Date.now()}); apMsg("✅ Alert sent!"); };
    window.ap_lockSite = async()=>{ const m=document.getElementById("ap_lock_msg")?.value.trim(); await _fbReady; if(_fb)await _fb.set(_fb.ref(_fb.db,"site_lock"),{locked:true,msg:m||"Site is currently locked.",by:getUsername(),ts:Date.now()}); apMsg("⚠️ Site locked!"); };
    window.ap_unlockSite = async()=>{ await _fbReady; if(_fb)await _fb.remove(_fb.ref(_fb.db,"site_lock")); apMsg("✅ Site unlocked!"); };
    window.ap_forceReload = async()=>{ await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"redirect",url:location.href,targetName:"all",from:getUsername(),ts:Date.now()}); apMsg("✅ Reload sent!"); };
    window.ap_setAccent = ()=>{ const c=document.getElementById("ap_accent")?.value; if(!c)return; document.documentElement.style.setProperty("--accent",c); lsSet("accent",c); apMsg("✅ Accent updated!"); };
    window.ap_setMOTD = async()=>{ const m=document.getElementById("ap_motd")?.value.trim(); if(!m)return; await _fbReady; if(_fb)await _fb.set(_fb.ref(_fb.db,"motd"),{msg:m,from:getUsername(),ts:Date.now()}); showGlobalBanner("📅 MOTD: "+m,getUsername()); apMsg("✅ MOTD set!"); };
    window.ap_setNextUpdate = ()=>{ const m=document.getElementById("ap_next_update")?.value.trim(); if(!m)return; lsSet("next_update_text",m); apMsg("✅ Next update note saved!"); };
    window.ap_loadAdminList = async()=>{ const el=document.getElementById("ap_admin_list_view"); await _fbReady; if(!_fb||!el)return; const snap=await _fb.get(_fb.ref(_fb.db,"admin_list")); if(snap.exists()){let h="";snap.forEach(c=>{h+=`<div>${escHtml(c.key)}: <span style="color:${c.val()?"#3cff9a":"#ff6b6b"}">${c.val()?"Admin":"Removed"}</span></div>`;});el.innerHTML=h;}else{el.innerHTML="No admins";} };
    window.ap_loadStats = async()=>{ const el=document.getElementById("ap_stats"); await _fbReady; if(!_fb||!el)return; const[lb,chat,coins]=await Promise.all([_fb.get(_fb.ref(_fb.db,"leaderboard")),_fb.get(_fb.ref(_fb.db,"chat")),_fb.get(_fb.ref(_fb.db,"coins"))]); el.innerHTML=`Players: ${lb.exists()?Object.keys(lb.val()).length:0}<br>Chat msgs: ${chat.exists()?Object.keys(chat.val()).length:0}<br>Coin holders: ${coins.exists()?Object.keys(coins.val()).length:0}`; };
    window.ap_loadOwnerSlots = async()=>{ const el=document.getElementById("ap_owner_slots"); await _fbReady; if(!_fb||!el)return; const snap=await _fb.get(_fb.ref(_fb.db,"owner_slots")); if(snap.exists()){let h="";snap.forEach(c=>{const v=c.val();h+=`<div>${escHtml(v.username||"?")} — <span style="opacity:.5;font-size:.78rem;">${new Date(v.ts||0).toLocaleDateString()}</span></div>`;});el.innerHTML=h;}else{el.innerHTML="No slots";} };
    window.ap_setXP = async()=>{ const n=document.getElementById("ap_set_xp_u")?.value.trim(); const v=parseInt(document.getElementById("ap_set_xp_v")?.value)||0; if(!n||!v)return; await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"give_levels",amount:Math.floor(v/100),targetName:n,from:getUsername(),ts:Date.now()}); apMsg(`✅ Set XP for ${n}!`); };
    window.ap_unlockAllTrails = ()=>{ const inv=JSON.parse(ls("inventory")||"{}"); if(!inv.trails)inv.trails={}; Object.keys(TRAIL_DEFS).forEach(k=>{if(k!=="none")inv.trails[k]={acquiredAt:Date.now(),gifted:true};}); lsSet("inventory",JSON.stringify(inv)); apMsg("✅ All trails unlocked locally!"); };
    window.ap_exportData = async()=>{ await _fbReady; if(!_fb)return; const snap=await _fb.get(_fb.ref(_fb.db,"leaderboard")); const data={leaderboard:snap.exists()?snap.val():{},exported:new Date().toISOString()}; const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a");a.href=url;a.download="oozecrib_data.json";a.click(); apMsg("✅ Exported!"); };
    window.ap_forceThemeAll = async()=>{ const t=document.getElementById("ap_ow_theme")?.value; if(!t)return; applyThemeCSS(t); lsSet("theme",t); await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"force_theme",theme:t,from:getUsername(),ts:Date.now()}); apMsg(`✅ Theme forced: ${t}!`); };
    window.ap_unban = async()=>{ const n=document.getElementById("ap_unban_u")?.value.trim(); if(!n)return; await _fbReady; if(_fb)await _fb.remove(_fb.ref(_fb.db,"bans/"+n.toLowerCase())); apMsg(`✅ Unbanned ${n}!`); };
    window.ap_redirectAll = async()=>{ const url=document.getElementById("ap_redir_all")?.value.trim(); if(!url)return; if(!confirm(`Redirect ALL users to ${url}?`))return; await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"redirect",url,targetName:"all",from:getUsername(),ts:Date.now()}); apMsg("✅ Redirect sent to all!"); };
    window.ap_resetVisits = ()=>{ const n=document.getElementById("ap_reset_u")?.value.trim(); if(n&&n.toLowerCase()===getUsername().toLowerCase()){lsSet("visits","0");apMsg("✅ Visits reset!");}else{apMsg("⚠️ Can only reset your own visits locally",false);} };
    window.ap_loadChatLog = async()=>{ const el=document.getElementById("ap_chatLog"); if(!el)return; await _fbReady; if(!_fb){el.innerHTML="No Firebase";return;} const snap=await _fb.get(_fb.query(_fb.ref(_fb.db,"chat"),_fb.orderByChild("ts"),_fb.limitToLast(20))); if(!snap.exists()){el.innerHTML="<span style='opacity:.5'>No messages</span>";return;} let msgs=[]; snap.forEach(c=>msgs.push(c.val())); msgs.sort((a,b)=>(b.ts||0)-(a.ts||0)); el.innerHTML=msgs.map(m=>`<div style="margin-bottom:3px;"><strong style="color:${escHtml(m.color||"#3cff9a")}">${escHtml(m.user||"?")}:</strong> ${escHtml(m.msg||"[media]")}</div>`).join(""); };
    window.ap_setColorMOTD = async()=>{ const m=document.getElementById("ap_motd_text")?.value.trim(); const c=document.getElementById("ap_motd_color")?.value||"#3cff9a"; if(!m)return; showGlobalBanner(m,getUsername()); await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_messages"),{msg:m,from:getUsername(),ts:Date.now(),color:c}); apMsg("✅ Colored banner sent!"); };
    window.ap_massGiveTrail = async()=>{ const t=document.getElementById("ap_mass_trail")?.value; if(!t)return; await _fbReady; if(_fb)await _fb.push(_fb.ref(_fb.db,"global_events"),{type:"give_trail",trailId:t,targetName:"all",from:getUsername(),ts:Date.now()}); const inv=JSON.parse(ls("inventory")||"{}"); if(!inv.trails)inv.trails={}; inv.trails[t]={acquiredAt:Date.now(),gifted:true}; lsSet("inventory",JSON.stringify(inv)); apMsg(`✅ Trail given to all!`); };
  }

  if (typeof unlockAchievement === "function") unlockAchievement("admin_panel");
}

/* ══ ACHIEVEMENTS ══ */
const ACH_LIST = [
  ["first_visit","First Visit","Visit for the first time",50,"🌟"],["first_rename","Identity","Change your display name",50,"✏️"],
  ["first_game","Gamer","Open any game",50,"🎮"],["first_music","Music Fan","Play any song",50,"🎵"],
  ["first_msg","Chatterbox","Send your first chat message",75,"💬"],
  ["lvl_1","Level 1","Reach Level 1",100,"⭐"],["lvl_5","Level 5","Reach Level 5",150,"🔥"],
  ["lvl_10","Level 10","Reach Level 10",300,"💎"],["lvl_25","Level 25","Reach Level 25",500,"👑"],
  ["xp_500","XP Grinder","Earn 500 XP",100,"⚡"],["xp_2000","XP Farmer","Earn 2,000 XP",200,"🚀"],
  ["xp_5000","XP Addict","Earn 5,000 XP",400,"🏆"],
  ["daily_1","Daily I","Claim daily once",100,"📅"],["daily_7","Daily II","Claim daily 7 times",200,"📆"],["daily_30","Daily III","Claim daily 30 times",400,"🗓️"],
  ["visits_5","Explorer I","Visit 5 times",100,"🗺️"],["visits_25","Explorer II","Visit 25 times",200,"🧭"],["visits_100","Explorer III","Visit 100 times",400,"🌍"],
  ["chat_10","Chatty","Send 10 messages",100,"🗣️"],["chat_50","Social Butterfly","Send 50 messages",250,"🦋"],
  ["games_5","Arcade Regular","Open 5 games",100,"🕹️"],["games_20","Arcade Master","Open 20 games",300,"🎯"],
  ["admin_panel","Secret Admin","Find admin panel",200,"🛡️"],["veteran","Veteran","Use site 30 days",500,"🎖️"],
  ["unlock_20","Achievement Hunter","Unlock 20 achievements",400,"🏅"],["unlock_all","Ultimate User","Unlock every achievement",1000,"🌈"],
  ["first_drop","Drop Opener","Open your first Ooze Drop",150,"🎁"],["first_shop","Shopper","Buy from the shop",100,"🛒"],
];
function getUnlockedAch() { return JSON.parse(ls("unlocked_ach") || "{}"); }
function unlockAchievement(achId) {
  const ach = ACH_LIST.find(a => a[0] === achId); if (!ach) return false;
  const unlocked = getUnlockedAch(); if (unlocked[achId]) return false;
  unlocked[achId] = Date.now(); lsSet("unlocked_ach", JSON.stringify(unlocked));
  _addXPRaw(ach[3]); _achToast(ach[1], ach[2], ach[4], ach[3]);
  const count = Object.keys(unlocked).length;
  if (count >= 20) setTimeout(() => unlockAchievement("unlock_20"), 100);
  if (count >= ACH_LIST.length - 1) setTimeout(() => unlockAchievement("unlock_all"), 200);
  const el = document.getElementById("stat_ach"); if (el) el.innerText = count;
  return true;
}
function _achToast(name, desc, icon, xp) { const t = document.createElement("div"); t.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0d0d1f;border:2px solid #3cff9a;border-radius:18px;padding:14px 22px;z-index:99998;display:flex;align-items:center;gap:14px;box-shadow:0 0 40px rgba(60,255,154,.35);max-width:340px;transition:opacity .5s;"; t.innerHTML = `<span style="font-size:2rem">${icon}</span><div><div style="font-weight:800;color:#3cff9a;">Achievement!</div><div style="font-weight:700;font-size:.95rem;">${escHtml(name)}</div><div style="opacity:.65;font-size:.82rem;">${escHtml(desc)}</div><div style="color:gold;font-size:.82rem;margin-top:2px;">+${xp} XP</div></div>`; document.body.appendChild(t); setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 600); }, 4500); }
function checkAchievements() {
  const xpNum = Number(BigInt(ls("xp") || "0")); const level = Math.floor(xpNum / 100); const visits = parseInt(ls("visits") || "0"); const daily = parseInt(ls("dailyClaims") || "0"); const msgs = parseInt(ls("chatMsgCount") || "0"); const games = parseInt(ls("gamesOpened") || "0"); const days = parseInt(ls("daysUsed") || "0");
  [["first_visit",visits>=1],["lvl_1",level>=1],["lvl_5",level>=5],["lvl_10",level>=10],["lvl_25",level>=25],["xp_500",xpNum>=500],["xp_2000",xpNum>=2000],["xp_5000",xpNum>=5000],["daily_1",daily>=1],["daily_7",daily>=7],["daily_30",daily>=30],["visits_5",visits>=5],["visits_25",visits>=25],["visits_100",visits>=100],["chat_10",msgs>=10],["chat_50",msgs>=50],["games_5",games>=5],["games_20",games>=20],["veteran",days>=30]].forEach(([id,cond]) => { if (cond) unlockAchievement(id); });
}
function loadAchievementsPage() {
  const grid = document.getElementById("achGrid"); if (!grid) return;
  const unlocked = getUnlockedAch(); const uc = Object.keys(unlocked).length; const total = ACH_LIST.length;
  let header = document.getElementById("achHeader"); if (!header) { header = document.createElement("div"); header.id = "achHeader"; header.style.marginBottom = "24px"; grid.parentElement.insertBefore(header, grid); }
  header.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span style="font-size:1.1rem;font-weight:700;">${uc} / ${total} Unlocked</span><span style="color:gold;font-weight:700;">${Math.round(uc/total*100)}%</span></div><div style="background:rgba(255,255,255,.1);border-radius:99px;height:8px;overflow:hidden;"><div style="background:linear-gradient(90deg,#3cff9a,#6b48ff);height:100%;width:${uc/total*100}%;transition:width .6s;border-radius:99px;"></div></div>`;
  grid.innerHTML = "";
  ACH_LIST.forEach(([id,name,desc,xp,icon]) => { const isU = !!unlocked[id]; const div = document.createElement("div"); div.className = "ach-card "+(isU?"unlocked":"locked"); div.innerHTML = `<div style="font-size:2.2rem;margin-bottom:8px;">${icon}</div><div class="ach-title">${escHtml(name)}</div><div class="ach-desc">${escHtml(desc)}</div><div class="ach-xp">+${xp} XP</div><div style="margin-top:10px;font-size:.85rem;">${isU?`<span style="color:#3cff9a;font-weight:700;">✅ UNLOCKED</span><br><span style="opacity:.4;font-size:.75rem;">${new Date(unlocked[id]).toLocaleDateString()}</span>`:`<span style="opacity:.5;">🔒 LOCKED</span>`}</div>`; grid.appendChild(div); });
}
function updateAchCount() { const el = document.getElementById("stat_ach"); if (el) el.innerText = Object.keys(getUnlockedAch()).length; }

/* ══ STAT TRACKERS ══ */
function trackVisit() { const v = parseInt(ls("visits") || "0") + 1; lsSet("visits", v); const today = Math.floor(Date.now() / 86400000); if (today > parseInt(ls("lastVisitDay") || "0")) { lsSet("lastVisitDay", today); lsSet("daysUsed", String(parseInt(ls("daysUsed") || "0") + 1)); } checkAchievements(); }
function trackChatMsg() { const m = parseInt(ls("chatMsgCount") || "0") + 1; lsSet("chatMsgCount", m); unlockAchievement("first_msg"); checkAchievements(); }

/* ══ SITE LOCK ══ */
async function _checkSiteLock() {
  await _fbReady; if (!_fb) return;
  _fb.onValue(_fb.ref(_fb.db, "site_lock"), snap => {
    if (snap.exists() && snap.val().locked && !_isOwner()) {
      const msg = snap.val().msg || "Site is currently locked.";
      document.body.innerHTML = `<div style="position:fixed;inset:0;background:#000510;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;z-index:9999999;"><div style="font-size:3rem;">🔒</div><div style="color:#3cff9a;font-size:1.4rem;font-weight:900;">${escHtml(msg)}</div><div style="opacity:.4;font-size:.9rem;">Check back later</div></div>`;
    }
  });
}

/* ══ INIT ══ */
document.addEventListener("DOMContentLoaded", () => {
  if (ls("oozecrib_banned") === "1") {
    document.body.innerHTML = `<div style="position:fixed;inset:0;background:#000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;z-index:9999999;"><div style="font-size:3rem;">🚫</div><div style="color:#ff6b6b;font-size:1.4rem;font-weight:900;">You are banned.</div><div style="opacity:.5;">${escHtml(ls("ban_reason") || "")}</div></div>`;
    return;
  }
  applyAllSettings(); _refreshCoinDisplay(); _refreshXPDisplay(); updateAchCount(); trackVisit(); loadGameOfDay(); _checkFirstVisitUsername(); _checkSiteLock();
  // Check if a level reset was issued while this user was offline
  _fbReady.then(async () => {
    if (!_fb) return;
    try {
      const snap = await _fb.get(_fb.ref(_fb.db, "reset_levels_ts"));
      if (snap.exists()) {
        const resetTs = snap.val();
        const lastReset = parseInt(ls("last_level_reset_ack") || "0");
        if (resetTs > lastReset) {
          // Reset hasn't been applied yet — wipe XP now
          localStorage.removeItem("xp");
          lsSet("last_level_reset_ack", resetTs.toString());
          _refreshXPDisplay();
          saveLeaderboard();
          showEventToast("⭐ Levels have been reset!", "#ffe600");
        }
      }
    } catch(e) {}
  });
  // Weather widget (any page that has the element)
  if (document.getElementById("weatherWidget")) { setTimeout(() => loadWeatherWidget("weatherWidget"), 500); }
  // Game cards (ratings, favorites, play stats) on pages with game grid
  if (document.querySelector(".grid .btn[onclick]")) { setTimeout(() => _initGameCards(), 700); }
  _fbReady.then(() => { if (_fb) { const chatRef = _fb.ref(_fb.db, "chat"); _initFullChat(chatRef); } });
});
window.saveToLeaderboard = saveLeaderboard;
