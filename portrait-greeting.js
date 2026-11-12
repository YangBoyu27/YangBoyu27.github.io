(() => {
  const interaction = document.querySelector('.portrait-interaction');
  const portrait = interaction?.querySelector('.hero-portrait');
  const greeting = interaction?.querySelector('.portrait-greeting');
  if (!interaction || !portrait || !greeting) return;

  const positionGreeting = () => {
    const hero = interaction.closest('.hero');
    if (!hero) return;
    const heroBounds = hero.getBoundingClientRect();
    const portraitBounds = interaction.getBoundingClientRect();
    const greetingWidth = greeting.getBoundingClientRect().width;
    const greetingHeight = greeting.getBoundingClientRect().height;
    if (innerWidth <= 640) {
      greeting.style.left = `${Math.max(0, portraitBounds.left - heroBounds.left - greetingWidth - 24)}px`;
      greeting.style.top = `${portraitBounds.top - heroBounds.top - 6}px`;
      return;
    }
    greeting.style.left = `${Math.max(0, portraitBounds.left - heroBounds.left - greetingWidth - 48)}px`;
    greeting.style.top = `${portraitBounds.top - heroBounds.top - 6}px`;
  };
  interaction.addEventListener('pointerenter', event => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    positionGreeting();
    greeting.classList.add('is-visible');
  });
  interaction.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') greeting.classList.remove('is-visible');
  });
  // Touch screens reveal the greeting with a tap; tapping elsewhere dismisses it.
  interaction.addEventListener('click', () => {
    if (!matchMedia('(hover: none) and (pointer: coarse)').matches) return;
    positionGreeting();
    greeting.classList.toggle('is-visible');
  });
  document.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' && !interaction.contains(event.target)) {
      greeting.classList.remove('is-visible');
    }
  }, { passive: true });
  new ResizeObserver(positionGreeting).observe(portrait);
  positionGreeting();
})();
