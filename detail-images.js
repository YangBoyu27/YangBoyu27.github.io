(() => {
  'use strict';

  const gallery = document.querySelector('.project-gallery');
  if (!gallery) return;

  const deferred = [...gallery.querySelectorAll('picture[data-deferred]')];
  let index = 0;
  let active = 0;
  const maxConcurrent = 2;

  function loadNext() {
    while (active < maxConcurrent && index < deferred.length) {
      loadImage(deferred[index++]);
    }
  }

  function loadImage(picture) {
    active += 1;

    const source = picture.querySelector('source[data-srcset]');
    const image = picture.querySelector('img[data-src]');
    if (!image) {
      active -= 1;
      loadNext();
      return;
    }

    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      active -= 1;
      loadNext();
    };

    image.addEventListener('load', advance, { once: true });
    image.addEventListener('error', advance, { once: true });
    image.fetchPriority = 'low';
    image.loading = 'eager';
    if (source) source.srcset = source.dataset.srcset;
    image.src = image.dataset.src;
    image.removeAttribute('data-src');
  }

  const first = gallery.querySelector('picture:not([data-deferred]) img');
  if (!first || first.complete) {
    loadNext();
    return;
  }

  first.addEventListener('load', loadNext, { once: true });
  first.addEventListener('error', loadNext, { once: true });
})();
