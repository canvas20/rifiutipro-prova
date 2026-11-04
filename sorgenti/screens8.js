/* ================= VERSIONE DA COMPUTER + CRM PER I GESTORI AMBIENTALI ================= */
function isWide() { try { return window.matchMedia('(min-width: 1000px)').matches; } catch (e) { return false; } }
let _wasWide = null; window.addEventListener('resize', () => { const w = isWide(); if (w !== _wasWide) { _wasWide = w; sched(); } });
const crmOn = () => { const m = me(), co = myCo(); return !!(m && co && isG(co) && !isField(m)); };

/* ---------- menu laterale fisso ---------- */
function sidebar() {
  const m = me(), co = myCo(), r = route().r, g = isG(co), f = isField(m);
  const it = (href, ic, t, key, badge) => `<a href="${href}" class="${(key || href.slice(2).split('/')[0]) === r ? 'on' : ''}">${ic}<span>${t}</span>${badge ? `<em>${badge}</em>` : ''}</a>`;
  const nq = notifQuotes(), nr = reqsOpenToMe().length, nc = unreadChats(), nt = crmOn() ? crmDue().length : 0, nn = notifCount();
  return `<aside class="side"><a href="#/home" class="slogo">${LOGO}</a>
  <a href="#/profile" class="sco">${avatar(co, 1)}<span class="sp"><b>${esc(co.name)}</b><small>${esc(memName(m.id))}</small></span></a>
  <nav>
  ${crmOn() ? `<div class="sh">CRM</div>${it('#/crm', IC.chart, 'Cruscotto', 'crm')}${it('#/clienti', IC.people, 'Clienti', 'clienti')}${it('#/trattative', IC.list, 'Trattative', 'trattative')}${it('#/promemoria', IC.cal, 'Promemoria', 'promemoria', nt)}${it('#/tabelle', IC.doc, 'Tabelle ed export', 'tabelle')}` : it('#/home', IC.home, 'Home', 'home')}
  <div class="sh">Lavoro</div>${it('#/notif', IC.bell, 'Notifiche', 'notif', nn)}${f ? '' : it('#/quotes', IC.tag, 'Quotazioni', 'quotes', nq) + it('#/quotes/req', IC.list, 'Richieste', 'req', nr)}${f ? '' : it('#/companies', IC.people, 'Aziende', 'companies')}${it('#/chats', IC.chat, 'Chat', 'chats', nc)}${it('#/agenda', IC.cal, 'Agenda', 'agenda')}${f ? '' : it('#/docs', IC.folder, 'Documenti', 'docs')}${it('#/firs', IC.truck, 'Formulari', 'firs')}
  <div class="sh">Strumenti</div>${it('#/eer', IC.building, 'Codici EER', 'eer')}${it('#/fotoeer', IC.cam, 'Codice EER da foto', 'fotoeer')}${f ? '' : it('#/lists', IC.tag, 'Listini', 'lists') + it('#/report', IC.chart, 'Report', 'report') + it('#/vetrina', IC.shop, 'Vetrina', 'vetrina') + it('#/myads', IC.ads, 'I miei annunci', 'myads')}
  <div class="sh">Account</div>${it('#/profile', IC.gear, 'Profilo e impostazioni', 'profile')}${g && !f ? it('#/plan', IC.card, 'Piano e codici regalo', 'plan') : ''}${canTeam(m) ? it('#/team', IC.user, 'Team e accessi', 'team') : ''}<a href="#" data-act="logout">${IC.out}<span>Esci</span></a>
  </nav>${crmOn() ? '<button class="bt g s" data-act="newReq" style="margin:10px 6px">+ Richiedi quotazione</button>' : ''}<div class="ftr" style="text-align:left;padding:6px">${APPV} · ${modeTxt()}</div></aside>`;
}

/* ---------- dati CRM ---------- */
function clientsOf(co) {
  const ids = new Set(partners(co.id).map(c => c.id));
  all('reqs').forEach(r => { if ((r.to || []).includes(co.id)) ids.add(r.from); if (r.from === co.id) (r.to || []).forEach(t => ids.add(t)); });
  all('quotes').forEach(q => { if (q.from === co.id) ids.add(q.to); if (q.to === co.id) ids.add(q.from); });
  all('crm_tasks').concat(all('crm_notes')).forEach(x => { if (x.co === co.id && x.client) ids.add(x.client); });
  ids.delete(co.id);
  return [...ids].map(id => get('companies', id)).filter(Boolean);
}
function clientStats(co, c) {
  const rq = all('reqs').filter(r => (r.from === c.id && (r.to || []).includes(co.id)) || (r.from === co.id && (r.to || []).includes(c.id)));
  const qs = all('quotes').filter(q => (q.from === co.id && q.to === c.id) || (q.from === c.id && q.to === co.id));
  const ch = D.chats[chatKey(co.id, c.id)]; const msgs = (ch && ch.msgs) || [];
  const notes = all('crm_notes').filter(n => n.co === co.id && n.client === c.id);
  const tasks = all('crm_tasks').filter(t => t.co === co.id && t.client === c.id);
  const dates = [].concat(rq.map(r => r.createdAt), qs.map(q => q.updatedAt || q.createdAt), msgs.map(x => x.at), notes.map(n => n.at)).filter(Boolean).sort();
  const l = linkBetween(co.id, c.id);
  const next = tasks.filter(t => !t.done).sort((a, b) => String(a.due).localeCompare(String(b.due)))[0];
  const sent = qs.filter(q => q.from === co.id && q.status !== 'withdrawn');
  return { rq, qs, msgs, notes, tasks, last: dates[dates.length - 1] || '', linked: !!(l && l.status === 'active'), linkedAt: l && (l.acceptedAt || l.createdAt), next, sent, recvReq: rq.filter(r => r.from === c.id).length, conf: sent.filter(q => q.confirmedAt).length };
}
function crmDue() { const co = myCo(), m = me(); if (!co) return []; const end = new Date(); end.setHours(23, 59, 59); return all('crm_tasks').filter(t => t.co === co.id && !t.done && (!t.who || t.who === m.id) && new Date(t.due) <= end); }
/* trattative: richieste ricevute e quotazioni spontanee inviate */
const STAGES = [['nuova', 'Da gestire', '#F29100'], ['quotata', 'Quotata', '#0057F5'], ['vista', 'Vista dal cliente', '#7A3FE0'], ['trattativa', 'In trattativa', '#00A3A3'], ['conclusa', 'Conclusa', '#079A5A'], ['persa', 'Non andata', '#8792A8']];
function deals(co) {
  const L = [];
  all('reqs').filter(r => r.status !== 'cancelled' && (r.to || []).includes(co.id)).forEach(r => { const qs = all('quotes').filter(q => q.reqId === r.id && q.from === co.id && q.status !== 'withdrawn'); L.push({ id: 'r_' + r.id, kind: 'req', ref: r, client: r.from, title: r.sub || r.macro, qty: r.qty ? r.qty + ' ' + r.unit : '', at: r.createdAt, qs, resp: r.resp && r.resp[co.id] }); });
  all('quotes').filter(q => q.from === co.id && !q.reqId && q.status !== 'withdrawn').forEach(q => L.push({ id: 'q_' + q.id, kind: 'quote', ref: q, client: q.to, title: q.sub || q.macro, qty: '', at: q.createdAt, qs: [q], resp: 'quoted' }));
  L.forEach(d => { const man = D.crm_stage[co.id + '__' + d.id]; d.auto = d.resp === 'declined' ? 'persa' : !d.qs.length ? 'nuova' : d.qs.some(q => q.confirmedAt) ? 'trattativa' : d.qs.some(q => q.seenAt) ? 'vista' : 'quotata'; d.stage = (man && man.stage) || d.auto; d.manual = !!(man && man.stage); d.price = d.qs.length ? priceTxt(d.qs[d.qs.length - 1]) : ''; });
  return L.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

/* ---------- componenti ---------- */
function crmHead(title, sub, right) { return `<div class="row" style="align-items:flex-end;gap:12px;flex-wrap:wrap"><div class="sp"><h2 class="ttl">${title}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${right || ''}</div>`; }
function needCrm() { return !crmOn() ? { h: header('t', 'CRM'), b: '<div class="warn">Il CRM è riservato ai gestori ambientali (amministrazione, uffici, visualizza e modifica).</div>' } : null; }
/* tabella con ordinamento, ricerca ed esportazione */
function table(key, cols, rows, opt = {}) {
  const S = U['tb_' + key] || (U['tb_' + key] = { s: opt.sort || 0, d: opt.dir || -1 });
  const q = String(fv('tq_' + key, 'q')).toLowerCase().trim();
  let R = rows.filter(r => !q || cols.some(c => String(c.v(r) ?? '').toLowerCase().includes(q)));
  const c0 = cols[S.s]; R = R.slice().sort((a, b) => { const x = c0.sv ? c0.sv(a) : c0.v(a), y = c0.sv ? c0.sv(b) : c0.v(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), 'it', { numeric: true })) * S.d; });
  U['tbrows_' + key] = { cols, R };
  return `<div class="row" style="gap:8px;flex-wrap:wrap"><div class="sr sp" style="min-width:220px">${IC.search}<input data-f="tq_${key}.q" data-live value="${esc(fv('tq_' + key, 'q'))}" placeholder="Cerca…"></div>${opt.extra || ''}<button class="bt gh s" data-act="tbCsv" data-k="${key}" data-n="${esc(opt.file || key)}">⬇︎ Esporta Excel</button></div>
  <div class="tbl"><table><thead><tr>${cols.map((c, i) => `<th data-act="tbSort" data-k="${key}" data-i="${i}" class="${c.num ? 'n' : ''}">${esc(c.t)}${S.s === i ? (S.d > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead>
  <tbody>${R.map(r => `<tr ${opt.href ? `data-go="${opt.href(r)}" class="lk"` : ''}>${cols.map(c => `<td class="${c.num ? 'n' : ''}">${c.h ? c.h(r) : esc(c.v(r) ?? '')}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${cols.length}" class="mut" style="text-align:center;padding:20px">Nessun dato</td></tr>`}</tbody></table></div><span class="hint">${R.length} righe · tocca l'intestazione di una colonna per ordinare</span>`;
}
ACT.tbSort = el => { const S = U['tb_' + el.dataset.k]; const i = +el.dataset.i; if (S.s === i) S.d = -S.d; else { S.s = i; S.d = 1; } render(); };
ACT.tbCsv = el => { const T = U['tbrows_' + el.dataset.k]; if (!T) return; const rows = [T.cols.map(c => c.t)].concat(T.R.map(r => T.cols.map(c => c.csv ? c.csv(r) : c.v(r)))); download('RifiutiPro_' + el.dataset.n + '.csv', '﻿' + rows.map(r => r.map(x => '"' + String(x ?? '').replace(/"/g, '""') + '"').join(';')).join('\n'), 'text/csv'); };
const dshort = iso => iso ? new Date(iso).toLocaleDateString('it-IT') : '';

/* ---------- Cruscotto ---------- */
XR.crm = () => {
  const n = needCrm(); if (n) return n;
  const co = myCo(); const D_ = deals(co); const cl = clientsOf(co); const due = crmDue();
  const by = s => D_.filter(d => d.stage === s).length;
  const since = Date.now() - 30 * 864e5; const sent30 = all('quotes').filter(q => q.from === co.id && new Date(q.createdAt) > since);
  const upcoming = all('crm_tasks').filter(t => t.co === co.id && !t.done).sort((a, b) => String(a.due).localeCompare(String(b.due))).slice(0, 6);
  const logs = ((D.logs[co.id] && D.logs[co.id].items) || []).slice(0, 8);
  return {
    wide: 1, h: header('home'), b: `${banner()}${crmHead('Buongiorno ' + esc(me().name), esc(co.name) + ' · ' + new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }), '<button class="bt g" data-act="newReq" style="width:auto">+ Richiedi quotazione</button>')}
  <div class="kp4"><a href="#/trattative"><span>Da gestire</span><b style="color:#F29100">${by('nuova')}</b></a><a href="#/trattative"><span>Trattative aperte</span><b>${by('quotata') + by('vista') + by('trattativa')}</b></a><a href="#/promemoria"><span>Promemoria per oggi</span><b style="color:${due.length ? '#E5243B' : 'inherit'}">${due.length}</b></a><a href="#/clienti"><span>Clienti</span><b>${cl.length}</b></a><a href="#/tabelle/quotes"><span>Quotazioni inviate (30 g)</span><b>${sent30.length}</b></a><a href="#/tabelle/quotes"><span>Ricezione confermata (30 g)</span><b>${sent30.filter(q => q.confirmedAt).length}</b></a></div>
  <div class="g3"><div class="card"><div class="row"><h3 class="sp">Richieste da gestire</h3><a href="#/trattative">Trattative ›</a></div>${D_.filter(d => d.stage === 'nuova').slice(0, 6).map(dealRow).join('') || '<span class="mut sm">Nessuna richiesta in attesa.</span>'}</div>
  <div class="card"><div class="row"><h3 class="sp">Promemoria</h3><button class="bt gh s" data-act="taskNew">+ Nuovo</button></div>${upcoming.map(taskRow).join('') || '<span class="mut sm">Nessun promemoria.</span>'}</div>
  <div class="card"><div class="row"><h3 class="sp">Attività recenti</h3><a href="#/logs">Registro ›</a></div>${logs.map(l => `<div class="row sm"><span class="sp">${esc(l.t)}<div class="xs mut">${esc(l.who)}</div></span><span class="xs mut">${fDT(l.at)}</span></div>`).join('') || '<span class="mut sm">Nessuna attività.</span>'}</div></div>` };
};
function dealRow(d) { const c = get('companies', d.client); return `<a class="li" data-go="${d.kind === 'req' ? '#/req/' + d.ref.id : '#/quote/' + d.ref.id}">${avatar(c, 1)}<span class="sp"><b>${esc(d.title)}</b><span class="s">${esc(c ? c.name : '')}${d.qty ? ' · ' + esc(d.qty) : ''} · ${fDT(d.at)}</span></span><span class="chev">›</span></a>`; }
function taskRow(t) { const late = new Date(t.due) < new Date() && !t.done; const c = get('companies', t.client); return `<div class="row sm" style="border-top:1px solid var(--line);padding-top:8px;align-items:flex-start"><input type="checkbox" data-act="taskDone" data-id="${t.id}" ${t.done ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--green);margin-top:2px"><span class="sp" style="${t.done ? 'text-decoration:line-through;opacity:.6' : ''}"><b>${esc(t.title)}</b><div class="xs mut">${c ? `<a href="#/cliente/${c.id}">${esc(c.name)}</a> · ` : ''}${t.who ? esc(memName(t.who)) + ' · ' : ''}<span style="color:${late ? '#E5243B' : 'inherit'};font-weight:${late ? 700 : 400}">${fDT(t.due)}${late ? ' · scaduto' : ''}</span></div></span><button class="x" data-act="taskDel" data-id="${t.id}" aria-label="Elimina">×</button></div>`; }

/* ---------- Clienti ---------- */
XR.clienti = () => {
  const n = needCrm(); if (n) return n;
  const co = myCo(); const L = clientsOf(co).map(c => Object.assign({ c }, clientStats(co, c)));
  const cols = [
    { t: 'Azienda', v: r => r.c.name, h: r => `<span class="row" style="gap:8px">${avatar(r.c, 1)}<b>${esc(r.c.name)}</b></span>` },
    { t: 'Tipo', v: r => coTypes(r.c) }, { t: 'Comune', v: r => r.c.city + ' (' + r.c.prov + ')' },
    { t: 'Collegata', v: r => r.linked ? 'sì' : 'no', h: r => r.linked ? stx('n', 'Collegata') : stx('x', 'No') },
    { t: 'Richieste ricevute', v: r => r.recvReq, num: 1 }, { t: 'Quotazioni inviate', v: r => r.sent.length, num: 1 }, { t: 'Confermate', v: r => r.conf, num: 1 },
    { t: 'Ultimo contatto', v: r => dshort(r.last), sv: r => r.last, h: r => r.last ? fDT(r.last) : '—' },
    { t: 'Prossimo promemoria', v: r => r.next ? dshort(r.next.due) + ' ' + r.next.title : '', sv: r => r.next ? r.next.due : 'z', h: r => r.next ? `<span class="xs"><b>${fDT(r.next.due)}</b> ${esc(r.next.title)}</span>` : '<span class="mut">—</span>' },
  ];
  return { wide: 1, h: header('t', 'Clienti', { back: '#/crm' }), b: `${crmHead('Clienti', 'Aziende collegate e aziende con cui hai scambiato richieste o quotazioni', '<a class="bt gh s" href="#/companies/search" style="width:auto">Cerca nuove aziende</a>')}${table('cl', cols, L, { sort: 7, dir: -1, href: r => '#/cliente/' + r.c.id, file: 'clienti' })}` };
};
/* scheda cliente */
XR.cliente = (id) => {
  const n = needCrm(); if (n) return n;
  const co = myCo(); const c = get('companies', id); if (!c) return { h: header('t', 'Cliente', { back: '#/clienti' }), b: '<div class="empty">Azienda non trovata.</div>' };
  const S = clientStats(co, c); const on = S.linked;
  const tl = [];
  S.rq.forEach(r => tl.push({ at: r.createdAt, ic: '📥', t: (r.from === c.id ? 'Richiesta ricevuta: ' : 'Richiesta inviata: ') + (r.sub || r.macro) + (r.qty ? ' · ' + r.qty + ' ' + r.unit : ''), go: '#/req/' + r.id, st: r.status === 'cancelled' ? 'Annullata' : r.from === c.id ? reqState(r, co.id)[1] : '' }));
  S.qs.forEach(q => tl.push({ at: q.updatedAt || q.createdAt, ic: '🏷️', t: (q.from === co.id ? 'Quotazione inviata: ' : 'Quotazione ricevuta: ') + (q.sub || q.macro) + ' · ' + priceTxt(q).replace(/<[^>]+>/g, ''), go: '#/quote/' + q.id, st: qStatus(q, q.to === co.id)[1] }));
  S.msgs.slice(-15).forEach(x => tl.push({ at: x.at, ic: '💬', t: (x.co === co.id ? 'Tu: ' : esc(c.name) + ': ') + x.text, go: '#/chat/' + c.id }));
  S.notes.forEach(x => tl.push({ at: x.at, ic: '📝', t: 'Nota di ' + memName(x.by) + ': ' + x.text, note: x.id }));
  if (S.linkedAt) tl.push({ at: S.linkedAt, ic: '🤝', t: 'Collegamento attivo' });
  tl.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const D_ = deals(co).filter(d => d.client === c.id && !['conclusa', 'persa'].includes(d.stage));
  return {
    wide: 1, h: header('t', c.name, { back: '#/clienti' }), b: `<div class="row" style="gap:14px;align-items:center;flex-wrap:wrap">${avatar(c).replace('class="av', 'style="width:64px;height:64px;font-size:22px" class="av')}<div class="sp"><h2 class="ttl" style="margin:0">${esc(c.name)}</h2><span class="mut">${esc(coTypes(c))} · ${esc(c.city)} (${esc(c.prov)})</span></div>
   <div class="row" style="gap:8px;flex-wrap:wrap">${on ? `<button class="bt g s" data-act="reqTo" data-id="${c.id}">Richiedi quotazione</button>${isG(co) ? `<a class="bt s" href="#/makequote/to/${c.id}" style="width:auto">Invia quotazione</a>` : ''}<a class="bt gh s" href="#/chat/${c.id}" style="width:auto">Chat</a>` : `<a class="bt s" href="#/company/${c.id}" style="width:auto">Profilo e collegamento</a>`}<button class="bt gh s" data-act="taskNew" data-client="${c.id}">+ Promemoria</button></div></div>
  <div class="kp4"><div><span>Richieste ricevute</span><b>${S.recvReq}</b></div><div><span>Quotazioni inviate</span><b>${S.sent.length}</b></div><div><span>Ricezione confermata</span><b>${S.conf}</b></div><div><span>Ultimo contatto</span><b style="font-size:16px">${S.last ? fDT(S.last) : '—'}</b></div></div>
  <div class="g2w"><div style="display:flex;flex-direction:column;gap:12px">
   <div class="card"><h3>Nota interna</h3><textarea class="in" data-f="cn.t" placeholder="Visibile solo al tuo team: accordi, preferenze, persone di riferimento…">${esc(fv('cn', 't'))}</textarea><button class="bt s" data-act="noteAdd" data-client="${c.id}" style="align-self:flex-end;width:auto">Salva nota</button></div>
   <div class="card"><h3>Storico</h3>${tl.map(x => `<div class="row sm" style="border-top:1px solid var(--line);padding-top:8px;align-items:flex-start;${x.go ? 'cursor:pointer' : ''}" ${x.go ? `data-go="${x.go}"` : ''}><span style="font-size:18px">${x.ic}</span><span class="sp">${esc(x.t)}${x.st ? ' ' + stx('v', x.st) : ''}<div class="xs mut">${fDT(x.at)}</div></span>${x.note ? `<button class="x" data-act="noteDel" data-id="${x.note}" aria-label="Elimina nota">×</button>` : ''}</div>`).join('') || '<span class="mut sm">Ancora nessuna attività con questo cliente.</span>'}</div></div>
   <div style="display:flex;flex-direction:column;gap:12px">
   <div class="card"><h3>Contatti</h3>${on ? `<dl class="dl"><dt>Indirizzo</dt><dd>${esc(c.addr || '—')}, ${esc(c.city)}</dd><dt>Telefono</dt><dd>${c.phone ? `<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>` : '—'}</dd><dt>Email</dt><dd>${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '—'}</dd>${c.piva ? `<dt>P. IVA</dt><dd>${esc(c.piva)}</dd>` : ''}</dl>` : `<div class="lock">${IC.lock} Visibili dopo il collegamento.</div>`}</div>
   <div class="card"><div class="row"><h3 class="sp">Promemoria</h3><button class="bt gh s" data-act="taskNew" data-client="${c.id}">+</button></div>${S.tasks.sort((a, b) => (a.done - b.done) || String(a.due).localeCompare(String(b.due))).map(taskRow).join('') || '<span class="mut sm">Nessuno.</span>'}</div>
   <div class="card"><h3>Trattative aperte</h3>${D_.map(d => `<div class="row sm"><span class="sp"><b>${esc(d.title)}</b> ${d.price ? '· ' + d.price : ''}</span>${stageChip(d.stage)}</div>`).join('') || '<span class="mut sm">Nessuna.</span>'}</div>
   ${isG(c) && (c.waste || []).length ? `<div class="card"><h3>Rifiuti trattati</h3><div>${coMacros(c).map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div></div>` : ''}</div></div>` };
};
ACT.noteAdd = el => { const t = String(fv('cn', 't')).trim(); if (!t) return toast('Scrivi la nota.'); put('crm_notes', uid('cn_'), { co: myCo().id, client: el.dataset.client, text: t.slice(0, 2000), by: meId(), at: nowISO() }); setF('cn', 't', ''); log('Nota CRM per ' + coName(el.dataset.client)); toast('Nota salvata'); };
ACT.noteDel = el => confirmBox('Eliminare la nota?', '', 'Elimina', () => del('crm_notes', el.dataset.id), 1);

/* ---------- Promemoria ---------- */
function stageChip(s) { const x = STAGES.find(y => y[0] === s) || STAGES[0]; return `<span class="st" style="background:${x[2]}22;color:${x[2]}">${x[1]}</span>`; }
ACT.taskNew = el => {
  const co = myCo(); const cl = clientsOf(co).sort((a, b) => a.name.localeCompare(b.name)); const team = all('members').filter(x => x.co === co.id && x.status === 'active');
  const d = new Date(Date.now() + 864e5); d.setHours(9, 0, 0, 0); const def = new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  modal(`<h3 style="margin:0">Nuovo promemoria</h3>${fld('Cosa fare', '<input class="in" id="tk_t" placeholder="Es. Richiamare per il rame">')}${fld('Cliente', `<select class="in" id="tk_c"><option value="">— nessuno —</option>${cl.map(c => `<option value="${c.id}" ${el.dataset.client === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`)}<div class="two">${fld('Quando', `<input class="in" id="tk_d" type="datetime-local" value="${def}">`)}${fld('Per chi', `<select class="in" id="tk_w"><option value="">Tutto il team</option>${team.map(x => `<option value="${x.id}" ${x.id === meId() ? 'selected' : ''}>${esc(memName(x.id))}</option>`).join('')}</select>`)}</div><div class="two"><button class="bt gh" data-act="mClose">Annulla</button><button class="bt g" id="tk_ok">Salva</button></div>`);
  document.getElementById('tk_t').focus();
  document.getElementById('tk_ok').onclick = () => { const t = document.getElementById('tk_t').value.trim(); const dt = document.getElementById('tk_d').value; if (!t || !dt) return toast('Scrivi cosa fare e quando.'); const o = { co: co.id, client: document.getElementById('tk_c').value, title: t.slice(0, 200), due: new Date(dt).toISOString(), who: document.getElementById('tk_w').value, done: false, by: meId(), createdAt: nowISO() }; closeOverlays(); put('crm_tasks', uid('tk_'), o); log('Promemoria: ' + t + (o.client ? ' (' + coName(o.client) + ')' : '')); toast('Promemoria salvato'); };
};
ACT.taskDone = el => { const t = get('crm_tasks', el.dataset.id); patch('crm_tasks', t.id, { done: !t.done, doneAt: nowISO(), doneBy: meId() }); if (!t.done) log('Completato: ' + t.title); };
ACT.taskDel = el => confirmBox('Eliminare il promemoria?', '', 'Elimina', () => del('crm_tasks', el.dataset.id), 1);
XR.promemoria = () => {
  const n = needCrm(); if (n) return n;
  const co = myCo(); const f = fv('pm', 'f', 'open'); const mine = fv('pm', 'mine', false);
  let L = all('crm_tasks').filter(t => t.co === co.id); if (mine) L = L.filter(t => !t.who || t.who === meId());
  const now = new Date(); const end = new Date(); end.setHours(23, 59, 59);
  const F = { open: t => !t.done, late: t => !t.done && new Date(t.due) < now, today: t => !t.done && new Date(t.due) <= end, done: t => t.done };
  const cnt = k => L.filter(F[k]).length; L = L.filter(F[f]).sort((a, b) => String(f === 'done' ? b.due : a.due).localeCompare(String(f === 'done' ? a.due : b.due)));
  return { wide: 1, h: header('t', 'Promemoria', { back: '#/crm' }), b: `${crmHead('Promemoria e richiami', 'Le cose da fare con i clienti: arrivano nella campanella il giorno stabilito', '<button class="bt g" data-act="taskNew" style="width:auto">+ Nuovo promemoria</button>')}
  <div class="row" style="gap:8px;flex-wrap:wrap"><div class="chips">${[['open', 'Da fare'], ['today', 'Entro oggi'], ['late', 'Scaduti'], ['done', 'Completati']].map(([k, l]) => chip(f === k, 'pmF', `${l} (${cnt(k)})`, `data-k="${k}"`)).join('')}</div><label class="cbx" style="margin-left:auto"><input type="checkbox" data-f="pm.mine" ${mine ? 'checked' : ''}><span>Solo i miei</span></label></div>
  <div class="card">${L.map(taskRow).join('') || '<span class="mut">Niente qui.</span>'}</div>` };
};
ACT.pmF = el => { setF('pm', 'f', el.dataset.k); render(); };

/* ---------- Trattative a colonne ---------- */
XR.trattative = () => {
  const n = needCrm(); if (n) return n;
  const co = myCo(); const q = String(fv('tr', 'q')).toLowerCase(); const L = deals(co).filter(d => !q || (d.title + ' ' + coName(d.client)).toLowerCase().includes(q));
  return {
    wide: 1, h: header('t', 'Trattative', { back: '#/crm' }), b: `${crmHead('Trattative', 'Richieste ricevute e quotazioni inviate. Trascina una scheda per cambiarne la fase: è un\'informazione interna, il cliente non la vede.', `<div class="sr" style="width:260px">${IC.search}<input data-f="tr.q" data-live value="${esc(fv('tr', 'q'))}" placeholder="Cerca rifiuto o cliente"></div>`)}
  <div class="kanban">${STAGES.map(([k, l, col]) => { const C = L.filter(d => d.stage === k); return `<div class="kcol" data-stage="${k}"><div class="khd" style="border-top:4px solid ${col}"><b>${l}</b><span class="mut">${C.length}</span></div><div class="kbody">${C.map(d => { const c = get('companies', d.client); const nt = all('crm_tasks').filter(t => t.co === co.id && t.client === d.client && !t.done).sort((a, b) => String(a.due).localeCompare(String(b.due)))[0]; return `<div class="kcard" draggable="true" data-deal="${d.id}"><div class="row" style="gap:6px">${avatar(c, 1).replace('av ', 'av xs ')}<b class="sp" style="font-size:13.5px">${esc(c ? c.name : '')}</b></div><div style="font-weight:700">${esc(d.title)}</div><div class="xs mut">${d.qty ? esc(d.qty) + ' · ' : ''}${fDT(d.at)}</div>${d.price ? `<div class="xs" style="color:var(--navy);font-weight:700">${d.price}</div>` : ''}${nt ? `<div class="xs" style="color:#9A5A00">⏰ ${fDT(nt.due)} · ${esc(nt.title)}</div>` : ''}<div class="row" style="gap:4px;margin-top:4px"><a class="xs" href="${d.kind === 'req' ? '#/req/' + d.ref.id : '#/quote/' + d.ref.id}">Apri</a><span class="sp"></span>${d.manual ? `<a class="xs mut" href="#" data-act="stReset" data-deal="${d.id}" title="Torna alla fase automatica">auto</a>` : ''}<select class="ksel" data-act-change="stSet" data-deal="${d.id}">${STAGES.map(s => `<option value="${s[0]}" ${s[0] === d.stage ? 'selected' : ''}>${s[1]}</option>`).join('')}</select></div></div>`; }).join('') || '<div class="xs mut" style="text-align:center;padding:12px">—</div>'}</div></div>`; }).join('')}</div>
  <p class="hint">Le fasi si aggiornano da sole (richiesta ricevuta → quotata → vista → ricezione confermata). Se sposti una scheda a mano, resta lì finché non tocchi «auto». «Conclusa» e «Non andata» servono solo al tuo team: RifiutiPro non conclude contratti.</p>`,
    after: () => {
      document.querySelectorAll('.kcard').forEach(k => k.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', k.dataset.deal); k.classList.add('drag'); }));
      document.querySelectorAll('.kcol').forEach(c => { c.addEventListener('dragover', e => { e.preventDefault(); c.classList.add('over'); }); c.addEventListener('dragleave', () => c.classList.remove('over')); c.addEventListener('drop', e => { e.preventDefault(); c.classList.remove('over'); const id = e.dataTransfer.getData('text/plain'); if (id) setStage(id, c.dataset.stage); }); });
    }
  };
};
function setStage(dealId, stage) { const co = myCo(); const d = deals(co).find(x => x.id === dealId); if (!d) return; if (stage === d.auto) del('crm_stage', co.id + '__' + dealId); else put('crm_stage', co.id + '__' + dealId, { co: co.id, deal: dealId, stage, by: meId(), at: nowISO() }); log('Trattativa «' + d.title + '» con ' + coName(d.client) + ': ' + (STAGES.find(s => s[0] === stage) || [, stage])[1]); }
document.addEventListener('change', e => { if (e.target.getAttribute && e.target.getAttribute('data-act-change') === 'stSet') setStage(e.target.dataset.deal, e.target.value); });
ACT.stReset = el => { del('crm_stage', myCo().id + '__' + el.dataset.deal); };

/* ---------- Tabelle ed esportazioni ---------- */
XR.tabelle = (tab) => {
  const n = needCrm(); if (n) return n;
  const co = myCo(); tab = tab || 'quotes'; let body = '';
  if (tab === 'quotes') {
    const L = all('quotes').filter(q => q.from === co.id || q.to === co.id);
    body = table('qt', [
      { t: 'Numero', v: q => q.num }, { t: 'Data', v: q => dshort(q.updatedAt || q.createdAt), sv: q => q.updatedAt || q.createdAt },
      { t: 'Verso', v: q => q.from === co.id ? 'Inviata' : 'Ricevuta' }, { t: 'Cliente / fornitore', v: q => coName(q.from === co.id ? q.to : q.from) },
      { t: 'Rifiuto', v: q => q.sub || q.macro }, { t: 'EER', v: q => q.eer || '' }, { t: 'Direzione', v: q => DIRL[q.dir] || '' },
      { t: 'Prezzo', v: q => q.dir === 'gratuito' ? 0 : Number(q.price), num: 1, h: q => q.dir === 'gratuito' ? 'gratuito' : money(q.price), csv: q => q.dir === 'gratuito' ? '0' : String(q.price).replace('.', ',') },
      { t: 'Unità', v: q => q.dir === 'gratuito' ? '' : q.unit }, { t: 'Stato', v: q => qStatus(q, q.to === co.id)[1], h: q => { const s = qStatus(q, q.to === co.id); return stx(s[0], s[1]); } },
    ], L, { sort: 1, dir: -1, href: q => '#/quote/' + q.id, file: 'quotazioni' });
  } else if (tab === 'reqs') {
    const L = all('reqs').filter(r => r.from === co.id || (r.to || []).includes(co.id));
    body = table('rq', [
      { t: 'Numero', v: r => r.num }, { t: 'Data', v: r => dshort(r.createdAt), sv: r => r.createdAt }, { t: 'Verso', v: r => r.from === co.id ? 'Inviata' : 'Ricevuta' },
      { t: 'Da / a', v: r => r.from === co.id ? (r.to || []).map(coName).join(', ') : coName(r.from) }, { t: 'Macroarea', v: r => r.macro }, { t: 'Rifiuto', v: r => r.sub },
      { t: 'EER', v: r => r.eer || '' }, { t: 'Quantità', v: r => r.qty ? r.qty + ' ' + r.unit : '' }, { t: 'Stato', v: r => r.status === 'cancelled' ? 'Annullata' : r.from === co.id ? 'Inviata' : reqState(r, co.id)[1] },
    ], L, { sort: 1, dir: -1, href: r => '#/req/' + r.id, file: 'richieste' });
  } else if (tab === 'clients') { location.hash = '#/clienti'; return { b: '' }; }
  else if (tab === 'tasks') {
    const L = all('crm_tasks').filter(t => t.co === co.id);
    body = table('tk', [{ t: 'Scadenza', v: t => fDT(t.due), sv: t => t.due }, { t: 'Cosa', v: t => t.title }, { t: 'Cliente', v: t => t.client ? coName(t.client) : '' }, { t: 'Per chi', v: t => t.who ? memName(t.who) : 'Team' }, { t: 'Stato', v: t => t.done ? 'Fatto' : new Date(t.due) < new Date() ? 'Scaduto' : 'Da fare' }], L, { sort: 0, dir: 1, file: 'promemoria' });
  }
  return { wide: 1, h: header('t', 'Tabelle', { back: '#/crm' }), b: `${crmHead('Tabelle ed esportazioni', 'Filtra, ordina ed esporta in Excel (CSV)')}<div class="seg" style="max-width:640px">${[['quotes', 'Quotazioni'], ['reqs', 'Richieste'], ['clients', 'Clienti'], ['tasks', 'Promemoria']].map(([k, l]) => `<a href="#/tabelle/${k}" class="${tab === k ? 'on' : ''}">${l}</a>`).join('')}</div>${body}` };
};

/* ---------- su computer, la Home del gestore è il cruscotto; promemoria nella campanella ---------- */
const _vHome = vHome;
vHome = function () { if (isWide() && crmOn()) return XR.crm(); return _vHome(); };
const _notifList = notifList;
notifList = function () { const L = _notifList(); if (crmOn()) crmDue().forEach(t => L.push({ at: t.due, ic: '⏰', t: 'Promemoria: ' + t.title + (t.client ? ' · ' + coName(t.client) : ''), go: t.client ? '#/cliente/' + t.client : '#/promemoria' })); return L.sort((a, b) => String(b.at).localeCompare(String(a.at))); };
/* dal profilo di un'azienda si apre la scheda CRM */
const _vCompany2 = vCompany;
vCompany = function (id) { const v = _vCompany2(id); if (crmOn() && v.b && get('companies', id)) v.b = `<a class="bt gh s" href="#/cliente/${id}" style="width:auto;align-self:flex-start">📇 Scheda cliente (CRM)</a>` + v.b; return v; };
