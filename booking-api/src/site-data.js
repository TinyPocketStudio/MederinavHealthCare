// One source of truth: the backend reads treatments, staff days and opening hours
// straight from the website's assets/js/data.js. The shim must be imported first.
import "./window-shim.js";
import "../../assets/js/data.js";

export const DATA = globalThis.MEDERINAV;

export const allTreatments = () => DATA.categories.flatMap((cat) => cat.items);
