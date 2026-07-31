const IW_CONFIG = {
  businessName: 'iKhethelo Digital',
  // Placeholder contact details. Replace these with final business contact information.
  email: 'khethelomachi@gmail.com',
  phone: '+27 84 351 7720',
  whatsAppNumber: '27843517720',
  address: 'Durban, South Africa',
  linkedInUrl: 'https://www.linkedin.com/company/ikhethelo-digital',
};

window.IW_CONFIG = IW_CONFIG;

const buildWhatsAppUrl = (message = 'Hello iKhethelo Digital, I would like to discuss a project.') =>
  `https://wa.me/${IW_CONFIG.whatsAppNumber}?text=${encodeURIComponent(message)}`;

const setContactDetails = () => {
  document.querySelectorAll('[data-contact]').forEach((element) => {
    const key = element.dataset.contact;
    if (key && IW_CONFIG[key]) {
      element.textContent = IW_CONFIG[key];
    }
  });

  document.querySelectorAll('[data-contact-link="email"]').forEach((element) => {
    element.setAttribute('href', `mailto:${IW_CONFIG.email}`);
  });

  document.querySelectorAll('[data-contact-link="phone"]').forEach((element) => {
    element.setAttribute('href', `tel:${IW_CONFIG.phone.replace(/\s/g, '')}`);
  });

  document.querySelectorAll('[data-whatsapp]').forEach((element) => {
    element.setAttribute('href', buildWhatsAppUrl());
    element.setAttribute('target', '_blank');
    element.setAttribute('rel', 'noopener');
  });
};

const setCurrentYear = () => {
  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = new Date().getFullYear().toString();
  });
};

const setActiveNavigation = () => {
  const currentPage = document.body.dataset.page;
  document.querySelectorAll('[data-nav]').forEach((link) => {
    if (link.dataset.nav === currentPage) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });
};

const setupNavigation = () => {
  const header = document.querySelector('[data-site-header]');
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('#site-menu');

  if (!header || !toggle || !menu) {
    return;
  }

  const setHeaderState = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    header.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    menu.classList.toggle('is-open', !isOpen);
    header.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('nav-open', !isOpen);
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 992) {
      closeMenu();
    }
  });

  window.addEventListener('scroll', setHeaderState, { passive: true });
  setHeaderState();
};

const setupRevealAnimation = () => {
  const elements = document.querySelectorAll('.reveal');

  if (!elements.length) {
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
  );

  elements.forEach((element) => observer.observe(element));
};

document.addEventListener('DOMContentLoaded', () => {
  setContactDetails();
  setCurrentYear();
  setActiveNavigation();
  setupNavigation();
  setupRevealAnimation();
});
