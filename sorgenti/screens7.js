/* ================= INVIO DEI CODICI: WhatsApp, SMS, email, copia · LINK DI INSTALLAZIONE ================= */
function giftLink(code) { return APP_URL + '?codice=' + encodeURIComponent(code); }
function giftMsg(p, from) {
  return `🎁 Ti regalo un anno di RifiutiPro, l'app per collegarsi con impianti, trasportatori e intermediari e scambiare quotazioni nel settore rifiuti.\n\n1) Apri e installa l'app da qui:\n${giftLink(p.code)}\n\n2) Registrati: il codice si inserisce da solo.\n\nCodice regalo: ${p.code}\n(vale un anno di abbonamento, si usa una sola volta)${from ? '\n\n' + from : ''}`;
}
/* sostituisce i testi usati da email e condivisione */
promoShareText = (p, from) => giftMsg(p, from);
promoMail = (p, from) => 'mailto:' + encodeURIComponent(p.toEmail || '') + '?subject=' + encodeURIComponent('Un anno di RifiutiPro in regalo') + '&body=' + encodeURIComponent(`Buongiorno${p.toName ? ' ' + p.toName : ''},\n\n` + giftMsg(p, '') + `\n\nSe il codice non si inserisce da solo, lo scriva in Profilo > Il tuo piano.\n\nCordiali saluti\n${from || 'Soluzione Rifiuti S.r.l.'}`);
function sendRow(code, who) {
  const d = `data-id="${esc(code)}" data-who="${who}"`;
  return `<div class="row" style="gap:6px;flex-wrap:wrap"><button class="bt s" style="background:#25D366" data-act="gsWa" ${d}>WhatsApp</button><button class="bt s" data-act="gsSms" ${d}>💬 SMS</button><button class="bt gh s" data-act="gsMail" ${d}>✉️ Email</button><button class="bt gh s" data-act="gsCopyCode" ${d}>Copia codice</button><button class="bt gh s" data-act="gsCopyMsg" ${d}>Copia messaggio</button>${navigator.share ? `<button class="bt gh s" data-act="gsShare" ${d}>Altro…</button>` : ''}</div>`;
}
function gsCtx(el) { const p = get('promo', el.dataset.id); const staff = el.dataset.who === 'staff'; return { p, from: staff ? 'Soluzione Rifiuti S.r.l.' : (myCo() ? myCo().name : '') }; }
function gsMark(p, how) { patch('promo', p.code, { sentAt: nowISO(), sentTo: p.sentTo || p.toName || how }); log('Inviato il codice regalo ' + p.code + ' (' + how + ')'); }
ACT.gsWa = el => { const { p, from } = gsCtx(el); gsMark(p, 'WhatsApp'); location.href = 'https://wa.me/?text=' + encodeURIComponent(giftMsg(p, from)); };
ACT.gsSms = el => { const { p, from } = gsCtx(el); gsMark(p, 'SMS'); location.href = 'sms:' + (isIOS() ? '&' : '?') + 'body=' + encodeURIComponent(giftMsg(p, from)); };
ACT.gsMail = el => { const { p, from } = gsCtx(el); if (el.dataset.who === 'staff') { gsMark(p, 'email'); location.href = promoMail(p, from); return; } askRecipient(p, (n, e) => { patch('promo', p.code, { sentTo: n || e || 'email', sentAt: nowISO() }); location.href = promoMail(Object.assign({}, p, { toName: n, toEmail: e }), from); }); };
ACT.gsCopyCode = el => { const { p } = gsCtx(el); try { navigator.clipboard.writeText(p.code); toast('Codice copiato: ' + p.code); } catch (e) { toast(p.code); } };
ACT.gsCopyMsg = el => { const { p, from } = gsCtx(el); try { navigator.clipboard.writeText(giftMsg(p, from)); toast('Messaggio con link e codice copiato'); } catch (e) { toast(p.code); } };
ACT.gsShare = async el => { const { p, from } = gsCtx(el); try { await navigator.share({ title: 'Un anno di RifiutiPro in regalo', text: giftMsg(p, from) }); gsMark(p, 'condiviso'); } catch (e) { } };

/* nella pagina «Il tuo piano» e nel backoffice, i pulsanti diventano quelli nuovi */
const _vPlan = vPlan;
vPlan = function () { const v = _vPlan(); v.b = v.b.replace(/<div class="row" style="gap:6px;flex-wrap:wrap"><button class="bt gh s" data-act="pcMail" data-id="([^"]+)">✉️ Email<\/button><button class="bt gh s" data-act="pcShare" data-id="[^"]+">Condividi<\/button><button class="bt gh s" data-act="pcCopy" data-id="[^"]+">Copia<\/button><\/div>/g, (m, c) => sendRow(c, 'co')); return v; };
const _adminCodes = adminCodes;
adminCodes = function () { return _adminCodes().replace(/<div class="row" style="gap:6px"><button class="bt gh s" data-act="pcAdmMail" data-id="([^"]+)">✉️ Invia per email<\/button><button class="bt gh s" data-act="pcAdmCopy" data-id="[^"]+">Copia testo<\/button>(<button class="bt rd s" data-act="pcDel" data-id="[^"]+">Elimina<\/button>)<\/div>/g, (m, c, delb) => sendRow(c, 'staff') + `<div class="row">${delb}</div>`); };

/* ---------- link con il codice: ?codice=RP-XXXX-XXXX ---------- */
(function () { try { const q = new URLSearchParams(location.search); const c = q.get('codice'); if (c) { lsSet('rp_gift', codeId(c)); } /* il codice resta nell'indirizzo: su iPhone l'app aggiunta alla Home lo ritrova */ } catch (e) { } })();
function pendingGift() { const c = lsGet('rp_gift'); if (!c) return ''; const p = get('promo', c); if (p && p.usedBy) { lsSet('rp_gift', null); return ''; } return c; }
const _vReg = vReg;
vReg = function (a, b) { const g = pendingGift(); if (g && !fv('reg', 'gift')) setF('reg', 'gift', g); return _vReg(a, b); };
const _vPlan2 = vPlan;
vPlan = function () { const g = pendingGift(); if (g && !fv('pl', 'code') && !fv('pl', 'msg')) setF('pl', 'code', g); return _vPlan2(); };
const _redeem = redeemCode;
redeemCode = function (raw, co) { const r = _redeem(raw, co); if (r.ok && codeId(raw) === lsGet('rp_gift')) lsSet('rp_gift', null); return r; };

/* ---------- installazione dell'app ---------- */
let BIP = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); BIP = e; sched(); });
window.addEventListener('appinstalled', () => { BIP = null; toast('RifiutiPro installata'); sched(); });
function installCard(big) {
  if (isStandalone()) return '';
  return `<div class="card" style="border:2px solid var(--blue)"><b>📲 Installa RifiutiPro sul telefono</b><span class="sm mut">Così la trovi tra le app, con l'icona, le notifiche e il numero degli avvisi.</span><button class="bt" data-act="install">${big ? 'Scarica e installa l\'app' : 'Installa l\'app'}</button></div>`;
}
ACT.install = async () => {
  if (BIP) { BIP.prompt(); try { await BIP.userChoice; } catch (e) { } BIP = null; return; }
  if (isIOS()) return modal(`<h3 style="margin:0">Installa su iPhone o iPad</h3><ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px"><li>Apri questa pagina con <b>Safari</b>.</li><li>Tocca <b>Condividi</b> <span style="font-size:20px">⬆️</span> (in basso, o in alto a destra su iPad).</li><li>Scorri e tocca <b>«Aggiungi alla schermata Home»</b>, poi <b>Aggiungi</b>.</li><li>Apri <b>RifiutiPro</b> dall'icona.</li></ol><span class="hint">Serve iOS 16.4 o successivo per le notifiche.</span><button class="bt" data-act="mClose">Ho capito</button>`);
  modal(`<h3 style="margin:0">Installa sul telefono</h3><ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px"><li>Apri questa pagina con <b>Chrome</b>.</li><li>Tocca il menu <b>⋮</b> in alto a destra.</li><li>Tocca <b>«Installa app»</b> oppure <b>«Aggiungi a schermata Home»</b>.</li></ol><button class="bt" data-act="mClose">Ho capito</button>`);
};
const _vWelcome = vWelcome;
vWelcome = function () {
  const v = _vWelcome(); const g = pendingGift();
  const giftBox = g ? `<div class="card" style="background:linear-gradient(135deg,#0BA862,#056F47);color:#fff;border:0"><b style="font-size:18px">🎁 Hai ricevuto un anno di RifiutiPro in regalo</b><span class="sm">Codice <b class="mono">${esc(g)}</b>: si inserisce da solo quando ti registri.</span><button class="bt" style="background:#fff;color:#056F47" data-act="startReg">Registrati e attiva il regalo</button></div>` : '';
  v.b = v.b.replace('<button class="bt" data-go="#/login">Accedi</button>', giftBox + installCard(!!g) + '<button class="bt" data-go="#/login">Accedi</button>');
  return v;
};
/* chi ha già un account e apre il link con il codice */
function giftPendingBox() { const g = pendingGift(); if (!g || !me()) return ''; return `<a class="wide" href="#/plan" style="background:linear-gradient(135deg,#0BA862,#056F47)"><span class="vi" style="color:#056F47;font-size:24px">🎁</span><span><b>Codice regalo ${esc(g)} da attivare</b><small>Tocca qui e poi «Applica»</small></span><span class="ar">›</span></a>`; }
const _giftInvite = giftInvite;
giftInvite = function () { return giftPendingBox() + _giftInvite() + (isStandalone() ? '' : `<button class="bt gh s" data-act="install" style="align-self:flex-start">📲 Installa l'app sul telefono</button>`); };
