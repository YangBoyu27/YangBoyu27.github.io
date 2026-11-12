(() => {
  'use strict';

  // White/black paper shapes sit behind each glyph. The text itself is drawn once.
  const titles = [...document.querySelectorAll('.hero-title-svg, .detail-title-svg')];
  const svgNS = 'http://www.w3.org/2000/svg';
  const letterMeasure = document.createElement('canvas').getContext('2d');
  const protectLetters = () => {
    titles.forEach(svg => {
      const paper = document.createElementNS(svgNS, 'g');
      paper.classList.add('letter-paper');
      paper.setAttribute('aria-hidden', 'true');
      svg.querySelectorAll('text tspan').forEach(letter => {
        if (!letter.textContent.trim()) return;
        let bounds = letter.getBBox();
        // SVG's line box includes empty ascender/descender space. Measure the ink
        // so only the glyph and its counters mask the dotted paper underneath.
        if (letterMeasure && letter.getNumberOfChars()) {
          const style = getComputedStyle(letter);
          letterMeasure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          const ink = letterMeasure.measureText(letter.textContent);
          const origin = letter.getStartPositionOfChar(0);
          if (Number.isFinite(ink.actualBoundingBoxAscent)) {
            bounds = {
              x: origin.x - ink.actualBoundingBoxLeft,
              y: origin.y - ink.actualBoundingBoxAscent,
              width: ink.actualBoundingBoxLeft + ink.actualBoundingBoxRight,
              height: ink.actualBoundingBoxAscent + ink.actualBoundingBoxDescent
            };
          }
        }
        if (!bounds.width || !bounds.height) return;
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', bounds.x - 1);
        rect.setAttribute('y', bounds.y - 1);
        rect.setAttribute('width', bounds.width + 2);
        rect.setAttribute('height', bounds.height + 2);
        paper.append(rect);
      });
      svg.querySelector('.letter-paper')?.remove();
      svg.prepend(paper);
      svg.classList.add('letter-paper-ready');
    });
  };
  protectLetters();
  if (document.fonts) {
    document.fonts.ready.then(protectLetters);
    document.fonts.addEventListener('loadingdone', protectLetters);
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)) return;

  const progress = document.createElement('div');
  progress.className = 'paper-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.target.hidden) return;
      const visible = entry.isIntersecting;
      entry.target.classList.toggle('is-in-view', visible);
      entry.target.classList.toggle('is-waiting', !visible);
    });
  }, { rootMargin: '0px 0px -24px 0px', threshold: 0 });

  const targets = document.querySelectorAll([
    '.hero-copy', '.hero-portrait', '.section-heading', '.project-card',
    '.about-title', '.about-photo-paper', '.about-identity', '.about-skills',
    '.about-contact', '.about-group', '.footer', '.detail-title-block',
    '.project-gallery > picture', '.he-film', '.project-bottom-nav',
    '.np-chapters', '.np-group-head', '.np-track', '.np-controls', '.np-bottom'
  ].join(', '));

  targets.forEach(element => {
    const bounds = element.getBoundingClientRect();
    const visible = !element.hidden && bounds.top < innerHeight && bounds.bottom > 0;
    element.classList.add('paper-reveal', visible ? 'is-in-view' : 'is-waiting');
    observer.observe(element);
  });

  // A restored page should immediately show its previous position, without fading.
  window.addEventListener('pageshow', event => {
    if (!event.persisted && !history.state?.portfolioWork) return;
    requestAnimationFrame(() => {
      targets.forEach(element => {
        const bounds = element.getBoundingClientRect();
        if (!element.hidden && bounds.top < innerHeight && bounds.bottom > 0) {
          element.classList.remove('is-waiting');
          element.classList.add('is-in-view');
        }
      });
    });
  });
})();
