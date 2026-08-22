'use strict';

(function () {

  var ENDPOINT_BASE = 'https://intake.epictech.club';

  function clean(value, max) {
    return String(value == null ? '' : value)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  }

  function isValidEmail(val) {
    return /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/.test(val);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function starString(rating) {
    var r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  // google is always an object (never null) with a status field:
  //   "ok"             -> rating/snippets loaded, googleReviewUrl set
  //   "degraded"       -> Google Business Profile is connected (a review URL
  //                       exists) but the rating/snippet fetch failed or
  //                       isn't fully set up yet
  //   "not_configured" -> no Google Business Profile connected at all
  function renderGoogle(google) {
    var summaryEl = document.querySelector('[data-google-summary]');
    var listEl = document.querySelector('[data-google-reviews]');
    var linkEl = document.querySelector('[data-google-link]');
    if (summaryEl) summaryEl.textContent = '';
    if (listEl) listEl.textContent = '';
    // linkEl already has a known-correct href baked into the static HTML
    // (the business's actual Google review link). It's left alone here —
    // never hidden, never cleared — and only upgraded below if the worker
    // returns a different one from a connected Places API integration.

    var status = google && google.status;

    if (!google || status === 'not_configured') {
      if (summaryEl) summaryEl.appendChild(el('p', 'muted', 'Google reviews will appear here once this business’s Google Business Profile is connected. You can leave an on-site review below in the meantime.'));
      return;
    }

    if (status === 'degraded') {
      if (summaryEl) summaryEl.appendChild(el('p', 'muted', 'Star rating and recent reviews are temporarily unavailable.'));
    } else if (summaryEl) {
      var summary = el('div', 'reviews-summary');
      if (typeof google.rating === 'number') {
        summary.appendChild(el('span', 'rating-number', google.rating.toFixed(1)));
        summary.appendChild(el('span', 'stars', starString(google.rating)));
      }
      if (typeof google.totalRatings === 'number') {
        summary.appendChild(el('span', 'muted', 'Based on ' + google.totalRatings + ' Google review' + (google.totalRatings === 1 ? '' : 's')));
      }
      summaryEl.appendChild(summary);
    }

    // If the worker has a live Places API integration configured, prefer
    // its googleReviewUrl over the static fallback already in the HTML.
    if (linkEl && google.googleReviewUrl) {
      linkEl.href = google.googleReviewUrl;
    }

    var list = google.reviews || [];
    if (listEl && list.length) {
      var grid = el('div', 'grid-3');
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        var card = el('div', 'card review-card');
        if (typeof r.rating === 'number') card.appendChild(el('div', 'stars', starString(r.rating)));
        card.appendChild(el('p', null, r.text || ''));
        card.appendChild(el('div', 'review-name', r.author || 'Google user'));
        if (r.relativeTime) card.appendChild(el('div', 'review-date', r.relativeTime));
        grid.appendChild(card);
      }
      listEl.appendChild(grid);
    }
  }

  function renderOnsite(reviews) {
    var container = document.querySelector('[data-onsite-reviews]');
    if (!container) return;
    container.textContent = '';

    if (!reviews || !reviews.length) {
      var empty = el('div', 'card reviews-empty');
      empty.appendChild(el('p', null, 'No on-site reviews yet.'));
      empty.appendChild(el('p', 'muted', 'Worked with us recently? Be the first to leave one below.'));
      container.appendChild(empty);
      return;
    }

    var grid = el('div', 'grid-3');
    for (var i = 0; i < reviews.length; i++) {
      var r = reviews[i];
      var card = el('div', 'card review-card');
      card.appendChild(el('div', 'stars', starString(r.rating)));
      card.appendChild(el('p', null, r.text || ''));
      card.appendChild(el('div', 'review-name', r.name || 'Anonymous'));
      if (r.submittedAt) {
        var d = new Date(r.submittedAt);
        var dateText = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        if (dateText) card.appendChild(el('div', 'review-date', dateText));
      }
      grid.appendChild(card);
    }
    container.appendChild(grid);
  }

  function loadReviews() {
    var summaryEl = document.querySelector('[data-google-summary]');
    var onsiteContainer = document.querySelector('[data-onsite-reviews]');
    if (summaryEl) summaryEl.textContent = '';
    if (summaryEl) summaryEl.appendChild(el('p', 'reviews-loading', 'Loading rating…'));
    if (onsiteContainer) onsiteContainer.textContent = '';
    if (onsiteContainer) onsiteContainer.appendChild(el('p', 'reviews-loading', 'Loading reviews…'));

    fetch(ENDPOINT_BASE + '/reviews', { headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('bad status');
        return res.json();
      })
      .then(function (data) {
        renderGoogle(data && data.google);
        renderOnsite(data && data.onsite);
      })
      .catch(function () {
        // The whole request failed (network/CORS/5xx) — distinct from
        // "not configured yet," which is a normal, expected response state.
        if (summaryEl) {
          summaryEl.textContent = '';
          summaryEl.appendChild(el('p', 'muted', 'Reviews could not be loaded right now. Please refresh the page.'));
        }
        if (onsiteContainer) {
          onsiteContainer.textContent = '';
          var failCard = el('div', 'card reviews-empty');
          failCard.appendChild(el('p', null, 'Reviews could not be loaded right now.'));
          failCard.appendChild(el('p', 'muted', 'Please refresh the page.'));
          onsiteContainer.appendChild(failCard);
        }
      });
  }

  function setStatus(form, msg, kind) {
    var elStatus = form.querySelector('.form-status');
    if (!elStatus) {
      elStatus = document.createElement('p');
      elStatus.className = 'form-status';
      elStatus.setAttribute('role', 'status');
      elStatus.setAttribute('aria-live', 'polite');
      form.insertBefore(elStatus, form.firstChild);
    }
    elStatus.textContent = msg;
    elStatus.setAttribute('data-kind', kind || 'info');
  }

  function resetTurnstile() {
    if (window.turnstile && typeof window.turnstile.reset === 'function') {
      try { window.turnstile.reset(); } catch (e) { /* ignore */ }
    }
  }

  function handleReviewSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var data = new FormData(form);

    if (String(data.get('_hp') || '').length > 0) {
      setStatus(form, 'Thanks for your review.', 'ok');
      return;
    }

    var name = clean(data.get('name'), 100);
    var email = clean(data.get('email'), 254);
    var rating = parseInt(data.get('rating'), 10);
    var text = clean(data.get('text'), 2000);
    var starInput = form.querySelector('.star-input');

    if (name.length < 2) { return fail(form, 'Please enter your name (at least 2 characters).'); }
    if (!isValidEmail(email)) { return fail(form, 'Please enter a valid email address.'); }
    if (!(rating >= 1 && rating <= 5)) {
      if (starInput) starInput.classList.add('invalid');
      return fail(form, 'Please choose a star rating.');
    }
    if (starInput) starInput.classList.remove('invalid');
    if (text.length < 10) { return fail(form, 'Please write a bit more detail (at least 10 characters).'); }

    var tokenEl = form.querySelector('[name="cf-turnstile-response"]');
    var token = tokenEl ? String(tokenEl.value || '') : '';
    if (!token) { return fail(form, 'Please complete the verification box, then submit again.'); }

    var payload = {
      name: name,
      email: email,
      rating: rating,
      text: text,
      sourcePage: location.pathname,
      submittedAt: new Date().toISOString(),
      _hp: '',
      token: token,
      'cf-turnstile-response': token
    };

    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    setStatus(form, 'Sending…', 'info');

    var endpoint = form.getAttribute('data-endpoint') || (ENDPOINT_BASE + '/review-intake');
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      if (res.ok) {
        setStatus(form, 'Thanks! Your review has been submitted and will appear on this page once it is approved.', 'ok');
        var controls = form.querySelectorAll('input, select, textarea, button');
        for (var i = 0; i < controls.length; i++) { controls[i].disabled = true; }
      } else {
        if (btn) btn.disabled = false;
        fail(form, 'Sorry, something went wrong sending your review. Please try again.');
        resetTurnstile();
      }
    })
    .catch(function () {
      if (btn) btn.disabled = false;
      fail(form, 'We could not reach the server. Please check your connection and try again.');
      resetTurnstile();
    });
  }

  function fail(form, msg) {
    setStatus(form, msg, 'error');
  }

  function init() {
    loadReviews();
    var form = document.querySelector('[data-review-form]');
    if (form) form.addEventListener('submit', handleReviewSubmit);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
