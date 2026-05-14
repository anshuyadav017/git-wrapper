const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/services/githubService', () => ({
  getUser: jest.fn().mockResolvedValue({
    login: 'testuser',
    avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
    bio: 'Test bio',
    public_repos: 10,
    followers: 100,
    following: 50
  }),
  getUserRepos: jest.fn().mockResolvedValue([
    { language: 'JavaScript', stargazers_count: 10 },
    { language: 'Python', stargazers_count: 5 }
  ]),
  getUserEvents: jest.fn().mockResolvedValue([]),
  getUserStarred: jest.fn().mockResolvedValue([]),
  getUserFollowers: jest.fn().mockResolvedValue({
    followersCount: 100,
    followingCount: 50
  })
}));

jest.mock('../src/services/aiService', () => ({
  generateRoast: jest.fn().mockResolvedValue('Mock roast text'),
  generatePraise: jest.fn().mockResolvedValue('Mock praise text')
}));

describe('Wrapped API', () => {
  describe('GET /wrapped/:username', () => {
    test('returns wrapped data for valid username', async () => {
      const response = await request(app).get('/wrapped/testuser');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('username', 'testuser');
      expect(response.body.data).toHaveProperty('roast');
      expect(response.body.data).toHaveProperty('praise');
    });

    test('returns stats with correct structure', async () => {
      const response = await request(app).get('/wrapped/testuser');
      const data = response.body.data;
      expect(data).toHaveProperty('totalCommits');
      expect(data).toHaveProperty('longestStreak');
      expect(data).toHaveProperty('topLanguages');
      expect(data).toHaveProperty('personalityBadge');
    });
  });

  describe('GET /health', () => {
    test('returns health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});