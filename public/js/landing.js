document.addEventListener('DOMContentLoaded', () => {
  initYear();
  initParticles();
  initSearch();
});

function initYear() {
  const yearElement = document.getElementById('year-text');
  const currentYear = new Date().getFullYear();
  yearElement.textContent = currentYear - 1;
}

function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const particles = [];
  const particleCount = 60;
  const connectionDistance = 120;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 2 + 1
    });
  }

  function getAccentColor() {
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue('--accent').trim() || '#58a6ff';
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${getAccentColor()}26`;
      ctx.fill();
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `${getAccentColor()}15`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });
}

function initSearch() {
  const input = document.getElementById('username-input');
  const btn = document.getElementById('search-btn');
  const pills = document.querySelectorAll('.example-pill');

  function navigate() {
    const username = input.value.trim();
    if (username) {
      window.location.href = `result.html?user=${encodeURIComponent(username)}`;
    }
  }

  btn.addEventListener('click', navigate);

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      navigate();
    }
  });

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      input.value = pill.dataset.username;
      navigate();
    });
  });
}