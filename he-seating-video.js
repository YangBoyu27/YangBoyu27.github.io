(() => {
  'use strict';
  const video = document.getElementById('he-film-video');
  const start = document.getElementById('he-film-start');
  const quality = document.getElementById('he-film-quality');
  const status = document.getElementById('he-film-status');
  const fallback = document.getElementById('he-film-fallback');
  if (!video || !start || !quality || !status || !fallback) return;
  let started = false;
  let generation = 0;

  async function loadSelected(position = 0, resume = true) {
    const current = ++generation;
    status.textContent = 'Loading video…';
    if (position > 0) {
      video.addEventListener('loadedmetadata', () => {
        if (current === generation && Number.isFinite(video.duration)) {
          video.currentTime = Math.min(position, Math.max(0, video.duration - 0.1));
        }
      }, { once: true });
    }
    video.src = quality.value;
    video.load();
    if (!resume) {
      status.textContent = 'Quality changed. Press play to continue.';
      return;
    }
    try {
      await video.play();
    } catch (error) {
      if (current !== generation || error.name === 'AbortError') return;
      status.textContent = 'Press play in the video controls to continue, or use Open video.';
    }
  }

  start.addEventListener('click', () => {
    started = true;
    start.hidden = true;
    loadSelected();
  });
  quality.addEventListener('change', () => {
    fallback.href = quality.value;
    if (started) loadSelected(video.currentTime || 0, !video.paused && !video.ended);
    else status.textContent = 'Click to load and play. No video has been downloaded yet.';
  });
  video.addEventListener('playing', () => { status.textContent = 'Playing. You can change quality or enter fullscreen using the video controls.'; });
  video.addEventListener('pause', () => { if (started && !video.ended) status.textContent = 'Paused. Press play in the video controls to continue.'; });
  video.addEventListener('waiting', () => { if (started) status.textContent = 'Buffering… If playback is slow, select 720p · Smooth.'; });
  video.addEventListener('ended', () => { status.textContent = 'Film finished. Press play to watch again.'; });
  video.addEventListener('error', () => { status.textContent = 'The video could not be loaded. Try Open video or reload this page.'; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !video.paused) video.pause();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      const fullscreen = document.fullscreenElement;
      if (!entry.isIntersecting && !video.paused && !video.webkitDisplayingFullscreen &&
          document.pictureInPictureElement !== video && !(fullscreen && fullscreen.contains(video))) {
        video.pause();
      }
    }, { threshold: 0 });
    observer.observe(video);
  }
})();
