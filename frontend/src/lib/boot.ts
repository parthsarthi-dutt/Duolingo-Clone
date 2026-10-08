/** Server-safe constants shared by the root layout and the client preferences store. */

export const PREFERENCES_KEY = "duo.preferences";

/**
 * Inlined into <head> so the saved theme is applied before first paint
 * (avoids a dark-to-light flash on reload).
 */
export const themeBootScript = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  PREFERENCES_KEY,
)})||"{}");var d=document.documentElement;d.dataset.theme=p.theme==="light"?"light":"dark";d.dataset.motion=p.motion===false?"off":"on";}catch(e){}})();`;
