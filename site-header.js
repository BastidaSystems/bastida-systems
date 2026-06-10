(() => {
  const mountHeader = async () => {
    const target = document.getElementById('site-header');
    if (!target) return;

    const response = await fetch('header.html');
    if (!response.ok) {
      throw new Error('header.html not found');
    }

    target.innerHTML = await response.text();
    document.dispatchEvent(new CustomEvent('site-header-loaded', { detail: { target } }));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountHeader);
  } else {
    mountHeader();
  }
})();
