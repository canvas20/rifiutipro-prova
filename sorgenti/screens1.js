/* ============ layout e render ============ */
function header(kind, title, opts = {}) {
  if (kind === 'home') {
    const n = notifCount();
    return `<div class="hd"><button class="ib" data-act="drawer" aria-label="Menu">${IC.menu}</button><div class="lg">${LOGO}</div><button class="ib" data-go="#/notif" aria-label="Notifiche">${IC.bell}${n ? `<span class="bd">${n}</span>` : ''}</button></div>`;
  }
  if (kind === 'logo') return `<div class="hd">${opts.back ? `<button class="ib" data-go="${opts.back}" aria-label="Indietro">${IC.back}</button>` : '<span style="width:40px"></span>'}<div class="lg">${LOGO}</div><span style="width:40px"></span></div>`;
  return `<div class="hd"><button class="ib" ${opts.back ? `data-go="${opts.back}"` : 'data-act="back"'} aria-label="Indietro">${IC.back}</button><h1>${esc(title)}</h1>${opts.right || '<span style="width:40px"></span>'}</div>`;
}
ACT.back = () => history.length > 1 ? history.back() : go('#/home');
function tabs(on) {
  const m = me(); if (!m) return '';
  const unread = unreadChats();
  const newq = notifQuotes();
  const T = isField(m)
    ? [['home', 'Home', IC.home, '#/home'], ['chat', 'Chat', IC.chat, '#/chats', unread], ['eer', 'EER', IC.building, '#/eer'], ['profile', 'Profilo', IC.user, '#/profile']]
    : [['home', 'Home', IC.home, '#/home'], ['quotes', 'Quotazioni', IC.tag, '#/quotes', newq], ['companies', 'Aziende', IC.people, '#/companies'], ['eer', 'EER', IC.building, '#/eer'], ['profile', 'Profilo', IC.user, '#/profile']];
  return `<nav class="tabs">${T.map(t => `<a href="${t[3]}" class="${on === t[0] ? 'on' : ''}">${t[2]}${t[4] ? `<span class="bd">${t[4]}</span>` : ''}${t[1]}</a>`).join('')}</nav>`;
}
function render() {
  const app = document.getElementById('app');
  const act = document.activeElement; const af = act && act.getAttribute && act.getAttribute('data-f'); let ss = null, se = null;
  try { if (af) { ss = act.selectionStart; se = act.selectionEnd; } } catch (e) { }
  const sy = window.scrollY;
  let v;
  try { v = view(); } catch (e) { console.error(e); v = { h: header('t', 'Errore', { back: '#/home' }), b: `<div class="err">Qualcosa non ha funzionato: ${esc(e.message)}</div>` }; }
  app.innerHTML = (v.h || '') + `<main class="ct ${v.t ? '' : 'nt'}">${v.b}</main>` + (v.t ? tabs(v.t) : '');
  try { if (typeof updateBadge === 'function') updateBadge(); } catch (e) { }
  if (af) { const el = app.querySelector(`[data-f="${af}"]`); if (el) { el.focus({ preventScroll: true }); try { if (ss != null) el.setSelectionRange(ss, se); } catch (e) { } } }
  if (!v.top) window.scrollTo(0, sy);
  if (v.after) v.after();
}
function view() {
  if (!READY) return { b: `<div style="padding:80px 0;text-align:center">${LOGO.replace('<svg', '<svg style="height:34px;width:auto"')}<p class="mut">Caricamento dei dati condivisi…</p></div>` };
  const { r, a, b } = route();
  const m = me();
  if (m && (!get('companies', m.co))) { setMe(null); }
  const M = me();
  if (!M) {
    const P = { '': vWelcome, login: vLogin, reg: vReg, regemp: vRegEmp, guide: vGuide };
    return (P[r] || vWelcome)(a, b);
  }
  if (M.status === 'pending') return vPending();
  if (M.status === 'suspended') return vSuspended();
  if (M.emailOk === false) return vVerify();
  const R = {
    home: vHome, '': vHome, notif: vNotif, quotes: vQuotes, quote: vQuote, req: vReq, newreq: vNewReq, makequote: vMakeQuote,
    companies: vCompanies, company: vCompany, linkreq: vLinkReq, chats: vChats, chat: vChat, eer: vEer, eercode: vEerCode,
    profile: vProfile, coedit: vCoEdit, waste: vWaste, auth: vAuth, team: vTeam, logs: vLogs, plan: vPlan, guide: vGuide,
    soon: vSoon, activated: vActivated, me: vMyAccount,
  };
  Object.assign(R, XR);
  if (M.sa && !['admin','me','guide','ad','chat'].includes(r)) return vAdmin(a, b);
  return (R[r] || vHome)(a, b);
}

/* ---------- menu laterale ---------- */
ACT.drawer = () => {
  const m = me(); const co = myCo(); const g = isG(co);
  const it = (href, ic, t, soon) => `<a href="${href}">${ic}<span>${t}</span>${soon ? '<em>fase 2</em>' : ''}</a>`;
  const bg = document.createElement('div'); bg.className = 'drawer-bg';
  bg.innerHTML = `<div class="drawer"><div class="row" style="padding:6px 4px 10px">${avatar(co)}<div class="sp"><b>${esc(co.name)}</b><div class="xs mut">${esc(memName(m.id))} · ${esc(ROLES[m.role])}</div></div></div>
  ${it('#/home', IC.home, 'Home')}
  <div class="dh">Lavoro</div>${it('#/chats', IC.chat, 'Chat')}${it('#/agenda', IC.cal, 'Agenda')}${isField(m) ? '' : it('#/docs', IC.folder, 'Documenti e scadenze')}${it('#/firs', IC.truck, 'Formulari xFIR')}
  ${isField(m) ? '' : `<div class="dh">Quotazioni e prezzi</div>${it('#/quotes/req', IC.list, 'Richieste')}${it('#/lists', IC.tag, g ? 'Listini riservati' : 'Listini dai collegati')}${it('#/favs', IC.star, 'Preferiti')}${it('#/prices', IC.chart, 'Prezzi e andamento')}${it('#/report', IC.chart, 'Report e statistiche')}
  <div class="dh">Codici EER</div>${it('#/eer', IC.building, 'Codici EER')}${it('#/fotoeer', IC.cam, 'Codice EER da foto')}
  <div class="dh">Vetrina</div>${it('#/vetrina', IC.shop, 'VETRINA')}${it('#/myads', IC.ads, 'I miei annunci')}`}
  <div class="dh">Account</div>${g && !isField(m) ? it('#/plan', IC.card, 'Il tuo piano') : ''}${it('#/profile', IC.gear, 'Impostazioni')}${it('#/help', IC.help, 'Aiuto e assistenza')}${it('#/guide', IC.book, 'Guida alla prova')}<a href="#" data-act="logout">${IC.out}<span>Esci</span></a>
  <div class="ftr" style="text-align:left;padding:14px 8px">${APPV}<br>${modeTxt()}</div></div>`;
  bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('a')) setTimeout(() => bg.remove(), 0); });
  document.body.appendChild(bg);
};
ACT.logout = () => { const m = me(); if (m) log('Uscita dall\'app'); setMe(null); closeOverlays(); U.login = {}; go('#/'); };

/* ---------- benvenuto, accesso ---------- */
function vWelcome() {
  return {
    h: header('logo'), top: 1, b: `
  <div class="hero"><h2>La rete commerciale del settore rifiuti</h2>
   <div class="pt"><i>🔎</i>Trova aziende</div><div class="pt"><i>🤝</i>Crea collegamenti</div><div class="pt"><i>🏷️</i>Scambia quotazioni</div>
   <p style="margin:0;opacity:.85;font-size:14px">Un unico punto di incontro per impianti, intermediari, trasportatori e produttori di rifiuti.</p></div>
  <button class="bt" data-go="#/login">Accedi</button>
  <button class="bt ln" data-act="startReg">Registrati</button>
  <div class="card"><b>Lavori in un'azienda già registrata?</b><span class="sm mut">Chiedi all'amministratore il <b>PIN aziendale</b> e registrati come dipendente o collega.</span><button class="bt gh s" data-go="#/regemp">Registrati con il PIN aziendale</button></div>
  ${typeof demoLoader === 'function' ? demoLoader() : ''}
  <div class="demo"><b>Versione di prova.</b> Solo dati fittizi: niente email reali, niente pagamenti. <a href="#/guide">Come provarla</a></div>
  ${ftr()}` };
}
function vLogin() {
  const L = U.login || {};
  const users = all('members').filter(m => m.status === 'active').sort((a, b) => coName(a.co).localeCompare(coName(b.co)));
  return {
    h: header('logo', '', { back: '#/' }), b: `
  <h2 class="ttl">Accedi al tuo account</h2><p class="sub">Inserisci le tue credenziali per accedere a RifiutiPro</p>
  ${L.err ? `<div class="err">${esc(L.err)}</div>` : ''}
  ${fld('Email', inp('login', 'email', 'nome@azienda.it', 'email', 'autocomplete="username"'))}
  ${fld('Password', inp('login', 'pw', '••••••••', 'password', 'data-enter="login"'), 0, 'In questa versione di prova la password non viene controllata.')}
  <button class="bt g" data-act="login">Accedi</button>
  <p class="sm mut" style="margin:0;text-align:center">Un solo modo di entrare per tutti: email e password personali. Niente cellulare.</p>
  <p style="text-align:center;margin:0">Non hai un account? <a href="#" data-act="startReg"><b>Registrati</b></a></p>
  ${users.length ? `<div class="sec">Accesso rapido di prova</div><div class="list">${users.map(u => { const c = get('companies', u.co); return `<a class="li" data-act="quick" data-id="${u.id}">${avatar(c, 1)}<span class="sp"><b>${esc(memName(u.id))}</b><span class="s">${esc(c ? c.name : '')} · ${esc(c && c.kind === 'gestore' ? 'Gestore' : 'Visualizzatore')} · ${esc(ROLES[u.role])}</span></span><span class="chev">›</span></a>`; }).join('')}</div>` : ''}
  ${ftr()}` };
}
ACT.login = () => {
  const L = U.login || {}; const em = String(L.email || '').trim().toLowerCase();
  const m = all('members').find(x => (x.email || '').toLowerCase() === em);
  if (!m) { setF('login', 'err', 'Email non trovata. Controlla o registrati.'); return render(); }
  enterAs(m);
};
ACT.quick = el => { const m = get('members', el.dataset.id); if (m) enterAs(m); };
function enterAs(m) { setMe(m.id); U.login = {}; if (m.status === 'active') { patch('members', m.id, { lastLogin: nowISO() }); log('Accesso all\'app', m.co); } go('#/home'); }
function vPending() {
  const m = me(); const co = get('companies', m.co);
  return { h: header('logo'), b: `<h2 class="ttl">Richiesta inviata</h2><div class="card"><b>${esc(co.name)}</b><span class="mut">La tua richiesta di accesso come <b>${esc(memName(m.id))}</b> è in attesa. L'amministratore o l'ufficio deve approvarla da <b>Profilo › Team e accessi</b>; poi entri con la tua email.</span></div><div class="info">Questa schermata si aggiorna da sola quando arriva l'approvazione.</div><button class="bt gh" data-act="logout">Esci</button>${ftr()}` };
}
function vSuspended() { return { h: header('logo'), b: `<h2 class="ttl">Accesso sospeso</h2><div class="warn">L'amministratore della tua azienda ha sospeso il tuo accesso.</div><button class="bt gh" data-act="logout">Esci</button>` }; }
function vVerify() {
  const m = me();
  return { h: header('logo'), b: `<h2 class="ttl">Controlla la tua email</h2><div class="card"><span>Abbiamo inviato un link di attivazione a <b>${esc(m.email)}</b>. Aprilo per attivare l'account.</span><span class="hint">L'email arriva una sola volta, alla fine della registrazione.</span></div>
  <div class="demo">In prova non parte nessuna email: tocca il pulsante qui sotto per simulare il clic sul link.</div>
  <button class="bt g" data-act="verifyOk">Apri il link di attivazione (simulazione)</button><button class="bt gh" data-act="logout">Esci</button>` };
}
ACT.verifyOk = () => { const m = me(); patch('members', m.id, { emailOk: true }); log('Email verificata, account attivato'); go('#/activated'); };
function vActivated() {
  const co = myCo(); const g = isG(co);
  return { h: header('logo'), b: `<div style="text-align:center;font-size:54px">✅</div><h2 class="ttl" style="text-align:center">Account attivato</h2>
  <div class="card"><span><b>${esc(co.name)}</b> è registrata come ${g ? (co.types || []).map(t => `<span class="tag g">${TYPES[t]}</span>`).join(' ') : '<span class="tag">Visualizzatore</span>'}</span>
  <span class="mut sm">Ora puoi cercare aziende, collegarti e ${g ? 'ricevere richieste. Per <b>inviare</b> quotazioni serve il piano: 5,00 € al mese o 50,00 € all\'anno.' : 'chiedere quotazioni ai tuoi collegamenti. Per te è gratis.'}</span></div>
  <button class="bt g" data-go="#/home">Vai alla Home</button>${g ? '<button class="bt ln" data-go="#/plan">Scegli il piano</button>' : ''}
  ${g && !(co.auth && co.auth.declared) ? '<div class="info">Puoi completare le autorizzazioni più tardi da Profilo › Autorizzazioni.</div>' : ''}` };
}

/* ---------- registrazione azienda: 6 passi senza interruzioni ---------- */
ACT.startReg = () => { U.reg = { step: 1, kind: '', types: [], waste: [] }; go('#/reg'); };
function steps(n, tot, label) { return `<div class="steps">${Array.from({ length: tot }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}<span>${label}</span></div>`; }
function vReg() {
  if (!U.reg) U.reg = { step: 1, kind: '', types: [], waste: [] };
  const R = U.reg; const g = R.kind === 'gestore';
  const tot = g ? 6 : 4; const st = R.step;
  const err = R.err ? `<div class="err">${esc(R.err)}</div>` : '';
  const back = st > 1 ? `<button class="bt gh" data-act="regBack">Indietro</button>` : '';
  let b = '';
  if (st === 1) {
    b = `<h2 class="ttl">Crea il tuo account</h2><p class="sub">Seleziona la tipologia di account per iniziare.</p>${steps(1, 6, 'Passo 1 di 6')}${err}
    <button class="opt ${R.kind === 'gestore' ? 'on' : ''}" data-act="regKind" data-k="gestore"><span class="oi">${IC.truck}</span><span class="sp"><b>Gestore ambientale</b><span class="d">Imprese che operano professionalmente nella gestione dei rifiuti: impianti, trasportatori, intermediari. Inviano e ricevono quotazioni.</span></span><span class="rdo ${R.kind === 'gestore' ? 'on' : ''}"></span></button>
    <button class="opt ${R.kind === 'visualizzatore' ? 'on' : ''}" data-act="regKind" data-k="visualizzatore"><span class="oi" style="background:#E3F5EB;color:#067A47">${IC.user}</span><span class="sp"><b>Visualizzatore</b><span class="d">Produttori di rifiuti, aziende clienti, privati. Chiede e riceve quotazioni, gratis.</span></span><span class="rdo ${R.kind === 'visualizzatore' ? 'on' : ''}"></span></button>
    <button class="bt" data-act="regNext">Continua</button>
    <p class="sm" style="text-align:center;margin:0">Hai già un account? <a href="#/login"><b>Accedi</b></a> · Lavori in un'azienda registrata? <a href="#/regemp"><b>PIN aziendale</b></a></p>`;
  } else if (st === 2 && g) {
    const T = (k, d) => `<button class="opt ${R.types.includes(k) ? 'on' : ''}" data-act="regType" data-k="${k}"><span class="ck ${R.types.includes(k) ? 'on' : ''}">${R.types.includes(k) ? '✓' : ''}</span><span class="sp"><b>${TYPES[k]}</b><span class="d">${d}</span></span></button>`;
    b = `<h2 class="ttl">Tipologia di operatore</h2><p class="sub">Seleziona le attività svolte dalla tua azienda. Puoi sceglierne più di una.</p>${steps(2, 6, 'Passo 2 di 6')}${err}
    <div class="row"><span class="sp sm mut">Puoi selezionarne una, due o tutte e tre.</span><button class="bt gh s" data-act="regAllTypes">Seleziona tutte</button></div>
    ${T('impianto', 'Recupero, trattamento o smaltimento rifiuti')}${T('trasportatore', 'Raccolta e trasporto rifiuti')}${T('intermediario', 'Commercio e intermediazione senza detenzione')}
    <span class="hint">${R.types.length} attività selezionate · compariranno come etichette sul profilo e nelle ricerche.</span><div class="two">${back}<button class="bt" data-act="regNext">Continua</button></div>`;
  } else if ((st === 2 && !g) || (st === 3 && g)) {
    const pw = fv('reg', 'pw'); const c1 = pw.length >= 10, c2 = /[a-z]/i.test(pw), c3 = /\d/.test(pw);
    b = `<h2 class="ttl">Dati di accesso</h2><p class="sub">Email e password che userai per accedere.</p>${steps(g ? 3 : 2, tot, `Passo ${g ? 3 : 2} di ${tot}`)}${err}
    <div class="info">${g ? 'Gestore ambientale · ' + esc(R.types.map(t => TYPES[t]).join(', ')) : 'Visualizzatore'} · <a href="#" data-act="regTo1">Modifica</a></div>
    ${fld('Nome', inp('reg', 'name', 'Nome'), 1)}${fld('Cognome', inp('reg', 'surname', 'Cognome'), 1)}
    ${fld('Email', inp('reg', 'email', 'nome@azienda.it', 'email'), 1)}
    ${fld('Password', inp('reg', 'pw', 'Almeno 10 caratteri', 'password', 'data-live'), 1, `${c1 ? '✓' : '○'} Almeno 10 caratteri · ${c2 ? '✓' : '○'} una lettera · ${c3 ? '✓' : '○'} un numero<br>In prova la password non viene salvata.`)}
    ${cbx('reg', 'tos', 'Accetto i Termini di servizio <b>(obbligatorio)</b>')}${cbx('reg', 'priv', 'Ho letto l\'Informativa privacy <b>(obbligatorio)</b>')}${cbx('reg', 'mkt', 'Comunicazioni promozionali (facoltativo)')}
    <span class="hint">Nessuna email adesso: la conferma arriva una sola volta, alla fine della registrazione. RifiutiPro non sostituisce FIR, RENTRI, MUD o altri adempimenti di legge.</span>
    <div class="two">${back}<button class="bt" data-act="regNext">Continua</button></div>`;
  } else if ((st === 3 && !g) || (st === 4 && g)) {
    const priv = !g && fv('reg', 'priv2');
    b = `<h2 class="ttl">${priv ? 'I tuoi dati' : 'Dati azienda'}</h2><p class="sub">Inserisci i dati principali${priv ? '' : ' della tua azienda'}.</p>${steps(g ? 4 : 3, tot, `Passo ${g ? 4 : 3} di ${tot}`)}${err}
    ${!g ? `<div class="seg"><button class="${priv ? '' : 'on'}" data-act="regPriv" data-v="0">Azienda</button><button class="${priv ? 'on' : ''}" data-act="regPriv" data-v="1">Privato</button></div>` : ''}
    ${priv ? fld('Codice fiscale', inp('reg', 'cf', 'Codice fiscale'), 1) : fld('Ragione sociale', inp('reg', 'coname', 'Es. Recuperi Demo Srl'), 1) + fld('Partita IVA', inp('reg', 'piva', '11 cifre', 'text', 'inputmode="numeric"'), 1) + fld('Codice fiscale', inp('reg', 'cf', 'Se diverso dalla P. IVA'))}
    ${fld('Indirizzo della sede', inp('reg', 'addr', 'Via e numero'))}
    <div class="two">${fld('Comune', inp('reg', 'city', 'Comune'), 1)}${fld('Provincia', inp('reg', 'prov', 'Sigla, es. SR', 'text', 'maxlength="2" style="text-transform:uppercase"'), 1)}</div>
    ${fld('Telefono aziendale (facoltativo)', inp('reg', 'phone', 'Telefono', 'tel'), 0, 'Visibile solo alle aziende collegate.')}
    <div class="two">${back}<button class="bt ${g ? '' : 'g'}" data-act="regNext">${g ? 'Continua' : 'Crea account'}</button></div>`;
  } else if (st === 5 && g) {
    b = `<h2 class="ttl">Autorizzazioni</h2><p class="sub">Facoltativo: inserisci i dati autorizzativi delle attività che hai scelto.</p>${steps(5, 6, 'Passo 5 di 6 · facoltativo')}${err}
    <div class="info"><b>Passo facoltativo.</b> Puoi saltarlo e completarlo quando vuoi da Profilo › Autorizzazioni. Senza questi dati il profilo funziona, ma non mostra il badge «Verificata».</div>
    ${authForm('reg', R.types)}
    <div class="two"><button class="bt gh" data-act="regSkip">Salta questo passo</button><button class="bt" data-act="regNext" ${authFilled('reg') && !fv('reg', 'decl') ? 'disabled' : ''}>Salva e continua</button></div>${back}`;
  } else if (st === 6 && g) {
    b = `<h2 class="ttl">Rifiuti che tratti</h2><p class="sub">Scegli macroaree e sottocategorie; descrizione e codice EER sono facoltativi.</p>${steps(6, 6, 'Passo 6 di 6')}${err}
    ${wasteEditor('reg')}
    <div class="two">${back}<button class="bt g" data-act="regNext">Crea account</button></div>`;
  }
  return { h: header('logo', '', { back: '#/' }), b: b + ftr() };
}
ACT.regKind = el => { U.reg.kind = el.dataset.k; U.reg.err = ''; render(); };
ACT.regType = el => { const t = U.reg.types; const k = el.dataset.k; const i = t.indexOf(k); if (i >= 0) t.splice(i, 1); else t.push(k); render(); };
ACT.regAllTypes = () => { U.reg.types = ['impianto', 'trasportatore', 'intermediario']; render(); };
ACT.regBack = () => { U.reg.step--; U.reg.err = ''; render(); window.scrollTo(0, 0); };
ACT.regTo1 = () => { U.reg.step = 1; render(); };
ACT.regPriv = el => { setF('reg', 'priv2', el.dataset.v === '1'); render(); };
ACT.regSkip = () => { ['imp_tipo', 'imp_num', 'imp_ente', 'imp_scad', 'tr_albo', 'int_albo', 'decl'].forEach(k => setF('reg', k, '')); U.reg.step = 6; U.reg.err = ''; render(); window.scrollTo(0, 0); };
function vErr(m) { U.reg.err = m; render(); window.scrollTo(0, 0); }
ACT.regNext = () => {
  const R = U.reg; const g = R.kind === 'gestore'; const st = R.step; const f = k => String(fv('reg', k)).trim();
  if (st === 1) { if (!R.kind) return vErr('Scegli Gestore ambientale o Visualizzatore.'); }
  else if (st === 2 && g) { if (!R.types.length) return vErr('Scegli almeno un\'attività.'); }
  else if ((st === 2 && !g) || (st === 3 && g)) {
    if (!f('name') || !f('surname')) return vErr('Inserisci nome e cognome.');
    const em = f('email').toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return vErr('Email non valida.');
    if (all('members').some(m => (m.email || '').toLowerCase() === em)) return vErr('Questa email è già registrata: accedi.');
    const pw = fv('reg', 'pw'); if (pw.length < 10 || !/[a-z]/i.test(pw) || !/\d/.test(pw)) return vErr('La password deve avere almeno 10 caratteri, una lettera e un numero.');
    if (!fv('reg', 'tos') || !fv('reg', 'priv')) return vErr('Accetta Termini di servizio e Informativa privacy.');
  } else if ((st === 3 && !g) || (st === 4 && g)) {
    const priv = !g && fv('reg', 'priv2');
    if (priv) { if (!f('cf')) return vErr('Inserisci il codice fiscale.'); }
    else { if (!f('coname')) return vErr('Inserisci la ragione sociale.'); if (!/^\d{11}$/.test(f('piva'))) return vErr('La Partita IVA ha 11 cifre.'); }
    if (!f('city') || !/^[A-Za-z]{2}$/.test(f('prov'))) return vErr('Inserisci comune e sigla della provincia (2 lettere).');
    if (!g) return createCompany();
  } else if (st === 5 && g) {
    if (authFilled('reg') && !fv('reg', 'decl')) return vErr('Spunta la dichiarazione di responsabilità oppure salta il passo.');
  } else if (st === 6 && g) {
    const w = wasteFromForm('reg'); if (w.err) return vErr(w.err); return createCompany();
  }
  R.step++; R.err = ''; render(); window.scrollTo(0, 0);
};
function authFilled(form) { return ['imp_tipo', 'imp_num', 'imp_ente', 'imp_scad', 'tr_albo', 'int_albo'].some(k => String(fv(form, k)).trim()); }
function authForm(form, types) {
  let h = '';
  if (types.includes('impianto')) h += `<div class="card"><h3>Impianto</h3>${fld('Tipo di autorizzazione', sel(form, 'imp_tipo', [['', 'Seleziona'], 'AIA – Autorizzazione integrata ambientale', 'AUA – Autorizzazione unica ambientale', 'Art. 208 d.lgs. 152/2006 (autorizzazione unica)', 'Artt. 214-216 (procedura semplificata)']))}${fld('Numero autorizzazione', inp(form, 'imp_num', 'Es. AIA n. 123/2023'))}<div class="two">${fld('Ente di rilascio', inp(form, 'imp_ente', 'Es. Regione Siciliana'))}${fld('Scadenza', inp(form, 'imp_scad', '', 'date'))}</div></div>`;
  if (types.includes('trasportatore')) h += `<div class="card"><h3>Trasportatore</h3>${fld('Iscrizione Albo Gestori Ambientali n.', inp(form, 'tr_albo', 'Es. PA/012345'))}${fld('Categorie', inp(form, 'tr_cat', 'Es. 1, 4, 5'))}</div>`;
  if (types.includes('intermediario')) h += `<div class="card"><h3>Intermediario</h3>${fld('Iscrizione Albo, categoria 8, n.', inp(form, 'int_albo', 'Es. PA/067890'))}</div>`;
  h += authFilesBox(form);
  h += `<div class="card"><b>Dichiarazione di responsabilità</b><label class="cbx"><input type="checkbox" data-f="${form}.decl" ${fv(form, 'decl') ? 'checked' : ''}><span class="sm">Dichiaro, a nome dell'azienda, che i dati e i documenti inseriti sono veri, completi e aggiornati. L'azienda è l'unica responsabile di quanto dichiarato e solleva RifiutiPro, Soluzione Rifiuti S.r.l. e gli sviluppatori dell'app da ogni responsabilità per dati non veritieri, incompleti o scaduti. <span class="ph">[testo definitivo da validare con il legale]</span></span></label><span class="hint">La spunta serve solo se inserisci dei dati. Il badge «Verificata» indica solo un controllo formale dei documenti da parte di Soluzione Rifiuti, non una garanzia.</span></div>`;
  return h;
}
function authFromForm(form) {
  const f = k => String(fv(form, k)).trim();
  return { impianto: { tipo: f('imp_tipo'), num: f('imp_num'), ente: f('imp_ente'), scad: f('imp_scad') }, trasportatore: { albo: f('tr_albo'), cat: f('tr_cat') }, intermediario: { albo: f('int_albo') }, declared: !!fv(form, 'decl') && authFilled(form), declAt: fv(form, 'decl') ? nowISO() : '', files: (U[form] && U[form].afiles) || [] };
}
function createCompany() {
  const R = U.reg; const g = R.kind === 'gestore'; const f = k => String(fv('reg', k)).trim();
  const priv = !g && fv('reg', 'priv2');
  const coId = uid('co_'), mId = uid('m_');
  const co = { kind: R.kind, priv: !!priv, types: g ? R.types.slice() : [], name: priv ? (f('name') + ' ' + f('surname')) : f('coname'), piva: priv ? '' : f('piva'), cf: f('cf'), addr: f('addr'), city: f('city'), prov: f('prov').toUpperCase(), phone: f('phone'), email: f('email').toLowerCase(), pres: '', pin: newPin(), createdAt: nowISO(), waste: g ? wasteFromForm('reg').list : [], auth: g ? authFromForm('reg') : {}, plan: null };
  const mem = { co: coId, name: f('name'), surname: f('surname'), email: f('email').toLowerCase(), role: 'admin', status: 'active', emailOk: false, createdAt: nowISO(), mkt: !!fv('reg', 'mkt') };
  put('companies', coId, co); put('members', mId, mem);
  setMe(mId); U.reg = null;
  setTimeout(() => log('Registrazione dell\'azienda ' + co.name + ' (' + (g ? 'Gestore ambientale' : 'Visualizzatore') + ')', coId), 50);
  go('#/home');
}

/* ---------- editor rifiuti trattati: macroaree › sottocategorie › riquadri descrizione + EER ---------- */
/* U[form].W = { 'Macro': { open:bool, subs:{ 'Sub': {on:bool, rows:[{d,e}]} } } , ordine in U[form].WO } */
function wInit(form, list) {
  const F = U[form] = U[form] || {}; if (F.W) return F;
  F.W = {}; F.WO = [];
  MACRO.forEach(([n, , , subs]) => { F.W[n] = { open: false, subs: {} }; F.WO.push(n); subs.forEach(s => F.W[n].subs[s] = { on: false, rows: [] }); });
  (list || []).forEach(w => { if (!F.W[w.m]) { F.W[w.m] = { open: false, subs: {} }; F.WO.push(w.m); } F.W[w.m].subs[w.s] = { on: true, rows: (w.rows || []).map(r => ({ d: r.d || '', e: r.e || '' })) }; });
  return F;
}
function wasteEditor(form, list) {
  const F = wInit(form, list);
  const tot = F.WO.reduce((a, m) => a + Object.values(F.W[m].subs).filter(s => s.on).length, 0);
  const macros = F.WO.map((m, mi) => {
    const M = F.W[m]; const info = macroInfo(m); const subs = Object.keys(M.subs); const on = subs.filter(s => M.subs[s].on).length;
    const body = M.open ? `<div class="mb">${subs.map((s, si) => {
      const S = M.subs[s]; const rows = S.rows.length ? S.rows : [{ d: '', e: '' }, { d: '', e: '' }];
      return `<div class="subc"><label class="row" style="cursor:pointer"><span class="ck ${S.on ? 'on' : ''}" data-act="wSub" data-m="${mi}" data-s="${si}">${S.on ? '✓' : ''}</span><b class="sp" data-act="wSub" data-m="${mi}" data-s="${si}">${esc(s)}</b></label>
      ${S.on ? rows.map((r, ri) => `<div class="slot"><input class="in" placeholder="Descrizione del materiale" value="${esc(r.d)}" data-w="${mi}|${si}|${ri}|d"><input class="in mono" placeholder="EER (facolt.)" value="${esc(r.e)}" data-w="${mi}|${si}|${ri}|e"><button class="x" data-act="wDelRow" data-m="${mi}" data-s="${si}" data-r="${ri}" aria-label="Elimina riga">×</button></div>`).join('') + `<button class="add" data-act="wAddRow" data-m="${mi}" data-s="${si}">+ Aggiungi riga</button>` : ''}</div>`;
    }).join('')}<button class="add" data-act="wAddSub" data-m="${mi}">+ Aggiungi sottocategoria in «${esc(m)}»</button></div>` : '';
    return `<div class="mac"><div class="mh" data-act="wOpen" data-m="${mi}"><span class="mi" style="background:${info.col}">${esc(info.ini)}</span><span class="sp"><b>${esc(m)}</b><div class="xs mut">${on} di ${subs.length} scelte</div></span><span class="mut">${M.open ? '▲' : '▼'}</span></div>${body}</div>`;
  }).join('');
  return `<div class="info"><b>${tot}</b> sottocategorie scelte. Apri una macroarea, spunta le sottocategorie e, se vuoi, scrivi descrizione e codice EER nei riquadri.</div>${macros}<button class="add" data-act="wAddMacro" data-form="${form}">+ Aggiungi macroarea</button>`;
}
function wF() { const r = route(); return r.r === 'reg' ? 'reg' : 'waste'; }
function wKeys(el) { const F = U[wF()]; const m = F.WO[+el.dataset.m]; const s = Object.keys(F.W[m].subs)[+el.dataset.s]; return { F, m, s }; }
ACT.wOpen = el => { const F = U[wF()]; const m = F.WO[+el.dataset.m]; F.W[m].open = !F.W[m].open; render(); };
ACT.wSub = el => { const { F, m, s } = wKeys(el); const S = F.W[m].subs[s]; S.on = !S.on; if (S.on && !S.rows.length) S.rows = [{ d: '', e: '' }, { d: '', e: '' }]; render(); };
ACT.wAddRow = el => { const { F, m, s } = wKeys(el); F.W[m].subs[s].rows.push({ d: '', e: '' }); render(); };
ACT.wDelRow = el => { const { F, m, s } = wKeys(el); F.W[m].subs[s].rows.splice(+el.dataset.r, 1); render(); };
ACT.wAddSub = el => { const F = U[wF()]; const m = F.WO[+el.dataset.m]; const n = (prompt('Nome della nuova sottocategoria in «' + m + '»') || '').trim(); if (!n) return; if (!F.W[m].subs[n]) F.W[m].subs[n] = { on: true, rows: [{ d: '', e: '' }, { d: '', e: '' }] }; render(); };
ACT.wAddMacro = () => { const F = U[wF()]; const n = (prompt('Nome della nuova macroarea') || '').trim(); if (!n) return; if (!F.W[n]) { F.W[n] = { open: true, subs: {} }; F.WO.push(n); } const s = (prompt('Prima sottocategoria in «' + n + '»') || '').trim(); if (s) F.W[n].subs[s] = { on: true, rows: [{ d: '', e: '' }, { d: '', e: '' }] }; render(); };
document.addEventListener('input', e => { const w = e.target.getAttribute && e.target.getAttribute('data-w'); if (!w) return; const [mi, si, ri, k] = w.split('|'); const F = U[wF()]; const m = F.WO[+mi]; const s = Object.keys(F.W[m].subs)[+si]; const S = F.W[m].subs[s]; if (!S.rows.length) S.rows = [{ d: '', e: '' }, { d: '', e: '' }]; while (S.rows.length <= +ri) S.rows.push({ d: '', e: '' }); S.rows[+ri][k] = e.target.value; });
function wasteFromForm(form) {
  const F = wInit(form); const list = [];
  for (const m of F.WO) for (const s in F.W[m].subs) { const S = F.W[m].subs[s]; if (!S.on) continue; const rows = []; for (const r of S.rows) { const d = String(r.d || '').trim(); const e0 = String(r.e || '').trim(); if (!d && !e0) continue; let e = ''; if (e0) { e = eerNorm(e0); if (!e) return { err: `Codice EER non valido in «${s}»: usa 6 cifre (es. 17 04 05).` }; } rows.push({ d, e }); } list.push({ m, s, rows }); }
  return { list };
}
