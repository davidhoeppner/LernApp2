// Scroll progress bar attached to navigation
// Accessible, performant, respects reduced motion
(function () {
  const progressContainer = document.querySelector('.nav-scroll-progress');
  const progressBar = progressContainer && progressContainer.querySelector('.bar');
  if (!progressContainer || !progressBar) return;

  let ticking = false;

  function update() {
    const docEl = document.documentElement;
    const scrollTop = docEl.scrollTop || document.body.scrollTop;
    const scrollHeight = docEl.scrollHeight || document.body.scrollHeight;
    const clientHeight = docEl.clientHeight || window.innerHeight;
    const max = scrollHeight - clientHeight;
    let percent = 0;
    if (max > 0) {
      percent = (scrollTop / max) * 100;
      if (percent < 0) percent = 0;
      if (percent > 100) percent = 100;
    }

    progressBar.style.width = percent + '%';
    progressContainer.setAttribute('aria-valuenow', String(Math.round(percent)));
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);

  // Initial paint after DOM ready (in case script executes before layout stable)
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    update();
  } else {
    document.addEventListener('DOMContentLoaded', update, { once: true });
  }
})();
