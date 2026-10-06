(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const body = document.body;
  const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motionMedia.matches;

  /* ---------------- Menu ---------------- */
  const menu = $('.menu-panel');
  const menuButton = $('.menu-button');
  const menuClose = $('.menu-close');
  let lastMenuTrigger = null;

  function focusableInside(root) {
    return $$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])', root)
      .filter(el => !el.hidden && el.offsetParent !== null);
  }

  function setMenu(open, { restoreFocus = true } = {}) {
    if (!menu || !menuButton) return;
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menuButton.setAttribute('aria-expanded', String(open));
    body.classList.toggle('menu-open', open);

    if (open) {
      lastMenuTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : menuButton;
      window.setTimeout(() => menuClose?.focus(), 0);
    } else if (restoreFocus) {
      const target = lastMenuTrigger && document.contains(lastMenuTrigger) ? lastMenuTrigger : menuButton;
      target?.focus();
    }
  }

  function trapMenuFocus(event) {
    if (!menu?.classList.contains('open') || event.key !== 'Tab') return;
    const list = focusableInside(menu);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function initMenu() {
    if (!menu || !menuButton || !menuClose) return;
    menuButton.addEventListener('click', () => setMenu(true));
    menuClose.addEventListener('click', () => setMenu(false));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.classList.contains('open')) setMenu(false);
      trapMenuFocus(event);
    });
  }

  /* ---------------- Language ---------------- */
  function internalUrl(path, params = {}) {
    const url = new URL(path, location.href);
    if (typeof LANGUAGE_CONFIG !== 'undefined' && typeof CURRENT_LANG !== 'undefined') {
      url.searchParams.set('lang', LANGUAGE_CONFIG[CURRENT_LANG]?.query || 'zh');
    }
    if (typeof isKioskMode === 'function' && isKioskMode()) url.searchParams.set('kiosk', '1');
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
    return `${url.pathname.split('/').pop()}${url.search}${url.hash}`;
  }

  function updateCollectionLinks() {
    const main = $('#bookListLink');
    if (main) main.href = internalUrl('book-list.html');
    $$('[data-collection-link]').forEach(link => {
      link.href = internalUrl('book-list.html', { filter: link.dataset.collectionLink });
    });
  }

  function renderBookTitle(el) {
    const original = el.dataset.bookTitle || '';
    if (!original) return;
    if (typeof CURRENT_LANG === 'undefined' || CURRENT_LANG === 'zh-Hant' || typeof getBookDisplayInfo !== 'function') {
      el.textContent = `《${original}》`;
      return;
    }
    const info = getBookDisplayInfo(original, CURRENT_LANG);
    const title = info?.title || original;
    const label = typeof bookTranslationLabel === 'function' ? bookTranslationLabel(info?.type, CURRENT_LANG) : '';
    el.textContent = '';
    const main = document.createElement('span');
    main.className = 'book-title-display';
    main.textContent = title;
    el.append(main);
    if (label) {
      const note = document.createElement('span');
      note.className = 'book-title-note-inline';
      note.textContent = label;
      el.append(note);
    }
    if (title !== original) {
      const source = document.createElement('span');
      source.className = 'book-title-original-inline';
      source.lang = 'zh-Hant';
      source.textContent = `《${original}》`;
      el.append(source);
    }
  }

  function updateBookTitles() {
    $$('[data-book-title]').forEach(renderBookTitle);
  }

  function updateFeedbackForm() {
    const forms = window.FEEDBACK_FORMS || {};
    const config = forms[CURRENT_LANG] || forms['zh-Hant'] || {};
    const link = $('#feedbackFormLink');
    const qr = $('#feedbackQr');
    const placeholder = $('#feedbackQrPlaceholder');

    if (link) {
      if (config.url) {
        link.href = config.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-disabled', 'false');
      } else {
        link.removeAttribute('href');
        link.removeAttribute('target');
        link.removeAttribute('rel');
        link.setAttribute('aria-disabled', 'true');
      }
    }

    if (qr && placeholder) {
      const showPlaceholder = () => {
        qr.hidden = true;
        qr.removeAttribute('src');
        placeholder.hidden = false;
      };
      if (config.qr) {
        qr.onload = () => {
          qr.hidden = false;
          placeholder.hidden = true;
        };
        qr.onerror = showPlaceholder;
        qr.src = config.qr;
        if (qr.complete && qr.naturalWidth > 0) {
          qr.hidden = false;
          placeholder.hidden = true;
        }
      } else {
        showPlaceholder();
      }
    }
  }

  function initLanguage() {
    $$('.lang-btn').forEach(btn => btn.addEventListener('click', () => applyLanguage(btn.dataset.lang)));
    applyLanguage(CURRENT_LANG, { syncUrl: false });
    updateCollectionLinks();
    updateBookTitles();
    updateFeedbackForm();
    window.addEventListener('languagechange', () => {
      updateCollectionLinks();
      updateBookTitles();
      updateFeedbackForm();
      rerenderLanguageSensitiveUI();
    });
  }

  /* ---------------- Reveal / header theme ---------------- */
  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    items.forEach(el => io.observe(el));
  }

  function initHeaderTheme() {
    const sections = $$('[data-header-theme="light"]');
    if (!sections.length) return;
    const active = new Set();
    const sync = () => body.classList.toggle('header-dark', active.size > 0);
    if (!('IntersectionObserver' in window)) {
      const fallback = () => {
        const y = window.scrollY + 110;
        body.classList.toggle('header-dark', sections.some(s => y >= s.offsetTop && y < s.offsetTop + s.offsetHeight));
      };
      window.addEventListener('scroll', fallback, { passive: true });
      window.addEventListener('resize', fallback);
      fallback();
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? active.add(entry.target) : active.delete(entry.target));
      sync();
    }, { rootMargin: '-16% 0px -76% 0px', threshold: 0 });
    sections.forEach(s => io.observe(s));
  }

  /* ---------------- Images / featured covers ---------------- */
  function initImageFallbacks() {
    $$('[data-dahhsian-image]').forEach(img => {
      const fail = () => {
        img.hidden = true;
        img.closest('.dahhsian-card,.residents-hero')?.classList.add('image-missing');
      };
      img.addEventListener('error', fail);
      if (img.complete && img.naturalWidth === 0) fail();
    });

    $$('.work-spotlight-cover').forEach(wrap => {
      const img = $('img', wrap);
      if (!img) return;
      const loaded = () => wrap.classList.add('loaded');
      const failed = () => {
        wrap.classList.remove('loaded');
        img.hidden = true;
      };
      img.addEventListener('load', loaded, { once: true });
      img.addEventListener('error', failed, { once: true });
      if (img.complete) img.naturalWidth ? loaded() : failed();
    });
  }

  /* ---------------- Dah Hsian close-up ---------------- */
  const hotspotMeta = {
    lake: { index: '01', titleKey: 'dahhsian.lakeTitle' },
    glass: { index: '02', titleKey: 'dahhsian.glassTitle' },
    building: { index: '03', titleKey: 'dahhsian.buildingTitle' },
    shore: { index: '04', titleKey: 'dahhsian.shoreTitle' }
  };
  let activeHotspot = '';

  function renderHotspots() {
    $$('.dahhsian-card').forEach(card => {
      const key = card.dataset.hotspot;
      const open = key === activeHotspot;
      card.classList.toggle('active', open);
      card.setAttribute('aria-pressed', String(open));
      card.setAttribute('aria-expanded', String(open));

      const panel = $('.dahhsian-card-detail', card);
      if (!panel) return;
      panel.setAttribute('aria-hidden', String(!open));

      const title = $('.dahhsian-card-detail-title', panel);
      const note = $('.dahhsian-card-detail-note', panel);
      if (title) title.textContent = t(hotspotMeta[key]?.titleKey || '');
      if (note && typeof HOTSPOT_I18N !== 'undefined') {
        note.textContent = HOTSPOT_I18N[CURRENT_LANG]?.[key] || HOTSPOT_I18N['zh-Hant']?.[key] || '';
      }
    });
  }

  function showHotspot(key) {
    if (!hotspotMeta[key]) return;
    activeHotspot = activeHotspot === key ? '' : key;
    renderHotspots();
  }

  function initHotspots() {
    $$('.dahhsian-card').forEach(card => {
      card.setAttribute('aria-pressed', 'false');
      card.setAttribute('aria-expanded', 'false');
      card.addEventListener('click', () => showHotspot(card.dataset.hotspot));
    });
    renderHotspots();
  }

  /* ---------------- NCCU report interactions ---------------- */
  const campusQuizState = {};
  let campusFutureChoice = '';

  function answerCampusQuiz(card, button) {
    const key = card.dataset.campusQuiz;
    const selected = button.dataset.option;
    const correct = card.dataset.correct;
    campusQuizState[key] = selected;
    $$('.nccu-quiz-options button', card).forEach(btn => {
      const isSelected = btn === button;
      btn.classList.toggle('is-selected', isSelected);
      btn.classList.toggle('is-correct', btn.dataset.option === correct);
      btn.setAttribute('aria-pressed', String(isSelected));
    });
    const reveal = $('.nccu-quiz-reveal', card);
    if (reveal) reveal.hidden = false;
    card.classList.add('answered');
  }

  function initCampusQuiz() {
    $$('[data-campus-quiz]').forEach(card => {
      $$('.nccu-quiz-options button', card).forEach(btn => {
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => answerCampusQuiz(card, btn));
      });
    });
    const future = $('[data-campus-future]');
    if (future) {
      $$('.nccu-future-options button', future).forEach(btn => {
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => {
          campusFutureChoice = btn.dataset.option || '';
          $$('.nccu-future-options button', future).forEach(b => {
            const on = b === btn;
            b.classList.toggle('is-selected', on);
            b.setAttribute('aria-pressed', String(on));
          });
          const reveal = $('.nccu-future-reveal', future);
          if (reveal) reveal.hidden = false;
        });
      });
    }
  }

  function resetCampusQuiz() {
    Object.keys(campusQuizState).forEach(k => delete campusQuizState[k]);
    campusFutureChoice = '';
    $$('[data-campus-quiz]').forEach(card => {
      card.classList.remove('answered');
      $$('.nccu-quiz-options button', card).forEach(btn => {
        btn.classList.remove('is-selected', 'is-correct');
        btn.setAttribute('aria-pressed', 'false');
      });
      const reveal = $('.nccu-quiz-reveal', card);
      if (reveal) reveal.hidden = true;
    });
    const future = $('[data-campus-future]');
    if (future) {
      $$('.nccu-future-options button', future).forEach(btn => {
        btn.classList.remove('is-selected');
        btn.setAttribute('aria-pressed', 'false');
      });
      const reveal = $('.nccu-future-reveal', future);
      if (reveal) reveal.hidden = true;
    }
  }

  /* ---------------- Five trade-off questions ---------------- */
  const choiceState = {};
  const choiceOrder = ['comfort', 'glass', 'convenience', 'technology', 'future'];
  const choiceQuestionKeys = {
    comfort: 'choice.q1.title', glass: 'choice.q2.title', convenience: 'choice.q3.title', technology: 'choice.q4.title', future: 'choice.q5.title'
  };
  const choiceExploreMeta = {
    comfort: { href: '#dahhsian' }, glass: { href: '#dahhsian' }, convenience: { href: '#consume' }, technology: { href: '#future' }, future: { href: '#future' }
  };
  const integrativeChoiceMap = {
    comfort: ['c'], glass: ['b', 'c'], convenience: ['c'], technology: ['c'], future: ['c']
  };

  function renderChoiceFeedback(card, key, option) {
    const box = $('.choice-feedback', card);
    if (!box) return;
    const copy = CHOICE_FEEDBACK_I18N?.[CURRENT_LANG]?.[key]?.[option] || CHOICE_FEEDBACK_I18N?.['zh-Hant']?.[key]?.[option] || t('choice.feedback');
    box.innerHTML = '';
    const label = document.createElement('span');
    label.textContent = t('choice.reflectionLabel');
    const p = document.createElement('p');
    p.textContent = copy;
    box.append(label, p);
    const meta = choiceExploreMeta[key];
    if (meta) {
      const a = document.createElement('a');
      a.href = meta.href;
      a.textContent = t('choice.exploreRelated');
      box.append(a);
    }
  }

  function renderChoiceSummary() {
    const count = Object.keys(choiceState).length;
    const progress = $('#choiceProgress');
    const bar = $('#choiceProgressBar');
    const summary = $('#choiceSummary');
    const list = $('#choiceSummaryList');
    if (progress) progress.textContent = `${count} / ${choiceOrder.length}`;
    if (bar) bar.style.width = `${count / choiceOrder.length * 100}%`;
    if (!summary || !list) return;
    if (count < choiceOrder.length) {
      summary.hidden = true;
      return;
    }
    list.innerHTML = '';
    choiceOrder.forEach(key => {
      const row = document.createElement('div');
      row.className = 'choice-summary-row';
      const q = document.createElement('b');
      q.textContent = t(choiceQuestionKeys[key]);
      const a = document.createElement('span');
      a.textContent = choiceState[key]?.labelKey ? t(choiceState[key].labelKey) : '';
      row.append(q, a);
      list.append(row);
    });
    const integrateCount = choiceOrder.reduce((n, key) => n + (integrativeChoiceMap[key]?.includes(choiceState[key]?.option) ? 1 : 0), 0);
    const insight = $('#choiceInsightText');
    if (insight) insight.textContent = t(integrateCount >= 3 ? 'choice.insightIntegrate' : 'choice.insightPriority');
    summary.hidden = false;
  }

  function selectChoice(card, button, { scrollToSummary = true } = {}) {
    const key = card.dataset.choice;
    const wasCompleteBefore = Object.keys(choiceState).length === choiceOrder.length;
    $$('.choice-actions button', card).forEach(btn => {
      const on = btn === button;
      btn.classList.toggle('selected', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    card.classList.add('answered');
    choiceState[key] = { option: button.dataset.option, labelKey: button.dataset.i18n || '' };
    renderChoiceFeedback(card, key, button.dataset.option);
    renderChoiceSummary();
    const isCompleteNow = Object.keys(choiceState).length === choiceOrder.length;
    const summary = $('#choiceSummary');
    if (!wasCompleteBefore && isCompleteNow && scrollToSummary && summary && !summary.hidden) {
      window.setTimeout(() => summary.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 180);
    }
  }

  function resetChoices({ scrollToTop = false } = {}) {
    Object.keys(choiceState).forEach(k => delete choiceState[k]);
    $$('.choice-card').forEach(card => {
      card.classList.remove('answered');
      $$('.choice-actions button', card).forEach(btn => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-pressed', 'false');
      });
      const feedback = $('.choice-feedback', card);
      if (feedback) feedback.innerHTML = '';
    });
    const summary = $('#choiceSummary');
    if (summary) summary.hidden = true;
    renderChoiceSummary();
    if (scrollToTop) $('#choice')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  function initChoices() {
    $$('.choice-card').forEach(card => {
      $$('.choice-actions button', card).forEach(btn => {
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => selectChoice(card, btn));
      });
    });
    $('#choiceReset')?.addEventListener('click', () => resetChoices({ scrollToTop: true }));
    renderChoiceSummary();
  }

  function rerenderLanguageSensitiveUI() {
    renderHotspots();
    choiceOrder.forEach(key => {
      const current = choiceState[key];
      if (!current) return;
      const card = $(`.choice-card[data-choice="${key}"]`);
      if (card) renderChoiceFeedback(card, key, current.option);
    });
    renderChoiceSummary();
  }

  /* ---------------- Hero motion ---------------- */
  function initHeroParallax() {
    const hero = $('.hero');
    const copy = $('.hero-copy');
    if (!hero || reduced) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const limit = hero.offsetHeight || window.innerHeight;
      if (y >= limit) return;
      const p = Math.min(y, window.innerHeight) / window.innerHeight;
      if (copy) {
        copy.style.opacity = String(Math.max(.18, 1 - p * 1.3));
        copy.style.transform = `translateY(${-24 * p}px)`;
      }
      hero.style.setProperty('--hero-scale', String(1 + Math.min(.02, p * .02)));
    };
    const request = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    request();
  }

  /* ---------------- Kiosk reset ---------------- */
  function resetForKiosk() {
    setMenu(false, { restoreFocus: false });
    if (typeof applyLanguage === 'function' && CURRENT_LANG !== 'zh-Hant') applyLanguage('zh-Hant');
    resetCampusQuiz();
    resetChoices();
    activeHotspot = '';
    renderHotspots();
    $$('details[open]').forEach(d => { d.open = false; });
    if (document.activeElement instanceof HTMLElement && document.activeElement !== body) document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }

  function initIdleReset() {
    if (typeof isKioskMode !== 'function' || !isKioskMode()) return;
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(resetForKiosk, 120000);
    };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(evt => window.addEventListener(evt, schedule, { passive: true }));
    schedule();
  }

  function initMotionPreference() {
    const update = event => { reduced = event.matches; };
    if (motionMedia.addEventListener) motionMedia.addEventListener('change', update);
    else if (motionMedia.addListener) motionMedia.addListener(update);
  }

  function init() {
    initMotionPreference();
    initMenu();
    initLanguage();
    initReveal();
    initHeaderTheme();
    initImageFallbacks();
    initHotspots();
    initCampusQuiz();
    initChoices();
    initHeroParallax();
    initIdleReset();
  }

  init();
})();
