(() => {
  const filters = document.querySelector('.projects-filters');
  const count = document.querySelector('.projects-count');
  const cards = [...document.querySelectorAll('.project-card')];
  if (!filters || !count || !cards.length) return;
  let active = 'all';
  function update() {
    let visible = 0;
    cards.forEach(card => {
      const categories = (card.dataset.category || '').split(/\s+/);
      card.hidden = active !== 'all' && !categories.includes(active);
      if (!card.hidden) visible++;
    });
    filters.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === active));
    });
    const spanish = document.documentElement.lang.startsWith('es');
    count.textContent = `${visible} ${spanish ? (visible === 1 ? 'proyecto' : 'proyectos') : (visible === 1 ? 'project' : 'projects')}`;
  }
  filters.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (!button || !filters.contains(button)) return;
    active = button.dataset.filter;
    update();
  });
  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  filters.hidden = false;
  update();
})();
