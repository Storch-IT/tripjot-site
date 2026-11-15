(function () {
  "use strict";

  var cfg = window.TRIPJOT_CONFIG || {};

  /* ---------- Analytics ----------
     track() sends an event to whichever free analytics tool is added to the page later
     (Umami, GoatCounter, Meta Pixel). Until then it only logs to the browser console.
     Events: cta_click, calculator_used, signup. Visits are counted by the tool itself. */
  function track(name, props) {
    try {
      if (window.umami && typeof window.umami.track === "function") window.umami.track(name, props);
      if (window.goatcounter && typeof window.goatcounter.count === "function") {
        window.goatcounter.count({ path: "event-" + name, title: name, event: true });
      }
      if (typeof window.fbq === "function" && name === "signup") window.fbq("track", "Lead");
    } catch (e) { /* never break the page because of analytics */ }
    if (window.console) console.info("[track]", name, props || "");
  }

  document.querySelectorAll("[data-track]").forEach(function (el) {
    el.addEventListener("click", function () { track(el.getAttribute("data-track")); });
  });

  /* ---------- Contact links ---------- */
  var email = cfg.contactEmail || "";
  var hasEmail = email.indexOf("@") > 0;
  document.querySelectorAll("[data-contact-link]").forEach(function (a) {
    if (hasEmail) a.href = "mailto:" + email;
  });
  document.querySelectorAll("[data-contact-text]").forEach(function (el) {
    if (email) el.textContent = email;
    if (hasEmail) {
      el.classList.remove("ph");
      if (el.tagName === "A") el.href = "mailto:" + email;
    }
  });
  document.querySelectorAll("[data-owner]").forEach(function (el) {
    if (cfg.ownerName) el.textContent = cfg.ownerName;
    if (cfg.ownerName && cfg.ownerName.charAt(0) !== "[") el.classList.remove("ph");
  });

  /* ---------- Calculator ----------
     yearMiles = weekly × 46
     approved  = 55p × first 10,000 + 25p above (35p from 6 April 2027)
     gap       = max(0, approved − employer rate × yearMiles)
     taxBack   = gap × tax rate                                         */
  var WEEKS = 46;
  var FIRST_BAND = 10000;

  function overRateFor(date) {
    // UK tax year starting 6 April 2027 uses 35p above 10,000 miles.
    return date >= new Date(2027, 3, 6) ? 0.35 : 0.25;
  }

  function taxBack(weeklyMiles, employerPence, taxRate, overRate) {
    var yearMiles = Math.max(0, weeklyMiles) * WEEKS;
    var approved = 0.55 * Math.min(yearMiles, FIRST_BAND) + overRate * Math.max(0, yearMiles - FIRST_BAND);
    var paid = (Math.max(0, employerPence) / 100) * yearMiles;
    var gap = Math.max(0, approved - paid);
    return gap * taxRate;
  }
  window.tripjotTaxBack = taxBack; // handy for checking in the console

  function formatPounds(x) {
    var rounded = x >= 100 ? Math.round(x / 10) * 10 : Math.round(x);
    return "£" + rounded.toLocaleString("en-GB");
  }

  /* Pleasant count-up of the result (skipped if the visitor prefers less motion) */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function countTo(el, target) {
    var from = parseFloat(el.getAttribute("data-value") || "0");
    el.setAttribute("data-value", String(target));
    if (reduceMotion || !window.requestAnimationFrame || Math.abs(target - from) < 1) { el.textContent = formatPounds(target); return; }
    var start = null, dur = 450;
    if (el._raf) cancelAnimationFrame(el._raf);
    function step(t) {
      if (start === null) start = t;
      var k = Math.min(1, (t - start) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = formatPounds(from + (target - from) * e);
      if (k < 1) el._raf = requestAnimationFrame(step);
    }
    el._raf = requestAnimationFrame(step);
    // safety net: always land on the exact number, even if animation frames are paused
    clearTimeout(el._done);
    el._done = setTimeout(function () { if (el._raf) cancelAnimationFrame(el._raf); el.textContent = formatPounds(target); }, dur + 80);
  }

  var calc = document.getElementById("calc");
  if (calc) {
    var milesEl = document.getElementById("miles");
    var penceEl = document.getElementById("pence");
    var resultEl = document.getElementById("calc-result");
    var noneEl = document.getElementById("calc-none");
    var overRate = overRateFor(new Date());
    var overRateText = document.getElementById("over-rate");
    if (overRateText) overRateText.textContent = Math.round(overRate * 100) + "p";
    var used = false;

    function num(el) {
      var v = parseFloat(String(el.value).replace(",", "."));
      return isFinite(v) ? v : 0;
    }

    function update() {
      var rateEl = calc.querySelector('input[name="rate"]:checked');
      var rate = rateEl ? parseFloat(rateEl.value) : 0.2;
      var x = taxBack(num(milesEl), num(penceEl), rate, overRate);
      if (x < 1) {
        resultEl.hidden = true;
        noneEl.hidden = false;
      } else {
        resultEl.hidden = false;
        noneEl.hidden = true;
        countTo(resultEl.querySelector("strong"), x);
      }
    }

    calc.addEventListener("input", function () {
      update();
      if (!used) { used = true; track("calculator_used"); }
    });
    calc.addEventListener("submit", function (e) { e.preventDefault(); });
    update();
  }

  /* ---------- Soft entrance on scroll ---------- */
  if ("IntersectionObserver" in window) {
    document.documentElement.classList.add("js");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) show(en.target); });
    }, { rootMargin: "0px 0px -8% 0px" });
    // After the entrance animation the block goes back to a plain element (no opacity/transform layer),
    // so a theme or colour change later cannot leave glass cards unpainted in some browsers.
    var show = function (t) {
      if (t.classList.contains("in")) return;
      t.classList.add("in");
      io.unobserve(t);
      setTimeout(function () { t.classList.remove("reveal", "in"); t.style.transitionDelay = ""; }, 1100);
    };
    var revealEls = document.querySelectorAll(".section .card, .steps li, .why li, .faq details, .offer, .section h2");
    revealEls.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(el);
    });
    // safety net: if the observer is slow, reveal anything already on screen when the visitor scrolls
    var check = function () {
      revealEls.forEach(function (el) {
        if (el.classList.contains("reveal") && el.getBoundingClientRect().top < window.innerHeight) show(el);
      });
    };
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("load", check);
    window.addEventListener("hashchange", check);
  }

  /* ---------- Floating glass button (phones) ----------
     Shows once the top of the page has scrolled away, hides while the form is on screen. */
  var dock = document.getElementById("dock");
  var heroEl = document.querySelector(".hero");
  var listEl = document.getElementById("waitlist");
  if (dock && heroEl && listEl && "IntersectionObserver" in window) {
    var heroVisible = true, listVisible = false;
    var dockBtn = dock.querySelector("a");
    var refresh = function () {
      var show = !heroVisible && !listVisible;
      dock.classList.toggle("show", show);
      dock.setAttribute("aria-hidden", show ? "false" : "true");
      if (dockBtn) dockBtn.tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; refresh(); }, { rootMargin: "-200px 0px 0px 0px" }).observe(heroEl);
    new IntersectionObserver(function (e) { listVisible = e[0].isIntersecting; refresh(); }, { rootMargin: "0px 0px -20% 0px" }).observe(listEl);
    refresh();
  }

  /* ---------- Waitlist form ---------- */
  var form = document.getElementById("waitlist-form");
  if (!form) return;

  var params = new URLSearchParams(window.location.search);
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  var emailEl = document.getElementById("email");
  var consentEl = document.getElementById("consent");
  var emailErr = document.getElementById("email-error");
  var consentErr = document.getElementById("consent-error");
  var formErr = document.getElementById("form-error");
  var btn = document.getElementById("submit-btn");
  var thanks = document.getElementById("thanks");

  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  function showThanks() {
    form.hidden = true;
    thanks.hidden = false;
    thanks.focus();
  }

  emailEl.addEventListener("input", function () {
    if (!emailErr.hidden && validEmail(emailEl.value.trim())) {
      emailErr.hidden = true; emailEl.removeAttribute("aria-invalid");
    }
  });
  consentEl.addEventListener("change", function () { if (consentEl.checked) consentErr.hidden = true; });
  form.querySelectorAll('input[name="role"]').forEach(function (r) {
    r.addEventListener("change", function () { document.getElementById("role-error").hidden = true; });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    formErr.hidden = true;

    var ok = true;
    if (!validEmail(emailEl.value.trim())) {
      emailErr.hidden = false; emailEl.setAttribute("aria-invalid", "true"); ok = false;
    }
    var roleEl = form.querySelector('input[name="role"]:checked');
    var roleErr = document.getElementById("role-error");
    if (!roleEl) { roleErr.hidden = false; ok = false; }
    if (!consentEl.checked) { consentErr.hidden = false; ok = false; }
    if (!ok) {
      var first = !emailErr.hidden ? emailEl : (!roleEl ? form.querySelector('input[name="role"]') : consentEl);
      first.focus();
      return;
    }

    // Spam bots fill the hidden field; pretend it worked and send nothing.
    if (document.getElementById("company").value) { showThanks(); return; }

    var data = new FormData(form);
    data.delete("company");
    data.set("email", emailEl.value.trim());
    data.set("consent_text", "I agree to get emails about Tripjot.");
    data.set("signed_up_at", new Date().toISOString());
    data.set("page", window.location.pathname);
    UTM_KEYS.forEach(function (k) { if (params.get(k)) data.set(k, params.get(k)); });

    var role = data.get("role");

    var endpoint = cfg.formEndpoint || "";
    if (endpoint === "auto") {
      var host = window.location.hostname;
      var local = window.location.protocol === "file:" || host === "" || host === "localhost" ||
        host === "127.0.0.1" || /\.(local|localhost|test)$/.test(host);
      endpoint = local ? "" : "/"; // live site: Netlify Forms catches POSTs to "/"
    }

    if (!endpoint) {
      // Test mode: nothing leaves the browser.
      console.warn("[waitlist] Test mode — nothing sent. Would send:", Object.fromEntries(data));
      track("signup", { role: role });
      showThanks();
      return;
    }

    btn.disabled = true;
    btn.textContent = "Sending…";
    fetch(endpoint, {
      method: "POST",
      body: new URLSearchParams(data).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        track("signup", { role: role });
        showThanks();
      })
      .catch(function () {
        formErr.hidden = false;
        btn.disabled = false;
        btn.textContent = "Join the waitlist";
      });
  });
})();
