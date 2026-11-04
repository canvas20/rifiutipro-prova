'use strict';
/* ============ RifiutiPro · app di prova (fase 1) ============ */
const EER = window.__EER__;
const LOGO = window.__LOGO__;
const APPV = 'Fase 2 · V.5';

/* ---------- utilità ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nowISO = () => new Date().toISOString();
const clone = o => JSON.parse(JSON.stringify(o ?? null));
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
function fDate(iso) { if (!iso) return ''; const d = new Date(iso); return d.getDate() + ' ' + MESI[d.getMonth()] + ' ' + d.getFullYear(); }
function fDT(iso) { if (!iso) return ''; const d = new Date(iso); const t = new Date(); const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); if (d.toDateString() === t.toDateString()) return 'oggi ' + hm; return fDate(iso) + ', ' + hm; }
function fTime(iso) { const d = new Date(iso); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
function eerNorm(s) { const raw = String(s || '').trim(); if (!raw) return ''; const star = raw.includes('*'); const dg = raw.replace(/\D/g, ''); if (dg.length !== 6) return null; return dg.slice(0, 2) + ' ' + dg.slice(2, 4) + ' ' + dg.slice(4, 6) + (star ? '*' : ''); }
function eerFind(code) { const dg = String(code || '').replace(/\D/g, ''); return EER.codes.find(c => c[0] === dg); }
function eerLabel(code) { const c = eerFind(code); return c ? c[3] : ''; }
function initials(n) { const p = String(n || '?').replace(/\b(srl|s\.r\.l\.|spa|snc|sas|s\.p\.a\.)\b/ig, '').trim().split(/\s+/); return ((p[0] || '?')[0] + ((p[1] || '')[0] || '')).toUpperCase(); }
function avc(id) { const k = ['', 'b', 'o', 'p', 't']; let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return k[h % k.length]; }
function money(v) { const n = Number(String(v).replace(',', '.')); if (!isFinite(n)) return esc(v); return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function num9() { return String(Math.floor(Math.random() * 1e9)).padStart(9, '0'); }
function newPin() { return String(Math.floor(100000 + Math.random() * 900000)); }

/* ---------- icone ---------- */
const IC = {
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1z"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 2 11.5h3V21h5.5v-6h3v6H19v-9.5h3z"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8.6l9.4 9.4-8.6 8.6L3 11.6zm4.5 2.8a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7.5" r="3.3"/><circle cx="5" cy="9" r="2.4"/><circle cx="19" cy="9" r="2.4"/><path d="M5.5 20c0-3.6 2.9-6.3 6.5-6.3s6.5 2.7 6.5 6.3zM0 19.5c0-2.6 1.8-4.6 4.4-4.9a8 8 0 0 0-1.9 4.9zM24 19.5h-2.5a8 8 0 0 0-1.9-4.9c2.6.3 4.4 2.3 4.4 4.9z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.4"/><path d="M15.4 15.4 20.5 20.5"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M6.4 2h7.3L19 7.3v13.3c0 .8-.6 1.4-1.4 1.4H6.4c-.8 0-1.4-.6-1.4-1.4V3.4C5 2.6 5.6 2 6.4 2zm7 1.3v4.3h4.3zM8 11.3v1.8h8v-1.8zm0 3.4v1.8h8v-1.8zm0 3.4v1.8h5.5v-1.8z"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 21V3h10v5h6v13h-7v-4h-2v4zm3-15v2h2V6zm4 0v2h2V6zm-4 4v2h2v-2zm4 0v2h2v-2zm5 1v2h2v-2zm-9 3v2h2v-2zm4 0v2h2v-2zm5 0v2h2v-2z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4.3"/><path d="M3.5 21c0-4.6 3.8-7.6 8.5-7.6s8.5 3 8.5 7.6z"/></svg>',
  cam: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 3 7.2 5H4.5C3.7 5 3 5.7 3 6.5v12c0 .8.7 1.5 1.5 1.5h15c.8 0 1.5-.7 1.5-1.5v-12c0-.8-.7-1.5-1.5-1.5h-2.7L15 3zm3 4.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>',
  shop: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18l-1.5 5.2c-.3 1.1-1.3 1.8-2.4 1.8-1 0-1.9-.6-2.3-1.5-.4.9-1.3 1.5-2.3 1.5s-1.9-.6-2.3-1.5C7.8 10.4 6.9 11 5.9 11c-1.1 0-2.1-.7-2.4-1.8zM5 12.6c.3.1.6.1.9.1 1 0 2-.3 2.8-.9.7.6 1.7.9 2.8.9s2-.3 2.8-.9c.7.6 1.7.9 2.8.9.3 0 .6 0 .9-.1V20H5zm5 2.4v5h4v-5z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16c.6 0 1 .4 1 1v11c0 .6-.4 1-1 1H9l-5 4v-4H4c-.6 0-1-.4-1-1V5c0-.6.4-1 1-1z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5 21.5 12 3 3.5l2.5 7 9 1.5-9 1.5z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h2v2h6V2h2v2h3v17H4V4h3zm-1 7v10h12V9z"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h7l2 2h9v12H3z"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 5h12v10h1.5V8H19l3 4v5h-2a2.5 2.5 0 0 1-5 0H9a2.5 2.5 0 0 1-5 0H2z"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 5h3v3H4zm5 0h11v3H9zm-5 6h3v3H4zm5 0h11v3H9zm-5 6h3v3H4zm5 0h11v3H9z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 6.6 7 .7-5.3 4.7 1.6 7L12 17.3 5.7 21l1.6-7L2 9.3l7-.7z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 20V10h3v10zm6 0V4h3v16zm6 0v-7h3v7z"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 6c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v2H2zm0 4h20v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm3 5v2h6v-2z"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 14.5a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zM12 6a4 4 0 0 0-4 4h2.2a1.8 1.8 0 1 1 2.6 1.6c-1 .5-1.9 1.3-1.9 2.6V15h2.2v-.6c0-.6.5-.9 1.2-1.3A4 4 0 0 0 12 6z"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m19.4 13 .1-1-.1-1 2.1-1.6-2-3.5-2.5 1a7 7 0 0 0-1.7-1L15 3h-4l-.4 2.7a7 7 0 0 0-1.7 1l-2.5-1-2 3.5L6.5 11l-.1 1 .1 1-2.1 1.6 2 3.5 2.5-1a7 7 0 0 0 1.7 1L11 21h4l.4-2.7a7 7 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>',
  out: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 3H4v18h6v-2H6V5h4zm6 4-1.4 1.4 2.6 2.6H8v2h9.2l-2.6 2.6L16 17l5-5z"/></svg>',
  ads: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h3l6 4V5L6 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3h12a2 2 0 0 1 2 2v14H7a2 2 0 0 0 0 2h12v1H7a3 3 0 0 1-3-3V4z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 4 5v6c0 5 3.4 9.5 8 11 4.6-1.5 8-6 8-11V5zm-1.2 14L7 12.2l1.4-1.4 2.4 2.4 4.8-4.8L17 9.8z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V7a5 5 0 0 1 10 0v3h1.5v12h-13V10zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>',
};

/* ---------- archivio dati (db condiviso dell'artefatto, oppure locale) ---------- */
const COLS = ['companies', 'members', 'links', 'reqs', 'quotes', 'chats', 'logs', 'ads', 'files', 'events', 'docs', 'firs', 'lists', 'favs', 'eerx', 'tickets', 'settings'];
const D = {}; COLS.forEach(c => D[c] = {});
let DB = null, MODE = 'loading', FS = null;
const LKEY = 'rp_local_v1';
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { } }
function saveLocal() { if (MODE === 'local') lsSet(LKEY, JSON.stringify(D)); }
function loadScript(src) { return new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }
function subscribeAll(getCol) {
  const seen = new Set();
  COLS.forEach(c => {
    getCol(c).onSnapshot(snap => {
      const o = {}; snap.docs.forEach(d => { o[d.id] = d.data(); }); D[c] = o;
      if (!seen.has(c)) { seen.add(c); if (seen.size === COLS.length) READY = true; }
      sched();
    }, err => { toast('Collegamento ai dati interrotto (' + (err && err.code) + '). Ricarica la pagina.'); });
  });
  setTimeout(() => { if (!READY) { READY = true; sched(); } }, 8000);
}
async function initStore() {
  /* 1) Firebase (versione web su GitHub Pages: dati condivisi anche senza Claude) */
  const cfg = window.FIREBASE_CONFIG;
  if (cfg && cfg.projectId) {
    try {
      const V = '10.12.2';
      await loadScript(`https://www.gstatic.com/firebasejs/${V}/firebase-app-compat.js`);
      await loadScript(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore-compat.js`);
      firebase.initializeApp(cfg); FS = firebase.firestore(); MODE = 'firebase';
      subscribeAll(c => FS.collection(c)); return;
    } catch (e) { console.error(e); toast('Archivio Firebase non raggiungibile: uso i dati di questo dispositivo.'); }
  }
  /* 2) archivio condiviso di claude.ai */
  let db = null;
  try { if (!FS && window.claude && typeof window.claude.use === 'function') db = await window.claude.use('db'); } catch (e) { db = null; }
  if (db) { DB = db; MODE = 'db'; subscribeAll(c => db.collection(c)); return; }
  /* 3) solo questo dispositivo */
  MODE = 'local';
  try { const s = JSON.parse(lsGet(LKEY) || 'null'); if (s) COLS.forEach(c => D[c] = s[c] || {}); } catch (e) { }
  READY = true; sched();
}
let READY = false;
function failW(e) { const c = e && e.code; toast(c === 'quota_exceeded' || c === 'resource-exhausted' ? 'Spazio dati esaurito: elimina dati di prova vecchi.' : 'Salvataggio non riuscito (' + (c || 'errore') + '). Riprova.'); }
function deepMerge(a, b) { for (const k in b) { const v = b[k]; if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) deepMerge(a[k], v); else a[k] = v; } return a; }
function ref(c, id) { return MODE === 'firebase' ? FS.collection(c).doc(id) : DB.collection(c).doc(id); }
function modeTxt() { return MODE === 'firebase' ? 'Dati condivisi (archivio Firebase)' : MODE === 'db' ? 'Dati condivisi su claude.ai' : 'Dati salvati solo su questo dispositivo'; }
const SHARED = () => MODE === 'db' || MODE === 'firebase';
async function put(c, id, obj) { const _b = D[c] && D[c][id] ? clone(D[c][id]) : null; D[c] = Object.assign({}, D[c], { [id]: obj }); sched(); try { if (typeof afterWrite === 'function') afterWrite(c, id, _b, D[c][id]); } catch (e) { console.error(e); } if (SHARED()) { try { await ref(c, id).set(clone(obj)); } catch (e) { failW(e); } } else saveLocal(); }
async function patch(c, id, p) { const _b = D[c] && D[c][id] ? clone(D[c][id]) : null; const cur = clone(D[c][id] || {}); D[c] = Object.assign({}, D[c], { [id]: deepMerge(cur, clone(p)) }); sched(); try { if (typeof afterWrite === 'function') afterWrite(c, id, _b, D[c][id]); } catch (e) { console.error(e); } if (SHARED()) { try { if (MODE === 'firebase') await ref(c, id).set(clone(p), { merge: true }); else await ref(c, id).update(clone(p)); } catch (e) { failW(e); } } else saveLocal(); }
async function del(c, id) { const o = Object.assign({}, D[c]); delete o[id]; D[c] = o; sched(); if (SHARED()) { try { await ref(c, id).delete(); } catch (e) { failW(e); } } else saveLocal(); }
/* immagini: ridotte e compresse (max ~180 KB) e salvate come documento a sé */
function compressImage(file, maxSide = 1100) {
  return new Promise((ok, ko) => {
    const fr = new FileReader(); fr.onerror = ko;
    fr.onload = () => { const img = new Image(); img.onerror = ko; img.onload = () => {
      let side = maxSide, q = 0.72, out = '';
      for (let i = 0; i < 6; i++) { const k = Math.min(1, side / Math.max(img.width, img.height)); const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); out = cv.toDataURL('image/jpeg', q); if (out.length < 180000) break; side *= 0.8; q -= 0.08; }
      ok(out); }; img.src = fr.result; };
    fr.readAsDataURL(file);
  });
}
async function saveImage(file) { const data = await compressImage(file); const id = uid('f_'); await put('files', id, { data, by: meId() || '', at: nowISO() }); return id; }
function imgSrc(id) { const f = id && D.files[id]; return f ? f.data : ''; }
function pickImage(cb, opts = {}) { const i = document.createElement('input'); i.type = 'file'; i.accept = opts.pdf ? 'image/*,application/pdf' : 'image/*'; if (opts.camera) i.capture = 'environment'; i.onchange = async () => { const f = i.files && i.files[0]; if (!f) return; if (f.type === 'application/pdf') { if (f.size > 180000) return toast('PDF troppo grande per la prova (max 180 KB): carica una foto.'); const fr = new FileReader(); fr.onload = async () => { const id = uid('f_'); await put('files', id, { data: fr.result, name: f.name, by: meId() || '', at: nowISO() }); cb(id, f.name); }; fr.readAsDataURL(f); return; } toast('Caricamento…'); try { const id = await saveImage(f); cb(id, f.name); } catch (e) { toast('Immagine non leggibile.'); } }; i.click(); }
const all = c => Object.entries(D[c]).map(([id, v]) => Object.assign({ id }, v));
const get = (c, id) => id && D[c][id] ? Object.assign({ id }, D[c][id]) : null;

/* ---------- sessione ---------- */
function meId() { return lsGet('rp_mid'); }
function me() { const m = get('members', meId()); return m; }
function myCo() { const m = me(); return m ? get('companies', m.co) : null; }
function setMe(id) { lsSet('rp_mid', id); }
const ROLES = { admin: 'Amministratore', editor: 'Visualizza e modifica', viewer: 'Solo visualizzazione', ufficio: 'Uffici', operatore: 'Operatore', autista: 'Autista' };
const canWrite = m => !!m && ['admin', 'editor', 'ufficio'].includes(m.role);
const isField = m => !!m && ['operatore', 'autista'].includes(m.role);
const canTeam = m => !!m && ['admin', 'ufficio'].includes(m.role);
const isG = co => !!co && co.kind === 'gestore';
const planOn = co => !!(co && co.plan && co.plan.until && new Date(co.plan.until) > new Date());
const TYPES = { impianto: 'Impianto', trasportatore: 'Trasportatore', intermediario: 'Intermediario' };
function coTypes(co) { if (!co) return ''; if (co.kind !== 'gestore') return co.priv ? 'Privato' : 'Visualizzatore'; return (co.types || []).map(t => TYPES[t]).join(' · '); }
function coName(id) { const c = get('companies', id); return c ? c.name : 'Azienda'; }
function memName(id) { const m = get('members', id); return m ? (m.name + ' ' + (m.surname || '')).trim() : ''; }

/* registro attività: un documento per azienda, ultime 300 voci */
function log(text, coId) {
  const m = me(); const co = coId || (m && m.co); if (!co) return;
  const cur = (D.logs[co] && D.logs[co].items) ? D.logs[co].items.slice() : [];
  cur.unshift({ at: nowISO(), mid: m ? m.id : '', who: m ? memName(m.id) : '', t: text });
  put('logs', co, { items: cur.slice(0, 300) });
}

/* collegamenti */
function linkBetween(a, b) { return all('links').find(l => (l.a === a && l.b === b) || (l.a === b && l.b === a)); }
function linked(a, b) { const l = linkBetween(a, b); return !!(l && l.status === 'active'); }
function partners(co) { return all('links').filter(l => l.status === 'active' && (l.a === co || l.b === co)).map(l => l.a === co ? l.b : l.a).map(id => get('companies', id)).filter(Boolean); }

/* catalogo rifiuti (macroaree e sottocategorie di base; l'azienda può aggiungerne) */
const MACRO = [
  ['Metalli', 'Me', '#0057F5', ['Ferro', 'Acciaio', 'Acciaio inox', 'Alluminio', 'Rame', 'Ottone', 'Piombo', 'Zinco']],
  ['Carta e cartone', 'Ca', '#079A5A', ['Carta', 'Cartone', 'Imballaggi in carta e cartone']],
  ['Plastica', 'Pl', '#F29100', ['PET', 'Film (LDPE/HDPE)', 'Plastica mista', 'Imballaggi in plastica']],
  ['Legno', 'Le', '#7A3FE0', ['Pallet', 'Imballaggi in legno', 'Legno da demolizione']],
  ['Vetro', 'Ve', '#0057F5', ['Vetro', 'Imballaggi in vetro']],
  ['RAEE', 'RA', '#079A5A', ['Grandi elettrodomestici', 'Piccoli elettrodomestici', 'Cavi', 'Lampade']],
  ['Oli ed emulsioni', 'Ol', '#F29100', ['Oli minerali esausti', 'Emulsioni', 'Oli vegetali esausti']],
  ['Inerti ed edilizia', 'In', '#7A3FE0', ['Cemento e calcestruzzo', 'Mattoni e mattonelle', 'Misti da demolizione', 'Terre e rocce']],
  ['Organici', 'Or', '#079A5A', ['Umido', 'Verde e potature', 'Scarti alimentari']],
  ['Pericolosi', 'Pe', '#E5243B', ['Batterie al piombo', 'Filtri olio', 'Imballaggi contaminati']],
];
function macroInfo(name) { const m = MACRO.find(x => x[0] === name); return m ? { ini: m[1], col: m[2] } : { ini: initials(name), col: '#4A5670' }; }
function coMacros(co) { const s = new Set(); (co && co.waste || []).forEach(w => s.add(w.m)); return [...s]; }
function coEers(co) { const s = new Set(); (co && co.waste || []).forEach(w => (w.rows || []).forEach(r => r.e && s.add(r.e.replace('*', '')))); return [...s]; }

/* ---------- interfaccia: stato, render, eventi ---------- */
const U = {};            // stato temporaneo dei moduli
let PENDING = false, DIRTY = false;
function sched() { if (PENDING) return; PENDING = true; requestAnimationFrame(() => { PENDING = false; render(); }); }
function route() { const h = (location.hash || '#/').slice(2); const p = h.split('/').map(decodeURIComponent); return { r: p[0] || '', a: p[1] || '', b: p[2] || '' }; }
function go(h) { if (location.hash === h) render(); else location.hash = h; }
window.addEventListener('hashchange', () => { closeOverlays(); render(); window.scrollTo(0, 0); });
let TOAST_T;
function toast(t) { let el = document.getElementById('toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); } el.textContent = t; el.style.display = 'block'; clearTimeout(TOAST_T); TOAST_T = setTimeout(() => el.style.display = 'none', 2800); }
function closeOverlays() { document.querySelectorAll('.drawer-bg,.modal-bg').forEach(e => e.remove()); }
function modal(html) { closeOverlays(); const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.innerHTML = '<div class="modal">' + html + '</div>'; bg.addEventListener('click', e => { if (e.target === bg) bg.remove(); }); document.body.appendChild(bg); }

/* moduli: ogni campo con data-f="modulo.campo" scrive in U */
function fv(form, key, def = '') { return U[form] && U[form][key] !== undefined ? U[form][key] : def; }
function setF(form, key, val) { (U[form] = U[form] || {})[key] = val; }
document.addEventListener('input', e => { const f = e.target.getAttribute && e.target.getAttribute('data-f'); if (!f) return; const [form, key] = f.split('.'); setF(form, key, e.target.type === 'checkbox' ? e.target.checked : e.target.value); if (e.target.hasAttribute('data-live')) render(); });
document.addEventListener('change', e => { const f = e.target.getAttribute && e.target.getAttribute('data-f'); if (!f) return; const [form, key] = f.split('.'); setF(form, key, e.target.type === 'checkbox' ? e.target.checked : e.target.value); if (e.target.hasAttribute('data-rr') || e.target.type === 'checkbox' || e.target.tagName === 'SELECT') render(); });
const ACT = {};
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.getAttribute('data-go')); return; }
  const a = e.target.closest('[data-act]'); if (a) { e.preventDefault(); const fn = ACT[a.getAttribute('data-act')]; if (fn) fn(a, e); }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-enter]')) { e.preventDefault(); const fn = ACT[e.target.getAttribute('data-enter')]; if (fn) fn(e.target, e); } });

/* mattoncini html */
const inp = (form, key, ph = '', type = 'text', extra = '') => `<input class="in" type="${type}" data-f="${form}.${key}" value="${esc(fv(form, key))}" placeholder="${esc(ph)}" ${extra}>`;
const area = (form, key, ph = '') => `<textarea class="in" data-f="${form}.${key}" placeholder="${esc(ph)}">${esc(fv(form, key))}</textarea>`;
const fld = (label, html, req, hint) => `<div class="fl"><label>${esc(label)}${req ? '<span class="req">*</span>' : ''}</label>${html}${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
const sel = (form, key, opts, extra = '') => `<select class="in" data-f="${form}.${key}" ${extra}>${opts.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(fv(form, key)) === String(v) ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
const cbx = (form, key, label) => `<label class="cbx"><input type="checkbox" data-f="${form}.${key}" ${fv(form, key) ? 'checked' : ''}><span>${label}</span></label>`;
const chip = (on, act, label, data = '') => `<button class="chip ${on ? 'on' : ''}" data-act="${act}" ${data}>${esc(label)}</button>`;
const stx = (cls, t) => `<span class="st ${cls}">${esc(t)}</span>`;
const avatar = (co, sm) => co && co.logo && imgSrc(co.logo) ? `<img class="av ${sm ? 'sm' : ''}" src="${imgSrc(co.logo)}" alt="" style="object-fit:cover;background:#fff;border:1px solid var(--line)">` : `<span class="av ${avc(co ? co.id : '')} ${sm ? 'sm' : ''}">${esc(initials(co ? co.name : '?'))}</span>`;
const ftr = () => `<div class="ftr">RifiutiPro è un prodotto di Soluzione Rifiuti S.r.l. · ${APPV}</div>`;
