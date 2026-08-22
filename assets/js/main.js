'use strict';

(function () {

  // ── Navigation toggle ──────────────────────────────────────────────────
  var menuButton = document.querySelector('[data-menu-button]');
  var navLinks   = document.querySelector('[data-nav-links]');

  function closeMenu(returnFocus) {
    if (!navLinks || !navLinks.classList.contains('open')) return;
    navLinks.classList.remove('open');
    if (menuButton) {
      menuButton.setAttribute('aria-expanded', 'false');
      if (returnFocus) menuButton.focus();
    }
  }

  if (menuButton && navLinks) {
    menuButton.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });

    // Escape closes the menu and returns focus to the toggle button.
    navLinks.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' || event.key === 'Esc') {
        closeMenu(true);
      }
    });

    // Selecting a link closes the menu (mobile only has room for one open
    // panel at a time; leaving it open after navigation is disorienting).
    navLinks.addEventListener('click', function (event) {
      if (event.target && event.target.tagName === 'A') {
        closeMenu(false);
      }
    });
  }

  // ── Active nav link ────────────────────────────────────────────────────
  // Marks the current page's nav link with aria-current="page" without
  // needing to hand-edit every page's markup.
  function normalizePath(path) {
    return path.replace(/index\.html$/, '') || '/';
  }

  if (navLinks) {
    var here = normalizePath(location.pathname);
    var links = navLinks.querySelectorAll('a[href]');
    for (var li = 0; li < links.length; li++) {
      if (normalizePath(links[li].pathname) === here) {
        links[li].setAttribute('aria-current', 'page');
      }
    }
  }

  // ── Footer year ────────────────────────────────────────────────────────
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  function clean(value, max) {
    return String(value == null ? '' : value)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[<>`\\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  }

  function isValidEmail(val) {
    return /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/.test(val);
  }

  function setStatus(form, msg, kind) {
    var el = form.querySelector('.form-status');
    if (!el) {
      el = document.createElement('p');
      el.className = 'form-status';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      form.insertBefore(el, form.firstChild);
    }
    el.textContent = msg;
    el.setAttribute('data-kind', kind || 'info');
  }

  function clearStatus(form) {
    var el = form.querySelector('.form-status');
    if (el) el.textContent = '';
  }

  // ── Secure intake submission (fetch -> Cloudflare Worker) ──────────────
  var DEFAULT_ENDPOINT = 'https://intake.epictech.club/lead-intake';
  var forms = document.querySelectorAll('[data-intake-form]');
  for (var f = 0; f < forms.length; f++) {
    forms[f].addEventListener('submit', handleSubmit);
  }

  function handleSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    clearStatus(form);

    var data = new FormData(form);

    // Honeypot: if filled, silently pretend success (do not hit the network).
    if (String(data.get('_hp') || '').length > 0) {
      succeed(form);
      return;
    }

    var name    = clean(data.get('name'),     80);
    var biz     = clean(data.get('business'), 80);
    var email   = clean(data.get('email'),   120);
    var phone   = clean(data.get('phone'),    30);
    var service = clean(data.get('service'),  80);
    var message = clean(data.get('message'), 900);

    // Client-side validation for UX. The Worker validates again server-side.
    if (name.length < 1)      { return fail(form, 'Please enter your name.'); }
    if (!isValidEmail(email)) { return fail(form, 'Please enter a valid email address.'); }
    if (!service || service === 'Select what you need help with') {
      return fail(form, 'Please select a service so we can reply usefully.');
    }
    if (message.length < 20)  { return fail(form, 'Please describe what you need help with (at least 20 characters).'); }

    // Cloudflare Turnstile token (hidden input injected by the widget).
    var tokenEl = form.querySelector('[name="cf-turnstile-response"]');
    var token = tokenEl ? String(tokenEl.value || '') : '';
    if (!token) {
      return fail(form, 'Please complete the verification box, then submit again.');
    }

    var payload = {
      name: name,
      business: biz,
      businessName: biz,
      email: email,
      phone: phone,
      service: service,
      message: message,
      sourcePage: location.pathname,
      submittedAt: new Date().toISOString(),
      _hp: '',
      token: token,
      'cf-turnstile-response': token
    };

    var endpoint = form.getAttribute('data-endpoint') || DEFAULT_ENDPOINT;
    var btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; }
    setStatus(form, 'Sending…', 'info');

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      if (res.ok) {
        succeed(form);
      } else {
        reEnable(btn);
        fail(form, 'Sorry, something went wrong sending your message. Please try again, or email info@epictech.club.');
        resetTurnstile();
      }
    })
    .catch(function () {
      reEnable(btn);
      fail(form, 'We could not reach the server. Please check your connection and try again.');
      resetTurnstile();
    });
  }

  function succeed(form) {
    // Replace the form body with a clear confirmation.
    setStatus(form, 'Sent. Your message was received successfully.', 'ok');
    var controls = form.querySelectorAll('input, select, textarea, button');
    for (var i = 0; i < controls.length; i++) { controls[i].disabled = true; }
  }

  function fail(form, msg) {
    setStatus(form, msg, 'error');
  }

  function reEnable(btn) {
    if (btn) { btn.disabled = false; }
  }

  function resetTurnstile() {
    if (window.turnstile && typeof window.turnstile.reset === 'function') {
      try { window.turnstile.reset(); } catch (e) { /* ignore */ }
    }
  }

})();
