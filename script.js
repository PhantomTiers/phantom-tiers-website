const MODES = [
  {id:"overall", label:"Overall", icon:"✦", color:"overall"},
  {id:"sword", label:"Sword", icon:"⚔", color:"sword"},
  {id:"uhc", label:"UHC", icon:"♜", color:"uhc"},
  {id:"diamondSmp", label:"Diamond SMP", icon:"◇", color:"diamond"},
  {id:"diapot", label:"Diapot", icon:"◉", color:"diapot"},
  {id:"netherite", label:"Netherite", icon:"⬟", color:"netherite"},
  {id:"mace", label:"Mace", icon:"⚒", color:"mace"},
  {id:"crystal", label:"Crystal", icon:"✥", color:"crystal"},
  {id:"axe", label:"Axe", icon:"⌁", color:"axe"},
  {id:"smp", label:"SMP", icon:"◇", color:"smp"}
];

const TIERS = [
  "HT1","LT1",
  "HT2","LT2",
  "HT3","LT3",
  "HT4","LT4",
  "HT5","LT5"
];

const POINTS = {
  HT1:60,
  LT1:45,
  HT2:30,
  LT2:20,
  HT3:10,
  LT3:6,
  HT4:4,
  LT4:3,
  HT5:2,
  LT5:1
};

const aliases = {
  diamondSmp:["diamondSmp","diamondsmp","diamond_smp","diamond smp","Diamond SMP"],
  diapot:["diapot","diaPot","dia_pot","DiaPot"],
  netherite:["netherite"],
  crystal:["crystal","vanilla","crystals"],
  sword:["sword"],
  uhc:["uhc"],
  mace:["mace"],
  axe:["axe"],
  smp:["smp"]
};

const RANKING_MODES = MODES.filter(m => m.id !== "overall");

let players = [];
let selectedMode = "overall";

const $ = s => document.querySelector(s);


/* =========================
   TIER HELPERS
========================= */

function normalizeTier(tier){
  if(!tier) return null;

  const t = String(tier)
    .trim()
    .toUpperCase()
    .replace(/\s+/g,"");

  return TIERS.includes(t) ? t : null;
}


function getTier(p, mode){
  if(!p || !p.tiers) return null;

  for(const key of (aliases[mode] || [mode])){
    if(Object.prototype.hasOwnProperty.call(p.tiers,key)){
      const t = normalizeTier(p.tiers[key]);

      if(t) return t;
    }
  }

  return null;
}


function scorePlayer(p){
  return RANKING_MODES.reduce(
    (sum,mode) => sum + (POINTS[getTier(p,mode.id)] || 0),
    0
  );
}


function displayName(p){
  return p.minecraft ||
         p.username ||
         p.name ||
         "Unknown Player";
}


function avatarUrl(p){
  const name = displayName(p);

  return name && name !== "Unknown Player"
    ? `https://mc-heads.net/avatar/${encodeURIComponent(name)}/64`
    : "";
}


function tierClass(tier){
  return tier ? tier.toLowerCase() : "";
}


function regionOf(p){
  const r = (p.region || "").toUpperCase();

  return r || "";
}


/* =========================
   SORTING
========================= */

function sortedPlayers(){
  return [...players].sort((a,b) => {

    const diff =
      scorePlayer(b) -
      scorePlayer(a);

    return diff ||
      displayName(a).localeCompare(
        displayName(b)
      );
  });
}


function modePlayers(mode){
  return [...players]
    .filter(p => getTier(p,mode))
    .sort((a,b) => {

      const ta = getTier(a,mode);
      const tb = getTier(b,mode);

      return (
        TIERS.indexOf(ta) -
        TIERS.indexOf(tb)
      ) ||
      displayName(a).localeCompare(
        displayName(b)
      );
    });
}


/* =========================
   MODE BAR
========================= */

function buildModeBar(){

  $("#modeBar").innerHTML =
    MODES.map(m => `

      <button
        class="mode-btn ${m.id === selectedMode ? "active" : ""}"
        data-mode="${m.id}"
      >

        <span class="mode-icon mode-${m.color}">
          ${m.icon}
        </span>

        <span>${m.label}</span>

      </button>

    `).join("");


  document
    .querySelectorAll(".mode-btn")
    .forEach(b => {

      b.addEventListener("click", () => {

        selectedMode =
          b.dataset.mode;

        render();

        document
          .querySelector("#leaderboard")
          .scrollIntoView({
            behavior:"smooth",
            block:"start"
          });

      });

    });
}


/* =========================
   OVERALL PLAYER ROW
========================= */

function playerRow(p,i){

  const avatar = avatarUrl(p);

  const tierDisplays =
    RANKING_MODES.map(modeInfo => {

      const tier =
        getTier(p,modeInfo.id);

      /*
        IMPORTANT:

        If the player has NOT been tiered
        in this gamemode, the entire mode
        display is invisible.

        No dash.
        No empty box.
        Nothing.
      */

      if(!tier){
        return `
          <div class="tier-display tier-hidden"></div>
        `;
      }

      return `
        <div
          class="tier-display"
          title="${escapeHtml(modeInfo.label)}: ${tier}"
        >

          <span
            class="tier-mode-icon mode-${modeInfo.color}"
          >
            ${modeInfo.icon}
          </span>

          <span class="tier-mode-name">
            ${escapeHtml(modeInfo.label)}
          </span>

          <span class="tier-label ${tierClass(tier)}">
            ${tier}
          </span>

        </div>
      `;

    }).join("");


  return `

    <article
      class="player-row"
      data-player="${encodeURIComponent(displayName(p))}"
    >

      <div class="rank">
        ${i+1}.
      </div>


      <div class="player-main">

        ${
          avatar
            ? `<img
                class="avatar"
                src="${avatar}"
                alt=""
              >`
            : ""
        }

        <div>

          <div class="player-name">
            ${escapeHtml(displayName(p))}
          </div>

          <div class="player-sub">
            ${scorePlayer(p)} points
          </div>

        </div>

      </div>


      <div class="tier-pills">

        ${tierDisplays}

      </div>


      <div class="score">

        <b>
          ${scorePlayer(p)}
        </b>

        <small>
          points
        </small>

      </div>

    </article>

  `;
}


/* =========================
   OVERALL PAGE
========================= */

function renderOverall(){

  const list = sortedPlayers();

  $("#view").innerHTML = `

    <div class="overall-list">

      ${
        list.length
          ? list.map(playerRow).join("")
          : `<div class="empty">
               No players found.
             </div>`
      }

    </div>

  `;


  document
    .querySelectorAll(".player-row")
    .forEach(row => {

      row.addEventListener("click", () => {

        const name =
          decodeURIComponent(
            row.dataset.player
          );

        const p =
          players.find(
            x => displayName(x) === name
          );

        if(p) openModal(p);

      });

    });
}


/* =========================
   GAMEMODE BOARD
========================= */

function renderBoard(){

  const mode = selectedMode;

  const groups = {

    1:{high:[],low:[]},
    2:{high:[],low:[]},
    3:{high:[],low:[]},
    4:{high:[],low:[]},
    5:{high:[],low:[]}

  };


  modePlayers(mode).forEach(p => {

    const t =
      getTier(p,mode);

    const n =
      Number(t.slice(2));

    groups[n][
      t.startsWith("HT")
        ? "high"
        : "low"
    ].push(p);

  });


  $("#view").innerHTML = `

    <div class="tier-board">

      ${
        [1,2,3,4,5].map(n => `

          <section class="tier-column">

            <div class="tier-header">

              Tier ${n}

              <span class="points">
                ${POINTS["HT"+n]}
                /
                ${POINTS["LT"+n]}
                pts
              </span>

            </div>


            <div class="tier-half">

              <div class="half-label">
                HT${n}
              </div>

              ${
                boardPlayers(
                  groups[n].high
                )
              }

            </div>


            <div class="tier-half">

              <div class="half-label">
                LT${n}
              </div>

              ${
                boardPlayers(
                  groups[n].low
                )
              }

            </div>

          </section>

        `).join("")
      }

    </div>

  `;


  document
    .querySelectorAll(".board-player")
    .forEach(el => {

      el.addEventListener("click", () => {

        const p =
          players.find(
            x =>
              displayName(x) ===
              decodeURIComponent(
                el.dataset.player
              )
          );

        if(p) openModal(p);

      });

    });
}


/* =========================
   BOARD PLAYERS
========================= */

function boardPlayers(list){

  if(!list.length){

    return `
      <div class="empty">
        No players
      </div>
    `;

  }


  return list.map(p => `

    <div
      class="board-player"
      data-player="${encodeURIComponent(displayName(p))}"
    >

      ${
        avatarUrl(p)
          ? `<img
              class="board-avatar"
              src="${avatarUrl(p)}"
              alt=""
            >`
          : ""
      }

      <span class="board-name">
        ${escapeHtml(displayName(p))}
      </span>

    </div>

  `).join("");
}


/* =========================
   MAIN RENDER
========================= */

function render(){

  buildModeBar();

  const overall =
    selectedMode === "overall";

  const modeInfo =
    MODES.find(
      m => m.id === selectedMode
    );


  $("#viewEyebrow").textContent =
    overall
      ? "OVERALL RANKING"
      : `${modeInfo.label.toUpperCase()} RANKING`;


  $("#viewTitle").textContent =
    overall
      ? "Overall"
      : modeInfo.label;


  overall
    ? renderOverall()
    : renderBoard();


  document
    .querySelectorAll("[data-overall]")
    .forEach(e => {

      e.classList.toggle(
        "active",
        overall
      );

    });
}


/* =========================
   PLAYER MODAL
========================= */

function openModal(p){

  const tiers =
    RANKING_MODES.map(modeInfo => ({

      mode:
        modeInfo.label,

      tier:
        getTier(
          p,
          modeInfo.id
        )

    }));


  $("#modalContent").innerHTML = `

    <div class="modal-profile">

      ${
        avatarUrl(p)
          ? `<img
              src="${avatarUrl(p)}"
              alt=""
            >`
          : ""
      }

      <div>

        <h3>
          ${escapeHtml(displayName(p))}
        </h3>

        <p>
          ${scorePlayer(p)}
          overall points
        </p>

      </div>

    </div>


    <div class="modal-tiers">

      ${
        tiers.map(x => `

          <div class="modal-tier">

            <small>
              ${escapeHtml(x.mode)}
            </small>

            <b>
              ${x.tier || "Untested"}
            </b>

          </div>

        `).join("")
      }

    </div>

  `;


  $("#playerModal")
    .classList.add("open");


  $("#playerModal")
    .setAttribute(
      "aria-hidden",
      "false"
    );
}


function closeModal(){

  $("#playerModal")
    .classList.remove("open");

  $("#playerModal")
    .setAttribute(
      "aria-hidden",
      "true"
    );
}


/* =========================
   HTML SAFETY
========================= */

function escapeHtml(s){

  return String(s).replace(
    /[&<>"']/g,
    c => ({

      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"

    }[c])
  );

}


/* =========================
   LOAD PLAYERS
========================= */

async function loadPlayers(){

  try{

    const res =
      await fetch(
        `players.json?cache=${Date.now()}`
      );


    if(!res.ok){

      throw new Error(
        `HTTP ${res.status}`
      );

    }


    const data =
      await res.json();


    players =
      Array.isArray(data)
        ? data
        : Object.entries(data)
            .map(([id,p]) => ({
              id,
              ...p
            }));


    $("#dataStatus").textContent =
      `${players.length} players • live data`;

  }

  catch(err){

    console.error(err);

    players = [];

    $("#dataStatus").textContent =
      "Could not load players.json";

  }


  render();
}


/* =========================
   GLOBAL EVENTS
========================= */

document.addEventListener(
  "click",
  e => {

    if(
      e.target.matches(
        "[data-close-modal]"
      )
    ){

      closeModal();

    }


    if(
      e.target.closest(
        "[data-info]"
      )
    ){

      $("#information")
        .scrollIntoView({
          behavior:"smooth"
        });

    }


    if(
      e.target.closest(
        "[data-home]"
      )
    ){

      e.preventDefault();

      window.scrollTo({
        top:0,
        behavior:"smooth"
      });

    }


    if(
      e.target.closest(
        "[data-overall]"
      ) &&
      !e.target.closest(".mode-btn")
    ){

      e.preventDefault();

      selectedMode =
        "overall";

      render();

      $("#leaderboard")
        .scrollIntoView({
          behavior:"smooth"
        });

    }

  }
);


/* =========================
   SEARCH
========================= */

$("#playerSearch")
  .addEventListener(
    "input",
    e => {

      const q =
        e.target.value
          .trim()
          .toLowerCase();


      document
        .querySelectorAll(
          ".player-row,.board-player"
        )
        .forEach(el => {

          const name =
            decodeURIComponent(
              el.dataset.player
            ).toLowerCase();


          el.style.display =
            !q || name.includes(q)
              ? ""
              : "none";

        });

    }
  );


/* =========================
   KEYBOARD
========================= */

document.addEventListener(
  "keydown",
  e => {

    if(e.key === "Escape"){
      closeModal();
    }

  }
);


/* =========================
   POINT GRID
========================= */

const grid =
  $("#pointGrid");


grid.innerHTML =
  TIERS.map(t => `

    <div class="point">

      <b>
        ${t}
      </b>

      <span>
        ${POINTS[t]} points
      </span>

    </div>

  `).join("");


/* =========================
   START
========================= */

loadPlayers();
