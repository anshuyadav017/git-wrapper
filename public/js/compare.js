let user1Data = null;
let user2Data = null;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('battle-form');
  form.addEventListener('submit', handleBattle);

  checkUrlParams();
});

function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const u1 = params.get('u1');
  const u2 = params.get('u2');

  if (u1 && u2) {
    document.getElementById('username1').value = u1;
    document.getElementById('username2').value = u2;
    handleBattle({ preventDefault: () => {} });
  }
}

async function handleBattle(e) {
  if (e) e.preventDefault();

  const username1 = document.getElementById('username1').value.trim();
  const username2 = document.getElementById('username2').value.trim();

  if (!username1 || !username2) return;

  showLoading();

  try {
    const [data1, data2] = await Promise.all([
      fetchWrappedData(username1),
      fetchWrappedData(username2)
    ]);

    user1Data = data1;
    user2Data = data2;

    renderVersus(data1, data2);
    hideLoading();

  } catch (error) {
    showError(error.message);
  }
}

async function fetchWrappedData(username) {
  const response = await fetch(`/wrapped/${encodeURIComponent(username)}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to load ${username}`);
  }
  const result = await response.json();
  return result.data;
}

function showLoading() {
  document.getElementById('input-section').style.display = 'none';
  document.getElementById('loading-state').style.display = 'grid';
  document.getElementById('error-card').style.display = 'none';
  document.getElementById('versus-result').style.display = 'none';
}

function hideLoading() {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('versus-result').style.display = 'block';
}

function showError(message) {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('error-card').style.display = 'block';
  document.getElementById('error-message').textContent = message;
}

function renderVersus(data1, data2) {
  const metrics = [
    { key: 'totalCommits', label: 'Commits' },
    { key: 'longestStreak', label: 'Longest Streak' },
    { key: 'totalPRs', label: 'Pull Requests' },
    { key: 'totalStars', label: 'Total Stars' },
    { key: 'topLanguages', label: 'Languages', isArray: true },
    { key: 'followingCount', label: 'Following' }
  ];

  const scores = { score1: 0, score2: 0 };

  renderUserCard(1, data1, metrics, scores, data2);
  renderUserCard(2, data2, metrics, scores, data1);

  updateScore(1, scores.score1);
  updateScore(2, scores.score2);

  updateWinnerBanner(scores.score1, scores.score2, data1, data2);

  document.getElementById('compare-card').src = `/compare/${data1.username}/${data2.username}`;

  updateUrlParams(data1.username, data2.username);
}

function renderUserCard(userNum, data, metrics, scores, opponentData) {
  document.getElementById(`avatar${userNum}`).src = data.avatarUrl;
  document.getElementById(`username-display${userNum}`).textContent = `@${data.username}`;
  document.getElementById(`badge${userNum}`).textContent = data.personalityBadge;

  const metricsContainer = document.getElementById(`metrics${userNum}`);
  metricsContainer.innerHTML = '';

  metrics.forEach(metric => {
    const val1 = metric.isArray ? data[metric.key].length : data[metric.key];
    const val2 = metric.isArray ? opponentData[metric.key].length : opponentData[metric.key];

    const isWin1 = val1 > val2;
    const isWin2 = val2 > val1;

    if (isWin1) scores.score1++;
    if (isWin2) scores.score2++;

    const row = document.createElement('div');
    row.className = 'metric-row';
    row.innerHTML = `
      <span class="metric-label">${metric.label}</span>
      <div class="metric-values">
        <span class="metric-value ${isWin1 ? 'winner' : ''}">${metric.isArray ? val1 : val1.toLocaleString()}${isWin1 ? '<span class="winner-indicator">✓</span>' : ''}</span>
        <span class="metric-value ${isWin2 ? 'winner' : ''}">${metric.isArray ? val2 : val2.toLocaleString()}${isWin2 ? '<span class="winner-indicator">✓</span>' : ''}</span>
      </div>
    `;
    metricsContainer.appendChild(row);
  });
}

function updateScore(userNum, score) {
  document.getElementById(`score${userNum}`).textContent = score;
}

function updateWinnerBanner(score1, score2, data1, data2) {
  const banner = document.getElementById('winner-banner');
  const text = document.getElementById('winner-text');

  if (score1 > score2) {
    banner.classList.remove('tie');
    text.textContent = `🏆 @${data1.username} wins with ${score1}/6 points!`;
    document.getElementById('card1').classList.add('winner');
    document.getElementById('avatar1').classList.add('winner');
  } else if (score2 > score1) {
    banner.classList.remove('tie');
    text.textContent = `🏆 @${data2.username} wins with ${score2}/6 points!`;
    document.getElementById('card2').classList.add('winner');
    document.getElementById('avatar2').classList.add('winner');
  } else {
    banner.classList.add('tie');
    text.textContent = `🤝 It's a tie — you're both nerds!`;
  }
}

function updateUrlParams(u1, u2) {
  const url = new URL(window.location);
  url.searchParams.set('u1', u1);
  url.searchParams.set('u2', u2);
  window.history.replaceState({}, '', url);
}

function resetForm() {
  document.getElementById('error-card').style.display = 'none';
  document.getElementById('input-section').style.display = 'block';
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('versus-result').style.display = 'none';

  document.getElementById('card1').classList.remove('winner');
  document.getElementById('card2').classList.remove('winner');
  document.getElementById('avatar1').classList.remove('winner');
  document.getElementById('avatar2').classList.remove('winner');
}

document.getElementById('download-compare').addEventListener('click', async () => {
  if (!user1Data || !user2Data) return;

  try {
    const response = await fetch(`/compare/${user1Data.username}/${user2Data.username}`);
    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `github-wrapped-compare-${user1Data.username}-vs-${user2Data.username}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
  }
});