const MODES = [
  {id:"overall", label:"Overall", icon:"✦"},
  {id:"sword", label:"Sword", icon:"⚔"},
  {id:"uhc", label:"UHC", icon:"♜"},
  {id:"diamondSmp", label:"Diamond SMP", icon:"◇"},
  {id:"diapot", label:"Diapot", icon:"◉"},
  {id:"netherite", label:"Netherite", icon:"⬟"},
  {id:"mace", label:"Mace", icon:"⚒"},
  {id:"crystal", label:"Crystal", icon:"✥"},
  {id:"axe", label:"Axe", icon:"⌁"},
  {id:"smp", label:"SMP", icon:"◇"}
];

const TIERS = ["HT1","LT1","HT2","LT2","HT3","LT3","HT4","LT4","HT5","LT5"];
const POINTS = {HT1:60,LT1:50,HT2:40,LT2:35,HT3:30,LT3:25,HT4:20,LT4:15,HT5:10,LT5:5};

const aliases = {
  diamondSmp:["diamondSmp","diamond_smp","diamond smp","Diamond SMP"],
  diapot:["diapot","diaPot","dia_pot","DiaPot"],
  netherite:["netherite"],
  crystal:["crystal","vanilla","crystals"],
  sword:["sword"],
  uhc:["uhc"],
  mace:["mace"],
  axe:["axe"],
  smp:["smp"]
};

let players = [];
let selectedMode = "overall";

const $ = s => document.querySelector(s);

function normalizeTier(tier){
  if(!tier) return null;
  const t = String(tier).trim().toUpperCase().replace(/\s+/g,"");
  return TIERS.includes(t) ? t : null;
}
function getTier(p, mode){
  if(!p || !p.tiers) return null;
  for(const key of (aliases[mode] || [mode])){
    if(Object.prototype.hasOwnProperty.call(p.tiers,key)){
      const t=normalizeTier(p.tiers[key]);
      if(t) return t;
    }
  }
  return null;
}
function scorePlayer(p){
  return Object.keys(aliases).reduce((sum,mode)=>sum+(POINTS[getTier(p,mode)]||0),0);
}
function displayName(p){
  return p.minecraft || p.username || p.name || "Unknown Player";
}
function avatarUrl(p){
  const name=displayName(p);
  return name && name!=="Unknown Player"
    ? `https://mc-heads.net/avatar/${encodeURIComponent(name)}/64`
    : "";
}
function tierClass(tier){return tier ? tier.toLowerCase() : ""}
function regionOf(p){
  const r=(p.region||"").toUpperCase();
  return r || "";
}
function sortedPlayers(){
  return [...players].sort((a,b)=>{
    const diff=scorePlayer(b)-scorePlayer(a);
    return diff || displayName(a).localeCompare(displayName(b));
  });
}
function modePlayers(mode){
  return [...players].filter(p=>getTier(p,mode)).sort((a,b)=>{
    const ta=getTier(a,mode),tb=getTier(b,mode);
    return TIERS.indexOf(ta)-TIERS.indexOf(tb) || displayName(a).localeCompare(displayName(b));
  });
}
function buildModeBar(){
  $("#modeBar").innerHTML=MODES.map(m=>`
    <button class="mode-btn ${m.id===selectedMode?"active":""}" data-mode="${m.id}">
      <span class="mode-icon">${m.icon}</span><span>${m.label}</span>
    </button>`).join("");
  document.querySelectorAll(".mode-btn").forEach(b=>b.addEventListener("click",()=>{
    selectedMode=b.dataset.mode; render();
    document.querySelector("#leaderboard").scrollIntoView({behavior:"smooth",block:"start"});
  }));
}
function playerRow(p,i){
  const avatar=avatarUrl(p);

  const tierDisplays=Object.keys(aliases).map(mode=>{
    const tier=getTier(p,mode);
    const modeInfo=MODES.find(m=>m.id===mode);

    return `
      <div class="tier-display" title="${modeInfo.label}: ${tier || "Untested"}">
        <span class="tier-mode-icon">${modeInfo.icon}</span>
        <span class="tier-label ${tierClass(tier)}">${tier || "—"}</span>
      </div>
    `;
  }).join("");

  return `<article class="player-row" data-player="${encodeURIComponent(displayName(p))}">
    <div class="rank">${i+1}.</div>

    <div class="player-main">
      ${avatar?`<img class="avatar" src="${avatar}" alt="">`:""}
      <div>
        <div class="player-name">${escapeHtml(displayName(p))}</div>
        <div class="player-sub">${scorePlayer(p)} points</div>
      </div>
    </div>

    <div class="tier-pills">
      ${tierDisplays}
    </div>

    <div class="score">
      <b>${scorePlayer(p)}</b>
      <small>points</small>
    </div>
  </article>`;
}
function renderOverall(){
  const list=sortedPlayers();
  $("#view").innerHTML=`<div class="overall-list">${list.length?list.map(playerRow).join(""):`<div class="empty">No players found.</div>`}</div>`;
  document.querySelectorAll(".player-row").forEach(row=>row.addEventListener("click",()=>{
    const name=decodeURIComponent(row.dataset.player);
    const p=players.find(x=>displayName(x)===name); if(p) openModal(p);
  }));
}
function renderBoard(){
  const mode=selectedMode;
  const groups={1:{high:[],low:[]},2:{high:[],low:[]},3:{high:[],low:[]},4:{high:[],low:[]},5:{high:[],low:[]}};
  modePlayers(mode).forEach(p=>{
    const t=getTier(p,mode); const n=Number(t.slice(2));
    groups[n][t.startsWith("HT")?"high":"low"].push(p);
  });
  $("#view").innerHTML=`<div class="tier-board">${[1,2,3,4,5].map(n=>`
    <section class="tier-column">
      <div class="tier-header">Tier ${n}<span class="points">${POINTS["HT"+n]} / ${POINTS["LT"+n]} pts</span></div>
      <div class="tier-half"><div class="half-label">HT${n}</div>${boardPlayers(groups[n].high)}</div>
      <div class="tier-half"><div class="half-label">LT${n}</div>${boardPlayers(groups[n].low)}</div>
    </section>`).join("")}</div>`;
  document.querySelectorAll(".board-player").forEach(el=>el.addEventListener("click",()=>{
    const p=players.find(x=>displayName(x)===decodeURIComponent(el.dataset.player)); if(p) openModal(p);
  }));
}
function boardPlayers(list){
  if(!list.length)return `<div class="empty">No players</div>`;
  return list.map(p=>`<div class="board-player" data-player="${encodeURIComponent(displayName(p))}">
    ${avatarUrl(p)?`<img class="board-avatar" src="${avatarUrl(p)}" alt="">`:""}
    <span class="board-name">${escapeHtml(displayName(p))}</span>
  </div>`).join("");
}
function render(){
  buildModeBar();
  const overall=selectedMode==="overall";
  $("#viewEyebrow").textContent=overall?"OVERALL RANKING":`${MODES.find(m=>m.id===selectedMode).label.toUpperCase()} RANKING`;
  $("#viewTitle").textContent=overall?"Overall":MODES.find(m=>m.id===selectedMode).label;
  overall?renderOverall():renderBoard();
  document.querySelectorAll("[data-overall]").forEach(e=>e.classList.toggle("active",overall));
}
function openModal(p){
  const tiers=Object.keys(aliases).map(m=>({mode:MODES.find(x=>x.id===m)?.label||m,tier:getTier(p,m)}));
  $("#modalContent").innerHTML=`
    <div class="modal-profile">${avatarUrl(p)?`<img src="${avatarUrl(p)}" alt="">`:""}<div><h3>${escapeHtml(displayName(p))}</h3><p>${scorePlayer(p)} overall points</p></div></div>
    <div class="modal-tiers">${tiers.map(x=>`<div class="modal-tier"><small>${escapeHtml(x.mode)}</small><b>${x.tier||"Untested"}</b></div>`).join("")}</div>`;
  $("#playerModal").classList.add("open"); $("#playerModal").setAttribute("aria-hidden","false");
}
function closeModal(){$("#playerModal").classList.remove("open");$("#playerModal").setAttribute("aria-hidden","true")}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

async function loadPlayers(){
  try{
    const res=await fetch(`players.json?cache=${Date.now()}`);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    players=Array.isArray(data)?data:Object.entries(data).map(([id,p])=>({id,...p}));
    $("#dataStatus").textContent=`${players.length} players • live data`;
  }catch(err){
    console.error(err);
    players=[];
    $("#dataStatus").textContent="Could not load players.json";
  }
  render();
}

document.addEventListener("click",e=>{
  if(e.target.matches("[data-close-modal]"))closeModal();
  if(e.target.closest("[data-info]"))$("#information").scrollIntoView({behavior:"smooth"});
  if(e.target.closest("[data-home]")){e.preventDefault();window.scrollTo({top:0,behavior:"smooth"});}
  if(e.target.closest("[data-overall]")&&!e.target.closest(".mode-btn")){
    e.preventDefault();selectedMode="overall";render();$("#leaderboard").scrollIntoView({behavior:"smooth"});
  }
});
$("#playerSearch").addEventListener("input",e=>{
  const q=e.target.value.trim().toLowerCase();
  document.querySelectorAll(".player-row,.board-player").forEach(el=>{
    el.style.display=!q||decodeURIComponent(el.dataset.player).toLowerCase().includes(q)?"":"none";
  });
});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
const grid=$("#pointGrid");
grid.innerHTML=TIERS.map(t=>`<div class="point"><b>${t}</b><span>${POINTS[t]} points</span></div>`).join("");
loadPlayers();
