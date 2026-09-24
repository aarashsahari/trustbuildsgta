  /* ================================================================
     TrustBuildGTA shared site script (every page).
     Vanilla JS, no dependencies. Source: src/site.js, copied into each
     page by tools/build.py. Edit here, then run the build.
     ================================================================ */
  (function () {
    'use strict';

    // Every lead form posts here as JSON. Replace before launch
    // (Formspree, Basin, a CRM webhook, a Make/Zapier hook, etc.).
    var FORM_ENDPOINT = '[FORM_ENDPOINT]';

    var TB = window.TB = window.TB || {};
    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pageStart = Date.now();

    /* ---------- Storage helpers (can throw in private mode or embeds) ---------- */
    function st(kind) { try { return window[kind] || null; } catch (e) { return null; } }
    var ss = st('sessionStorage'), ls = st('localStorage');
    function get(s, k) { try { return s ? s.getItem(k) : null; } catch (e) { return null; } }
    function set(s, k, v) { try { if (s) s.setItem(k, v); } catch (e) { /* ignore */ } }
    function del(s, k) { try { if (s) s.removeItem(k); } catch (e) { /* ignore */ } }

    /* ---------- Analytics: dataLayer events for GTM / GA4 / Google Ads ---------- */
    TB.track = function (event, params) {
      try {
        var o = { event: event };
        for (var k in params) if (Object.prototype.hasOwnProperty.call(params, k)) o[k] = params[k];
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(o);
      } catch (e) { /* never block the page on tracking */ }
    };
    document.addEventListener('click', function (e) {
      var tel = e.target.closest('a[href^="tel:"]');
      if (tel) {
        var sec = tel.closest('section, header, footer, nav');
        TB.track('click_to_call', { location: sec ? (sec.id || sec.className.split(' ')[0]) : 'page' });
      }
    });

    /* ---------- Lead source: remember UTM and click IDs for the session ---------- */
    (function () {
      var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid'];
      var q = new URLSearchParams(window.location.search), found = {}, any = false;
      keys.forEach(function (k) { if (q.get(k)) { found[k] = q.get(k); any = true; } });
      if (any) set(ss, 'tb-attr', JSON.stringify(found));
      if (!get(ss, 'tb-landing')) {
        set(ss, 'tb-landing', window.location.href);
        set(ss, 'tb-ref', document.referrer || '');
      }
    })();
    TB.attribution = function () {
      var o = {};
      try { o = JSON.parse(get(ss, 'tb-attr') || '{}'); } catch (e) { o = {}; }
      o.landing_page = get(ss, 'tb-landing') || window.location.href;
      o.referrer = get(ss, 'tb-ref') || document.referrer || '';
      o.page_url = window.location.href;
      o.page_title = document.title;
      return o;
    };

    /* ---------- Footer year ---------- */
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---------- Hide broken placeholder images gracefully ---------- */
    Array.prototype.forEach.call(document.images, function (img) {
      var mark = function () { img.classList.add('is-broken'); };
      if (img.complete && img.naturalWidth === 0 && img.src.indexOf('data:') !== 0) mark();
      img.addEventListener('error', mark);
    });

    /* ---------- Mobile menu ---------- */
    var toggle = document.querySelector('.menu-toggle');
    var panel = document.getElementById('mobile-menu');
    function setMenu(open) {
      if (!toggle || !panel) return;
      toggle.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
    }
    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        setMenu(toggle.getAttribute('aria-expanded') !== 'true');
      });
      panel.addEventListener('click', function (e) {
        if (e.target.closest('a')) setMenu(false);
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth >= 1100) setMenu(false);
      });
    }

    /* ---------- Desktop dropdowns (disclosure pattern) ---------- */
    var drops = Array.prototype.slice.call(document.querySelectorAll('[data-dropdown]'));
    function closeDrops(except) {
      drops.forEach(function (d) {
        if (d === except) return;
        d.classList.remove('is-open');
        d.querySelector('.nav-drop__btn').setAttribute('aria-expanded', 'false');
      });
    }
    drops.forEach(function (d) {
      var btn = d.querySelector('.nav-drop__btn');
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        closeDrops(d);
        btn.setAttribute('aria-expanded', String(!open));
        d.classList.toggle('is-open', !open);
      });
      d.addEventListener('focusout', function (e) {
        if (!d.contains(e.relatedTarget)) closeDrops();
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-dropdown]')) closeDrops();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var openDrop = drops.filter(function (d) { return d.classList.contains('is-open'); })[0];
      if (openDrop) { closeDrops(); openDrop.querySelector('.nav-drop__btn').focus(); }
      if (panel && panel.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });

    /* ---------- Scroll to an in-page target and move focus to it ---------- */
    function jumpTo(id, instant) {
      var target = document.getElementById(id);
      if (!target) return false;
      target.scrollIntoView({ behavior: (instant || reduceMotion) ? 'auto' : 'smooth', block: 'start' });
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      try { history.replaceState(null, '', '#' + id); } catch (err) { /* sandboxed embed */ }
      return true;
    }
    TB.jumpTo = jumpTo;

    /* ---------- In-page anchors: smooth scroll and move focus ---------- */
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      setMenu(false);
      var id = link.getAttribute('href').slice(1);
      if (id && document.getElementById(id)) {
        e.preventDefault();
        jumpTo(id, false);
      }
    });

    /* ---------- Scroll reveal ----------
       Anything already on screen when the page opens shows immediately, with no
       fade, so a new page never looks like it is still loading. Only content
       further down fades in as it scrolls into view. */
    var reveals = document.querySelectorAll('.reveal');
    var fold = window.innerHeight || document.documentElement.clientHeight;
    reveals = Array.prototype.filter.call(reveals, function (el) {
      if (el.getBoundingClientRect().top < fold) {
        el.classList.add('is-in', 'no-anim');
        return false;
      }
      return true;
    });
    if ('IntersectionObserver' in window && !reduceMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    }

    /* ---------- Prefetch the next page on hover or touch ----------
       Browsers that support speculation rules (Chrome, Edge) prerender from the
       rules in the page head. Everyone else gets a prefetch here, so the next
       page is usually in the cache before the click lands. */
    var supportsRules = window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules');
    var fetched = {};
    function prefetch(a) {
      if (supportsRules || !a || a.target === '_blank') return;
      var url;
      try { url = new URL(a.getAttribute('href'), window.location.href); } catch (err) { return; }
      if (!/^https?:$/.test(url.protocol) || url.origin !== window.location.origin) return;
      var key = url.origin + url.pathname;
      if (fetched[key] || key === window.location.origin + window.location.pathname) return;
      fetched[key] = true;
      var l = document.createElement('link');
      l.rel = 'prefetch';
      l.href = key;
      document.head.appendChild(l);
    }
    ['pointerover', 'touchstart', 'focusin'].forEach(function (type) {
      document.addEventListener(type, function (e) {
        var a = e.target.closest && e.target.closest('a[href$=".html"], a[href*=".html#"]');
        if (a) prefetch(a);
      }, { passive: true });
    });

    /* ---------- FAQ accordion ---------- */
    document.querySelectorAll('.acc__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        document.getElementById(btn.getAttribute('aria-controls')).classList.toggle('is-open', !open);
      });
    });

    /* ================================================================
       PROJECTS: before/after slider, gallery filter, lightbox
       (only runs on pages that have them)
       ================================================================ */

    /* ---------- Before/after slider ---------- */
    var ba = document.getElementById('ba');
    if (ba) {
      var handle = ba.querySelector('.ba__handle');
      var pos = 50;
      var dragging = false;

      function setPos(p) {
        pos = Math.max(0, Math.min(100, p));
        ba.style.setProperty('--pos', pos + '%');
        var r = Math.round(pos);
        handle.setAttribute('aria-valuenow', r);
        handle.setAttribute('aria-valuetext', r + ' percent before photo');
      }
      function fromPointer(e) {
        var rect = ba.getBoundingClientRect();
        setPos(((e.clientX - rect.left) / rect.width) * 100);
      }

      ba.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragging = true;
        ba.setPointerCapture(e.pointerId);
        fromPointer(e);
        handle.focus({ preventScroll: true });
      });
      ba.addEventListener('pointermove', function (e) { if (dragging) fromPointer(e); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) {
        ba.addEventListener(t, function () { dragging = false; });
      });

      handle.addEventListener('keydown', function (e) {
        var step = e.shiftKey ? 10 : 2;
        var map = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step, PageDown: -10, PageUp: 10 };
        if (e.key in map) { setPos(pos + map[e.key]); e.preventDefault(); }
        else if (e.key === 'Home') { setPos(0); e.preventDefault(); }
        else if (e.key === 'End') { setPos(100); e.preventDefault(); }
      });
    }

    /* ---------- Gallery filter ---------- */
    var filterBtns = document.querySelectorAll('.filters button');
    var items = Array.prototype.slice.call(document.querySelectorAll('#gallery li'));
    var galleryStatus = document.getElementById('gallery-status');

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var shown = 0;
        items.forEach(function (li) {
          var match = f === 'all' || li.getAttribute('data-cat') === f;
          li.hidden = !match;
          if (match) shown++;
        });
        if (galleryStatus) galleryStatus.textContent = 'Showing ' + shown + ' ' + (shown === 1 ? 'project' : 'projects');
      });
    });

    /* ---------- Lightbox ---------- */
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lb-img');
    var lbCap = document.getElementById('lb-cap');
    var lbCount = document.getElementById('lb-count');
    var current = 0;
    var opener = null;

    function visibleItems() { return items.filter(function (li) { return !li.hidden; }); }

    function showAt(i) {
      var list = visibleItems();
      if (!list.length) return;
      current = (i + list.length) % list.length;
      var btn = list[current].querySelector('.g-item');
      var thumb = btn.querySelector('img');
      lbImg.src = btn.getAttribute('data-full');
      lbImg.alt = thumb.alt;
      lbCap.textContent = thumb.alt;
      lbCount.textContent = (current + 1) + ' of ' + list.length;
    }
    function openLb(i) {
      opener = document.activeElement;
      showAt(i);
      if (typeof lb.showModal === 'function') lb.showModal();
      else lb.setAttribute('open', '');
      lb.querySelector('[data-lb="close"]').focus();
    }
    function closeLb() {
      if (typeof lb.close === 'function') lb.close();
      else lb.removeAttribute('open');
    }

    if (lb && lbImg) {
      items.forEach(function (li) {
        li.querySelector('.g-item').addEventListener('click', function () {
          openLb(visibleItems().indexOf(li));
        });
      });
      lb.addEventListener('click', function (e) {
        var action = e.target.closest('[data-lb]');
        if (action) {
          var a = action.getAttribute('data-lb');
          if (a === 'close') closeLb();
          if (a === 'prev') showAt(current - 1);
          if (a === 'next') showAt(current + 1);
          return;
        }
        // Click on the dark backdrop area closes it
        if (e.target === lb || e.target.classList.contains('lb__inner') || e.target.classList.contains('lb__fig')) closeLb();
      });
      lb.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { showAt(current - 1); e.preventDefault(); }
        if (e.key === 'ArrowRight') { showAt(current + 1); e.preventDefault(); }
      });
      lb.addEventListener('close', function () {
        if (opener && opener.focus) opener.focus();
      });
      // Simple swipe on touch screens
      var sx = null;
      lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 50) showAt(current + (dx < 0 ? 1 : -1));
        sx = null;
      });
    }

    /* ================================================================
       LEAD FORMS
       ================================================================ */

    /* ---------- Field helpers ---------- */
    TB.digits = function (v) {
      var d = String(v || '').replace(/\D/g, '');
      return (d.length === 11 && d.charAt(0) === '1') ? d.slice(1) : d;
    };
    TB.validPhone = function (v) { return TB.digits(v).length === 10; };
    TB.validEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim()); };
    TB.formatPhone = function (v) {
      var d = TB.digits(v);
      if (d.length !== 10) return v;
      return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
    };
    // Show or clear the error under a field, and flag the field for screen readers
    TB.setError = function (field, msg) {
      if (!field) return;
      var wrap = field.closest('.field, fieldset');
      var err = wrap ? wrap.querySelector('.err') : null;
      if (err) err.textContent = msg || '';
      if (field.setAttribute) field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };
    // Tidy the phone number when the visitor leaves the field
    document.addEventListener('blur', function (e) {
      var f = e.target;
      if (f && f.type === 'tel' && TB.validPhone(f.value)) f.value = TB.formatPhone(f.value);
    }, true);

    /* ---------- Draft saving: a half-filled form survives a reload or a failed send ---------- */
    TB.draft = function (form) {
      var key = 'tb-draft-' + form.id;
      var fields = form.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], select, textarea');
      var saved = {};
      try { saved = JSON.parse(get(ls, key) || '{}'); } catch (e) { saved = {}; }
      Array.prototype.forEach.call(fields, function (f) {
        if (f.name && f.name !== 'tb_hp_field' && saved[f.name] && !f.value) f.value = saved[f.name];
      });
      function save() {
        var o = {};
        Array.prototype.forEach.call(fields, function (f) {
          if (f.name && f.name !== 'tb_hp_field' && f.value) o[f.name] = f.value;
        });
        set(ls, key, JSON.stringify(o));
      }
      form.addEventListener('input', save);
      form.addEventListener('change', save);
      return { clear: function () { del(ls, key); } };
    };

    /* ---------- Send a lead: spam checks, source data, timeout, one retry ---------- */
    TB.submitLead = function (form, data) {
      var hp = form.elements.namedItem('tb_hp_field');
      // Honeypot filled, or submitted faster than a person could: quietly drop it
      if ((hp && hp.value) || Date.now() - pageStart < 1500) return Promise.resolve({ spam: true });

      var payload = {};
      var extra = TB.attribution();
      Object.keys(data).forEach(function (k) { payload[k] = data[k]; });
      Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });
      payload.form_id = form.id;
      payload.submitted_at = new Date().toISOString();

      if (FORM_ENDPOINT.charAt(0) === '[') {
        if (window.console) console.warn('TrustBuildGTA: FORM_ENDPOINT is not set. This lead was NOT sent.', payload);
        return Promise.reject(new Error('endpoint-not-set'));
      }

      function attempt(n) {
        var ctrl = ('AbortController' in window) ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : null;
        return fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
          signal: ctrl ? ctrl.signal : undefined
        }).then(function (res) {
          clearTimeout(timer);
          if (!res.ok) { var err = new Error('HTTP ' + res.status); err.status = res.status; throw err; }
          return res;
        }).catch(function (err) {
          clearTimeout(timer);
          // Retry once on network trouble or a server error, never on a 4xx
          if (n === 0 && !(err.status >= 400 && err.status < 500)) {
            return new Promise(function (r) { setTimeout(r, 1200); }).then(function () { return attempt(1); });
          }
          throw err;
        });
      }

      return attempt(0).then(function () {
        TB.track('generate_lead', {
          form_id: form.id,
          service: data.service || (data.projects || []).join(', '),
          city: data.city || ''
        });
        return { ok: true };
      });
    };

    TB.failMessage = 'That didn\'t go through, and it\'s not your fault. Your details are still here, so try again, or call <a href="tel:+16475137955">(647) 513-7955</a> and we\'ll take them by phone. We pick up any time, 24/7.';

    /* ---------- Short single-step form used on every landing page ---------- */
    document.querySelectorAll('form[data-lead="short"]').forEach(function (form) {
      var draft = TB.draft(form);
      var el = function (n) { return form.elements.namedItem(n); };
      var btn = form.querySelector('[type="submit"]');
      var btnText = btn.textContent;
      var errBox = form.querySelector('.qstatus--error');
      var done = document.getElementById(form.getAttribute('data-done'));
      var started = false;

      form.addEventListener('focusin', function () {
        if (!started) { started = true; TB.track('form_start', { form_id: form.id }); }
      });

      var rules = {
        name: function (v) { return v.trim().length > 1 ? '' : 'Tell us who we\'re talking to.'; },
        phone: function (v) { return TB.validPhone(v) ? '' : 'Enter a 10-digit phone number so we can call you back.'; },
        email: function (v) { return (!v.trim() || TB.validEmail(v)) ? '' : 'That email doesn\'t look right. Leave it blank if you prefer a call.'; },
        city: function (v) { return v ? '' : 'Choose the city the project is in.'; },
        project: function (v) { return v ? '' : 'Choose the type of project.'; }
      };
      function check(name) {
        var f = el(name);
        if (!f || f.type === 'hidden' || !rules[name]) return '';
        var msg = rules[name](f.value);
        TB.setError(f, msg);
        return msg;
      }
      // Validate a field when the visitor leaves it, and clear errors as they fix them
      Object.keys(rules).forEach(function (n) {
        var f = el(n);
        if (!f || f.type === 'hidden') return;
        f.addEventListener('blur', function () { if (f.value) check(n); });
        f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') check(n); });
        f.addEventListener('change', function () { if (f.getAttribute('aria-invalid') === 'true') check(n); });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (btn.disabled) return;
        var order = ['name', 'phone', 'email', 'city', 'project'];
        var firstBad = null;
        order.forEach(function (n) { if (check(n) && !firstBad) firstBad = el(n); });
        if (firstBad) { firstBad.focus(); return; }

        var val = function (n) { var f = el(n); return f ? String(f.value).trim() : ''; };
        var data = {
          service: val('service') || val('project'),
          city: val('city'),
          name: val('name'),
          phone: TB.formatPhone(val('phone')),
          email: val('email'),
          message: val('message')
        };

        btn.disabled = true;
        btn.textContent = 'Sending...';
        errBox.hidden = true;

        TB.submitLead(form, data).then(function () {
          draft.clear();
          form.hidden = true;
          done.hidden = false;
          done.focus();
        }).catch(function () {
          errBox.innerHTML = TB.failMessage;
          errBox.hidden = false;
          TB.track('form_error', { form_id: form.id });
        }).then(function () {
          btn.disabled = false;
          btn.textContent = btnText;
        });
      });
    });
  })();
