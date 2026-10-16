// The website's data.js assigns `window.MEDERINAV`. Workers have no `window`,
// so point it at the global object before data.js is imported (see site-data.js).
globalThis.window = globalThis;
