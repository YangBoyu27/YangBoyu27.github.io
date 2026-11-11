(() => {
  const pendingKey = 'portfolio-project-entry';
  const grid = document.getElementById('project-grid');

  if (grid) {
    const restore = () => {
      const saved = history.state?.portfolioWork;
      if (!saved) return;
      const button = [...document.querySelectorAll('[data-work-category]')]
        .find(item => item.dataset.workCategory === saved.category);
      if (button) button.click();
      window.scrollTo({ top: saved.scrollY, left: 0, behavior: 'instant' });
    };

    grid.addEventListener('click', event => {
      const link = event.target.closest('.project-link');
      if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const category = document.querySelector('[data-work-category][aria-pressed="true"]')?.dataset.workCategory;
      history.replaceState({ ...history.state, portfolioWork: { category, scrollY: window.scrollY } }, '');
      try {
        sessionStorage.setItem(pendingKey, JSON.stringify({ to: link.href, at: Date.now() }));
      } catch { /* Browser history still restores the page when storage is unavailable. */ }
    });

    window.addEventListener('pageshow', restore);
    return;
  }

  const backLinks = document.querySelectorAll('[data-project-back]');
  if (!backLinks.length) return;
  try {
    const pending = JSON.parse(sessionStorage.getItem(pendingKey) || 'null');
    sessionStorage.removeItem(pendingKey);
    if (pending?.to === location.href && Date.now() - pending.at < 60000) {
      history.replaceState({ ...history.state, portfolioReturn: true }, '');
    }
  } catch { /* The regular link remains available when storage is unavailable. */ }

  const home = new URL('index.html', location.href);
  let fromHome = false;
  if (document.referrer) {
    const previous = new URL(document.referrer);
    fromHome = previous.origin === home.origin &&
      (previous.pathname === home.pathname || previous.pathname === new URL('./', home).pathname);
  }

  backLinks.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (history.length > 1 && (history.state?.portfolioReturn || fromHome)) {
      event.preventDefault();
      history.back();
    }
  }));
})();
