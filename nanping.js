(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.np-group').forEach(group => {
    const track = group.querySelector('.np-track');
    const slides = [...track.querySelectorAll('.np-slide')];
    const previous = group.querySelector('[data-previous]');
    const next = group.querySelector('[data-next]');
    const count = group.querySelector('.np-counter');
    let activeIndex = 0;
    const targetLeft = slide => {
      const bounds = slide.getBoundingClientRect();
      return track.scrollLeft + bounds.left - track.getBoundingClientRect().left - (track.clientWidth - bounds.width) / 2;
    };
    const nearestIndex = () => slides.reduce((nearest, slide, i) =>
      Math.abs(targetLeft(slide) - track.scrollLeft) < Math.abs(targetLeft(slides[nearest]) - track.scrollLeft) ? i : nearest, 0);
    const update = () => {
      const i = activeIndex = nearestIndex();
      slides.forEach((slide, index) => slide.classList.toggle('is-active', index === i));
      track.classList.add('is-enhanced');
      count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      previous.disabled = i === 0;
      next.disabled = i === slides.length - 1;
    };
    const centerSlide = (index, behavior = reducedMotion ? 'instant' : 'smooth') => {
      const position = Math.max(0, Math.min(slides.length - 1, index));
      track.scrollTo({ left: targetLeft(slides[position]), behavior });
    };
    const go = direction => {
      centerSlide(nearestIndex() + direction);
    };
    previous.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    track.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        go(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
    let frame = 0;
    track.addEventListener('scroll', () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; update(); });
    }, { passive: true });
    let drag = null;
    track.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      drag = { x: event.clientX, left: track.scrollLeft, index: nearestIndex() };
      track.setPointerCapture(event.pointerId);
    });
    track.addEventListener('pointermove', event => {
      if (!drag || Math.abs(event.clientX - drag.x) < 4) return;
      track.classList.add('is-dragging');
      track.scrollLeft = drag.left - (event.clientX - drag.x);
    });
    const stopDrag = () => {
      if (!drag) return;
      const distance = track.scrollLeft - drag.left;
      let position = nearestIndex();
      if (position === drag.index && Math.abs(distance) > 60) position += Math.sign(distance);
      drag = null;
      track.classList.remove('is-dragging');
      centerSlide(position);
    };
    track.addEventListener('pointerup', stopDrag);
    track.addEventListener('pointercancel', stopDrag);
    new ResizeObserver(() => {
      if (!drag) centerSlide(activeIndex, 'instant');
      update();
    }).observe(track);
    update();
  });
})();
