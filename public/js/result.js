const LANGUAGE_COLORS = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3776ab',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  Go: '#00add8',
  Rust: '#dea584',
  PHP: '#4f5d95',
  Swift: '#fa7343',
  Kotlin: '#A97BFF',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Dart: '#00B4AB'
};

const loadingMessages = [
  'Stalking your commits...',
  'Counting your 3 AM pushes...',
  'Asking AI to roast you...',
  'Measuring your streak obsession...',
  'Almost done...'
];

let currentUsername = '';
let wrappedData = null;
let currentMode = 'roast';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const username = params.get('user');

  if (!username) {
    window.location.href = 'index.html';
    return;
  }

  currentUsername = username;
  loadWrappedData(username);
});

async function loadWrappedData(username) {
  showLoading();
  startLoadingAnimation();

  try {
    const response = await fetch(`/wrapped/${encodeURIComponent(username)}`);
    
    // If response is not OK, get the error
    if (!response.ok) {
      let errorMessage = 'Failed to load data';
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || 'Failed to load data';
        } catch (e) {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
      } else {
        // Response is HTML (likely 500 error)
        errorMessage = `Server error (${response.status}): ${response.statusText} - Check that your GitHub token is valid and the server is running`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    wrappedData = result.data;

    updateAccentColor(wrappedData.topLanguages);
    renderWrappedData(wrappedData);
    hideLoading();
    initScrollReveal();
    initInteractions();

  } catch (error) {
    console.error('Error details:', error);
    showError(error.message);
  }
}

function showLoading() {
  document.getElementById('loading-overlay').classList.remove('hidden');
  document.getElementById('result-content').style.display = 'none';
  document.getElementById('error-card').style.display = 'none';
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
  document.getElementById('result-content').style.display = 'flex';
}

function showError(message) {
  document.getElementById('loading-overlay').classList.add('hidden');
  document.getElementById('error-card').style.display = 'block';
  document.getElementById('error-message').textContent = message;
}

function startLoadingAnimation() {
  const progressBar = document.getElementById('progress-bar');
  const loadingText = document.getElementById('loading-text');
  let progress = 0;
  let messageIndex = 0;

  loadingText.textContent = loadingMessages[0];

  const interval = setInterval(() => {
    progress += 2;
    progressBar.style.width = `${progress}%`;

    if (progress > (messageIndex + 1) * 20 && messageIndex < loadingMessages.length - 1) {
      messageIndex++;
      loadingText.textContent = loadingMessages[messageIndex];
    }

    if (progress >= 100) {
      clearInterval(interval);
    }
  }, 100);
}

function updateAccentColor(languages) {
  const primaryLang = languages[0]?.name || 'JavaScript';
  const color = LANGUAGE_COLORS[primaryLang] || '#58a6ff';

  document.documentElement.style.setProperty('--accent', color);
}

function renderWrappedData(data) {
  document.getElementById('avatar').src = data.avatarUrl;
  document.getElementById('username').textContent = `@${data.username}`;
  document.getElementById('bio').textContent = data.bio || '';
  document.getElementById('followers').textContent = data.followersCount;
  document.getElementById('following').textContent = data.followingCount;
  document.getElementById('personality-badge').textContent = data.personalityBadge;

  document.getElementById('wrapped-card').src = `/card/${data.username}`;

  animateNumbers(data);

  renderLanguages(data.topLanguages);

  document.getElementById('active-day').textContent = data.mostActiveDay;
  document.getElementById('active-hour').textContent = data.mostActiveHour;

  const timeLabel = document.getElementById('time-label');
  timeLabel.textContent = data.timeOfDay === 'night owl' ? 'the night owl hours' :
    data.timeOfDay === 'early bird' ? 'the early bird hours' :
      data.timeOfDay === 'afternoon coder' ? 'the afternoon hours' : 'the evening hours';

  document.getElementById('roast-text').textContent = data.roast;
  document.getElementById('praise-text').textContent = data.praise;
}

function animateNumbers(data) {
  const targets = {
    'total-commits': data.totalCommits,
    'longest-streak': data.longestStreak,
    'total-prs': data.totalPRs,
    'total-stars': data.totalStars
  };

  Object.entries(targets).forEach(([id, target]) => {
    const element = document.getElementById(id);
    animateValue(element, 0, target, 1500);
  });
}

function animateValue(element, start, end, duration) {
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (end - start) * easeProgress);

    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function renderLanguages(languages) {
  const bar = document.getElementById('language-bar');
  const legend = document.getElementById('language-legend');

  bar.innerHTML = '';
  legend.innerHTML = '';

  languages.forEach((lang, index) => {
    const segment = document.createElement('div');
    segment.className = 'language-segment';
    segment.style.backgroundColor = LANGUAGE_COLORS[lang.name] || '#8b949e';
    segment.style.width = '0%';
    bar.appendChild(segment);

    setTimeout(() => {
      segment.style.width = `${lang.percentage}%`;
    }, 100 + index * 200);

    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <span class="legend-dot" style="background-color: ${LANGUAGE_COLORS[lang.name] || '#8b949e'}"></span>
      <span>${lang.name} ${lang.percentage}%</span>
    `;
    legend.appendChild(item);
  });
}

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  reveals.forEach(el => observer.observe(el));
}

function initInteractions() {
  const roastToggle = document.getElementById('roast-toggle');
  const praiseToggle = document.getElementById('praise-toggle');
  const flipContent = document.getElementById('flip-content');

  roastToggle.addEventListener('click', () => {
    roastToggle.classList.add('active');
    praiseToggle.classList.remove('active');
    flipContent.classList.remove('flipped');
    currentMode = 'roast';
  });

  praiseToggle.addEventListener('click', () => {
    praiseToggle.classList.add('active');
    roastToggle.classList.remove('active');
    flipContent.classList.add('flipped');
    currentMode = 'praise';
  });

  const downloadBtn = document.getElementById('download-btn');
  downloadBtn.addEventListener('click', downloadCard);

  const shareBtn = document.getElementById('share-btn');
  shareBtn.addEventListener('click', shareResult);

  const twitterBtn = document.getElementById('share-twitter');
  twitterBtn.addEventListener('click', shareTwitter);

  const linkedinBtn = document.getElementById('share-linkedin');
  linkedinBtn.addEventListener('click', shareLinkedIn);

  const copyBtn = document.getElementById('share-copy');
  copyBtn.addEventListener('click', shareResult);
}

async function downloadCard() {
  try {
    const response = await fetch(`/card/${currentUsername}`);
    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `github-wrapped-${currentUsername}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
  }
}

function shareResult() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    showCopiedTooltip();
  });
}

function shareTwitter() {
  const text = `I just got my GitHub Wrapped! 🚀 Check mine at ${window.location.href} #GitHubWrapped`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

function shareLinkedIn() {
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
  window.open(url, '_blank');
}

function showCopiedTooltip() {
  const tooltip = document.getElementById('copied-tooltip');
  tooltip.classList.add('show');
  setTimeout(() => {
    tooltip.classList.remove('show');
  }, 2000);
}