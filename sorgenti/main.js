/* ============ avvio ============ */
render();
initStore();
if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claude\.ai|claudeusercontent/.test(location.host)) { navigator.serviceWorker.register('sw.js').catch(() => { }); }
