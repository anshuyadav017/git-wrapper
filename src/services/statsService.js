const { getUserRepos, getUserEvents, getUserFollowers, getUser } = require('./githubService');

const processCommits = (contributionData) => {
  // Handle GraphQL contribution data
  if (contributionData.totalContributions !== undefined) {
    return {
      commitsByDay: {},
      commitsByHour: {},
      contributionDates: contributionData.contributionDates || [],
      totalCommits: contributionData.totalCommitContributions || 0,
      totalContributions: contributionData.totalContributions,
      totalIssues: contributionData.totalIssueContributions || 0,
      totalPRs: contributionData.totalPullRequestContributions || 0
    };
  }

  // Fallback for REST API data (shouldn't reach here)
  return {
    commitsByDay: {},
    commitsByHour: {},
    contributionDates: [],
    totalCommits: 0,
    totalContributions: 0,
    totalIssues: 0,
    totalPRs: 0
  };
};

const calculateStreak = (contributionDates) => {
  if (!contributionDates || contributionDates.length === 0) {
    return { longest: 0, current: 0 };
  }

  // Sort dates in ascending order
  const sortedDates = contributionDates
    .map(d => new Date(d))
    .sort((a, b) => a - b);

  // Get unique days
  const uniqueDays = [...new Set(sortedDates.map(d => d.toDateString()))].map(d => new Date(d));
  uniqueDays.sort((a, b) => a - b);

  let longestStreak = 1;
  let currentStreak = 1;
  let tempStreak = 1;

  // Calculate longest streak
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // Calculate current streak (from today or yesterday backwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastContributionDate = new Date(uniqueDays[uniqueDays.length - 1]);
  lastContributionDate.setHours(0, 0, 0, 0);

  // Check if last contribution was today or yesterday
  if (lastContributionDate.getTime() === today.getTime() || lastContributionDate.getTime() === yesterday.getTime()) {
    currentStreak = 1;
    // Count backwards from the last contribution
    for (let i = uniqueDays.length - 2; i >= 0; i--) {
      const prev = new Date(uniqueDays[i + 1]);
      const curr = new Date(uniqueDays[i]);
      const diffDays = Math.floor((prev - curr) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
  }

  return { longest: longestStreak, current: currentStreak };
};

const calculateTopLanguages = (repos) => {
  const langCounts = {};
  repos.forEach(repo => {
    if (repo.language) {
      langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
    }
  });

  const total = Object.values(langCounts).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([lang, count]) => ({
      name: lang,
      count,
      percentage: Math.round((count / total) * 100)
    }));

  return sorted;
};

const calculateTotalStars = (repos) => {
  return repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
};

const calculateTotalPRs = (events) => {
  return events.filter(e => e.type === 'PullRequestEvent').length;
};

const getMostActiveDay = (commitsByDay) => {
  if (Object.keys(commitsByDay).length === 0) return 'Unknown';
  return Object.entries(commitsByDay).sort((a, b) => b[1] - a[1])[0][0];
};

const getMostActiveHour = (commitsByHour) => {
  if (Object.keys(commitsByHour).length === 0) return '12 PM';
  const hour = parseInt(Object.entries(commitsByHour).sort((a, b) => b[1] - a[1])[0][0]);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour} ${period}`;
};

const getTimeOfDay = (hour) => {
  if (hour >= 0 && hour < 6) return 'night owl';
  if (hour >= 6 && hour < 12) return 'early bird';
  if (hour >= 12 && hour < 18) return 'afternoon coder';
  return 'evening programmer';
};

const assignPersonalityBadge = (stats) => {
  const { totalCommits, longestStreak, topLanguages, currentStreak } = stats;

  if (currentStreak >= 7 && currentStreak > 0) return '🔥 On Fire';
  if (longestStreak >= 365) return '👑 The Legend';
  if (longestStreak >= 180) return '📅 The Scheduler';
  if (totalCommits > 5000) return '💻 The Machine';
  if (totalCommits > 1000) return '🚀 The Powerhouse';
  if (topLanguages.length >= 3) return '🧠 The Polyglot';
  if (totalCommits > 500) return '⚡ The Coder';
  if (topLanguages[0]?.name === 'Python') return '🐍 The Pythonista';
  if (topLanguages[0]?.name === 'Rust') return '🦀 The Rustacean';
  if (topLanguages[0]?.name === 'Go') return '🐹 The Gopher';
  if (topLanguages[0]?.name === 'JavaScript' || topLanguages[0]?.name === 'TypeScript') return '⚡ The JavaScripter';

  return '🌟 The Contributor';
};

const getAllStats = async (username) => {
  const [user, repos, contributionData, followers] = await Promise.all([
    getUser(username),
    getUserRepos(username),
    getUserEvents(username),
    getUserFollowers(username)
  ]);

  const { contributionDates, totalCommits, totalContributions, totalIssues, totalPRs } = processCommits(contributionData);
  const { longest: longestStreak, current: currentStreak } = calculateStreak(contributionDates);
  const topLanguages = calculateTopLanguages(repos);
  const totalStars = calculateTotalStars(repos);

  // Use actual contribution data instead of REST API events
  const stats = {
    username: user.login,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    followersCount: followers.followersCount,
    followingCount: followers.followingCount,
    totalCommits: totalContributions, // Total contributions is the most accurate metric
    totalPRs: totalPRs,
    totalIssues: totalIssues,
    totalStars,
    topLanguages,
    longestStreak,
    currentStreak,
    mostActiveDay: 'N/A', // Can't determine from contribution calendar alone
    mostActiveHour: 'N/A', // Can't determine from contribution calendar alone
    timeOfDay: 'Unknown',
    publicRepos: user.public_repos,
    repositoriesContributed: contributionData.totalRepositoryContributions || 0
  };

  stats.personalityBadge = assignPersonalityBadge(stats);

  return stats;
};

module.exports = {
  getAllStats,
  calculateStreak,
  calculateTopLanguages,
  calculateTotalStars,
  calculateTotalPRs,
  getMostActiveDay,
  getMostActiveHour,
  assignPersonalityBadge
};