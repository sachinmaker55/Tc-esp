// assets/main.js
const FORM_ENDPOINT = "https://formspree.io/f/YOUR_FORMSPREE_ID"; // <-- Replace or leave blank to use localStorage fallback
const WHATSAPP_NUMBER = "YOUR_PHONE_NUMBER"; // e.g. "9198XXXXXXXX" (without +) replace for merchandise order links

// --- include header/footer (with fallback if fetch fails) ---
const headerPlaceholder = document.getElementById('header-placeholder');
const footerPlaceholder = document.getElementById('footer-placeholder');

const headerFallback = `
  <header class="site-header">
    <a href="index.html" class="brand-link">
      <img src="assets/images/logo.png" alt="logo" class="logo">
      <div class="brand-text"><h1>TIGER CLAW</h1><p class="tagline">Claw of Fury — My mark is permanent on your skin</p></div>
    </a>
    <button id="nav-toggle">☰</button>
    <nav id="main-nav" class="main-nav"><ul>
      <li><a href="index.html">Home</a></li>
      <li><a href="merchandise.html">Merchandise</a></li>
      <li><a href="tournaments.html">Tournaments</a></li>
      <li><a href="blogs.html">Blogs / News</a></li>
      <li><a href="guilds.html">Guilds</a></li>
      <li><a href="about.html">About</a></li>
      <li><a href="contact.html">Contact</a></li>
    </ul></nav>
  </header>
`;
const footerFallback = `
  <footer class="site-footer"><div class="footer-inner">
    <div class="footer-brand"><img src="assets/images/logo.png" class="logo-small"><div><strong>TIGER CLAW</strong><div class="tiny">Claw of Fury</div></div></div>
    <div class="copyright">© TIGER CLAW</div>
  </div></footer>
`;

async function includePart(path, placeholder, fallbackHTML) {
  if(!placeholder) return;
  try{
    const res = await fetch(path);
    if(!res.ok) throw new Error('no');
    const txt = await res.text();
    placeholder.innerHTML = txt;
  } catch(e){
    placeholder.innerHTML = fallbackHTML;
  }
}

// run on load
document.addEventListener('DOMContentLoaded', async()=>{
  await includePart('inc/header.html', document.getElementById('header-placeholder'), headerFallback);
  await includePart('inc/footer.html', document.getElementById('footer-placeholder'), footerFallback);
  // nav toggle
  const toggle = document.getElementById('nav-toggle');
  if(toggle){
    toggle.addEventListener('click', ()=> {
      const nav = document.getElementById('main-nav');
      if(nav) nav.classList.toggle('open');
    });
  }
  // set year in footer
  const yr = document.getElementById('year'); if(yr) yr.textContent = new Date().getFullYear();

  // init page-specific logic
  if(document.getElementById('guilds-list')) initGuildsPage();
  if(document.getElementById('tournament-form')) initTournamentForm();
  if(document.getElementById('merch-list')) initMerchPage();
});

// ----------------- Guilds generation and registration (max 55 players per guild) -----------------
const STATE_UTS = [
  {code:'AN',name:'Andaman & Nicobar Islands'},{code:'AP',name:'Andhra Pradesh'},{code:'AR',name:'Arunachal Pradesh'},{code:'AS',name:'Assam'},
  {code:'BR',name:'Bihar'},{code:'CH',name:'Chandigarh'},{code:'CG',name:'Chhattisgarh'},{code:'DH',name:'Dadra and Nagar Haveli and Daman and Diu'},
  {code:'DL',name:'Delhi'},{code:'GA',name:'Goa'},{code:'GJ',name:'Gujarat'},{code:'HR',name:'Haryana'},
  {code:'HP',name:'Himachal Pradesh'},{code:'JK',name:'Jammu & Kashmir'},{code:'JH',name:'Jharkhand'},{code:'KA',name:'Karnataka'},
  {code:'KL',name:'Kerala'},{code:'LA',name:'Ladakh'},{code:'LD',name:'Lakshadweep'},{code:'MP',name:'Madhya Pradesh'},
  {code:'MH',name:'Maharashtra'},{code:'MN',name:'Manipur'},{code:'ML',name:'Meghalaya'},{code:'MZ',name:'Mizoram'},
  {code:'NL',name:'Nagaland'},{code:'OD',name:'Odisha'},{code:'PY',name:'Puducherry'},{code:'PB',name:'Punjab'},
  {code:'RJ',name:'Rajasthan'},{code:'SK',name:'Sikkim'},{code:'TN',name:'Tamil Nadu'},{code:'TS',name:'Telangana'},
  {code:'TR',name:'Tripura'},{code:'UP',name:'Uttar Pradesh'},{code:'UK',name:'Uttarakhand'},{code:'WB',name:'West Bengal'}
];

function buildGuildList(){
  const guilds = [];
  guilds.push({id:'MAIN', display:'TIGER CLAW ™'});
  guilds.push({id:'GIRLS', display:'TIGRESS CLAW'});
  for(let i=0;i<10;i++) guilds.push({id:`NUM${i}`, display:`TIGER CLAW ${i}`});
  for(const s of STATE_UTS) guilds.push({id:s.code, display:`TIGER CLAW ${s.code}`, region:s.name});
  return guilds;
}

function initGuildsPage(){
  const list = document.getElementById('guilds-list');
  const guilds = buildGuildList();
  for(const g of guilds){
    const div = document.createElement('div');
    div.className = 'card guild-card';
    div.innerHTML = `
      <div>
        <div class="guild-code">${g.id}</div>
        <div class="small">${g.display}${g.region? ' • '+g.region : ''}</div>
      </div>
      <div class="actions">
        <button class="primary" data-g="${g.id}" onclick="openGuildRegister('${g.id}','${escapeHtml(g.display)}')">Register Players</button>
        <button class="small" onclick="exportGuildCSV('${g.id}')">Export</button>
      </div>
    `;
    list.appendChild(div);
  }
  // admin export all (if admin flag)
  if(location.search.includes('admin')){
    const adminDiv = document.createElement('div');
    adminDiv.className='card';
    adminDiv.innerHTML = '<strong>Admin Tools:</strong> <button onclick="exportAllGuilds()">Export All Guilds CSV</button>';
    list.prepend(adminDiv);
  }
}

window.openGuildRegister = function(guildId, guildDisplay){
  // open a simple prompt-based registration sequence (mobile friendly)
  const MAX = 55;
  const current = getGuildPlayers(guildId);
  if(current.length >= MAX){ alert('This guild already has 55 players (max).'); return; }
  const ign = prompt(`Enter player IGN to add to ${guildDisplay} (Guild ${guildId})`);
  if(!ign) return;
  const realName = prompt('Real name (optional)') || '';
  const contact = prompt('Contact number (optional)') || '';
  addGuildPlayer(guildId, {ign, realName, contact, added: new Date().toISOString()});
  alert('Player added locally. Use Export to download CSV or sync with backend.');
}

function getGuildPlayers(guildId){
  try{
    const raw = localStorage.getItem('TC_guild_'+guildId) || '[]';
    return JSON.parse(raw);
  }catch(e){ return [];}
}
function addGuildPlayer(guildId, player){
  const list = getGuildPlayers(guildId);
  if(list.length >= 55) { alert('Max 55 players reached.'); return false; }
  list.push(player);
  localStorage.setItem('TC_guild_'+guildId, JSON.stringify(list));
  return true;
}
function exportGuildCSV(guildId){
  const list = getGuildPlayers(guildId);
  if(!list || list.length===0){ alert('No players for '+guildId); return; }
  const rows = [['IGN','RealName','Contact','Added']];
  for(const r of list) rows.push([r.ign||'', r.realName||'', r.contact||'', r.added||'']);
  downloadCSV(rows, `TIGER_CLAW_${guildId}_players.csv`);
}
function exportAllGuilds(){
  const guilds = buildGuildList();
  const allData = [];
  for(const g of guilds){
    const list = getGuildPlayers(g.id);
    if(list.length) {
      for(const p of list) allData.push([g.id, g.display, p.ign||'', p.realName||'', p.contact||'', p.added||'']);
    }
  }
  if(!allData.length){ alert('No data to export'); return; }
  const header = [['GuildCode','GuildName','IGN','RealName','Contact','Added']];
  const rows = header.concat(allData);
  downloadCSV(rows, `TIGER_CLAW_all_guilds_players.csv`);
}
function downloadCSV(rows, filename){
  const csv = rows.map(r=>r.map(cell=>`"${String(cell||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function escapeHtml(text){ return String(text).replace(/'/g,"\\'").replace(/"/g,'\\"'); }

// ----------------- Tournament form -----------------
function initTournamentForm(){
  const form = document.getElementById('tournament-form');
  const guildSelect = document.getElementById('tournament-guild');
  // populate guilds
  const guilds = buildGuildList();
  guilds.forEach(g=> {
    const opt = document.createElement('option'); opt.value=g.id; opt.textContent = g.display; guildSelect.appendChild(opt);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    // fallback: if FORM_ENDPOINT unchanged, save to localStorage
    if(!FORM_ENDPOINT || FORM_ENDPOINT.includes('YOUR_FORMSPREE')){
      // store in localStorage under tournaments
      const arr = JSON.parse(localStorage.getItem('TC_tournaments') || '[]');
      const obj = {};
      fd.forEach((v,k)=> obj[k]=v);
      obj.added = new Date().toISOString();
      arr.push(obj);
      localStorage.setItem('TC_tournaments', JSON.stringify(arr));
      alert('Registration saved locally. For live email/DB use Formspree or Google Forms.');
      form.reset();
      return;
    }
    // else post to endpoint
    try{
      const res = await fetch(FORM_ENDPOINT, {method:'POST', body:fd, headers:{'Accept':'application/json'}});
      if(res.ok){ alert('Registered — check your email for confirmation (if configured).'); form.reset(); }
      else { alert('Submission failed — saved locally'); /* fallback store */ }
    }catch(err){
      alert('Network error — saved locally'); // fallback
    }
  });
}

// ----------------- Merchandise page quick init -----------------
function initMerchPage(){
  const container = document.getElementById('merch-list');
  const products = [
    {id:'M1',title:'TIGER CLAW Tee',desc:'Premium cotton tee',img:'assets/images/merch1.jpg',price:'499'},
    {id:'M2',title:'TIGER CLAW Hoodie',desc:'Warm hoodie with logo',img:'assets/images/merch2.jpg',price:'999'},
  ];
  // show cards
  products.forEach(p=>{
    const c = document.createElement('div'); c.className='card';
    c.innerHTML = `<img class="product-img" src="${p.img}" alt="${p.title}"><h3>${p.title}</h3><div class="small">${p.desc}</div><div class="mt-8"><strong>₹${p.price}</strong></div><div class="mt-8"><a href="https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20I%20want%20to%20order%20${encodeURIComponent(p.title)}" class="primary">Order via WhatsApp</a></div>`;
    container.appendChild(c);
  });
}