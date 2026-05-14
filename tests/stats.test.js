const {
  calculateStreak,
  calculateTopLanguages,
  calculateTotalStars,
  calculateTotalPRs,
  getMostActiveDay,
  getMostActiveHour,
  assignPersonalityBadge
} = require('../src/services/statsService');

describe('Stats Service', () => {
  describe('calculateStreak', () => {
    test('returns 0 for empty dates', () => {
      const result = calculateStreak([]);
      expect(result).toEqual({ longest: 0, current: 0 });
    });

    test('calculates longest streak correctly', () => {
      const dates = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03'),
        new Date('2024-01-05'),
        new Date('2024-01-06')
      ];
      const result = calculateStreak(dates);
      expect(result.longest).toBe(3);
    });

    test('calculates current streak for recent dates', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dates = [today, yesterday];
      const result = calculateStreak(dates);
      expect(result.current).toBe(2);
    });
  });

  describe('calculateTopLanguages', () => {
    test('returns sorted languages by count', () => {
      const repos = [
        { language: 'JavaScript' },
        { language: 'JavaScript' },
        { language: 'Python' },
        { language: 'TypeScript' }
      ];
      const result = calculateTopLanguages(repos);
      expect(result[0].name).toBe('JavaScript');
      expect(result[0].percentage).toBe(50);
    });

    test('returns empty array for no languages', () => {
      const result = calculateTopLanguages([{}]);
      expect(result).toHaveLength(0);
    });
  });

  describe('calculateTotalStars', () => {
    test('sums all stars correctly', () => {
      const repos = [
        { stargazers_count: 100 },
        { stargazers_count: 50 },
        { stargazers_count: 25 }
      ];
      expect(calculateTotalStars(repos)).toBe(175);
    });

    test('handles missing stargazers_count', () => {
      const repos = [{ stargazers_count: 10 }, {}];
      expect(calculateTotalStars(repos)).toBe(10);
    });
  });

  describe('calculateTotalPRs', () => {
    test('counts pull request events', () => {
      const events = [
        { type: 'PullRequestEvent' },
        { type: 'PullRequestEvent' },
        { type: 'PushEvent' }
      ];
      expect(calculateTotalPRs(events)).toBe(2);
    });

    test('returns 0 for no PRs', () => {
      const events = [{ type: 'PushEvent' }];
      expect(calculateTotalPRs(events)).toBe(0);
    });
  });

  describe('getMostActiveDay', () => {
    test('returns day with most commits', () => {
      const commits = { Monday: 10, Tuesday: 5, Wednesday: 15 };
      expect(getMostActiveDay(commits)).toBe('Wednesday');
    });

    test('returns Unknown for empty object', () => {
      expect(getMostActiveDay({})).toBe('Unknown');
    });
  });

  describe('getMostActiveHour', () => {
    test('returns formatted hour', () => {
      const commits = { 14: 10, 2: 5, 22: 15 };
      expect(getMostActiveHour(commits)).toBe('10 PM');
    });

    test('handles 12 PM correctly', () => {
      const commits = { 12: 10 };
      expect(getMostActiveHour(commits)).toBe('12 PM');
    });
  });

  describe('assignPersonalityBadge', () => {
    test('assigns On Fire badge for high current streak', () => {
      const stats = {
        currentStreak: 10,
        longestStreak: 10,
        totalCommits: 50,
        topLanguages: [{ name: 'JavaScript' }],
        mostActiveHour: '2 PM'
      };
      expect(assignPersonalityBadge(stats)).toBe('🔥 On Fire');
    });

    test('assigns The Midnight Coder for late night activity', () => {
      const stats = {
        currentStreak: 1,
        longestStreak: 5,
        totalCommits: 20,
        topLanguages: [{ name: 'JavaScript' }],
        mostActiveHour: '2 AM'
      };
      expect(assignPersonalityBadge(stats)).toBe('🌙 The Midnight Coder');
    });

    test('assigns The Polyglot for many languages', () => {
      const stats = {
        currentStreak: 1,
        longestStreak: 3,
        totalCommits: 50,
        topLanguages: [
          { name: 'JavaScript' },
          { name: 'Python' },
          { name: 'Go' },
          { name: 'Rust' },
          { name: 'Ruby' }
        ],
        mostActiveHour: '2 PM'
      };
      expect(assignPersonalityBadge(stats)).toBe('🧠 The Polyglot');
    });
  });
});