// One source of truth: the backend reads categories, staff days and opening hours
// straight from the website's assets/js/data.js. The shim must be imported first.
// Treatments live in the database (see catalog.js); data.js only seeds them.
import "./window-shim.js";
import "../../assets/js/data.js";

export const DATA = globalThis.MEDERINAV;
