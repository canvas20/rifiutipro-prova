/* ================= FASE 2 ================= */
const REG = { 'Abruzzo': 'AQ CH PE TE', 'Basilicata': 'MT PZ', 'Calabria': 'CS CZ KR RC VV', 'Campania': 'AV BN CE NA SA', 'Emilia-Romagna': 'BO FC FE MO PC PR RA RE RN', 'Friuli-Venezia Giulia': 'GO PN TS UD', 'Lazio': 'FR LT RI RM VT', 'Liguria': 'GE IM SP SV', 'Lombardia': 'BG BS CO CR LC LO MB MI MN PV SO VA', 'Marche': 'AN AP FM MC PU', 'Molise': 'CB IS', 'Piemonte': 'AL AT BI CN NO TO VB VC', 'Puglia': 'BA BR BT FG LE TA', 'Sardegna': 'CA NU OR SS SU', 'Sicilia': 'AG CL CT EN ME PA RG SR TP', 'Toscana': 'AR FI GR LI LU MS PI PO PT SI', 'Trentino-Alto Adige': 'BZ TN', 'Umbria': 'PG TR', "Valle d'Aosta": 'AO', 'Veneto': 'BL PD RO TV VE VI VR' };
const PROV2REG = {}; Object.entries(REG).forEach(([r, ps]) => ps.split(' ').forEach(p => PROV2REG[p] = r));
const ALLPROV = Object.keys(PROV2REG).sort();
const XR = {};
function authFilled(form) { return ['imp_tipo', 'imp_num', 'imp_ente', 'imp_scad', 'tr_albo', 'int_albo'].some(k => String(fv(form, k)).trim()) || ((U[form] && U[form].afiles) || []).length > 0; }

/* ---------- piccoli componenti ---------- */
function banner() { const g = D.settings.global; const b = g && g.banner; if (!b || !b.text) return ''; return `<div class="${b.type === 'warn' ? 'warn' : 'info'}"><b>${esc(b.title || 'Avviso')}</b> · ${esc(b.text)}</div>`; }
function favDoc() { return D.favs[meId()] || { companies: [], quotes: [] }; }
function isFav(kind, id) { return (favDoc()[kind] || []).includes(id); }
function favBtn(kind, id) { const on = isFav(kind, id); return `<button class="bt gh ${kind === 'companies' ? '' : ''}" data-act="favToggle" data-k="${kind}" data-id="${id}">${IC.star.replace('<svg', `<svg style="color:${on ? '#F2A900' : '#A9B3C6'}"`)} ${on ? 'Nei preferiti' : 'Aggiungi ai preferiti'}</button>`; }
ACT.favToggle = el => { const f = clone(favDoc()); const k = el.dataset.k; f[k] = f[k] || []; const i = f[k].indexOf(el.dataset.id); if (i >= 0) f[k].splice(i, 1); else f[k].push(el.dataset.id); put('favs', meId(), f); toast(i >= 0 ? 'Tolto dai preferiti' : 'Aggiunto ai preferiti'); };
ACT.zoom = el => { const src = imgSrc(el.dataset.id); if (src) modal(`<img src="${src}" alt="" style="width:100%;border-radius:12px"><button class="bt gh" data-act="mClose">Chiudi</button>`); };
function photosBox(form) {
  const ph = (U[form] && U[form].photos) || [];
  return `<div class="lb">Foto (massimo 3, facoltative)</div><div class="row" style="gap:8px;flex-wrap:wrap">${ph.map((f, i) => `<span style="position:relative"><img src="${imgSrc(f)}" alt="" style="width:84px;height:84px;object-fit:cover;border-radius:12px"><button class="x" data-act="phDel" data-form="${form}" data-i="${i}" style="position:absolute;top:-6px;right:-6px;background:#fff;border-radius:12px;width:24px;height:24px;color:var(--red)">×</button></span>`).join('')}${ph.length < 3 ? `<button class="add" data-act="phAdd" data-form="${form}" style="width:84px;height:84px;text-align:center">+ Foto</button>` : ''}</div><span class="hint">Le foto vengono ridotte e compresse prima dell'invio.</span>`;
}
ACT.phAdd = el => { const form = el.dataset.form; pickImage(id => { U[form] = U[form] || {}; (U[form].photos = U[form].photos || []).push(id); render(); }); };
ACT.phDel = el => { U[el.dataset.form].photos.splice(+el.dataset.i, 1); render(); };
function logoBox() { const co = myCo(); const C = U.ce || {}; const id = C.logo || co.logo; return `<div class="lb">Logo aziendale</div><div class="row">${id && imgSrc(id) ? `<img src="${imgSrc(id)}" alt="Logo" style="width:64px;height:64px;object-fit:contain;border:1px solid var(--line);border-radius:14px;background:#fff">` : avatar(co)}<button class="bt gh s" data-act="logoUp">${id ? 'Cambia logo' : 'Carica logo'}</button></div>`; }
ACT.logoUp = () => pickImage(id => { U.ce.logo = id; render(); });
function authFilesBox(form) { const F = U[form] = U[form] || {}; const L = F.afiles = F.afiles || []; return `<div class="card"><b>Documenti (PDF o foto)</b>${L.map((f, i) => `<div class="row sm"><span class="sp">📎 ${esc((D.files[f] && D.files[f].name) || 'Documento ' + (i + 1))}</span><button class="x" data-act="afDel" data-form="${form}" data-i="${i}">×</button></div>`).join('')}<button class="add" data-act="afAdd" data-form="${form}">+ Carica i documenti (PDF o foto)</button><span class="hint">Servono a Soluzione Rifiuti per il badge «Verificata».</span></div>`; }
ACT.afAdd = el => { const form = el.dataset.form; pickImage((id) => { (U[form].afiles = U[form].afiles || []).push(id); render(); }, { pdf: 1 }); };
ACT.afDel = el => { U[el.dataset.form].afiles.splice(+el.dataset.i, 1); render(); };

/* ---------- zona della pubblicità ---------- */
function zoneGet() { const co = myCo(); let z = null; try { z = JSON.parse(lsGet('rp_zone') || 'null'); } catch (e) { } if (!z || !z.lvl) z = { lvl: 'prov', prov: (co && co.prov) || 'SR' }; if (z.lvl === 'prov' && !z.prov) z.prov = (co && co.prov) || 'SR'; return z; }
function zoneTxt(z) { z = z || zoneGet(); return z.lvl === 'it' ? 'Tutta Italia' : z.lvl === 'reg' ? 'Regione ' + z.reg : 'Provincia di ' + z.prov; }
function zoneLine() { return `<div class="row sm mut">📍 <span class="sp">Pubblicità per: <b style="color:var(--navy)">${esc(zoneTxt())}</b></span><a href="#/zona"><b>Cambia zona</b></a></div>`; }
function adMatches(ad, z) {
  if (ad.status !== 'active' || !ad.until || new Date(ad.until) < new Date()) return 0;
  const az = ad.zone || { lvl: 'it' };
  if (az.lvl === 'it') return 1;
  if (z.lvl === 'it') return 1;
  const zreg = z.lvl === 'reg' ? z.reg : PROV2REG[z.prov];
  if (az.lvl === 'reg') return az.reg === zreg ? 2 : 0;
  if (az.lvl === 'prov') { if (z.lvl === 'prov') return az.prov === z.prov ? 3 : 0; return PROV2REG[az.prov] === zreg ? 3 : 0; }
  return 0;
}
function adsFor(kind) { const z = zoneGet(); return all('ads').filter(a => a.kind === kind).map(a => [a, adMatches(a, z)]).filter(x => x[1]).sort((x, y) => y[1] - x[1] || (y[0].feat ? 1 : 0) - (x[0].feat ? 1 : 0)).map(x => x[0]); }
function rot(list, n) { if (!list.length) return null; const k = Math.floor(Date.now() / 20000) % Math.min(list.length, n); return list[k]; }
function adBig() {
  const L = adsFor('big'); const a = rot(L, 3); if (!a) return '';
  const img = imgSrc(a.img);
  return `<a class="tile" data-act="adTap" data-id="${a.id}" style="min-height:170px;background:${img ? `linear-gradient(180deg,rgba(11,20,66,.05),rgba(11,20,66,.82)),url('${img}') center/cover` : 'linear-gradient(135deg,#0B1442,#0A3B8F)'};cursor:pointer"><em style="left:12px;right:auto;font-size:10.5px;letter-spacing:.5px">SPONSORIZZATO</em>${L.length > 1 ? `<span style="position:absolute;top:14px;right:14px;font-size:11px;opacity:.9">${Math.min(L.length, 3)} annunci</span>` : ''}<b style="text-transform:none;font-size:19px;padding-right:86px">${esc(a.title)}</b><span style="padding-right:86px">${esc(coName(a.co))}${a.text ? ' · ' + esc(a.text.slice(0, 70)) : ''}</span><span style="position:absolute;right:12px;bottom:12px;background:#fff;color:var(--navy);font-weight:800;border-radius:10px;padding:6px 10px;font-size:13px;opacity:1">${esc(a.cta || 'Scopri')}</span></a>`;
}
function adSmall() {
  const L = adsFor('small'); const a = rot(L, 5); if (!a) return '';
  const img = imgSrc(a.img);
  return `<a class="li" data-act="adTap" data-id="${a.id}">${img ? `<img src="${img}" alt="" style="width:52px;height:52px;object-fit:cover;border-radius:10px">` : `<span class="av sm ${avc(a.co)}">${esc(initials(coName(a.co)))}</span>`}<span class="sp"><b>${esc(a.title)}</b><span class="s">${esc((a.text || coName(a.co)).slice(0, 80))}</span></span><span class="st x" style="font-size:10px">SPONSOR</span></a>`;
}
ACT.adTap = el => { const a = get('ads', el.dataset.id); if (!a) return; patch('ads', a.id, { taps: (a.taps || 0) + 1 }); go('#/ad/' + a.id); };
XR.zona = () => {
  const z = zoneGet(); const co = myCo();
  if (!U.zn) U.zn = { lvl: z.lvl, prov: z.prov || co.prov, reg: z.reg || PROV2REG[co.prov] || 'Sicilia' };
  const Z = U.zn;
  const opt = (k, t, d) => `<button class="opt ${Z.lvl === k ? 'on' : ''}" data-act="znLvl" data-k="${k}"><span class="rdo ${Z.lvl === k ? 'on' : ''}"></span><span class="sp"><b>${t}</b><span class="d">${d}</span></span></button>`;
  return {
    h: header('t', 'Zona della pubblicità'), b: `<p class="sub">Scegli di quale zona vedere la Vetrina e gli spazi sponsorizzati.</p>
  <button class="bt gh" data-act="znGeo">📍 Usa la mia posizione</button><span class="hint">Solo con il tuo permesso: serve a ricavare la provincia, non viene salvata.</span>
  <button class="bt gh" data-act="znMine">🏢 Provincia della mia azienda (${esc(co.prov)})</button>
  ${opt('prov', 'Una provincia', 'Prima gli annunci della provincia, poi della regione, poi nazionali')}${Z.lvl === 'prov' ? sel('zn', 'prov', ALLPROV.map(p => [p, p + ' · ' + PROV2REG[p]])) : ''}
  ${opt('reg', 'Una regione', 'Annunci della regione e delle sue province')}${Z.lvl === 'reg' ? sel('zn', 'reg', Object.keys(REG)) : ''}
  ${opt('it', 'Tutta Italia', 'Tutti gli annunci attivi')}
  <button class="bt" data-act="znSave">Applica</button>` };
};
ACT.znLvl = el => { U.zn.lvl = el.dataset.k; render(); };
ACT.znMine = () => { const co = myCo(); lsSet('rp_zone', JSON.stringify({ lvl: 'prov', prov: co.prov })); U.zn = null; toast('Zona: provincia di ' + co.prov); history.back(); };
ACT.znSave = () => { const Z = U.zn; lsSet('rp_zone', JSON.stringify({ lvl: Z.lvl, prov: Z.prov, reg: Z.reg })); U.zn = null; toast('Zona aggiornata'); history.back(); };
ACT.znGeo = () => {
  if (!navigator.geolocation) return toast('Posizione non disponibile su questo dispositivo.');
  toast('Cerco la posizione…');
  navigator.geolocation.getCurrentPosition(async p => {
    try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=8&lat=${p.coords.latitude}&lon=${p.coords.longitude}`, { headers: { 'Accept-Language': 'it' } }); const j = await r.json(); const iso = (j.address && (j.address['ISO3166-2-lvl6'] || '')) || ''; const pr = iso.split('-')[1]; if (pr && PROV2REG[pr]) { U.zn = Object.assign(U.zn || {}, { lvl: 'prov', prov: pr }); render(); toast('Provincia trovata: ' + pr); } else toast('Provincia non riconosciuta: sceglila dall\'elenco.'); }
    catch (e) { toast('Servizio di posizione non raggiungibile: scegli la provincia dall\'elenco.'); }
  }, () => toast('Permesso negato: scegli la provincia dall\'elenco.'), { timeout: 10000 });
};

/* ---------- VETRINA ---------- */
const VCAT = ['Consulenti ambientali', 'Avvocati', 'Noleggio mezzi e cassoni', 'Attrezzature', 'Laboratori di analisi', 'Formazione e sicurezza', 'Assicurazioni', 'Software e servizi', 'Altro'];
XR.vetrina = (cat) => {
  const q = String(fv('vt', 'q')).toLowerCase().trim(); cat = cat || fv('vt', 'cat');
  let L = adsFor('card'); if (cat) L = L.filter(a => a.cat === cat); if (q) L = L.filter(a => (a.title + ' ' + (a.text || '') + ' ' + coName(a.co) + ' ' + (a.cat || '')).toLowerCase().includes(q));
  const feat = L.filter(a => a.feat), rest = L.filter(a => !a.feat);
  const card = a => { const img = imgSrc(a.img); return `<a class="li" data-act="adTap" data-id="${a.id}" style="align-items:flex-start">${img ? `<img src="${img}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:12px">` : `<span class="av ${avc(a.co)}">${esc(initials(coName(a.co)))}</span>`}<span class="sp"><b>${esc(a.title)}</b><span class="s">${esc(a.cat || '')} · ${esc(zoneTxt(a.zone))}</span><span class="s">${esc((a.text || '').slice(0, 110))}</span></span>${a.feat ? stx('w', 'In evidenza') : ''}</a>`; };
  return {
    h: header('t', 'VETRINA', { back: '#/home' }), t: 'home', b: `<h2 class="ttl">Vetrina</h2><p class="sub">Servizi e prodotti per le imprese del settore rifiuti</p>${zoneLine()}
  <div class="sr">${IC.search}<input data-f="vt.q" data-live value="${esc(fv('vt', 'q'))}" placeholder="Cerca un servizio o un nome"></div>
  <div class="chips">${chip(!cat, 'vtCat', 'Tutte', 'data-k=""')}${VCAT.map(c => chip(cat === c, 'vtCat', c, `data-k="${esc(c)}"`)).join('')}</div>
  ${adBig()}
  ${feat.length ? `<div class="sec">In evidenza</div><div class="list">${feat.map(card).join('')}</div>` : ''}
  <div class="sec">Nella tua zona</div>${rest.length ? `<div class="list">${rest.map(card).join('')}</div>` : '<div class="empty">Nessuna scheda in questa zona e categoria. Prova «Tutta Italia».</div>'}
  <div class="card"><b>Lavori per le imprese dei rifiuti?</b><span class="sm mut">Consulente, avvocato, noleggio, attrezzature, laboratorio: pubblica la tua scheda o uno spazio sponsorizzato nella zona che scegli.</span><button class="bt g" data-go="#/adnew/card">Pubblica la tua scheda</button></div>` };
};
ACT.vtCat = el => { setF('vt', 'cat', el.dataset.k); render(); };
XR.ad = (id) => {
  const a = get('ads', id); if (!a) return { h: header('t', 'Annuncio'), b: '<div class="empty">Annuncio non più disponibile.</div>' };
  const img = imgSrc(a.img); const c = get('companies', a.co); const mine = a.co === myCo().id;
  return {
    h: header('t', a.kind === 'card' ? 'Scheda Vetrina' : 'Sponsorizzato'), b: `${img ? `<img src="${img}" alt="" style="width:100%;border-radius:16px;max-height:260px;object-fit:cover">` : ''}
  <div class="card"><div class="row"><span class="sp"><b style="font-size:20px">${esc(a.title)}</b><div class="mut sm">${esc(a.cat || (a.kind === 'big' ? 'Spazio grande' : 'Spazio piccolo'))} · ${esc(zoneTxt(a.zone))}</div></span>${a.feat ? stx('w', 'In evidenza') : ''}</div>${a.text ? `<p style="margin:0;white-space:pre-line">${esc(a.text)}</p>` : ''}
  <dl class="dl"><dt>Da</dt><dd>${esc(c ? c.name : '')}</dd>${a.phone ? `<dt>Telefono</dt><dd><a href="tel:${esc(a.phone)}">${esc(a.phone)}</a></dd>` : ''}${a.email ? `<dt>Email</dt><dd><a href="mailto:${esc(a.email)}">${esc(a.email)}</a></dd>` : ''}${a.web ? `<dt>Sito</dt><dd>${esc(a.web)}</dd>` : ''}</dl></div>
  <span class="hint">Contenuto pubblicitario sotto la responsabilità dell'inserzionista.</span>${mine ? `<button class="bt gh" data-go="#/myads">Gestisci nei miei annunci</button>` : ''}` };
};

/* ---------- I MIEI ANNUNCI ---------- */
const ADP = { big: [39, 99, 290], small: [15, 39, 120], card: [9, 25, 69], feat: [15, 35, 99] };
const ADN = { big: 'Spazio grande (Home e Vetrina)', small: 'Spazio piccolo (nelle liste)', card: 'Scheda Vetrina' };
function adPrice(A) { const li = A.zlvl === 'it' ? 2 : A.zlvl === 'reg' ? 1 : 0; let m = ADP[A.kind][li] + (A.kind === 'card' && A.feat ? ADP.feat[li] : 0); const months = +A.months || 1; const disc = months === 12 ? 0.8 : months === 3 ? 0.9 : 1; const tot = Math.round(m * months * disc * 100) / 100; const gr = A.grafica ? (A.grafica === 'pack' ? 89 : 49) : 0; return { month: m, tot, gr, all: tot + gr, disc }; }
function adStatus(a) { if (a.status === 'review') return ['w', 'In revisione']; if (a.status === 'rejected') return ['r', 'Non approvato']; if (a.status === 'paused') return ['x', 'In pausa']; if (a.until && new Date(a.until) < new Date()) return ['x', 'Scaduto']; return ['n', 'Attivo']; }
XR.myads = () => {
  const co = myCo(); const L = all('ads').filter(a => a.co === co.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return {
    h: header('t', 'I miei annunci', { back: '#/home' }), b: `<p class="sub">Spazi sponsorizzati e schede Vetrina della tua azienda, gestiti in autonomia.</p>
  <div class="two"><button class="bt g" data-go="#/adnew/big">Nuovo spazio sponsorizzato</button><button class="bt" data-go="#/adnew/card">Nuova scheda Vetrina</button></div>
  ${L.length ? `<div class="list">${L.map(a => { const [c, t] = adStatus(a); return `<div class="card"><div class="row"><span class="sp"><b>${esc(a.title)}</b><div class="xs mut">${ADN[a.kind]} · ${esc(zoneTxt(a.zone))}${a.until ? ' · fino al ' + fDate(a.until) : ''}</div></span>${stx(c, t)}</div>${a.status === 'rejected' && a.reason ? `<div class="err">Motivo: ${esc(a.reason)}</div>` : ''}${a.grafica && !a.img ? `<div class="info">Grafica richiesta: ${a.grafica === 'pack' ? 'pacchetto (89 €)' : 'banner (49 €)'} · ${a.graficaDone ? 'consegnata' : 'in lavorazione (3 giorni lavorativi)'}</div>` : ''}<div class="row sm mut"><span class="sp">Tocchi: <b>${a.taps || 0}</b></span><span>${money(a.paid || 0)} € pagati (simulazione)</span></div><div class="two"><button class="bt gh s" data-act="adEdit" data-id="${a.id}">Modifica</button>${a.status === 'active' ? `<button class="bt gh s" data-act="adPause" data-id="${a.id}">Pausa</button>` : a.status === 'paused' ? `<button class="bt gh s" data-act="adResume" data-id="${a.id}">Riattiva</button>` : ''}<button class="bt gh s" data-act="adRenew" data-id="${a.id}">Rinnova</button><button class="bt rd s" data-act="adDel" data-id="${a.id}">Elimina</button></div></div>`; }).join('')}</div>` : '<div class="empty">Nessun annuncio. Crea il primo: lo approva Soluzione Rifiuti entro 1 giorno lavorativo.</div>'}
  <div class="card"><h3>Prezzi al mese (IVA esclusa)</h3><dl class="dl"><dt></dt><dd class="sm">Provincia / Regione / Italia</dd><dt>Spazio grande</dt><dd>39 / 99 / 290 €</dd><dt>Spazio piccolo</dt><dd>15 / 39 / 120 €</dd><dt>Scheda Vetrina</dt><dd>9 / 25 / 69 €</dd><dt>«In evidenza»</dt><dd>+15 / +35 / +99 €</dd></dl><span class="hint">3 mesi −10%, 12 mesi −20%. Grafica: banner 49 €, pacchetto grande + piccolo + Vetrina 89 €. <span class="ph">[prezzi da confermare]</span></span></div>` };
};
ACT.adEdit = el => { U.an = null; go('#/adnew/edit/' + el.dataset.id); };
ACT.adPause = el => { patch('ads', el.dataset.id, { status: 'paused' }); log('Messo in pausa un annuncio'); };
ACT.adResume = el => { patch('ads', el.dataset.id, { status: 'active' }); log('Riattivato un annuncio'); };
ACT.adDel = el => confirmBox('Eliminare l\'annuncio?', 'Sparisce subito dagli spazi e dalla Vetrina. In prova nessun rimborso.', 'Elimina', () => { del('ads', el.dataset.id); log('Eliminato un annuncio'); }, 1);
ACT.adRenew = el => { const a = get('ads', el.dataset.id); const m = +(a.months || 1); const base = a.until && new Date(a.until) > new Date() ? new Date(a.until) : new Date(); base.setMonth(base.getMonth() + m); const pr = adPrice({ kind: a.kind, zlvl: a.zone.lvl, months: m, feat: a.feat }); patch('ads', a.id, { until: base.toISOString(), paid: (a.paid || 0) + pr.tot }); log('Rinnovato l\'annuncio «' + a.title + '» per ' + m + ' mesi (simulazione)'); toast('Rinnovato fino al ' + fDate(base.toISOString())); };
XR.adnew = (kind, id) => {
  const co = myCo(); const editing = kind === 'edit'; const old = editing ? get('ads', id) : null;
  if (!U.an || U.an._k !== kind + id) {
    const o = old || {};
    U.an = { _k: kind + id, kind: o.kind || (['big', 'small', 'card'].includes(kind) ? kind : 'big'), title: o.title || '', text: o.text || '', cat: o.cat || VCAT[0], img: o.img || '', cta: o.cta || 'Contatta', phone: o.phone || co.phone || '', email: o.email || co.email || '', web: o.web || '', zlvl: (o.zone && o.zone.lvl) || 'prov', prov: (o.zone && o.zone.prov) || co.prov, reg: (o.zone && o.zone.reg) || PROV2REG[co.prov] || 'Sicilia', months: o.months || 1, feat: !!o.feat, grafica: o.grafica || '', brief: o.brief || '' };
  }
  const A = U.an; const p = adPrice(A);
  return {
    h: header('t', editing ? 'Modifica annuncio' : 'Nuovo annuncio', { back: '#/myads' }), b: `${A.err ? `<div class="err">${esc(A.err)}</div>` : ''}
  ${editing ? '' : `<div class="lb">Tipo</div><div class="seg">${['big', 'small', 'card'].map(k => `<button class="${A.kind === k ? 'on' : ''}" data-act="anSet" data-k="kind" data-v="${k}">${k === 'big' ? 'Grande' : k === 'small' ? 'Piccolo' : 'Vetrina'}</button>`).join('')}</div><span class="hint">${A.kind === 'big' ? 'Immagine 16:9 in alto nella Home e nella Vetrina, fino a 3 a rotazione per zona.' : A.kind === 'small' ? 'Striscia con miniatura nelle liste di Home, Quotazioni, Aziende, Cerca aziende e Codici EER, fino a 5 a rotazione.' : 'Scheda nella Vetrina, con categoria e contatti.'}</span>`}
  ${A.kind === 'card' ? fld('Categoria', sel('an', 'cat', VCAT)) : ''}
  ${fld('Titolo', inp('an', 'title', A.kind === 'card' ? 'Es. Studio Ambiente Prova' : 'Es. Cassoni scarrabili a noleggio', 'text', 'maxlength="40"'), 1, 'Massimo 40 caratteri.')}
  ${fld('Testo', area('an', 'text', 'Cosa offri, dove, a chi'), 0, A.kind === 'card' ? 'Fino a 500 caratteri.' : 'Fino a 120 caratteri.')}
  <div class="lb">Immagine</div><div class="row">${A.img && imgSrc(A.img) ? `<img src="${imgSrc(A.img)}" alt="" style="width:120px;height:68px;object-fit:cover;border-radius:10px">` : '<span class="mut sm">Nessuna immagine</span>'}<button class="bt gh s" data-act="anImg">${A.img ? 'Cambia' : 'Carica immagine'}</button></div>
  <div class="card"><b>Non hai la grafica?</b><span class="sm mut">La realizziamo noi: consegna in 3 giorni lavorativi con una revisione.</span><div class="chips">${chip(!A.grafica, 'anSet', 'No, grazie', 'data-k="grafica" data-v=""')}${chip(A.grafica === 'banner', 'anSet', 'Banner · 49 €', 'data-k="grafica" data-v="banner"')}${chip(A.grafica === 'pack', 'anSet', 'Pacchetto · 89 €', 'data-k="grafica" data-v="pack"')}</div>${A.grafica ? fld('Indicazioni per la grafica', area('an', 'brief', 'Colori, testo, logo, cosa mettere in evidenza')) : ''}</div>
  ${A.kind !== 'small' ? fld('Pulsante', sel('an', 'cta', ['Contatta', 'Scopri', 'Chiama', 'Richiedi preventivo'])) : ''}
  <div class="two">${fld('Telefono', inp('an', 'phone', '', 'tel'))}${fld('Email', inp('an', 'email', '', 'email'))}</div>${fld('Sito web (facoltativo)', inp('an', 'web', 'www.esempio.invalid'))}
  ${editing ? '' : `<div class="lb">Zona</div><div class="seg">${[['prov', 'Provincia'], ['reg', 'Regione'], ['it', 'Italia']].map(([k, l]) => `<button class="${A.zlvl === k ? 'on' : ''}" data-act="anSet" data-k="zlvl" data-v="${k}">${l}</button>`).join('')}</div>${A.zlvl === 'prov' ? sel('an', 'prov', ALLPROV.map(x => [x, x + ' · ' + PROV2REG[x]]), 'data-rr') : A.zlvl === 'reg' ? sel('an', 'reg', Object.keys(REG)) : ''}
  <div class="lb">Durata</div><div class="seg">${[[1, '1 mese'], [3, '3 mesi −10%'], [12, '12 mesi −20%']].map(([k, l]) => `<button class="${+A.months === k ? 'on' : ''}" data-act="anSet" data-k="months" data-v="${k}">${l}</button>`).join('')}</div>
  ${A.kind === 'card' ? `<label class="cbx"><input type="checkbox" data-f="an.feat" ${A.feat ? 'checked' : ''}><span>«In evidenza» in cima alla Vetrina (+${ADP.feat[A.zlvl === 'it' ? 2 : A.zlvl === 'reg' ? 1 : 0]} €/mese)</span></label>` : ''}
  <div class="card"><div class="row"><span class="sp">${ADN[A.kind]} · ${A.zlvl === 'it' ? 'Italia' : A.zlvl === 'reg' ? esc(A.reg) : esc(A.prov)}</span><b>${money(p.month)} €/mese</b></div><div class="row"><span class="sp">${A.months} mes${+A.months === 1 ? 'e' : 'i'}${p.disc < 1 ? ' con sconto' : ''}</span><b>${money(p.tot)} €</b></div>${p.gr ? `<div class="row"><span class="sp">Grafica</span><b>${money(p.gr)} €</b></div>` : ''}<div class="row" style="border-top:1px solid var(--line);padding-top:8px"><b class="sp">Totale (IVA esclusa)</b><span class="price" style="font-size:22px">${money(p.all)} €</span></div></div>
  <div class="demo">In prova non c'è nessun pagamento. Nella versione definitiva: acquisto in-app Apple o carta sul sito <span class="ph">[fornitore da definire]</span>.</div>`}
  <label class="cbx"><input type="checkbox" data-f="an.ok" ${fv('an', 'ok') ? 'checked' : ''}><span class="sm">Dichiaro che il contenuto è veritiero, che ho i diritti su immagini e marchi e che sono responsabile di quanto pubblicato.</span></label>
  <button class="bt g" data-act="anSave">${editing ? 'Salva e invia in revisione' : 'Paga e invia in revisione (simulazione)'}</button>
  <span class="hint">Soluzione Rifiuti controlla ogni annuncio prima della pubblicazione (di solito entro 1 giorno lavorativo).</span>` };
};
ACT.anSet = el => { U.an[el.dataset.k] = el.dataset.v; render(); };
ACT.anImg = () => pickImage(id => { U.an.img = id; render(); });
ACT.anSave = () => {
  const A = U.an; const co = myCo(); const { a: kind, b: id } = route(); const editing = kind === 'edit';
  const err = t => { A.err = t; render(); window.scrollTo(0, 0); };
  const title = String(A.title).trim(); const text = String(A.text || '').trim();
  if (!title) return err('Scrivi il titolo.'); if (text.length > (A.kind === 'card' ? 500 : 120)) return err('Il testo è troppo lungo.');
  if (A.kind === 'big' && !A.img && !A.grafica) return err('Lo spazio grande richiede un\'immagine, oppure chiedi a noi la grafica.');
  if (!fv('an', 'ok')) return err('Spunta la dichiarazione sul contenuto.');
  const base = { title, text, cat: A.kind === 'card' ? A.cat : '', img: A.img || '', cta: A.cta, phone: String(A.phone || '').trim(), email: String(A.email || '').trim(), web: String(A.web || '').trim(), grafica: A.grafica, brief: String(A.brief || '').trim(), status: 'review', updatedAt: nowISO() };
  if (editing) { patch('ads', id, base); log('Modificato l\'annuncio «' + title + '» (in revisione)'); }
  else {
    const p = adPrice(A); const until = new Date(); until.setMonth(until.getMonth() + (+A.months));
    const nid = uid('ad_'); put('ads', nid, Object.assign(base, { co: co.id, by: meId(), kind: A.kind, feat: A.kind === 'card' && !!A.feat, zone: A.zlvl === 'it' ? { lvl: 'it' } : A.zlvl === 'reg' ? { lvl: 'reg', reg: A.reg } : { lvl: 'prov', prov: A.prov }, months: +A.months, until: until.toISOString(), paid: p.all, taps: 0, createdAt: nowISO() }));
    log('Acquistato ' + ADN[A.kind] + ' «' + title + '» per ' + A.months + ' mesi, ' + money(p.all) + ' € (simulazione)');
  }
  U.an = null; toast('Inviato in revisione'); go('#/myads');
};

/* ---------- CODICE EER DA FOTO ---------- */
const FX_MAT = [['ferro', 'Metallo ferroso (ferro, acciaio)'], ['nonfer', 'Alluminio o altri metalli non ferrosi'], ['rame', 'Rame, ottone o cavi'], ['veicolo', 'Componente di veicolo (alternatore, motorino…)'], ['plastica', 'Plastica'], ['carta', 'Carta o cartone'], ['legno', 'Legno'], ['vetro', 'Vetro'], ['lampade', 'Lampade o tubi luminosi'], ['batterie', 'Batterie o pile'], ['raee', 'Apparecchi elettrici o elettronici'], ['alimenti', 'Alimenti'], ['inerti', 'Macerie, inerti'], ['oli', 'Oli o liquidi'], ['altro', 'Altro']];
const FX_ACT = [['officina', 'Officina, autoriparazione'], ['autodem', 'Autodemolizione'], ['edilizia', 'Costruzione o demolizione'], ['metalmecc', 'Lavorazione dei metalli o della plastica'], ['commercio', 'Commercio, magazzino, grossista'], ['terziario', 'Ristorante, ufficio, negozio'], ['agricola', 'Azienda agricola'], ['alimentare', 'Industria alimentare'], ['legno', 'Lavorazione del legno'], ['casa', 'Privato, casa'], ['altro', 'Altro']];
function fxProc(mat) {
  const P = { imb: 'Imballaggio (scatole, sacchi, pallet, cassette)', scarto: 'Scarto di lavorazione o di produzione', manut: 'Pezzo smontato in manutenzione o riparazione', fine: 'Oggetto a fine vita o rotto', inv: 'Merce invenduta, scaduta o fuori specifica', dem: 'Materiale da demolizione o ristrutturazione' };
  const by = { ferro: ['manut', 'scarto', 'dem', 'imb', 'fine'], nonfer: ['manut', 'scarto', 'dem', 'imb', 'fine'], rame: ['dem', 'scarto', 'manut', 'fine'], veicolo: ['manut', 'fine'], plastica: ['imb', 'inv', 'scarto', 'dem', 'fine'], carta: ['imb', 'scarto', 'fine'], legno: ['imb', 'scarto', 'dem', 'fine'], vetro: ['imb', 'dem', 'fine'], lampade: ['fine', 'manut'], raee: ['fine', 'manut'], alimenti: ['inv', 'scarto'], inerti: ['dem'], oli: ['manut', 'fine'], altro: ['imb', 'scarto', 'manut', 'fine', 'inv', 'dem'] };
  return (by[mat] || by.altro).map(k => [k, P[k]]);
}
function fxQ3(mat, act, proc) {
  if (mat === 'lampade') return ['tipo', 'Che lampade sono?', [['led', 'LED'], ['fluo', 'Fluorescenti / neon / a risparmio'], ['ns', 'Non so']]];
  if (mat === 'batterie') return ['bat', 'Che batterie sono?', [['piombo', 'Al piombo (auto, muletti, gruppi di continuità)'], ['litio', 'Al litio / ioni di litio'], ['alcaline', 'Pile alcaline o comuni'], ['ns', 'Non so']]];
  if (mat === 'plastica' && act === 'commercio' && proc !== 'imb') return ['urb', 'Il rifiuto è simile per natura e composizione a quelli domestici (allegato L-quater)?', [['si', 'Sì'], ['no', 'No'], ['ns', 'Non so']]];
  if (['nonfer', 'ferro', 'veicolo', 'rame', 'raee'].includes(mat)) return ['haz', 'Contiene oli, liquidi o parti pericolose?', [['no', 'No, è pulito'], ['si', 'Sì'], ['ns', 'Non so']]];
  return null;
}
const CODEDESC = { '160117': 'metalli ferrosi', '160118': 'metalli non ferrosi', '160122': 'componenti non specificati altrimenti', '160214': 'apparecchiature fuori uso, diverse da 16 02 09–16 02 13', '160213': 'apparecchiature fuori uso con componenti pericolosi*', '200136': 'apparecchiature elettriche ed elettroniche fuori uso, diverse da 20 01 21, 20 01 23 e 20 01 35', '200135': 'apparecchiature elettriche ed elettroniche fuori uso con componenti pericolosi*', '200121': 'tubi fluorescenti ed altri rifiuti contenenti mercurio*', '200139': 'plastica', '160306': 'rifiuti organici, diversi da quelli di cui alla voce 16 03 05', '160304': 'rifiuti inorganici, diversi da quelli di cui alla voce 16 03 03', '020104': 'rifiuti plastici (ad esclusione degli imballaggi)', '120103': 'limatura e trucioli di materiali non ferrosi', '120101': 'limatura e trucioli di materiali ferrosi', '120105': 'limatura e trucioli di materiali plastici', '170402': 'alluminio', '170405': 'ferro e acciaio', '170401': 'rame, bronzo, ottone', '170411': 'cavi, diversi da quelli di cui alla voce 17 04 10', '170410': 'cavi, impregnati di olio, di catrame di carbone o di altre sostanze pericolose*', '150101': 'imballaggi di carta e cartone', '150102': 'imballaggi di plastica', '150103': 'imballaggi in legno', '150104': 'imballaggi metallici', '150107': 'imballaggi di vetro', '200101': 'carta e cartone', '200102': 'vetro', '200140': 'metallo', '200108': 'rifiuti biodegradabili di cucine e mense', '200301': 'rifiuti urbani non differenziati', '020304': 'scarti inutilizzabili per il consumo o la trasformazione', '020601': 'scarti inutilizzabili per il consumo o la trasformazione (industria dolciaria e della panificazione)', '170203': 'plastica', '170201': 'legno', '170202': 'vetro', '030105': 'segatura, trucioli, residui di taglio, legno, pannelli', '200138': 'legno, diverso da quello di cui alla voce 20 01 37', '170107': 'miscugli di cemento, mattoni, mattonelle e ceramiche, diversi da 17 01 06', '170904': 'rifiuti misti dell\'attività di costruzione e demolizione', '130205': 'scarti di olio minerale per motori, ingranaggi e lubrificazione, non clorurati*', '200125': 'oli e grassi commestibili', '160216': 'componenti rimossi da apparecchiature fuori uso, diversi da 16 02 15', '160601': 'batterie al piombo*', '160604': 'batterie alcaline (tranne 16 06 03)', '160605': 'altre batterie ed accumulatori', '200133': 'batterie e accumulatori di cui alle voci 16 06 01, 16 06 02 e 16 06 03 e batterie e accumulatori non suddivisi contenenti tali batterie*', '200134': 'batterie e accumulatori diversi da quelli di cui alla voce 20 01 33', '160103': 'pneumatici fuori uso' };
const fc = c => eerNorm(c) + (/\*$/.test(CODEDESC[c] || '') ? '*' : '');
const fdesc = c => String(CODEDESC[c] || eerLabel(c) || '').replace(/\*$/, '');
function fxSolve(F) {
  const { mat, act, proc, q3 } = F; const V = act === 'officina' || act === 'autodem'; const urbAct = ['terziario', 'casa', 'commercio'].includes(act);
  const R = (code, why, alts, checks) => ({ code, why, alts: (alts || []).map(x => ({ c: x[0], d: x[1] })), checks: checks || [] });
  const ND = (why, need) => ({ nd: true, why, checks: need });
  if (mat !== 'oli' && (q3 === 'si' && ['nonfer', 'ferro', 'veicolo', 'rame', 'raee'].includes(mat))) return ND('Se il pezzo contiene oli, liquidi o parti pericolose la classificazione cambia: prima va bonificato oppure va valutata una voce pericolosa.', ['Svuotare e bonificare il pezzo e ripetere la classificazione', 'In alternativa far valutare la pericolosità con un\'analisi']);
  if (proc === 'imb') { const m = { carta: '150101', plastica: '150102', legno: '150103', ferro: '150104', nonfer: '150104', vetro: '150107' }[mat]; if (m) return R(m, 'È un imballaggio: per gli imballaggi il capitolo 15 01 prevale sull\'attività che li ha prodotti.', [['15 01 06', 'imballaggi in materiali misti: solo se il materiale non è separato'], urbAct ? ['20 01 xx', 'il capitolo 20 vale per la raccolta urbana, non per gli imballaggi conferiti a parte'] : null].filter(Boolean), ['Verificare che l\'imballaggio sia vuoto e non contaminato (altrimenti 15 01 10*)']); }
  switch (mat) {
    case 'lampade':
      if (q3 === 'fluo') return R(urbAct ? '200121' : '160213', 'Le lampade fluorescenti contengono mercurio: sono pericolose.', [['20 01 36', 'solo per lampade LED senza componenti pericolosi']], ['Conservare integre, senza romperle']);
      if (urbAct) return R('200136', 'Lampade LED da un\'attività con rifiuti simili a quelli domestici: rifiuto urbano, capitolo 20 01 (art. 183, c. 1, lett. b-ter, d.lgs. 152/2006 e allegato L-quater).', [['20 01 35*', 'solo se ci sono componenti pericolosi'], ['16 02 14', 'se il rifiuto non ha i requisiti di rifiuto urbano'], ['16 02 13*', 'versione pericolosa del 16 02 14']], ['Verificare che siano davvero LED (non fluorescenti)', 'Verificare i requisiti di rifiuto urbano dell\'attività']);
      return R('160214', 'Lampade LED da un\'attività produttiva: apparecchiature fuori uso del capitolo 16 02.', [['16 02 13*', 'se ci sono componenti pericolosi'], ['20 01 36', 'solo se rifiuto urbano']], ['Verificare il tipo di lampada']);
    case 'plastica':
      if (act === 'agricola') return R('020104', 'Plastica prodotta da un\'azienda agricola: la provenienza porta al capitolo 02 01 (rifiuti plastici, esclusi gli imballaggi).', [['15 01 02', 'se si tratta di imballaggi'], ['20 01 39', 'non si applica: non è rifiuto urbano']], ['Verificare che non siano imballaggi di fitofarmaci (pericolosi)']);
      if (act === 'edilizia') return R('170203', 'Plastica da costruzione o demolizione: capitolo 17 02.', [['17 02 04*', 'se contaminata da sostanze pericolose']]);
      if (act === 'metalmecc' && proc === 'scarto') return R('120105', 'Ritagli o trucioli di lavorazione della plastica: capitolo 12 01.', [['07 02 13', 'se viene dalla produzione della plastica stessa']]);
      if (act === 'commercio' || proc === 'inv') { if (q3 === 'si') return R('200139', 'Merce in plastica da magazzino o rivendita con i requisiti del rifiuto urbano (allegati L-quater e L-quinquies): capitolo 20 01.', [['16 03 06', 'se non ha i requisiti di rifiuto urbano: prodotti fuori specifica o inutilizzati']], ['Verificare i requisiti di rifiuto urbano']); if (q3 === 'no') return R('160306', 'Prodotti in plastica invenduti o fuori specifica, senza i requisiti del rifiuto urbano: capitolo 16 03 (le plastiche sono materiali organici).', [['20 01 39', 'solo se ha i requisiti di rifiuto urbano'], ['16 03 04', 'per prodotti inorganici']]); return ND('Per la merce in plastica di un magazzino il codice dipende dal fatto che il rifiuto abbia o no i requisiti di rifiuto urbano.', ['Verificare la natura dell\'attività (allegato L-quinquies) e del rifiuto (allegato L-quater)']); }
      if (urbAct) return R('200139', 'Plastica da attività con rifiuti simili ai domestici: rifiuto urbano.', [['15 01 02', 'se sono imballaggi']]);
      break;
    case 'nonfer':
      if (V) return R('160118', 'Il rifiuto nasce dalla manutenzione o demolizione di un veicolo: il capitolo pertinente è il 16 01. Il pezzo è di metallo non ferroso, svuotato e separato.', [['16 01 17', 'metalli ferrosi: il pezzo non è di ferro'], ['16 01 22', 'componenti non specificati: qui il pezzo è solo metallo'], ['12 01 03', 'limatura e trucioli: non è uno scarto di lavorazione'], ['17 04 02', 'alluminio da costruzione e demolizione: origine diversa']], ['Confermare che sia alluminio e che non restino oli, liquidi o parti pericolose']);
      if (act === 'metalmecc' && proc === 'scarto') return R('120103', 'Trucioli o limatura di metalli non ferrosi da lavorazione meccanica: capitolo 12 01.', [['12 01 04', 'polveri e particolato di metalli non ferrosi']]);
      if (act === 'edilizia' || proc === 'dem') return R('170402', 'Alluminio da costruzione o demolizione: capitolo 17 04.', [['16 01 18', 'solo se viene da veicoli']]);
      if (urbAct) return R('200140', 'Metallo da attività con rifiuti simili ai domestici: rifiuto urbano.', [['17 04 02', 'se viene da lavori edili']]);
      break;
    case 'ferro':
      if (V) return R('160117', 'Metallo ferroso da manutenzione o demolizione di veicoli: capitolo 16 01.', [['17 04 05', 'ferro da costruzione e demolizione'], ['12 01 01', 'limatura e trucioli']], ['Verificare che il pezzo sia svuotato da liquidi']);
      if (act === 'edilizia' || proc === 'dem') return R('170405', 'Ferro e acciaio da costruzione o demolizione: capitolo 17 04.', [['16 01 17', 'solo se viene da veicoli'], ['12 01 01', 'solo per trucioli di lavorazione']]);
      if (act === 'metalmecc' && proc === 'scarto') return R('120101', 'Limatura e trucioli di ferro da lavorazione meccanica: capitolo 12 01.', [['12 01 02', 'polveri e particolato'], ['17 04 05', 'solo per materiale da demolizione']]);
      if (urbAct) return R('200140', 'Metallo da attività con rifiuti simili ai domestici: rifiuto urbano.', [['17 04 05', 'se viene da lavori edili']]);
      break;
    case 'veicolo':
      if (V) return R('160122', 'Componente rimosso da un veicolo (es. alternatore) che contiene più materiali: capitolo 16 01, componenti non specificati altrimenti.', [['16 01 18', 'solo se il pezzo è di un unico metallo non ferroso'], ['16 01 17', 'solo se è di ferro'], ['16 02 16', 'componenti rimossi da apparecchiature, non da veicoli']], ['Verificare che non contenga liquidi o parti pericolose']);
      break;
    case 'rame':
      if (act === 'edilizia' || proc === 'dem') return R(F.cavi ? '170411' : '170401', 'Rame da costruzione o ristrutturazione: capitolo 17 04.', [['17 04 10*', 'cavi impregnati di olio o catrame'], ['17 04 01', 'rame in pezzi'], ['17 04 11', 'cavi']], ['Indicare se si tratta di cavi o di rame in pezzi']);
      if (act === 'metalmecc' && proc === 'scarto') return R('120103', 'Sfridi di rame da lavorazione: capitolo 12 01.', []);
      break;
    case 'alimenti':
      if (act === 'alimentare') return R('020601', 'Scarti di prodotto da un\'industria alimentare (es. pastificio): capitolo 02, in base alla lavorazione.', [['02 03 04', 'per altre lavorazioni alimentari'], ['16 03 06', 'solo per merce commerciale invenduta']], ['Verificare il sottocapitolo giusto per il tipo di lavorazione']);
      if (act === 'commercio') return R('160306', 'Alimenti scaduti o invenduti da un grossista: prodotti fuori specifica o inutilizzati, capitolo 16 03.', [['20 01 08', 'rifiuti di cucine e mense: non è il caso'], ['20 03 01', 'urbani indifferenziati: non applicabile'], ['02 03 04', 'scarti di produzione: il grossista non produce']], ['Verificare se gli imballaggi vanno separati (15 01)']);
      if (act === 'terziario') return R('200108', 'Rifiuti di cucina da ristorazione: rifiuto urbano.', [['20 01 25', 'oli e grassi commestibili']]);
      break;
    case 'carta': if (urbAct) return R('200101', 'Carta da attività con rifiuti simili ai domestici: rifiuto urbano.', [['15 01 01', 'se sono imballaggi']]); break;
    case 'legno':
      if (act === 'legno') return R('030105', 'Scarti della lavorazione del legno: capitolo 03 01.', [['03 01 04*', 'se contengono sostanze pericolose']]);
      if (act === 'edilizia' || proc === 'dem') return R('170201', 'Legno da costruzione o demolizione: capitolo 17 02.', [['17 02 04*', 'se trattato con sostanze pericolose']]);
      if (urbAct) return R('200138', 'Legno da attività con rifiuti simili ai domestici: rifiuto urbano.', [['15 01 03', 'se imballaggi']]);
      break;
    case 'vetro': if (act === 'edilizia' || proc === 'dem') return R('170202', 'Vetro da costruzione o demolizione.', []); if (urbAct) return R('200102', 'Vetro da attività con rifiuti simili ai domestici.', [['15 01 07', 'se imballaggi']]); break;
    case 'inerti': return R('170107', 'Macerie da costruzione o demolizione (cemento, mattoni, ceramiche).', [['17 09 04', 'rifiuti misti, se ci sono altri materiali'], ['17 01 06*', 'se contengono sostanze pericolose']], ['Verificare l\'assenza di amianto e sostanze pericolose']);
    case 'oli': if (V) return R('130205', 'Olio motore esausto da officina: capitolo 13 02, pericoloso.', [['13 02 08*', 'altri oli per motori']], ['Conservare in contenitori a tenuta']); if (act === 'terziario') return R('200125', 'Oli e grassi commestibili da ristorazione.', [['20 01 26*', 'oli diversi da quelli commestibili']]); break;
    case 'batterie':
      if (q3 === 'piombo') return R(urbAct ? '200133' : '160601', urbAct ? 'Batterie al piombo da attività con rifiuti simili ai domestici: rifiuto urbano pericoloso.' : 'Accumulatori al piombo da attività produttiva o officina: capitolo 16 06, pericolosi.', [[urbAct ? '16 06 01*' : '20 01 33*', urbAct ? 'se non ha i requisiti di rifiuto urbano' : 'solo per rifiuti urbani']], ['Conservare in contenitori a tenuta, senza perdite di acido']);
      if (q3 === 'litio') return R(urbAct ? '200134' : '160605', urbAct ? 'Batterie al litio da attività con rifiuti simili ai domestici: rifiuto urbano.' : 'Batterie al litio da attività produttiva: «altre batterie ed accumulatori», capitolo 16 06.', [['16 06 02*', 'batterie al nichel-cadmio'], ['16 06 03*', 'batterie contenenti mercurio']], ['Proteggere i poli dal cortocircuito', 'Separare le batterie gonfie o danneggiate']);
      if (q3 === 'alcaline') return R(urbAct ? '200134' : '160604', urbAct ? 'Pile da attività con rifiuti simili ai domestici: rifiuto urbano.' : 'Batterie alcaline da attività produttiva: capitolo 16 06.', [['16 06 03*', 'se contengono mercurio']]);
      return ND('Il codice delle batterie dipende dal tipo (piombo, litio, alcaline…), che di solito è scritto sull\'etichetta.', ['Leggere l\'etichetta della batteria', 'Fotografare l\'etichetta e ripetere la classificazione']);
    case 'raee': return R(urbAct ? '200136' : '160214', urbAct ? 'Apparecchi elettrici da attività con rifiuti simili ai domestici: RAEE urbani.' : 'Apparecchiature fuori uso da attività produttiva: capitolo 16 02.', [[urbAct ? '20 01 35*' : '16 02 13*', 'se ci sono componenti pericolosi']]);
  }
  return ND('Con questi dati non è possibile proporre un codice in modo affidabile: la combinazione di materiale e attività richiede una valutazione caso per caso.', ['Descrivere meglio il processo che ha prodotto il rifiuto', 'Chiedere a un consulente ambientale']);
}
XR.fotoeer = (step) => {
  const F = U.fx || (U.fx = {});
  if (step === 'hist') {
    const co = myCo(); const L = all('eerx').filter(x => x.co === co.id).sort((a, b) => String(b.at).localeCompare(String(a.at)));
    return { h: header('t', 'Le mie classificazioni', { back: '#/fotoeer' }), b: L.length ? `<div class="list">${L.map(x => `<a class="li" data-act="fxOpen" data-id="${x.id}">${x.img && imgSrc(x.img) ? `<img src="${imgSrc(x.img)}" alt="" style="width:52px;height:52px;object-fit:cover;border-radius:10px">` : `<span class="av sm t">EER</span>`}<span class="sp"><b class="mono">${xCode(x) ? esc(xCode(x)) + (x.res.nd ? ' (IA)' : '') : 'Non determinabile'}</b><span class="s">${esc((FX_MAT.find(m => m[0] === x.mat) || [, ''])[1])} · ${esc((FX_ACT.find(m => m[0] === x.act) || [, ''])[1])}</span><span class="s">${fDT(x.at)} · ${esc(memName(x.by))}</span></span></a>`).join('')}</div>` : '<div class="empty">Nessuna classificazione salvata.</div>' };
  }
  if (step === 'q') {
    if (!F.mat) { setTimeout(() => go('#/fotoeer'), 0); return { b: '' }; }
    const procs = fxProc(F.mat); const q3 = F.act && F.proc ? fxQ3(F.mat, F.act, F.proc) : null;
    const chs = (key, list) => `<div class="chips">${list.map(([k, l]) => chip(F[key] === k, 'fxSet', l, `data-k="${key}" data-v="${k}"`)).join('')}</div>`;
    return {
      h: header('t', 'Qualche domanda', { back: '#/fotoeer' }), b: `<div class="steps"><i class="on"></i><i class="on"></i><i></i><span>Domande · massimo 3</span></div>
    <div class="co">${F.img && imgSrc(F.img) ? `<img src="${imgSrc(F.img)}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:12px">` : ''}<span class="sp"><div class="xs mut">Nella foto</div><b>${esc((FX_MAT.find(m => m[0] === F.mat) || [, ''])[1])}</b></span></div>
    <div class="card"><span class="sec" style="margin:0;color:var(--blue)">Domanda 1 di ${q3 ? 3 : 2} · obbligatoria</span><b>Quale attività ha prodotto il rifiuto?</b>${chs('act', FX_ACT)}<span class="hint">La provenienza decide il capitolo del codice.</span></div>
    ${F.act ? `<div class="card"><span class="sec" style="margin:0;color:var(--blue)">Domanda 2 di ${q3 ? 3 : 2}</span><b>Da cosa proviene, perché viene scartato?</b>${chs('proc', procs)}</div>` : ''}
    ${q3 ? `<div class="card"><span class="sec" style="margin:0;color:var(--blue)">Domanda 3 di 3 · solo se indispensabile</span><b>${esc(q3[1])}</b>${chs('q3', q3[2])}</div>` : ''}
    ${F.mat === 'rame' && F.act ? `<label class="cbx"><input type="checkbox" data-f="fx.cavi" ${F.cavi ? 'checked' : ''}><span>Si tratta di cavi</span></label>` : ''}
    ${fld('Foto poco chiara? Descrivi il dettaglio (facoltativo)', inp('fx', 'det', 'Es. carter motore in alluminio, senza guarnizioni'))}
    <button class="bt" data-act="fxSolve" ${F.act && F.proc && (!q3 || F.q3) && !F.solving ? '' : 'disabled'}>${F.solving ? 'Sto preparando la proposta…' : 'Proponi il codice EER'}</button>` };
  }
  if (step === 'res') {
    const x = F.saved ? get('eerx', F.saved) : null; if (!x) { setTimeout(() => go('#/fotoeer'), 0); return { b: '' }; }
    const r = x.res; const m = me();
    return {
      h: header('t', r.nd && !xCode(x) ? 'Non determinabile' : 'Codice proposto', { back: '#/fotoeer/hist' }), b: `<div class="steps"><i class="on"></i><i class="on"></i><i class="on"></i><span>Proposta</span></div>
    ${x.ai ? `<div class="co">${x.img && imgSrc(x.img) ? `<img src="${imgSrc(x.img)}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:12px">` : ''}<span class="sp"><span class="xs mut">Nella foto</span><div><b>${esc(x.ai.oggetto)}</b></div></span></div>` : ''}
    ${r.nd && r.ai && r.ai.codice && !/non determinabile/i.test(r.ai.codice) ? `<div class="card" style="background:linear-gradient(135deg,#00A3A3,#007C8A);color:#fff;border:0"><span class="sm" style="opacity:.9">Proposta dell'intelligenza artificiale · da verificare</span><span class="mono" style="font-size:32px;font-weight:800;letter-spacing:2px">${esc(r.ai.codice)}</span><b>${esc(r.ai.descrizione)}</b></div><div class="card"><h3>Perché</h3><span>${esc(r.ai.motivazione)}</span>${eerFind(r.ai.codice) ? '' : '<span class="hint">Codice non presente nell\'elenco ridotto dell\'app: verificarlo sull\'elenco ufficiale.</span>'}</div>${(r.ai.alternative || []).length ? `<div class="card"><h3>Codici confrontati</h3>${r.ai.alternative.map(a => `<div class="row sm" style="align-items:flex-start;border-top:1px solid var(--line);padding-top:8px"><b class="mono" style="min-width:80px">${esc(a.c)}</b><span class="sp">${esc(a.d)}</span></div>`).join('')}</div>` : ''}${(r.ai.verifiche || []).length ? `<div class="warn"><b>Verifiche</b><ul style="margin:4px 0 0;padding-left:18px">${r.ai.verifiche.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}<div class="info sm">Le regole dell'app non bastavano per questo caso (${esc(r.why)}): la proposta è dell'intelligenza artificiale e va verificata con più attenzione, meglio con un consulente.</div>` : ''}
    ${r.nd && !(r.ai && r.ai.codice && !/non determinabile/i.test(r.ai.codice)) ? `<div class="card" style="background:#FFF3E0;border-color:#F5D19A"><b style="font-size:20px">Non determinabile</b><span>${esc(r.why)}</span>${r.aiErr ? `<span class="hint">Proposta automatica non disponibile: ${esc(r.aiErr)}</span>` : ''}</div>` : r.nd ? '' : `<div class="card" style="background:linear-gradient(135deg,#0A9858,#056F47);color:#fff;border:0"><span class="sm" style="opacity:.9">Codice EER proposto</span><span class="mono" style="font-size:34px;font-weight:800;letter-spacing:2px">${esc(fc(r.code))}</span><b>${esc(fdesc(r.code))}</b><span class="sm" style="opacity:.9">Capitolo ${r.code.slice(0, 2)} ${r.code.slice(2, 4)} · ${/\*/.test(fc(r.code)) ? 'pericoloso' : 'non pericoloso'}</span></div>
    <div class="card"><h3>Perché</h3><span>${esc(r.why)}</span></div>`}
    ${(r.alts || []).length ? `<div class="card"><h3>Codici confrontati e scartati</h3>${r.alts.map(a => `<div class="row sm" style="align-items:flex-start;border-top:1px solid var(--line);padding-top:8px"><b class="mono" style="min-width:80px">${esc(a.c || a[0])}</b><span class="sp">${esc(a.d || a[1])}</span></div>`).join('')}</div>` : ''}
    ${(r.checks || []).length && !(r.nd && r.ai && r.ai.codice) ? `<div class="warn"><b>${r.nd ? 'Dati da raccogliere' : 'Verifiche prima di usarlo'}</b><ul style="margin:4px 0 0;padding-left:18px">${r.checks.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
    ${(!r.nd || (r.ai && eerNorm(r.ai.codice))) && canWrite(m) && !isField(m) ? `<div class="two"><button class="bt g" data-act="fxReq">Richiedi quotazione</button>${isG(myCo()) ? '<button class="bt gh" data-act="fxAdd">Aggiungi ai miei rifiuti</button>' : ''}</div>` : ''}
    <div class="two"><button class="bt gh" data-act="fxPrint">Stampa o salva PDF</button><button class="bt gh" data-act="fxConsult">Chiedi a un consulente</button></div>
    <p class="hint">È una proposta motivata, non una classificazione definitiva: decide il produttore del rifiuto. Metodo: Linee guida SNPA sulla classificazione dei rifiuti; capitoli 01–12 e 17–20, poi 13–15, poi 16, infine 99.</p>` };
  }
  const co = myCo();
  return {
    h: header('t', 'Codice EER da foto', { back: '#/home' }), b: `<p class="sub">Fotografa il rifiuto: ti proponiamo il codice</p><div class="steps"><i class="on"></i><i></i><i></i><span>Foto · domande · proposta</span></div>
  <div style="position:relative;border-radius:18px;overflow:hidden;background:#0B1442;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center">${F.img && imgSrc(F.img) ? `<img src="${imgSrc(F.img)}" alt="Foto del rifiuto" style="width:100%;height:100%;object-fit:cover">` : `<span style="color:#fff;opacity:.8;text-align:center;padding:20px">Inquadra tutto l'oggetto, con buona luce.<br>Una sola tipologia di rifiuto per foto.</span>`}</div>
  <button class="bt" data-act="fxShot" data-cam="1">${IC.cam} Scatta la foto</button><button class="bt gh" data-act="fxShot">🖼 Carica dalla galleria</button>
  ${aiBox(F)}<div class="card"><b>${F.ai && F.ai.ok ? 'Materiale riconosciuto: correggi se serve' : 'Cosa c\'è nella foto?'}</b><span class="hint">${aiOn() ? (F.img ? '' : 'Scatta o carica la foto: il rifiuto viene riconosciuto in automatico. ') + 'Puoi sempre correggere il materiale.' : 'Il riconoscimento automatico funziona nella versione web (canvas20.github.io). Qui indica tu il materiale.'}</span><div class="chips">${FX_MAT.map(([k, l]) => chip(F.mat === k, 'fxSet', l, `data-k="mat" data-v="${k}"`)).join('')}</div></div>
  <button class="bt g" data-act="fxNext" ${F.mat ? '' : 'disabled'}>Continua</button>
  <div class="info sm">1. Foto del rifiuto. 2. Al massimo tre domande: chi lo ha prodotto, come, e solo se serve di cosa è fatto. 3. Codice EER proposto, con motivazione e verifiche.</div>
  <p class="hint">La proposta è un aiuto: la classificazione resta responsabilità di chi produce il rifiuto. Le foto si usano solo per questa analisi <span class="ph">[durata di conservazione da definire]</span>.</p>
  <a href="#/fotoeer/hist"><b>Le mie classificazioni (storico)</b></a>` };
};
ACT.fxShot = el => pickImage(id => { U.fx.img = id; U.fx.ai = null; render(); fxAnalyze(); }, { camera: !!el.dataset.cam });
function aiOn() { return MODE === 'firebase' && !!window.NOTIFY_URL; }
function aiUrl() { return String(window.NOTIFY_URL).replace(/\/$/, '') + '/eer-foto'; }
async function aiCall(body) { const r = await fetch(aiUrl(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json(); if (!r.ok || j.error) throw new Error(j.error || ('errore ' + r.status)); return j; }
async function fxAnalyze() {
  const F = U.fx; if (!aiOn() || !F.img) return;
  F.ai = { loading: true }; render();
  try { const a = await aiCall({ img: imgSrc(F.img), note: String(F.det || '').slice(0, 200) }); if (U.fx !== F) return; F.ai = a; if (!F.matManual) { F.mat = a.materiale; F.act = F.proc = F.q3 = ''; } }
  catch (e) { F.ai = { error: e.message }; }
  render();
}
function aiBox(F) {
  if (!F.ai) return '';
  if (F.ai.loading) return `<div class="info"><b>🔎 Analizzo la foto…</b> qualche secondo.</div>`;
  if (F.ai.error) return `<div class="warn">Riconoscimento automatico non riuscito (${esc(F.ai.error)}). Indica tu il materiale qui sotto, oppure riprova. <button class="bt gh s" data-act="fxRetry" style="margin-top:6px">Riprova</button></div>`;
  const a = F.ai; const aff = { alta: ['n', 'affidabilità alta'], media: ['w', 'affidabilità media'], bassa: ['r', 'affidabilità bassa'] }[a.affidabilita] || ['w', ''];
  return `<div class="card" style="border:2px solid #00A3A3"><span class="xs mut">Riconosciuto nella foto</span><b style="font-size:19px">${esc(a.oggetto || 'Oggetto non chiaro')}</b><span class="sm">${esc(a.descrizione || '')}</span><div>${stx(aff[0], aff[1])}</div>${a.pericolo ? `<div class="warn">⚠️ Possibili sostanze pericolose${a.nota_pericolo ? ': ' + esc(a.nota_pericolo) : ''}. Lo terremo in conto nelle domande.</div>` : ''}${a.piu_rifiuti ? '<div class="warn">Nella foto sembrano esserci più tipi di rifiuto: per un codice affidabile fotografa un solo tipo alla volta.</div>' : ''}</div>`;
}
ACT.fxRetry = () => fxAnalyze();
function xCode(x) { const r = x.res; if (!r.nd) return fc(r.code); return r.ai && eerNorm(r.ai.codice) ? eerNorm(r.ai.codice) : ''; }
function xDesc(x) { const r = x.res; return !r.nd ? fdesc(r.code) : ((r.ai && r.ai.descrizione) || ''); }
ACT.fxSet = el => { const F = U.fx; F[el.dataset.k] = el.dataset.v; if (el.dataset.k === 'mat') F.matManual = true; if (el.dataset.k === 'mat') { F.act = F.proc = F.q3 = ''; } if (el.dataset.k === 'act') { F.proc = ''; F.q3 = ''; } if (el.dataset.k === 'proc') F.q3 = ''; render(); };
ACT.fxNext = () => go('#/fotoeer/q');
ACT.fxSolve = async () => {
  const F = U.fx; if (F.solving) return; const res = fxSolve(F);
  const lab = (L, k) => (L.find(x => x[0] === k) || [, ''])[1];
  if (res.nd && aiOn()) {
    F.solving = true; render(); toast('Chiedo una proposta all\'intelligenza artificiale…');
    try { const p = await aiCall({ mode: 'proponi', oggetto: (F.ai && F.ai.oggetto) || '', materiale: lab(FX_MAT, F.mat), attivita: lab(FX_ACT, F.act), processo: lab(fxProc(F.mat), F.proc), dettaglio: [F.det, F.ai && F.ai.descrizione, F.q3 ? 'risposta: ' + F.q3 : '', F.ai && F.ai.pericolo ? 'possibili sostanze pericolose: ' + (F.ai.nota_pericolo || 'sì') : ''].filter(Boolean).join('; ') }); res.ai = { codice: p.codice, descrizione: p.descrizione, motivazione: p.motivazione, alternative: p.alternative || [], verifiche: p.verifiche || [] }; }
    catch (e) { res.aiErr = e.message; }
    F.solving = false;
  }
  const ai = F.ai && F.ai.ok ? { oggetto: F.ai.oggetto, descrizione: F.ai.descrizione, pericolo: !!F.ai.pericolo, affidabilita: F.ai.affidabilita } : null;
  const id = uid('x_'); put('eerx', id, { co: myCo().id, by: meId(), img: F.img || '', mat: F.mat, act: F.act, proc: F.proc, q3: F.q3 || '', det: String(F.det || '').trim(), ai, res, at: nowISO() });
  log('Codice EER da foto: ' + (res.nd ? (res.ai && res.ai.codice ? 'proposta IA ' + res.ai.codice : 'non determinabile') : fc(res.code))); U.fx = { saved: id }; go('#/fotoeer/res');
};
ACT.fxOpen = el => { U.fx = { saved: el.dataset.id }; go('#/fotoeer/res'); };
ACT.fxReq = () => { const x = get('eerx', U.fx.saved); const macro = { ferro: 'Metalli', nonfer: 'Metalli', rame: 'Metalli', veicolo: 'Metalli', plastica: 'Plastica', carta: 'Carta e cartone', legno: 'Legno', vetro: 'Vetro', lampade: 'RAEE', raee: 'RAEE', alimenti: 'Organici', inerti: 'Inerti ed edilizia', oli: 'Oli ed emulsioni' }[x.mat] || 'Metalli'; U.nr = { macro, sub: '__altro', subx: xDesc(x).slice(0, 60), unit: 'kg', to: {}, eer: xCode(x), descr: x.det || '', photos: x.img ? [x.img] : [] }; go('#/newreq'); };
ACT.fxAdd = () => { const x = get('eerx', U.fx.saved); const co = myCo(); const w = clone(co.waste || []); const macro = { ferro: 'Metalli', nonfer: 'Metalli', rame: 'Metalli', veicolo: 'Metalli', plastica: 'Plastica', carta: 'Carta e cartone', legno: 'Legno', vetro: 'Vetro', lampade: 'RAEE', raee: 'RAEE', alimenti: 'Organici', inerti: 'Inerti ed edilizia', oli: 'Oli ed emulsioni' }[x.mat] || 'Altro'; const s = xDesc(x).slice(0, 40); let e = w.find(z => z.m === macro && z.s === s); if (!e) { e = { m: macro, s, rows: [] }; w.push(e); } e.rows.push({ d: x.det || s, e: xCode(x) }); patch('companies', co.id, { waste: w }); log('Aggiunto ai rifiuti trattati: ' + xCode(x)); toast('Aggiunto ai tuoi rifiuti trattati'); };
ACT.fxPrint = () => { try { window.print(); } catch (e) { toast('Stampa non disponibile qui.'); } };
ACT.fxConsult = () => { setF('vt', 'cat', 'Consulenti ambientali'); go('#/vetrina'); };

/* ---------- AGENDA ---------- */
const EVT = { ritiro: ['Ritiro', '#079A5A'], consegna: ['Consegna', '#0057F5'], scadenza: ['Scadenza', '#E5243B'], appuntamento: ['Appuntamento', '#7A3FE0'] };
function myEvents() { const co = myCo(); const m = me(); return all('events').filter(e => e.co === co.id && (!isField(m) || e.who === m.id)); }
const today = () => new Date().toISOString().slice(0, 10);
function todayBox() { const L = myEvents().filter(e => e.date === today() && !e.done); return `<div class="card"><h3>Oggi</h3>${L.length ? L.map(evRow).join('') : '<span class="mut sm">Niente in programma per oggi.</span>'}</div>`; }
function evRow(e) { const t = EVT[e.type] || EVT.appuntamento; return `<a class="li" data-go="#/evedit/${e.id}" style="${e.done ? 'opacity:.55' : ''}"><span style="width:6px;align-self:stretch;border-radius:3px;background:${t[1]}"></span><span class="sp"><b>${esc(e.title)}</b><span class="s">${t[0]}${e.time ? ' · ' + esc(e.time) : ''}${e.place ? ' · ' + esc(e.place) : ''}${e.who ? ' · ' + esc(memName(e.who)) : ''}</span></span>${e.done ? stx('n', 'Fatto') : ''}</a>`; }
XR.agenda = () => {
  const L = myEvents().sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const fut = L.filter(e => e.date >= today()); const past = L.filter(e => e.date < today()).reverse().slice(0, 10);
  const days = {}; fut.forEach(e => (days[e.date] = days[e.date] || []).push(e));
  const m = me();
  return {
    h: header('t', 'Agenda', { back: '#/home' }), t: 'home', b: `<p class="sub">${isField(m) ? 'I ritiri e gli appuntamenti assegnati a te' : 'Ritiri, consegne, scadenze e appuntamenti dell\'azienda'}</p>${!isField(m) || true ? '<button class="bt g" data-go="#/evedit/new">+ Nuovo evento</button>' : ''}
  ${Object.keys(days).length ? Object.keys(days).map(d => `<div class="sec">${d === today() ? 'Oggi · ' : ''}${fDate(d)}</div><div class="list">${days[d].map(evRow).join('')}</div>`).join('') : '<div class="empty">Niente in programma.</div>'}
  ${past.length ? `<div class="sec">Passati</div><div class="list">${past.map(evRow).join('')}</div>` : ''}
  <p class="hint">Agenda semplice dell'azienda: non è un gestionale dei trasporti.</p>` };
};
XR.evedit = (id) => {
  const co = myCo(); const e = id !== 'new' ? get('events', id) : null; const m = me();
  if (!U.ev || U.ev._id !== id) U.ev = Object.assign({ _id: id, type: 'ritiro', title: '', date: today(), time: '', place: '', who: isField(m) ? m.id : '', note: '', link: '' }, e ? clone(e) : {});
  const team = all('members').filter(x => x.co === co.id && x.status === 'active');
  return {
    h: header('t', e ? 'Evento' : 'Nuovo evento', { back: '#/agenda' }), b: `${U.ev.err ? `<div class="err">${esc(U.ev.err)}</div>` : ''}
  <div class="chips">${Object.entries(EVT).map(([k, v]) => chip(U.ev.type === k, 'evType', v[0], `data-k="${k}"`)).join('')}</div>
  ${fld('Titolo', inp('ev', 'title', 'Es. Ritiro rame da Officina Demo'), 1)}
  <div class="two">${fld('Data', inp('ev', 'date', '', 'date'), 1)}${fld('Ora', inp('ev', 'time', '', 'time'))}</div>
  ${fld('Luogo', inp('ev', 'place', 'Indirizzo o azienda'))}
  ${fld('Assegnato a', sel('ev', 'who', [['', 'Nessuno']].concat(team.map(x => [x.id, memName(x.id) + ' · ' + ROLES[x.role]]))))}
  ${fld('Note', area('ev', 'note'))}
  <button class="bt g" data-act="evSave">Salva</button>
  ${e ? `<div class="two"><button class="bt gh" data-act="evDone">${e.done ? 'Segna da fare' : 'Segna come fatto'}</button><button class="bt rd" data-act="evDel">Elimina</button></div>` : ''}` };
};
ACT.evType = el => { U.ev.type = el.dataset.k; render(); };
ACT.evSave = () => { const E = U.ev; if (!String(E.title).trim() || !E.date) { E.err = 'Titolo e data sono obbligatori.'; return render(); } const id = E._id === 'new' ? uid('ev_') : E._id; const o = { co: myCo().id, type: E.type, title: String(E.title).trim(), date: E.date, time: E.time || '', place: String(E.place || '').trim(), who: E.who || '', note: String(E.note || '').trim(), done: !!E.done, by: E.by || meId(), createdAt: E.createdAt || nowISO() }; put('events', id, o); log((E._id === 'new' ? 'Creato' : 'Modificato') + ' in agenda: ' + o.title + ' (' + fDate(o.date) + ')'); U.ev = null; go('#/agenda'); };
ACT.evDone = () => { const id = U.ev._id; const e = get('events', id); patch('events', id, { done: !e.done }); log((e.done ? 'Riaperto' : 'Completato') + ': ' + e.title); U.ev = null; go('#/agenda'); };
ACT.evDel = () => confirmBox('Eliminare l\'evento?', '', 'Elimina', () => { const id = U.ev._id; const e = get('events', id); del('events', id); log('Eliminato dall\'agenda: ' + e.title); U.ev = null; go('#/agenda'); }, 1);

/* ---------- DOCUMENTI E SCADENZE ---------- */
const DCAT = ['Autorizzazione', 'Iscrizione Albo', 'Contratto', 'Certificato', 'Assicurazione', 'Altro'];
function docState(d) { if (!d.expiry) return ['x', 'Senza scadenza']; const days = Math.floor((new Date(d.expiry) - new Date()) / 864e5); if (days < 0) return ['r', 'Scaduto']; if (days <= (+d.remind || 30)) return ['w', 'Scade tra ' + days + ' g']; return ['n', 'Valido']; }
function expiringBox() { const co = myCo(); const L = all('docs').filter(d => d.co === co.id && ['r', 'w'].includes(docState(d)[0])); return L.length ? `<a class="warn" href="#/docs" style="display:block"><b>${L.length} document${L.length > 1 ? 'i' : 'o'} in scadenza o scadut${L.length > 1 ? 'i' : 'o'}</b> · ${L.map(d => esc(d.title)).join(', ')}</a>` : ''; }
XR.docs = () => {
  const co = myCo(); const L = all('docs').filter(d => d.co === co.id).sort((a, b) => String(a.expiry || '9999').localeCompare(String(b.expiry || '9999')));
  return { h: header('t', 'Documenti e scadenze', { back: '#/home' }), t: 'home', b: `<p class="sub">Autorizzazioni, iscrizioni e contratti, con avviso prima della scadenza.</p><button class="bt g" data-go="#/docedit/new">+ Aggiungi documento</button>${L.length ? `<div class="list">${L.map(d => { const [c, t] = docState(d); return `<a class="li" data-go="#/docedit/${d.id}">${IC.folder.replace('<svg', '<svg width="24" height="24" style="color:var(--blue);flex:none"')}<span class="sp"><b>${esc(d.title)}</b><span class="s">${esc(d.cat)}${d.expiry ? ' · scade il ' + fDate(d.expiry) : ''}${d.file ? ' · 📎' : ''}</span></span>${stx(c, t)}</a>`; }).join('')}</div>` : '<div class="empty">Nessun documento.</div>'}` };
};
XR.docedit = (id) => {
  const d = id !== 'new' ? get('docs', id) : null;
  if (!U.dc || U.dc._id !== id) U.dc = Object.assign({ _id: id, title: '', cat: DCAT[0], expiry: '', remind: '30', note: '', file: '' }, d ? clone(d) : {});
  const fdoc = U.dc.file && D.files[U.dc.file];
  return {
    h: header('t', d ? 'Documento' : 'Nuovo documento', { back: '#/docs' }), b: `${U.dc.err ? `<div class="err">${esc(U.dc.err)}</div>` : ''}
  ${fld('Titolo', inp('dc', 'title', 'Es. Autorizzazione unica art. 208'), 1)}${fld('Categoria', sel('dc', 'cat', DCAT))}
  <div class="two">${fld('Scadenza', inp('dc', 'expiry', '', 'date'))}${fld('Avvisami', sel('dc', 'remind', [['15', '15 giorni prima'], ['30', '30 giorni prima'], ['60', '60 giorni prima'], ['90', '90 giorni prima']]))}</div>
  <div class="lb">File</div><div class="row">${fdoc ? (String(fdoc.data).startsWith('data:image') ? `<img src="${fdoc.data}" alt="" style="width:80px;height:80px;object-fit:cover;border-radius:10px" data-act="zoom" data-id="${U.dc.file}">` : `<a href="#" data-act="dlFile" data-id="${U.dc.file}">📎 ${esc(fdoc.name || 'PDF')}</a>`) : '<span class="mut sm">Nessun file</span>'}<button class="bt gh s" data-act="dcFile">${fdoc ? 'Sostituisci' : 'Carica PDF o foto'}</button></div>
  ${fld('Note', area('dc', 'note'))}
  <button class="bt g" data-act="dcSave">Salva</button>${d ? '<button class="bt rd" data-act="dcDel">Elimina</button>' : ''}` };
};
ACT.dcFile = () => pickImage(id => { U.dc.file = id; render(); }, { pdf: 1 });
ACT.dcSave = () => { const C = U.dc; if (!String(C.title).trim()) { C.err = 'Il titolo è obbligatorio.'; return render(); } const id = C._id === 'new' ? uid('dc_') : C._id; put('docs', id, { co: myCo().id, title: String(C.title).trim(), cat: C.cat, expiry: C.expiry || '', remind: C.remind || '30', note: String(C.note || '').trim(), file: C.file || '', by: C.by || meId(), createdAt: C.createdAt || nowISO() }); log('Salvato il documento «' + String(C.title).trim() + '»'); U.dc = null; go('#/docs'); };
ACT.dcDel = () => confirmBox('Eliminare il documento?', '', 'Elimina', () => { const d = get('docs', U.dc._id); del('docs', d.id); log('Eliminato il documento «' + d.title + '»'); U.dc = null; go('#/docs'); }, 1);

/* ---------- FORMULARI xFIR ---------- */
XR.firs = () => {
  const co = myCo(); const q = String(fv('fq', 'q')).toLowerCase();
  const L = all('firs').filter(f => f.co === co.id).filter(f => !q || [f.num, f.producer, f.transporter, f.dest, f.eer].join(' ').toLowerCase().includes(q)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return { h: header('t', 'Formulari xFIR', { back: '#/home' }), t: 'home', b: `<p class="sub">Fotografa il formulario e registra i dati principali.</p><button class="bt g" data-go="#/firedit/new">${IC.cam} Scansiona un formulario</button><div class="sr">${IC.search}<input data-f="fq.q" data-live value="${esc(fv('fq', 'q'))}" placeholder="Numero, azienda, codice EER"></div>${L.length ? `<div class="list">${L.map(f => `<a class="li" data-go="#/firedit/${f.id}">${f.photo && imgSrc(f.photo) ? `<img src="${imgSrc(f.photo)}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:10px">` : IC.truck.replace('<svg', '<svg width="24" height="24" style="color:var(--blue)"')}<span class="sp"><b class="mono">${esc(f.num || 'senza numero')}</b><span class="s">${fDate(f.date)} · ${esc(f.eer || '')} · ${esc(f.qty || '')} ${esc(f.unit || '')}</span><span class="s">${esc(f.producer || '')} → ${esc(f.dest || '')}</span></span></a>`).join('')}</div>` : '<div class="empty">Nessun formulario registrato.</div>'}<p class="hint">Archivio di comodo: RifiutiPro non sostituisce FIR, RENTRI o MUD. La lettura automatica del formulario dalla foto arriverà con il modello di intelligenza artificiale.</p>` };
};
XR.firedit = (id) => {
  const f = id !== 'new' ? get('firs', id) : null; const co = myCo();
  if (!U.fr || U.fr._id !== id) U.fr = Object.assign({ _id: id, num: '', date: today(), producer: '', transporter: co.types && co.types.includes('trasportatore') ? co.name : '', dest: '', eer: '', qty: '', unit: 'kg', note: '', photo: '' }, f ? clone(f) : {});
  const F = U.fr;
  return {
    h: header('t', f ? 'Formulario' : 'Nuovo formulario', { back: '#/firs' }), b: `${F.err ? `<div class="err">${esc(F.err)}</div>` : ''}
  <div class="row">${F.photo && imgSrc(F.photo) ? `<img src="${imgSrc(F.photo)}" alt="" style="width:90px;height:120px;object-fit:cover;border-radius:10px" data-act="zoom" data-id="${F.photo}">` : '<span class="mut sm sp">Nessuna foto</span>'}<div class="sp" style="display:flex;flex-direction:column;gap:6px"><button class="bt s" data-act="frPhoto" data-cam="1">${IC.cam} Fotografa</button><button class="bt gh s" data-act="frPhoto">Carica</button></div></div>
  <div class="two">${fld('Numero formulario', inp('fr', 'num', 'Es. XFIR 000000/26'))}${fld('Data', inp('fr', 'date', '', 'date'), 1)}</div>
  ${fld('Produttore / detentore', inp('fr', 'producer'))}${fld('Trasportatore', inp('fr', 'transporter'))}${fld('Destinatario', inp('fr', 'dest'))}
  <div class="two">${fld('Codice EER', inp('fr', 'eer', '17 04 05'))}${fld('Quantità', inp('fr', 'qty', '', 'text', 'inputmode="decimal"'))}</div>${fld('Unità', sel('fr', 'unit', ['kg', 't', 'litri', 'm³']))}
  ${fld('Note', area('fr', 'note'))}
  <button class="bt g" data-act="frSave">Salva</button>${f ? '<button class="bt rd" data-act="frDel">Elimina</button>' : ''}` };
};
ACT.frPhoto = el => pickImage(id => { U.fr.photo = id; render(); }, { camera: !!el.dataset.cam });
ACT.frSave = () => { const F = U.fr; let eer = ''; if (String(F.eer || '').trim()) { eer = eerNorm(F.eer); if (!eer) { F.err = 'Codice EER non valido.'; return render(); } } if (!F.date) { F.err = 'La data è obbligatoria.'; return render(); } const id = F._id === 'new' ? uid('fr_') : F._id; const o = { co: myCo().id, num: String(F.num || '').trim(), date: F.date, producer: String(F.producer || '').trim(), transporter: String(F.transporter || '').trim(), dest: String(F.dest || '').trim(), eer, qty: String(F.qty || '').trim(), unit: F.unit, note: String(F.note || '').trim(), photo: F.photo || '', by: F.by || meId(), createdAt: F.createdAt || nowISO() }; put('firs', id, o); log('Registrato il formulario ' + (o.num || 'senza numero')); U.fr = null; go('#/firs'); };
ACT.frDel = () => confirmBox('Eliminare il formulario?', '', 'Elimina', () => { del('firs', U.fr._id); log('Eliminato un formulario'); U.fr = null; go('#/firs'); }, 1);

/* ---------- LISTINI RISERVATI ---------- */
XR.lists = (clientId) => {
  const co = myCo(); const m = me();
  if (!isG(co)) {
    const L = all('lists').filter(l => l.client === co.id && (l.rows || []).length);
    return { h: header('t', 'Listini dai collegati', { back: '#/home' }), b: `<p class="sub">Prezzi riservati che le aziende collegate hanno preparato per te.</p>${L.length ? L.map(l => listCard(l)).join('') : '<div class="empty">Nessun listino ricevuto.</div>'}` };
  }
  if (clientId) {
    const id = co.id + '__' + clientId; const cur = D.lists[id];
    if (!U.ls || U.ls._id !== id) U.ls = { _id: id, rows: clone((cur && cur.rows) || []) };
    const R = U.ls.rows;
    const others = all('lists').filter(l => l.co === co.id && l.client !== clientId && (l.rows || []).length);
    return {
      h: header('t', 'Listino per ' + coName(clientId), { back: '#/lists' }), b: `<p class="sub">Lo vede solo <b>${esc(coName(clientId))}</b>. Mai pubblico.</p>
    ${R.map((r, i) => `<div class="card"><div class="two">${`<select class="in" data-ls="${i}|m">${MACRO.map(x => `<option ${r.m === x[0] ? 'selected' : ''}>${esc(x[0])}</option>`).join('')}</select>`}<input class="in" data-ls="${i}|s" value="${esc(r.s || '')}" placeholder="Rifiuto"></div><div class="two"><input class="in mono" data-ls="${i}|e" value="${esc(r.e || '')}" placeholder="EER (facolt.)"><select class="in" data-ls="${i}|dir"><option value="offro" ${r.dir !== 'richiedo' ? 'selected' : ''}>Offro</option><option value="richiedo" ${r.dir === 'richiedo' ? 'selected' : ''}>Richiedo</option></select></div><div class="two"><input class="in" data-ls="${i}|p" value="${esc(r.p || '')}" placeholder="Prezzo" inputmode="decimal"><select class="in" data-ls="${i}|u">${['€/kg', '€/t', '€/pezzo'].map(u => `<option ${r.u === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div><div class="row"><input class="in sp" data-ls="${i}|n" value="${esc(r.n || '')}" placeholder="Note (es. trasporto incluso)"><button class="x" data-act="lsDel" data-i="${i}">×</button></div></div>`).join('')}
    <button class="add" data-act="lsAdd">+ Aggiungi riga</button>${others.length ? `<div class="row"><span class="sp sm mut">Copia listino da…</span><select class="in" style="width:auto" id="lscopy"><option value="">scegli</option>${others.map(l => `<option value="${l.id}">${esc(coName(l.client))}</option>`).join('')}</select><button class="bt gh s" data-act="lsCopy">Copia</button></div>` : ''}
    <button class="bt g" data-act="lsSave">Salva e invia al cliente</button>${cur ? `<span class="hint">Ultimo aggiornamento: ${fDT(cur.updatedAt)}</span>` : ''}` };
  }
  const P = partners(co.id);
  return { h: header('t', 'Listini riservati', { back: '#/home' }), b: `<p class="sub">Un listino per ogni cliente collegato. Lo vede solo quel cliente.</p>${P.length ? `<div class="list">${P.map(p => { const l = D.lists[co.id + '__' + p.id]; return `<a class="li" data-go="#/lists/${p.id}">${avatar(p, 1)}<span class="sp"><b>${esc(p.name)}</b><span class="s">${l && (l.rows || []).length ? l.rows.length + ' righe · aggiornato ' + fDT(l.updatedAt) : 'Nessun listino'}</span></span><span class="chev">›</span></a>`; }).join('')}</div>` : '<div class="empty">Collegati prima a un cliente.</div>'}${all('lists').some(l => l.client === co.id) ? `<div class="sec">Ricevuti dai collegati</div>${all('lists').filter(l => l.client === co.id && (l.rows || []).length).map(listCard).join('')}` : ''}` };
};
function listCard(l) { return `<div class="card"><div class="row"><b class="sp">${esc(coName(l.co))}</b><span class="xs mut">${fDT(l.updatedAt)}</span></div>${l.rows.map(r => `<div class="row sm" style="border-top:1px solid var(--line);padding-top:6px"><span class="sp"><b>${esc(r.s || r.m)}</b> <span class="mut">${esc(r.m)}${r.e ? ' · ' + esc(r.e) : ''}</span>${r.n ? `<div class="xs mut">${esc(r.n)}</div>` : ''}</span><span>${r.dir === 'richiedo' ? 'Richiedo' : 'Offro'} <b>${money(r.p)} ${esc(r.u)}</b></span></div>`).join('')}</div>`; }
document.addEventListener('input', e => { const k = e.target.getAttribute && e.target.getAttribute('data-ls'); if (!k || !U.ls) return; const [i, f] = k.split('|'); U.ls.rows[+i][f] = e.target.value; });
document.addEventListener('change', e => { const k = e.target.getAttribute && e.target.getAttribute('data-ls'); if (!k || !U.ls) return; const [i, f] = k.split('|'); U.ls.rows[+i][f] = e.target.value; });
ACT.lsAdd = () => { U.ls.rows.push({ m: 'Metalli', s: '', e: '', dir: 'offro', p: '', u: '€/kg', n: '' }); render(); };
ACT.lsDel = el => { U.ls.rows.splice(+el.dataset.i, 1); render(); };
ACT.lsCopy = () => { const v = (document.getElementById('lscopy') || {}).value; if (!v) return; U.ls.rows = clone(D.lists[v].rows); render(); };
ACT.lsSave = () => { const co = myCo(); const id = U.ls._id; const client = id.split('__')[1]; for (const r of U.ls.rows) { if (!String(r.s).trim() || !String(r.p).trim()) return toast('Ogni riga richiede rifiuto e prezzo.'); if (r.e && !eerNorm(r.e)) return toast('Codice EER non valido: ' + r.e); if (r.e) r.e = eerNorm(r.e); } put('lists', id, { co: co.id, client, rows: U.ls.rows, updatedAt: nowISO() }); log('Aggiornato il listino riservato per ' + coName(client)); U.ls = null; toast('Listino inviato a ' + coName(client)); go('#/lists'); };

/* ---------- PREFERITI ---------- */
XR.favs = () => { const f = favDoc(); const cs = (f.companies || []).map(id => get('companies', id)).filter(Boolean); const qs = (f.quotes || []).map(id => get('quotes', id)).filter(Boolean); return { h: header('t', 'Preferiti', { back: '#/home' }), b: `<div class="sec">Aziende</div>${cs.length ? `<div class="list">${cs.map(coRow).join('')}</div>` : '<div class="empty">Tocca «Aggiungi ai preferiti» nel profilo di un\'azienda.</div>'}<div class="sec">Quotazioni</div>${qs.length ? `<div class="list">${qs.map(quoteRow).join('')}</div>` : '<div class="empty">Nessuna quotazione tra i preferiti.</div>'}` }; };

/* ---------- PREZZI E ANDAMENTO (solo dalle proprie quotazioni) ---------- */
function toKg(q) { const p = Number(String(q.price).replace(',', '.')); if (!isFinite(p)) return null; if (q.unit === '€/kg') return p; if (q.unit === '€/t') return p / 1000; return null; }
XR.prices = () => {
  const co = myCo(); const Q = all('quotes').filter(q => (q.from === co.id || q.to === co.id) && q.status !== 'withdrawn');
  const by = {}; Q.forEach(q => { const k = toKg(q); if (k == null) return; const key = (q.sub || q.macro) + (q.eer ? ' · ' + q.eer : ''); (by[key] = by[key] || []).push({ k, at: q.updatedAt || q.createdAt, dir: q.dir }); });
  const keys = Object.keys(by).sort();
  return { h: header('t', 'Prezzi e andamento', { back: '#/home' }), b: `<div class="info"><b>Prezzi di mercato da fonte pubblica:</b> <span class="ph">[fonte da definire]</span>. Non usiamo mai le quotazioni di altre aziende.</div><div class="sec">L'andamento nelle tue quotazioni</div>${keys.length ? keys.map(k => { const L = by[k].sort((a, b) => String(a.at).localeCompare(String(b.at))); const vs = L.map(x => x.k); const mn = Math.min(...vs), mx = Math.max(...vs), av = vs.reduce((a, b) => a + b, 0) / vs.length; const w = 300, h = 60; const pts = L.map((x, i) => `${L.length === 1 ? w / 2 : i * w / (L.length - 1)},${mx === mn ? h / 2 : h - (x.k - mn) / (mx - mn) * (h - 8) - 4}`).join(' '); return `<div class="card"><b>${esc(k)}</b><svg viewBox="0 0 ${w} ${h}" style="width:100%;height:60px"><polyline points="${pts}" fill="none" stroke="#0057F5" stroke-width="2.5"/>${L.map((x, i) => `<circle cx="${L.length === 1 ? w / 2 : i * w / (L.length - 1)}" cy="${mx === mn ? h / 2 : h - (x.k - mn) / (mx - mn) * (h - 8) - 4}" r="3.5" fill="#0057F5"/>`).join('')}</svg><div class="row sm"><span class="sp">min <b>${money(mn)}</b></span><span class="sp">medio <b>${money(av)}</b></span><span>max <b>${money(mx)}</b> €/kg</span></div><span class="hint">${L.length} quotazioni</span></div>`; }).join('') : '<div class="empty">Ancora nessuna quotazione in €/kg o €/t.</div>'}<p class="hint">Solo le quotazioni che hai inviato o ricevuto, convertite in €/kg.</p>` };
};

/* ---------- REPORT ---------- */
XR.report = () => {
  const co = myCo(); const per = fv('rp', 'p', '30'); const since = per === 'y' ? new Date(new Date().getFullYear(), 0, 1).getTime() : Date.now() - (+per) * 864e5;
  const inP = x => new Date(x.createdAt).getTime() >= since;
  const sent = all('quotes').filter(q => q.from === co.id && inP(q)), recv = all('quotes').filter(q => q.to === co.id && inP(q));
  const reqIn = all('reqs').filter(r => (r.to || []).includes(co.id) && inP(r)), reqOut = all('reqs').filter(r => r.from === co.id && inP(r));
  const byW = {}; sent.concat(recv).forEach(q => { const k = q.sub || q.macro; byW[k] = (byW[k] || 0) + 1; });
  const byC = {}; sent.forEach(q => { byC[q.to] = byC[q.to] || [0, 0]; byC[q.to][0]++; }); recv.forEach(q => { byC[q.from] = byC[q.from] || [0, 0]; byC[q.from][1]++; });
  const mxW = Math.max(1, ...Object.values(byW));
  return {
    h: header('t', 'Report e statistiche', { back: '#/home' }), b: `<div class="seg">${[['30', '30 giorni'], ['365', '12 mesi'], ['y', 'Anno']].map(([k, l]) => `<button class="${per === k ? 'on' : ''}" data-act="rpP" data-k="${k}">${l}</button>`).join('')}</div>
  <div class="kp"><div><span>Quotazioni inviate</span><b>${sent.length}</b></div><div><span>Quotazioni ricevute</span><b>${recv.length}</b></div><div><span>Confermate (ricezione)</span><b>${sent.filter(q => q.confirmedAt).length + recv.filter(q => q.confirmedAt).length}</b></div><div><span>Richieste ricevute / inviate</span><b>${reqIn.length} / ${reqOut.length}</b></div></div>
  <div class="card"><h3>Per rifiuto</h3>${Object.keys(byW).length ? Object.entries(byW).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="sm">${esc(k)}<div style="display:flex;align-items:center;gap:8px"><span style="height:10px;border-radius:5px;background:var(--blue);width:${v / mxW * 85}%"></span><b>${v}</b></div></div>`).join('') : '<span class="mut sm">Nessun dato nel periodo.</span>'}</div>
  <div class="card"><h3>Per azienda</h3>${Object.keys(byC).length ? `<dl class="dl">${Object.entries(byC).map(([c, v]) => `<dt>${esc(coName(c))}</dt><dd>${v[0]} inviate · ${v[1]} ricevute</dd>`).join('')}</dl>` : '<span class="mut sm">Nessun dato.</span>'}</div>
  <button class="bt gh" data-act="rpCsv">Esporta in Excel (CSV)</button><span class="hint">«Confermata» significa ricezione confermata. Solo i dati della tua azienda.</span>` };
};
ACT.rpP = el => { setF('rp', 'p', el.dataset.k); render(); };
async function download(name, text, type) { if (MODE === 'db') { try { const dl = await window.claude.use('downloads'); if (dl) { await dl.save({ filename: name, data: new Blob([text], { type }) }); return; } } catch (e) { if (e && e.code === 'cancelled') return; } } try { const b = new Blob([text], { type }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); } catch (e) { toast('Download non disponibile qui.'); } }
ACT.rpCsv = () => { const co = myCo(); const rows = [['Numero', 'Data', 'Direzione', 'Da', 'A', 'Rifiuto', 'EER', 'Prezzo', 'Unità', 'IVA', 'Stato']]; all('quotes').filter(q => q.from === co.id || q.to === co.id).forEach(q => rows.push([q.num, (q.updatedAt || q.createdAt).slice(0, 10), q.dir, coName(q.from), coName(q.to), q.sub, q.eer, String(q.price).replace('.', ','), q.unit, q.vat === 'esente' ? 'esente' : '+IVA', qStatus(q, q.to === co.id)[1]])); download('RifiutiPro_quotazioni.csv', '﻿' + rows.map(r => r.map(x => '"' + String(x ?? '').replace(/"/g, '""') + '"').join(';')).join('\n'), 'text/csv'); log('Esportate le quotazioni in CSV'); };

ACT.dlFile = el => { const f = D.files[el.dataset.id]; if (!f) return; const [h, b64] = String(f.data).split(','); const type = (h.match(/data:([^;]+)/) || [, 'application/octet-stream'])[1]; const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); download(f.name || ('documento.' + (type.split('/')[1] || 'bin')), u, type); };
/* ---------- PRIVACY, NOTIFICHE, ASSISTENZA ---------- */
XR.privacy = () => {
  const m = me(); const N = m.notif || { quotes: true, reqs: true, chat: true, email: true, promo: !!m.mkt };
  const t = (k, l) => `<label class="cbx"><input type="checkbox" data-act="ntf" data-k="${k}" ${N[k] ? 'checked' : ''}><span>${l}</span></label>`;
  return {
    h: header('t', 'Privacy e preferenze', { back: '#/profile' }), b: `<div class="card"><h3>Notifiche</h3>${t('quotes', 'Nuove quotazioni')}${t('reqs', 'Nuove richieste di quotazione')}${t('chat', 'Messaggi in chat')}${t('email', 'Riepilogo via email')}${t('promo', 'Comunicazioni promozionali')}<span class="hint">In prova le notifiche compaiono solo nella campanella.</span></div>
  <div class="card"><h3>Password</h3><span class="sm mut">In prova le password non vengono salvate. Nella versione definitiva: cambio password con conferma via email.</span></div>
  <div class="card"><h3>I tuoi dati</h3><button class="bt gh" data-act="expData">Esporta i dati della mia azienda (JSON)</button><button class="bt rd" data-act="askDel">Chiedi la cancellazione dell'account</button><span class="hint">La richiesta arriva all'assistenza di Soluzione Rifiuti.</span></div>` };
};
ACT.ntf = el => { const m = me(); const N = Object.assign({ quotes: true, reqs: true, chat: true, links: true, team: true, agenda: true, ads: true, help: true, email: true, promo: !!m.mkt }, m.notif || {}); N[el.dataset.k] = !N[el.dataset.k]; patch('members', m.id, { notif: N }); };
ACT.expData = () => { const co = myCo(); const pick = (c, f) => all(c).filter(f); const out = { azienda: co, membri: pick('members', x => x.co === co.id), quotazioni: pick('quotes', q => q.from === co.id || q.to === co.id), richieste: pick('reqs', r => r.from === co.id || (r.to || []).includes(co.id)), agenda: pick('events', e => e.co === co.id), documenti: pick('docs', d => d.co === co.id).map(d => Object.assign({}, d, { file: d.file ? '(file)' : '' })), formulari: pick('firs', f => f.co === co.id).map(f => Object.assign({}, f, { photo: f.photo ? '(foto)' : '' })), registro: (D.logs[co.id] || {}).items || [] }; download('RifiutiPro_dati_' + co.name.replace(/\W+/g, '_') + '.json', JSON.stringify(out, null, 1), 'application/json'); log('Esportati i dati dell\'azienda'); };
ACT.askDel = () => confirmBox('Chiedere la cancellazione?', 'Soluzione Rifiuti riceverà la richiesta e ti risponderà in assistenza.', 'Invia richiesta', () => { const m = me(); put('tickets', uid('tk_'), { co: m.co, by: m.id, subject: 'Richiesta di cancellazione account', text: 'Chiedo la cancellazione del mio account (' + m.email + ').', status: 'open', replies: [], createdAt: nowISO() }); log('Chiesta la cancellazione dell\'account'); toast('Richiesta inviata'); });
const FAQ = [['Come mi collego a un\'azienda?', 'Aziende › Cerca, apri il profilo e tocca «Invia richiesta di collegamento». Quando l\'altra azienda accetta vedete i contatti reciproci.'], ['Chi vede le mie quotazioni?', 'Solo l\'azienda a cui le invii. Non esistono quotazioni o listini pubblici.'], ['Cosa vuol dire «Ho ricevuto e visualizzato»?', 'Conferma solo la ricezione. RifiutiPro non conclude contratti: nessuna accettazione o aggiudicazione nell\'app.'], ['Dove trovo il PIN aziendale?', 'Profilo › Team e accessi. Lo vedono amministratore e uffici.'], ['Il codice EER proposto è sicuro?', 'È una proposta motivata: la classificazione resta responsabilità del produttore del rifiuto.'], ['RifiutiPro sostituisce FIR o RENTRI?', 'No: è uno strumento commerciale e organizzativo, non sostituisce FIR, RENTRI, MUD o altri obblighi di legge.']];
XR.help = (sub) => {
  const co = myCo(); const m = me();
  if (sub === 'new') return { h: header('t', 'Scrivi all\'assistenza', { back: '#/help' }), b: `${fld('Oggetto', inp('tk', 'subject', 'Es. Non riesco a inviare una quotazione'), 1)}${fld('Messaggio', area('tk', 'text'), 1)}<button class="bt g" data-act="tkSend">Invia</button>` };
  if (sub) { const t = get('tickets', sub); if (!t) return { h: header('t', 'Assistenza'), b: '<div class="empty">Non trovato.</div>' }; return { h: header('t', 'Richiesta di assistenza', { back: '#/help' }), b: `<div class="card"><div class="row"><b class="sp">${esc(t.subject)}</b>${t.status === 'closed' ? stx('x', 'Chiusa') : stx('w', 'Aperta')}</div><span class="sm">${esc(t.text)}</span><span class="xs mut">${fDT(t.createdAt)}</span></div>${(t.replies || []).map(r => `<div class="msg ${r.staff ? '' : 'me'}" style="${r.staff ? '' : 'align-self:flex-end'}">${esc(r.text)}<small>${r.staff ? 'Assistenza Soluzione Rifiuti' : esc(r.name)} · ${fDT(r.at)}</small></div>`).join('')}${t.status !== 'closed' ? `<div class="cbar">${inp('tkr', 't', 'Rispondi')}<button class="bt s" data-act="tkReply" data-id="${t.id}">Invia</button></div>` : ''}` }; }
  const L = all('tickets').filter(t => t.co === co.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { h: header('t', 'Aiuto e assistenza', { back: '#/home' }), b: `<div class="sec">Domande frequenti</div>${FAQ.map(([q, a]) => `<details class="card"><summary><b>${esc(q)}</b></summary><span class="sm">${esc(a)}</span></details>`).join('')}<button class="bt" data-go="#/help/new">Scrivi all'assistenza</button>${L.length ? `<div class="sec">Le tue richieste</div><div class="list">${L.map(t => `<a class="li" data-go="#/help/${t.id}"><span class="sp"><b>${esc(t.subject)}</b><span class="s">${fDT(t.createdAt)} · ${(t.replies || []).length} risposte</span></span>${t.status === 'closed' ? stx('x', 'Chiusa') : stx('w', 'Aperta')}</a>`).join('')}</div>` : ''}` };
};
ACT.tkSend = () => { const s = String(fv('tk', 'subject')).trim(), t = String(fv('tk', 'text')).trim(); if (!s || !t) return toast('Scrivi oggetto e messaggio.'); const m = me(); const id = uid('tk_'); put('tickets', id, { co: m.co, by: m.id, subject: s, text: t, status: 'open', replies: [], createdAt: nowISO() }); U.tk = {}; log('Inviata una richiesta di assistenza'); go('#/help/' + id); };
ACT.tkReply = el => { const t = get('tickets', el.dataset.id); const txt = String(fv('tkr', 't')).trim(); if (!txt) return; const m = me(); patch('tickets', t.id, { replies: (t.replies || []).concat([{ text: txt, at: nowISO(), staff: !!m.sa, name: memName(m.id) }]), status: 'open' }); setF('tkr', 't', ''); };

/* ---------- BACKOFFICE SOLUZIONE RIFIUTI ---------- */
function vAdmin(tab, arg) {
  tab = tab || 'stats'; const m = me();
  const cos = all('companies').filter(c => c.kind !== 'staff'); const ads = all('ads'); const tks = all('tickets');
  const rev = ads.filter(a => a.status === 'review'); const gfx = ads.filter(a => a.grafica && !a.graficaDone); const open = tks.filter(t => t.status !== 'closed');
  const segs = [['stats', 'Numeri'], ['ads', 'Annunci' + (rev.length ? ' (' + rev.length + ')' : '')], ['cos', 'Aziende'], ['help', 'Assistenza' + (open.length ? ' (' + open.length + ')' : '')], ['com', 'Avvisi']];
  let b = '';
  if (tab === 'stats') { const since = Date.now() - 30 * 864e5; const r = x => new Date(x.createdAt).getTime() > since; b = `<div class="kp"><div><span>Aziende registrate</span><b>${cos.length}</b></div><div><span>Gestori / visualizzatori</span><b>${cos.filter(c => c.kind === 'gestore').length} / ${cos.filter(c => c.kind !== 'gestore').length}</b></div><div><span>Piani attivi</span><b>${cos.filter(planOn).length}</b></div><div><span>Utenti</span><b>${all('members').filter(x => !x.sa).length}</b></div><div><span>Quotazioni (30 g)</span><b>${all('quotes').filter(r).length}</b></div><div><span>Richieste (30 g)</span><b>${all('reqs').filter(r).length}</b></div><div><span>Annunci attivi</span><b>${ads.filter(a => a.status === 'active').length}</b></div><div><span>Incassi simulati</span><b>${money(ads.reduce((s, a) => s + (a.paid || 0), 0))} €</b></div></div><p class="hint">Il backoffice non vede i prezzi delle quotazioni: solo i conteggi.</p>`; }
  if (tab === 'ads') b = `<div class="sec">Da approvare</div>${rev.length ? rev.map(a => `<div class="card">${a.img && imgSrc(a.img) ? `<img src="${imgSrc(a.img)}" alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:10px">` : ''}<b>${esc(a.title)}</b><span class="sm">${esc(a.text || '')}</span><span class="xs mut">${esc(coName(a.co))} · ${ADN[a.kind]} · ${esc(zoneTxt(a.zone))} · ${money(a.paid || 0)} €</span>${a.grafica ? `<div class="info">Grafica richiesta (${a.grafica === 'pack' ? 'pacchetto' : 'banner'}): ${esc(a.brief || '—')}</div>` : ''}<div class="two"><button class="bt rd s" data-act="adNo" data-id="${a.id}">Non approvare</button><button class="bt g s" data-act="adYes" data-id="${a.id}">Approva e pubblica</button></div></div>`).join('') : '<div class="empty">Nessun annuncio in attesa.</div>'}<div class="sec">Grafiche da realizzare</div>${gfx.length ? gfx.map(a => `<div class="card"><b>${esc(a.title)}</b><span class="xs mut">${esc(coName(a.co))}</span><span class="sm">${esc(a.brief || '—')}</span><button class="bt gh s" data-act="gfxUp" data-id="${a.id}">Carica la grafica realizzata</button></div>`).join('') : '<div class="empty">Nessuna.</div>'}<div class="sec">Tutti gli annunci</div><div class="list">${ads.map(a => `<div class="li"><span class="sp"><b>${esc(a.title)}</b><span class="s">${esc(coName(a.co))} · ${ADN[a.kind]} · ${a.taps || 0} tocchi</span></span>${stx(...adStatus(a))}</div>`).join('')}</div>`;
  if (tab === 'cos') b = `<div class="list">${cos.map(c => `<div class="card"><div class="row">${avatar(c, 1)}<span class="sp"><b>${esc(c.name)}</b><div class="xs mut">${esc(coTypes(c))} · ${esc(c.city)} (${esc(c.prov)}) · ${all('members').filter(x => x.co === c.id).length} utenti${planOn(c) ? ' · piano attivo' : ''}</div></span>${c.verified ? stx('n', 'Verificata') : ''}</div>${c.auth && c.auth.declared ? `<span class="xs">Autorizzazioni dichiarate${(c.auth.files || []).length ? ' · ' + c.auth.files.length + ' documenti' : ''}</span>${(c.auth.files || []).map(f => D.files[f] ? `<a class="xs" href="#" data-act="dlFile" data-id="${f}">📎 ${esc(D.files[f].name || 'documento')}</a>` : '').join(' ')}` : ''}${c.kind === 'gestore' ? `<button class="bt ${c.verified ? 'gh' : 'g'} s" data-act="coVer" data-id="${c.id}">${c.verified ? 'Togli «Verificata»' : 'Segna come «Verificata»'}</button>` : ''}</div>`).join('')}</div>`;
  if (tab === 'help') b = tks.length ? `<div class="list">${tks.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).map(t => `<div class="card"><div class="row"><b class="sp">${esc(t.subject)}</b>${t.status === 'closed' ? stx('x', 'Chiusa') : stx('w', 'Aperta')}</div><span class="xs mut">${esc(coName(t.co))} · ${esc(memName(t.by))} · ${fDT(t.createdAt)}</span><span class="sm">${esc(t.text)}</span>${(t.replies || []).map(r => `<span class="xs"><b>${r.staff ? 'Staff' : esc(r.name)}:</b> ${esc(r.text)}</span>`).join('')}${t.status !== 'closed' ? `<div class="row"><input class="in" id="rep_${t.id}" placeholder="Risposta"><button class="bt s" data-act="tkStaff" data-id="${t.id}">Invia</button></div><button class="bt gh s" data-act="tkClose" data-id="${t.id}">Chiudi</button>` : ''}</div>`).join('')}</div>` : '<div class="empty">Nessuna richiesta.</div>';
  if (tab === 'com') { const g = (D.settings.global || {}).banner || {}; if (!U.bn) U.bn = { title: g.title || '', text: g.text || '', type: g.type || 'info' }; b = `<p class="sub">Avviso mostrato in cima alla Home di tutti.</p>${fld('Titolo', inp('bn', 'title', 'Es. Manutenzione programmata'))}${fld('Testo', area('bn', 'text', 'Es. Domenica dalle 2:00 alle 4:00 l\'app potrebbe non rispondere.'))}${fld('Tipo', sel('bn', 'type', [['info', 'Informazione (blu)'], ['warn', 'Manutenzione (arancione)']]))}<div class="two"><button class="bt gh" data-act="bnOff">Togli l'avviso</button><button class="bt g" data-act="bnOn">Pubblica</button></div>`; }
  return { h: `<div class="hd"><span style="width:40px"></span><h1>Backoffice · Soluzione Rifiuti</h1><button class="ib" data-act="logout" aria-label="Esci">${IC.out}</button></div>`, b: `<div class="seg" style="flex-wrap:wrap">${segs.map(([k, l]) => `<a href="#/admin/${k}" class="${tab === k ? 'on' : ''}">${l}</a>`).join('')}</div>${b}<p class="ftr">Accesso staff: ${esc(memName(m.id))} · ${APPV}</p>` };
}
XR.admin = (a, b) => me().sa ? vAdmin(a, b) : vHome();
ACT.adYes = el => { const a = get('ads', el.dataset.id); patch('ads', a.id, { status: 'active', approvedAt: nowISO() }); log('Annuncio «' + a.title + '» approvato da Soluzione Rifiuti', a.co); toast('Pubblicato'); };
ACT.adNo = el => askText('Motivo del rifiuto', 'Es. immagine non leggibile', r => { const a = get('ads', el.dataset.id); patch('ads', a.id, { status: 'rejected', reason: r }); log('Annuncio «' + a.title + '» non approvato: ' + r, a.co); });
ACT.gfxUp = el => pickImage(id => { patch('ads', el.dataset.id, { img: id, graficaDone: true }); toast('Grafica caricata'); });
ACT.coVer = el => { const c = get('companies', el.dataset.id); patch('companies', c.id, { verified: !c.verified }); log(c.verified ? 'Tolto il badge «Verificata»' : 'Badge «Verificata» assegnato da Soluzione Rifiuti', c.id); };
ACT.tkStaff = el => { const t = get('tickets', el.dataset.id); const i = document.getElementById('rep_' + t.id); const txt = i && i.value.trim(); if (!txt) return; patch('tickets', t.id, { replies: (t.replies || []).concat([{ text: txt, at: nowISO(), staff: true, name: 'Assistenza' }]) }); };
ACT.tkClose = el => patch('tickets', el.dataset.id, { status: 'closed' });
ACT.bnOn = () => { put('settings', 'global', { banner: { title: String(U.bn.title).trim(), text: String(U.bn.text).trim(), type: U.bn.type } }); toast('Avviso pubblicato'); };
ACT.bnOff = () => { put('settings', 'global', { banner: null }); U.bn = null; toast('Avviso tolto'); render(); };

/* badge «Verificata» nel profilo pubblico */
const _vCompany = vCompany;
vCompany = function (id) { const v = _vCompany(id); const c = get('companies', id); if (c && c.verified && v.b) v.b = v.b.replace('<span class="tag">Dati autorizzativi dichiarati</span>', '<span class="tag g">✓ Verificata da Soluzione Rifiuti</span>'); return v; };

/* dati di prova per la versione web (archivio vuoto) */
ACT.loadDemo = async () => { window.__SEEDING = true; try { const r = await fetch('seed.json', { cache: 'no-store' }); const S = await r.json(); toast('Carico i dati di prova…'); for (const c in S) for (const id in S[c]) { if (!D[c] || !D[c][id]) await put(c, id, S[c][id]); } toast('Dati di prova caricati'); go('#/login'); } catch (e) { toast('Dati di prova non disponibili qui.'); } window.__SEEDING = false; };
function demoLoader() { return MODE !== 'db' && !all('members').length ? `<div class="card"><b>Archivio vuoto</b><span class="sm mut">Carica le aziende di prova (Recuperi Demo, Ecologia Demo, Officina Demo…) per provare subito l'app.</span><button class="bt g s" data-act="loadDemo">Carica i dati di prova</button></div>` : ''; }
