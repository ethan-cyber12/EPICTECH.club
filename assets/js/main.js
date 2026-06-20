'use strict';

(function () {

  var menuButton = document.querySelector('[data-menu-button]');
  var navLinks   = document.querySelector('[data-nav-links]');
  if (menuButton && navLinks) {
    menuButton.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  var yearEl = document.querySelector('[data-year]');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

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

  function showError(form, msg) {
    var el = form.querySelector('.form-error');
    if (!el) {
      el = document.createElement('p');
      el.className = 'form-error';
      el.setAttribute('role', 'alert');
      el.setAttribute('aria-live', 'assertive');
      form.insertBefore(el, form.firstChild);
    }
    el.textContent = msg;
  }

  function clearError(form) {
    var el = form.querySelector('.form-error');
    if (el) el.parentNode.removeChild(el);
  }

  function repeat(char, n) {
    var s = '';
    for (var i = 0; i < n; i++) s += char;
    return s;
  }

  var forms = document.querySelectorAll('[data-mailto-form]');
  for (var f = 0; f < forms.length; f++) {
    forms[f].addEventListener('submit', handleSubmit);
  }

  function handleSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    clearError(form);

    var data = new FormData(form);

    if (String(data.get('_hp') || '').length > 0) {
      return;
    }

    var name    = clean(data.get('name'),     80);
    var biz     = clean(data.get('business'), 80);
    var email   = clean(data.get('email'),   120);
    var phone   = clean(data.get('phone'),    30);
    var service = clean(data.get('service'),  80);
    var message = clean(data.get('message'), 900);

    if (name.length < 1) {
      showError(form, 'Please enter your name.');
      return;
    }
    if (!isValidEmail(email)) {
      showError(form, 'Please enter a valid email address.');
      return;
    }
    if (!service || service === 'Select what you need help with') {
      showError(form, 'Please select a service so I can reply usefully.');
      return;
    }
    if (message.length < 20) {
      showError(form, 'Please describe what you need help with (at least 20 characters).');
      return;
    }

    var divider = repeat('━', 38);
    var dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    var crmData = {
      name: name, email: email, business: biz, phone: phone,
      service: service, message: message,
      dateReceived: new Date().toISOString()
    };
    var crmJson = JSON.stringify(crmData);

    var bodyLines = [
      'EPIC TECH — New Inquiry',
      divider,
      'Service:   ' + service,
      'Name:      ' + name,
      biz   ? 'Business:  ' + biz   : null,
      'Email:     ' + email,
      phone ? 'Phone:     ' + phone : null,
      '',
      'Message:',
      message,
      '',
      divider,
      'Received:  ' + dateStr,
      '',
      '─ Add to CRM ' + repeat('─', 26),
      'Open the EPIC TECH CRM, go to Leads → Import, and paste:',
      crmJson,
      repeat('─', 38),
    ];

    var body    = bodyLines.filter(function (l) { return l !== null; }).join('\n');
    var subject = 'EPIC TECH request: ' + (service || 'General inquiry');

    window.location.href = 'mailto:info@epictech.club'
      + '?subject=' + encodeURIComponent(subject)
      + '&body='    + encodeURIComponent(body);
  }

})();
