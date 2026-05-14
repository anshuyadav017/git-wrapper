const axios = require('axios');
const { defaultCache } = require('../utils/cache');
const { NotFoundError, RateLimitError, ExternalServiceError } = require('../utils/errors');

const GITHUB_API_BASE = 'https://api.github.com';
const ONE_YEAR_AGO = new Date();
ONE_YEAR_AGO.setFullYear(ONE_YEAR_AGO.getFullYear() - 1);

const getHeaders = () => {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-Wrapped-App'
  };
  if (process.env.TOKEN) {
    headers['Authorization'] = `token ${process.env.TOKEN}`;
  }
  return headers;
};

const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, { ...options, headers: getHeaders() });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) throw new NotFoundError('User not found');
      if (error.response?.status === 403 && error.response?.data?.message?.includes('rate limit')) {
        throw new RateLimitError();
      }
      if (i === retries - 1) throw new ExternalServiceError('Failed to fetch GitHub data');
    }
  }
};

const getUser = async (username) => {
  const cacheKey = `user:${username}`;
  const cached = defaultCache.get(cacheKey);
  if (cached) return cached;

  const user = await fetchWithRetry(`${GITHUB_API_BASE}/users/${username}`);
  defaultCache.set(cacheKey, user);
  return user;
};

const getUserRepos = async (username) => {
  const cacheKey = `repos:${username}`;
  const cached = defaultCache.get(cacheKey);
  if (cached) return cached;

  let repos = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchWithRetry(
      `${GITHUB_API_BASE}/users/${username}/repos?per_page=100&page=${page}&sort=updated`
    );
    if (data.length === 0) {
      hasMore = false;
    } else {
      repos = [...repos, ...data];
      page++;
    }
  }

  defaultCache.set(cacheKey, repos);
  return repos;
};

// Get full year contribution data using GitHub GraphQL API
// Fetches from contributionsCollection which includes ALL contributions:
// - Commits (totalCommitContributions)
// - Pull Requests (totalPullRequestContributions)
// - Issues (totalIssueContributions)
// - Repositories contributed to (totalRepositoryContributions)
// - Total contributions overall (totalContributions)
// - Contribution calendar with daily data for streak calculation
const getUserContributionData = async (username) => {
  const cacheKey = `contributions:${username}`;
  const cached = defaultCache.get(cacheKey);
  if (cached) return cached;

  if (!process.env.TOKEN) {
    throw new ExternalServiceError('GitHub token required for contribution data');
  }

  try {
    // Calculate date range: last 1 full year
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // GraphQL query to fetch contribution statistics from GitHub
    // Using 'contributionsCollection' endpoint which aggregates all types of contributions
    const graphqlQuery = `{
      user(login: "${username}") {
        contributionsCollection(from: "${oneYearAgo.toISOString()}", to: "${today.toISOString()}") {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalRepositoryContributions
        }
      }
    }`;

    const response = await axios.post(
      'https://api.github.com/graphql',
      { query: graphqlQuery },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.errors) {
      throw new Error(response.data.errors[0]?.message || 'GraphQL error');
    }

    const collection = response.data?.data?.user?.contributionsCollection;
    if (!collection) {
      throw new ExternalServiceError('Failed to fetch contribution data');
    }

    // Extract all contribution dates
    const contributionDates = [];
    collection.contributionCalendar.weeks.forEach(week => {
      week.contributionDays.forEach(day => {
        if (day.contributionCount > 0) {
          contributionDates.push(new Date(day.date));
        }
      });
    });

    const data = {
      totalContributions: collection.contributionCalendar.totalContributions,
      totalCommitContributions: collection.totalCommitContributions,
      totalIssueContributions: collection.totalIssueContributions,
      totalPullRequestContributions: collection.totalPullRequestContributions,
      totalRepositoryContributions: collection.totalRepositoryContributions,
      contributionDates: contributionDates,
      weeks: collection.contributionCalendar.weeks
    };

    defaultCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching contribution data:', error.message);
    throw new ExternalServiceError('Failed to fetch GitHub contribution data');
  }
};

const getUserEvents = async (username) => {
  // Returns contribution data (not individual events/commits)
  // This function uses GitHub GraphQL API which provides accurate
  // full-year contribution statistics instead of 90-day event logs
  return await getUserContributionData(username);
};

const getUserStarred = async (username) => {
  const cacheKey = `starred:${username}`;
  const cached = defaultCache.get(cacheKey);
  if (cached) return cached;

  let starred = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchWithRetry(
      `${GITHUB_API_BASE}/users/${username}/starred?per_page=100&page=${page}`
    );
    if (data.length === 0) {
      hasMore = false;
    } else {
      starred = [...starred, ...data];
      page++;
    }
  }

  defaultCache.set(cacheKey, starred);
  return starred;
};

const getUserFollowers = async (username) => {
  const cacheKey = `followers:${username}`;
  const cached = defaultCache.get(cacheKey);
  if (cached) return cached;

  const followers = await fetchWithRetry(`${GITHUB_API_BASE}/users/${username}/followers?per_page=1`);
  const following = await fetchWithRetry(`${GITHUB_API_BASE}/users/${username}/following?per_page=1`);

  const result = {
    followersCount: Array.isArray(followers) ? followers.length : 0,
    followingCount: Array.isArray(following) ? following.length : 0
  };

  defaultCache.set(cacheKey, result);
  return result;
};

module.exports = {
  getUser,
  getUserRepos,
  getUserEvents,
  getUserStarred,
  getUserFollowers
};