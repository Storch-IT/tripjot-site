/* Theme: "auto" follows the phone/computer setting (and changes with it, e.g. at sunset),
   "light" and "dark" are fixed. Loaded in <head> so the page never flashes the wrong theme.
   Тема: "auto" — як у телефоні/комп'ютері (і змінюється разом із ним), "light"/"dark" — вручну. */
(function () {
  "use strict";
  var KEY = "tripjot-theme";
  var ORDER = ["auto", "light", "dark"];
  var LABELS = { auto: "Auto", light: "Light", dark: "Dark" };
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function saved() {
    try { var v = localStorage.getItem(KEY); return ORDER.indexOf(v) >= 0 ? v : "auto"; }
    catch (e) { return "auto"; }
  }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode: still works for this visit */ } }

  var pref = saved();

  function apply() {
    var dark = pref === "dark" || (pref === "auto" && mq && mq.matches);
    root.setAttribute("data-theme", dark ? "dark" : "light");
    root.setAttribute("data-theme-pref", pref);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0f1115" : "#f2f1ec");
    syncControls();
  }

  function syncControls() {
    if (!document.body) return;
    document.querySelectorAll("[data-theme-cycle]").forEach(function (b) {
      var text = "Theme: " + LABELS[pref] + (pref === "auto" ? " (follows your device)" : "");
      b.setAttribute("aria-label", text + ". Tap to change.");
      b.setAttribute("title", text);
    });
    document.querySelectorAll("[data-theme-set]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-theme-set") === pref ? "true" : "false");
    });
  }

  /* Switch without transitions, then make the browser repaint everything once.
     Without this some browsers (Chrome on Mac) can leave glass blocks blank after a switch. */
  function switching(fn) {
    root.classList.add("theme-switching");
    fn();
    if (!document.body) { root.classList.remove("theme-switching"); return; }
    void document.body.offsetHeight;
    requestAnimationFrame(function () {
      document.body.style.transform = "translateZ(0)";
      requestAnimationFrame(function () {
        document.body.style.transform = "";
        root.classList.remove("theme-switching");
      });
    });
  }

  function set(v) { pref = v; save(v); switching(apply); }

  if (mq) {
    var onChange = function () { if (pref === "auto") switching(apply); };
    if (mq.addEventListener) mq.addEventListener("change", onChange); else if (mq.addListener) mq.addListener(onChange);
  }

  apply();

  /* Colour scheme: "copper" (default) or "sage". */
  var AKEY = "tripjot-accent";
  var ACCENTS = ["sage", "copper"];
  var ALABELS = { sage: "Sage", copper: "Copper" };
  function savedAccent() {
    try { var v = localStorage.getItem(AKEY); return ACCENTS.indexOf(v) >= 0 ? v : "copper"; }
    catch (e) { return "copper"; }
  }
  var accent = savedAccent();
  function applyAccent() {
    root.setAttribute("data-accent", accent);
    var icon = document.querySelector('link[rel="icon"]');
    if (icon) icon.setAttribute("href", accent === "copper" ? "favicon-copper.svg" : "favicon.svg");
    if (!document.body) return;
    document.querySelectorAll("[data-accent-cycle]").forEach(function (b) {
      b.setAttribute("aria-label", "Colour: " + ALABELS[accent] + ". Tap to change.");
      b.setAttribute("title", "Colour: " + ALABELS[accent]);
    });
    document.querySelectorAll("[data-accent-set]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-accent-set") === accent ? "true" : "false");
    });
  }
  function setAccent(v) { accent = v; try { localStorage.setItem(AKEY, v); } catch (e) {} switching(applyAccent); }
  applyAccent();

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-accent-cycle]").forEach(function (b) {
      b.addEventListener("click", function () { setAccent(ACCENTS[(ACCENTS.indexOf(accent) + 1) % ACCENTS.length]); });
    });
    document.querySelectorAll("[data-accent-set]").forEach(function (b) {
      b.addEventListener("click", function () { setAccent(b.getAttribute("data-accent-set")); });
    });
    applyAccent();
    document.querySelectorAll("[data-theme-cycle]").forEach(function (b) {
      b.addEventListener("click", function () { set(ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length]); });
    });
    document.querySelectorAll("[data-theme-set]").forEach(function (b) {
      b.addEventListener("click", function () { set(b.getAttribute("data-theme-set")); });
    });
    syncControls();
  });
})();
