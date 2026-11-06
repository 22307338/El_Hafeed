const faqPage = document.querySelector('.qa-page');
const faqToast = document.querySelector('#notice-toast');
let toastTimer;

faqPage?.addEventListener('click', (event) => {
  const button = event.target.closest('.qa-question');
  if (!button) return;

  const item = button.closest('.qa-item');
  const answer = document.getElementById(button.getAttribute('aria-controls'));
  if (!item || !answer) return;

  const isOpen = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!isOpen));
  answer.setAttribute('aria-hidden', String(isOpen));
  answer.inert = isOpen;
  item.classList.toggle('is-open', !isOpen);
});

document.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]');
  if (action) {
    const drawer = document.querySelector('#mobile-drawer');

    if (action.dataset.action === 'mobile-menu-toggle') {
      const willOpen = drawer?.classList.contains('hidden');
      drawer?.classList.toggle('hidden', !willOpen);
      action.setAttribute('aria-expanded', String(Boolean(willOpen)));
    }

    if (action.dataset.action === 'mobile-menu-close') {
      drawer?.classList.add('hidden');
      document.querySelector('[data-action="mobile-menu-toggle"]')?.setAttribute('aria-expanded', 'false');
    }

    if (action.dataset.action === 'toast-close') {
      faqToast?.classList.add('hidden');
    }
  }

  const toastTrigger = event.target.closest('[data-toast-trigger]');
  if (toastTrigger && faqToast) {
    if (toastTrigger instanceof HTMLAnchorElement) event.preventDefault();
    const messages = {
      linkedin: 'Le compte LinkedIn sera connecté très prochainement.',
      instagram: 'Le compte Instagram sera connecté très prochainement.',
      facebook: 'Le compte Facebook sera connecté très prochainement.',
      callback: 'Formulaire de rappel direct : un coordinateur vous contactera sous 24 h.',
      legal: 'Document en cours d’actualisation.',
      privacy: 'La politique de confidentialité sera bientôt disponible.',
    };
    document.querySelector('#notice-toast-text').textContent = messages[toastTrigger.dataset.toastTrigger] || 'Information bientôt disponible.';
    faqToast.classList.remove('hidden');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => faqToast.classList.add('hidden'), 4000);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const drawer = document.querySelector('#mobile-drawer');
  drawer?.classList.add('hidden');
  document.querySelector('[data-action="mobile-menu-toggle"]')?.setAttribute('aria-expanded', 'false');
  faqToast?.classList.add('hidden');
});

if (window.lucide) {
  window.lucide.createIcons();
} else {
  window.addEventListener('load', () => window.lucide?.createIcons(), { once: true });
}
