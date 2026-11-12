(() => {
  'use strict';
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  if (!finePointer.matches) return;

  const dot = document.createElement('div');
  dot.className = 'portfolio-cursor-dot';
  dot.setAttribute('aria-hidden', 'true');
  document.body.append(dot);
  document.documentElement.classList.add('cursor-dot-enabled');

  let position = null;
  let lastTarget = null;
  const hasDarkBackground = target => {
    if (target?.closest?.('.side-panel-layer')) return false;
    if (document.body.classList.contains('perceive-page')) return true;
    for (let element = target; element instanceof Element; element = element.parentElement) {
      const color = getComputedStyle(element).backgroundColor.match(/[\d.]+/g);
      if (!color || color.length < 3 || (color.length > 3 && Number(color[3]) < .5)) continue;
      const [red, green, blue] = color.map(Number);
      return .2126 * red + .7152 * green + .0722 * blue < 128;
    }
    return false;
  };
  const updateColor = target => {
    if (target === lastTarget) return;
    lastTarget = target;
    const outlined = target?.closest?.('.hero-title-svg tspan, .detail-title-svg tspan, .nav a, .work-category');
    const colored = outlined?.matches('.title-orange, .title-blue');
    const dark = hasDarkBackground(target);
    // Outlined lettering fills with the opposite color of its paper surface.
    dot.classList.toggle('is-white', outlined && !colored ? !dark : dark);
  };
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    position = { x: event.clientX, y: event.clientY };
    dot.style.transform = `translate3d(${position.x - 6}px, ${position.y - 6}px, 0)`;
    updateColor(event.target);
    dot.classList.add('is-visible');
  }, { passive: true });
  document.addEventListener('pointerover', event => updateColor(event.target), { passive: true });
  document.documentElement.addEventListener('pointerleave', () => dot.classList.remove('is-visible'));
  window.addEventListener('blur', () => dot.classList.remove('is-visible'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) dot.classList.remove('is-visible');
  });
  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (!position || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      updateColor(document.elementFromPoint(position.x, position.y));
    });
  }, { passive: true });
  finePointer.addEventListener('change', event => {
    document.documentElement.classList.toggle('cursor-dot-enabled', event.matches);
    if (!event.matches) dot.classList.remove('is-visible');
  });
})();
