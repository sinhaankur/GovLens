// Tiny progressive enhancement for the landing page.

// Animate the mock progress bar so the hero feels alive.
window.addEventListener('DOMContentLoaded', () => {
  const bar = document.querySelector('.mock-progress span');
  if (bar) {
    let pct = 0;
    setInterval(() => {
      pct = (pct + 7) % 100;
      bar.style.width = pct + '%';
    }, 280);
  }

  // Smooth-scroll offset for sticky nav
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });
});
