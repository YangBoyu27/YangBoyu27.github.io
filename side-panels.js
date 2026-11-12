(() => {
  'use strict';
  const layer = document.createElement('div');
  layer.className = 'side-panel-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = `
    <div class="side-panel-backdrop" data-panel-dismiss></div>
    <aside class="side-panel" role="dialog" aria-modal="true" aria-labelledby="side-panel-title" tabindex="-1" data-panel="about">
      <header class="side-panel-header">
        <h2 class="side-panel-label" id="side-panel-title">About</h2>
        <nav class="side-panel-actions" aria-label="Information panels">
          <button class="side-panel-action" type="button" data-panel-target="about" aria-pressed="true">About</button>
          <button class="side-panel-action" type="button" data-panel-target="contact" aria-pressed="false">Contact</button>
          <button class="side-panel-action side-panel-close" type="button" data-panel-dismiss aria-label="Close panel">(Close)</button>
        </nav>
      </header>
      <div class="side-panel-scroll" tabindex="0"></div>
    </aside>`;
  document.body.append(layer);
  const panel = layer.querySelector('.side-panel');
  const scrollArea = layer.querySelector('.side-panel-scroll');
  const title = layer.querySelector('.side-panel-label');
  const closeButton = layer.querySelector('.side-panel-close');
  let opener = null;
  let open = false;
  let current = null;
  let contentPromise = null;
  let background = [];
  const positions = { about: 0, contact: 0 };

  const getContents = () => {
    if (contentPromise) return contentPromise;
    contentPromise = fetch('panel-content.html').then(response => {
      if (!response.ok) throw new Error('Could not load panel content');
      return response.text();
    }).then(html => {
      const template = document.createElement('template');
      template.innerHTML = html;
      const about = template.content.querySelector('.about-section');
      const contactLinks = about?.querySelector('.about-contact');
      if (!about || !contactLinks) throw new Error('Panel content is missing');
      const contact = document.createElement('section');
      contact.className = 'side-contact';
      contact.innerHTML = '<h2>Get in touch.</h2><p class="side-contact-location">Beijing, China</p>';
      contact.append(contactLinks);

      const photo = about.querySelector('.about-photo-paper');
      const canTilt = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
      photo?.addEventListener('pointermove', event => {
        if (!canTilt.matches) return;
        const bounds = photo.getBoundingClientRect();
        photo.style.setProperty('--paper-tilt-y', `${((event.clientX - bounds.left) / bounds.width - .5) * 12}deg`);
        photo.style.setProperty('--paper-tilt-x', `${((event.clientY - bounds.top) / bounds.height - .5) * -10}deg`);
      });
      photo?.addEventListener('pointerleave', () => {
        photo.style.setProperty('--paper-tilt-y', '0deg');
        photo.style.setProperty('--paper-tilt-x', '0deg');
      });
      return { about, contact };
    }).catch(error => {
      contentPromise = null;
      throw error;
    });
    return contentPromise;
  };

  const setBackgroundInert = enabled => {
    if (enabled) {
      background = [...document.body.children]
        .filter(element => element !== layer && !element.matches('script, style, link, .portfolio-cursor-dot'))
        .map(element => ({ element, inert: element.inert }));
      background.forEach(({ element }) => { element.inert = true; });
    } else {
      background.forEach(({ element, inert }) => { element.inert = inert; });
      background = [];
    }
  };

  const showPanel = async (kind, trigger) => {
    if (!['about', 'contact'].includes(kind)) return;
    if (!open) {
      opener = trigger || document.activeElement;
      open = true;
      document.documentElement.classList.add('side-panel-open');
      layer.classList.add('is-open');
      layer.setAttribute('aria-hidden', 'false');
      closeButton.focus({ preventScroll: true });
      setBackgroundInert(true);
    }
    if (current) positions[current] = scrollArea.scrollTop;
    current = kind;
    panel.dataset.panel = kind;
    title.textContent = kind === 'about' ? 'About' : 'Contact';
    layer.querySelectorAll('[data-panel-target]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.panelTarget === kind));
    });
    scrollArea.setAttribute('aria-busy', 'true');
    scrollArea.innerHTML = '<p class="side-panel-loading" role="status">Loading…</p>';
    try {
      const contents = await getContents();
      if (!open || current !== kind) return;
      scrollArea.replaceChildren(contents[kind]);
      scrollArea.scrollTop = positions[kind];
    } catch {
      if (!open || current !== kind) return;
      scrollArea.innerHTML = '<p class="side-panel-error">Unable to load. <button type="button" data-panel-retry>Try again</button></p>';
    } finally {
      if (open && current === kind) scrollArea.setAttribute('aria-busy', 'false');
    }
  };

  const closePanel = () => {
    if (!open) return;
    positions[current] = scrollArea.scrollTop;
    open = false;
    current = null;
    document.documentElement.classList.remove('side-panel-open');
    layer.classList.remove('is-open');
    setBackgroundInert(false);
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    else document.querySelector('.nav a')?.focus({ preventScroll: true });
    layer.setAttribute('aria-hidden', 'true');
    if (['#about', '#contact'].includes(location.hash)) {
      history.replaceState(history.state, '', location.pathname + location.search);
    }
  };

  document.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (event.target.closest('[data-panel-dismiss]')) {
      event.preventDefault();
      closePanel();
      return;
    }
    const switcher = event.target.closest('[data-panel-target]');
    if (switcher) {
      event.preventDefault();
      showPanel(switcher.dataset.panelTarget, switcher);
      return;
    }
    if (event.target.closest('[data-panel-retry]')) {
      showPanel(current);
      return;
    }
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !['#about', '#contact'].includes(url.hash)) return;
    event.preventDefault();
    showPanel(url.hash.slice(1), link);
  });

  document.addEventListener('keydown', event => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closePanel();
    } else if (event.key === 'Tab') {
      const focusable = [...panel.querySelectorAll('button, a[href], [tabindex="0"]')]
        .filter(element => !element.disabled && element.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const openHash = () => {
    if (['#about', '#contact'].includes(location.hash)) showPanel(location.hash.slice(1));
  };
  window.addEventListener('hashchange', openHash);
  openHash();
})();
