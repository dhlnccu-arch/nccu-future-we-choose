(() => {
  const menu = document.querySelector('.menu-panel');
  const menuButton = document.querySelector('.menu-button');
  const menuClose = document.querySelector('.menu-close');
  const body = document.body;
  const supportsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const DEFAULT_LANG = 'zh-Hant';
  const DEFAULT_HOTSPOT = 'lake';
  let reduced = supportsReducedMotion.matches;
  let lastMenuTrigger = null;

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function getFocusable(root) {
    return $$(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      root
    ).filter(el => !el.hidden && el.offsetParent !== null);
  }

  function setMenu(open, { restoreFocus = true } = {}) {
    if (!menu || !menuButton) return;
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menuButton.setAttribute('aria-expanded', String(open));
    body.style.overflow = open ? 'hidden' : '';

    if (open) {
      lastMenuTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : menuButton;
      setTimeout(() => menuClose?.focus(), 0);
      return;
    }

    if (restoreFocus) {
      const target = lastMenuTrigger && document.contains(lastMenuTrigger) ? lastMenuTrigger : menuButton;
      target?.focus();
    }
  }

  function trapMenuFocus(event) {
    if (!menu?.classList.contains('open') || event.key !== 'Tab') return;
    const focusable = getFocusable(menu);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function updateBookListLink() {
    const link = document.getElementById('bookListLink');
    if (!link || typeof LANGUAGE_CONFIG === 'undefined') return;
    const q = LANGUAGE_CONFIG[CURRENT_LANG]?.query || 'zh';
    const url = new URL('book-list.html', location.href);
    url.searchParams.set('lang', q);
    if (new URLSearchParams(location.search).get('kiosk') === '1') url.searchParams.set('kiosk', '1');
    link.href = url.pathname.split('/').pop() + url.search;
  }

  function initMenu() {
    if (!menu || !menuButton || !menuClose) return;
    menuButton.addEventListener('click', () => setMenu(true));
    menuClose.addEventListener('click', () => setMenu(false));
    $$('a', menu).forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.classList.contains('open')) setMenu(false);
    });
    document.addEventListener('keydown', trapMenuFocus);
  }

  function initLanguage() {
    $$('.lang-btn').forEach(btn => btn.addEventListener('click', () => applyLanguage(btn.dataset.lang)));
    applyLanguage(CURRENT_LANG, { syncUrl: false });
    updateBookListLink();
    window.addEventListener('languagechange', updateBookListLink);
  }

  function initReveal() {
    const reveals = $$('.reveal');
    if (!reveals.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('in'));
      return;
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });

    reveals.forEach(el => io.observe(el));
  }

  function initHeaderTheme() {
    const themedSections = $$('[data-header-theme="light"]');
    if (!themedSections.length) return;

    const syncTheme = active => body.classList.toggle('header-dark', active);

    if (!('IntersectionObserver' in window)) {
      const onScroll = () => {
        const midpoint = window.scrollY + 120;
        const active = themedSections.some(section => {
          const top = section.offsetTop;
          const bottom = top + section.offsetHeight;
          return midpoint >= top && midpoint < bottom;
        });
        syncTheme(active);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      onScroll();
      return;
    }

    const activeSet = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) activeSet.add(entry.target);
        else activeSet.delete(entry.target);
      });
      syncTheme(activeSet.size > 0);
    }, { rootMargin: '-18% 0px -72% 0px', threshold: 0 });

    themedSections.forEach(section => io.observe(section));
  }

  const hotspotNote = $('.hotspot-note');
  const hotspotTitle = $('.hotspot-title');
  const hotspotIndex = $('.hotspot-index');
  const hotspotMeta = {
    lake: { index: '01', titleKey: 'dahhsian.lakeTitle' },
    glass: { index: '02', titleKey: 'dahhsian.glassTitle' },
    building: { index: '03', titleKey: 'dahhsian.buildingTitle' },
    shore: { index: '04', titleKey: 'dahhsian.shoreTitle' }
  };
  let activeHotspot = DEFAULT_HOTSPOT;

  function showHotspot(key) {
    if (!hotspotMeta[key]) return;
    activeHotspot = key;
    $$('.dahhsian-card').forEach(card => {
      const active = card.dataset.hotspot === key;
      card.classList.toggle('active', active);
      card.setAttribute('aria-pressed', String(active));
    });
    if (hotspotIndex) hotspotIndex.textContent = hotspotMeta[key].index;
    if (hotspotTitle) hotspotTitle.textContent = t(hotspotMeta[key].titleKey);
    if (hotspotNote && typeof HOTSPOT_I18N !== 'undefined') {
      hotspotNote.textContent = HOTSPOT_I18N[CURRENT_LANG]?.[key] || HOTSPOT_I18N['zh-Hant']?.[key] || '';
    }
  }

  function initHotspots() {
    $$('.dahhsian-card').forEach(card => {
      card.setAttribute('aria-pressed', 'false');
      card.addEventListener('click', () => showHotspot(card.dataset.hotspot));
    });
    showHotspot(activeHotspot);
  }

  function initImageFallbacks() {
    $$('[data-dahhsian-image]').forEach(img => {
      const handleError = () => {
        img.hidden = true;
        const host = img.closest('.dahhsian-card,.residents-hero');
        if (host) host.classList.add('image-missing');
        console.warn('Dah Hsian image not found:', img.getAttribute('src'));
      };
      img.addEventListener('error', handleError);
      if (img.complete && img.naturalWidth === 0) handleError();
    });
  }

  const choiceState = {};
  const choiceOrder = ['comfort', 'glass', 'convenience', 'technology', 'future'];
  const choiceQuestionKeys = {
    comfort: 'choice.q1.title',
    glass: 'choice.q2.title',
    convenience: 'choice.q3.title',
    technology: 'choice.q4.title',
    future: 'choice.q5.title'
  };
  const choiceExploreMeta = {
    comfort: { href: '#dahhsian' },
    glass: { href: '#dahhsian' },
    convenience: { href: '#consume' },
    technology: { href: '#future' },
    future: { href: '#future' }
  };
  const integrativeChoiceMap = {
    comfort: ['c'],
    glass: ['b', 'c'],
    convenience: ['c'],
    technology: ['c'],
    future: ['c']
  };
  const choiceProgress = document.getElementById('choiceProgress');
  const choiceProgressBar = document.getElementById('choiceProgressBar');
  const choiceSummary = document.getElementById('choiceSummary');
  const choiceSummaryList = document.getElementById('choiceSummaryList');
  const choiceInsightText = document.getElementById('choiceInsightText');
  const choiceReset = document.getElementById('choiceReset');

  function renderChoiceFeedback(card, key, option) {
    const box = $('.choice-feedback', card);
    if (!box) return;
    const copy = CHOICE_FEEDBACK_I18N?.[CURRENT_LANG]?.[key]?.[option] || t('choice.feedback');
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
    if (choiceProgress) choiceProgress.textContent = `${count} / ${choiceOrder.length}`;
    if (choiceProgressBar) choiceProgressBar.style.width = `${(count / choiceOrder.length) * 100}%`;
    if (!choiceSummary || !choiceSummaryList) return;
    if (count < choiceOrder.length) {
      choiceSummary.hidden = true;
      return;
    }

    choiceSummaryList.innerHTML = '';
    choiceOrder.forEach(key => {
      const row = document.createElement('div');
      row.className = 'choice-summary-row';
      const q = document.createElement('b');
      q.textContent = t(choiceQuestionKeys[key]);
      const a = document.createElement('span');
      const labelKey = choiceState[key]?.labelKey || '';
      a.textContent = labelKey ? t(labelKey) : '';
      row.append(q, a);
      choiceSummaryList.append(row);
    });

    const integrateCount = choiceOrder.reduce((n, key) => {
      const option = choiceState[key]?.option;
      return n + (integrativeChoiceMap[key]?.includes(option) ? 1 : 0);
    }, 0);
    if (choiceInsightText) {
      choiceInsightText.textContent = t(integrateCount >= 3 ? 'choice.insightIntegrate' : 'choice.insightPriority');
    }
    choiceSummary.hidden = false;
  }

  function selectChoice(card, btn, { scrollToSummary = true } = {}) {
    const key = card.dataset.choice;
    const option = btn.dataset.option;
    const labelKey = btn.dataset.i18n || '';
    const wasCompleteBefore = Object.keys(choiceState).length === choiceOrder.length;

    $$('.choice-actions button', card).forEach(button => {
      const selected = button === btn;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    card.classList.add('answered');
    choiceState[key] = { option, labelKey };
    renderChoiceFeedback(card, key, option);
    renderChoiceSummary();

    const isCompleteNow = Object.keys(choiceState).length === choiceOrder.length;
    if (!wasCompleteBefore && isCompleteNow && scrollToSummary && choiceSummary && !choiceSummary.hidden) {
      setTimeout(() => {
        choiceSummary.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }, 180);
    }
  }

  function resetChoices({ scrollToTop = false } = {}) {
    Object.keys(choiceState).forEach(key => delete choiceState[key]);
    $$('.choice-card').forEach(card => {
      card.classList.remove('answered');
      $$('.choice-actions button', card).forEach(button => {
        button.classList.remove('selected');
        button.setAttribute('aria-pressed', 'false');
      });
      const feedback = $('.choice-feedback', card);
      if (feedback) feedback.innerHTML = '';
    });
    if (choiceSummary) choiceSummary.hidden = true;
    renderChoiceSummary();
    if (scrollToTop) document.querySelector('#choice')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  function initChoices() {
    $$('.choice-card').forEach(card => {
      $$('.choice-actions button', card).forEach(btn => {
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => selectChoice(card, btn));
      });
    });
    choiceReset?.addEventListener('click', () => resetChoices({ scrollToTop: true }));
    renderChoiceSummary();
  }

  function rerenderLanguageSensitiveUI() {
    showHotspot(activeHotspot);
    choiceOrder.forEach(key => {
      const current = choiceState[key];
      if (!current) return;
      const card = document.querySelector(`.choice-card[data-choice="${key}"]`);
      if (card) renderChoiceFeedback(card, key, current.option);
    });
    renderChoiceSummary();
  }

  function initHeroParallax() {
    if (reduced) return;
    const hero = document.querySelector('.hero');
    const copy = document.querySelector('.hero-copy');
    if (!hero && !copy) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      if (reduced) {
        if (copy) { copy.style.opacity = ''; copy.style.transform = ''; }
        if (hero) hero.style.setProperty('--hero-scale', '1');
        return;
      }
      const y = window.scrollY;
      const heroLimit = hero ? hero.offsetHeight : window.innerHeight;
      if (y >= heroLimit) {
        if (copy) {
          copy.style.opacity = '';
          copy.style.transform = '';
        }
        if (hero) hero.style.setProperty('--hero-scale', '1');
        return;
      }

      const p = Math.min(y, window.innerHeight) / window.innerHeight;
      if (copy) {
        copy.style.opacity = String(Math.max(0.15, 1 - p * 1.35));
        copy.style.transform = `translateY(${-24 * p}px)`;
      }
      if (hero) hero.style.setProperty('--hero-scale', String(1 + Math.min(0.02, p * 0.02)));
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
  }

  function resetForKiosk() {
    setMenu(false, { restoreFocus: false });
    if (CURRENT_LANG !== DEFAULT_LANG) applyLanguage(DEFAULT_LANG);
    resetChoices();
    showHotspot(DEFAULT_HOTSPOT);
    $$('details[open]').forEach(detail => { detail.open = false; });
    if (document.activeElement instanceof HTMLElement && document.activeElement !== body) {
      document.activeElement.blur();
    }
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }

  function initIdleReset() {
    const params = new URLSearchParams(location.search);
    if (params.get('kiosk') !== '1') return;

    const idleLimit = 120000;
    let lastActivity = Date.now();
    let hasReset = false;

    const markActivity = () => {
      lastActivity = Date.now();
      hasReset = false;
    };

    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, markActivity, { passive: true });
    });
    window.addEventListener('resize', markActivity);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) markActivity();
    });

    window.setInterval(() => {
      if (window.innerWidth < 900 || hasReset) return;
      if (Date.now() - lastActivity < idleLimit) return;
      hasReset = true;
      resetForKiosk();
      lastActivity = Date.now();
    }, 1000);
  }

  function initMotionPreference() {
    const onChange = event => {
      reduced = event.matches;
    };
    if (supportsReducedMotion.addEventListener) supportsReducedMotion.addEventListener('change', onChange);
    else if (supportsReducedMotion.addListener) supportsReducedMotion.addListener(onChange);
  }

  function init() {
    initMotionPreference();
    initMenu();
    initLanguage();
    initReveal();
    initHeaderTheme();
    initHotspots();
    initImageFallbacks();
    initChoices();
    initHeroParallax();
    initIdleReset();
    window.addEventListener('languagechange', rerenderLanguageSensitiveUI);
  }

  init();
})();
