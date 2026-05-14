const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/services/statsService', () => ({
  getAllStats: jest.fn().mockResolvedValue({
    username: 'testuser',
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
  })
}));

jest.mock('../src/services/aiService', () => ({
  generateRoast: jest.fn().mockResolvedValue('Mock roast')
}));

jest.mock('../src/services/imageService', () => ({
  drawWrappedCard: jest.fn().mockResolvedValue(Buffer.from('fake-image'))
}));

describe('Card API', () => {
  describe('GET /card/:username', () => {
    test('returns PNG image', async () => {
      const response = await request(app).get('/card/testuser');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
    });

    test('returns non-empty buffer', async () => {
      const response = await request(app).get('/card/testuser');
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('sets cache headers', async () => {
      const response = await request(app).get('/card/testuser');
      expect(response.headers['cache-control']).toContain('public');
    });
  });
});