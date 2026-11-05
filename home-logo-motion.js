(() => {
  const video = document.querySelector('[data-brand-motion]');
  const button = document.querySelector('[data-brand-motion-toggle]');
  if (!video || !button) return;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let allowed = !preference.matches;
  let inView = false;
  let userPaused = false;
  let loaded = false;
  video.muted = true;

  const updateButton = () => {
    button.textContent = video.paused ? 'Play animation' : 'Pause animation';
  };
  const play = () => {
    if (!loaded) {
      video.querySelectorAll('source[data-src]').forEach(source => {
        source.src = source.dataset.src;
        delete source.dataset.src;
      });
      loaded = true;
      video.load();
    }
    video.play().catch(updateButton);
  };
  const sync = () => {
    if (inView && allowed && !userPaused && !document.hidden) play();
    else video.pause();
    updateButton();
  };
  button.addEventListener('click', () => {
    if (video.paused) {
      allowed = true;
      userPaused = false;
      play();
    } else {
      userPaused = true;
      video.pause();
    }
    updateButton();
  });
  video.addEventListener('play', updateButton);
  video.addEventListener('pause', updateButton);
  document.addEventListener('visibilitychange', sync);
  const onPreferenceChange = () => { allowed = !preference.matches; sync(); };
  if (preference.addEventListener) preference.addEventListener('change', onPreferenceChange);
  else preference.addListener(onPreferenceChange);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      sync();
    }, { rootMargin: '80px 0px', threshold: 0.05 }).observe(video);
  } else {
    inView = true;
    sync();
  }
  button.hidden = false;
  updateButton();
})();
