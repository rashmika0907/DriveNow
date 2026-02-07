(() => {
  const menu = document.querySelector('.user-menu');
  if (!menu) return;

  const button = menu.querySelector('.user-button');
  const dropdown = menu.querySelector('.user-dropdown');

  const closeMenu = () => {
    menu.classList.remove('open');
    if (button) button.setAttribute('aria-expanded', 'false');
  };

  const toggleMenu = () => {
    const isOpen = menu.classList.toggle('open');
    if (button) button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  };

  if (button) {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });
  }

  if (dropdown) {
    dropdown.addEventListener('click', (e) => e.stopPropagation());
  }

  document.addEventListener('click', () => closeMenu());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
})();

