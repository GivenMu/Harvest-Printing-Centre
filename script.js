
const body = document.body;
const header = document.querySelector('header');
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    body.classList.toggle('menu-open');
    menuToggle.setAttribute(
      'aria-expanded',
      navMenu.classList.contains('active')
    );
  });

  document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      body.classList.remove('menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (e) => {
    const clickedInsideMenu = navMenu.contains(e.target);
    const clickedToggle = menuToggle.contains(e.target);

    if (
      !clickedInsideMenu &&
      !clickedToggle &&
      navMenu.classList.contains('active')
    ) {
      navMenu.classList.remove('active');
      body.classList.remove('menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// HEADER SCROLL EFFECT
const handleHeaderScroll = () => {
  if (!header) return;

  if (window.scrollY > 20) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
};

window.addEventListener('scroll', handleHeaderScroll);
handleHeaderScroll();

// SCROLL PROGRESS BAR
const progressBar = document.createElement('div');
progressBar.className = 'page-progress';
document.body.appendChild(progressBar);

const updateProgressBar = () => {
  const scrollTop = window.scrollY;
  const docHeight =
    document.documentElement.scrollHeight - window.innerHeight;

  const progress =
    docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  progressBar.style.width = `${progress}%`;
};

window.addEventListener('scroll', updateProgressBar);
updateProgressBar();

// REVEAL ON SCROLL
const revealItems = document.querySelectorAll('.fade-up');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealItems.forEach(item => {
  revealObserver.observe(item);
});

// PARALLAX HERO
const hero = document.querySelector('.hero');

window.addEventListener('scroll', () => {
  if (!hero) return;

  const offset = window.scrollY * 0.2;
  hero.style.backgroundPosition = `center ${offset}px`;
});

// BUTTON HOVER EFFECT
document.querySelectorAll('.btn').forEach(button => {
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-3px)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = '';
  });
});

console.log('Harvest Printing Centre website loaded successfully.');

// MOUSE GLOW
const mouseGlow = document.createElement('div');
mouseGlow.className = 'mouse-glow';
document.body.appendChild(mouseGlow);

window.addEventListener('mousemove', (e) => {
  mouseGlow.style.left = `${e.clientX}px`;
  mouseGlow.style.top = `${e.clientY}px`;
});

// TILT EFFECT
const tiltItems = document.querySelectorAll(
  '.card, .service-item, .price-box, .step-card, .metric-card'
);

tiltItems.forEach(item => {
  item.addEventListener('mousemove', (e) => {
    const rect = item.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateY = ((x / rect.width) - 0.5) * 8;
    const rotateX = ((y / rect.height) - 0.5) * -8;

    item.style.transform =
      `perspective(900px)
       rotateX(${rotateX}deg)
       rotateY(${rotateY}deg)
       translateY(-8px)`;
  });

  item.addEventListener('mouseleave', () => {
    item.style.transform = '';
  });
});

// PHONE PARALLAX
const phoneCard = document.querySelector('.phone-story-card');

if (phoneCard) {
  window.addEventListener('mousemove', (e) => {
    const x =
      (window.innerWidth / 2 - e.clientX) / 45;

    const y =
      (window.innerHeight / 2 - e.clientY) / 45;

    phoneCard.style.transform =
      `translate(${x}px, ${y}px)`;
  });
}

