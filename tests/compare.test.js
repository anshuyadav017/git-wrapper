const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/services/statsService', () => ({
  getAllStats: jest.fn().mockImplementation((username) => {
    const stats = {
      username,
      avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
      bio: 'Test bio',
      followersCount: 100,
      followingCount: 50,
      totalCommits: 500,
      totalPRs: 50,
      totalStars: 200,
      topLanguages: [{ name: 'JavaScript', percentage: 60 }],
      longestStreak: 30,
      currentStreak: 7,
      mostActiveDay: 'Monday',
      mostActiveHour: '2 PM',
      timeOfDay: 'night owl',
      publicRepos: 10,
      personalityBadge: '🔥 On Fire',
      roast: 'Mock roast'
    };
    return Promise.resolve(stats);
  })
}));

jest.mock('../src/services/aiService', () => ({
  generateRoast: jest.fn().mockResolvedValue('Mock roast')
}));

jest.mock('../src/services/imageService', () => ({
  drawCompareCard: jest.fn().mockResolvedValue(Buffer.from('compare-image-data'))
}));

describe('Compare API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /compare/:username1/:username2', () => {
    test('returns PNG image for two users', async () => {
      const response = await request(app).get('/compare/user1/user2');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
    });

    test('returns non-empty buffer', async () => {
      const response = await request(app).get('/compare/user1/user2');
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('sets cache headers', async () => {
      const response = await request(app).get('/compare/user1/user2');
      expect(response.headers['cache-control']).toContain('public');
    });

    test('calls getAllStats twice in parallel', async () => {
      const statsService = require('../src/services/statsService');
      const { getAllStats } = statsService;

      await request(app).get('/compare/testuser1/testuser2');

      expect(getAllStats).toHaveBeenCalledTimes(2);
      expect(getAllStats).toHaveBeenCalledWith('testuser1');
      expect(getAllStats).toHaveBeenCalledWith('testuser2');
    });
  });
});