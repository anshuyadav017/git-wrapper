const axios = require('axios');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const callOpenRouter = async (messages, model = 'meta-llama/llama-2-70b-chat', temperature = 0.9) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: 300,
        top_p: 0.95,
        top_k: 40
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://github-wrapped.app',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return response.data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenRouter API error:', error.message);
    throw error;
  }
};

const generateRoast = async (stats) => {
  const prompt = `You are a witty GitHub code analyst. Roast this developer based on their stats:

📊 Stats:
• Commits: ${stats.totalCommits}
• Longest Streak: ${stats.longestStreak} days
• Current Streak: ${stats.currentStreak} days
• Top Language: ${stats.topLanguages[0]?.name || 'JavaScript'}
• PRs: ${stats.totalPRs}
• Stars: ${stats.totalStars}
• Badge: ${stats.personalityBadge}

📝 Write a FUNNY, BRUTAL but WITTY roast (2-3 sentences). Use emojis. Reference their specific stats. Make it memorable!`;

  try {
    const roast = await callOpenRouter(
      [{ role: 'user', content: prompt }],
      'meta-llama/llama-2-70b-chat',
      1.2
    );
    return roast.trim() || getFallbackRoast(stats);
  } catch (error) {
    console.error('Roast generation failed:', error.message);
    return getFallbackRoast(stats);
  }
};

const generatePraise = async (stats) => {
  const prompt = `You are an inspirational tech mentor. Give genuine, motivational praise to this developer:

📊 Stats:
• Commits: ${stats.totalCommits}
• Longest Streak: ${stats.longestStreak} days
• Current Streak: ${stats.currentStreak} days
• Top Language: ${stats.topLanguages[0]?.name || 'JavaScript'}
• PRs: ${stats.totalPRs}
• Stars: ${stats.totalStars}
• Badge: ${stats.personalityBadge}

🌟 Write MOTIVATIONAL praise (2-3 sentences). Highlight their real strengths. Use emojis. Make them feel proud of their journey!`;

  try {
    const praise = await callOpenRouter(
      [{ role: 'user', content: prompt }],
      'meta-llama/llama-2-70b-chat',
      0.7
    );
    return praise.trim() || getFallbackPraise(stats);
  } catch (error) {
    console.error('Praise generation failed:', error.message);
    return getFallbackPraise(stats);
  }
};

const generateCardTitle = async (stats) => {
  const prompt = `Create a SHORT, CATCHY title for a GitHub wrapped card (max 6 words). Be creative and fun!

Developer: @${stats.username}
Badge: ${stats.personalityBadge}
Top Language: ${stats.topLanguages[0]?.name || 'JavaScript'}`;

  try {
    const title = await callOpenRouter(
      [{ role: 'user', content: prompt }],
      'mistral/mistral-7b-instruct',
      0.8
    );
    return title.trim().slice(0, 50) || `🌟 ${stats.username}'s Code Odyssey`;
  } catch (error) {
    return `🌟 ${stats.username}'s Code Odyssey`;
  }
};

const generateCardDescription = async (stats) => {
  const prompt = `Write a SHORT one-liner summary of this developer's GitHub year (max 20 words). Make it inspiring!

Commits: ${stats.totalCommits}, Streak: ${stats.longestStreak} days, Badge: ${stats.personalityBadge}`;

  try {
    const description = await callOpenRouter(
      [{ role: 'user', content: prompt }],
      'mistral/mistral-7b-instruct',
      0.7
    );
    return description.trim().slice(0, 100) || 'An incredible year of coding and growth';
  } catch (error) {
    return 'An incredible year of coding and growth';
  }
};

const getFallbackRoast = (stats) => {
  const roasts = [
    `Wow, ${stats.totalCommits} commits? That's either impressive or you've been committing random auto-generated code. Either way, respect. 💀`,
    `${stats.currentStreak} day streak? That's not dedication, that's a cry for help. But we respect the grind. 🔥`,
    `${stats.topLanguages[0]?.name || 'everything'} developer? Bold choice. Hope your debugging sessions are going well. 🐛`,
    `${stats.totalPRs} PRs opened but only ${Math.max(1, Math.floor(stats.totalPRs * 0.3))} merged? Ouch. The code is out there, rejection is real. 💔`,
    `${stats.longestStreak} days straight? Someone's avoiding real life responsibilities. We support it. 🙌`
  ];
  return roasts[Math.floor(Math.random() * roasts.length)];
};

const getFallbackPraise = (stats) => {
  const praises = [
    `${stats.totalCommits} commits in a year? That's real work. You're building something, and it shows. Keep shipping! 🚀`,
    `${stats.currentStreak} day streak! Consistency is the secret weapon most developers never master. You're winning. 🏆`,
    `${stats.topLanguages[0]?.name || 'code'} is your thing? Niche mastery is underrated. You're becoming the go-to person. 💪`,
    `${stats.totalPRs} contributions to open source? You're not just using code, you're giving back. Legendary move. ⭐`,
    `${stats.longestStreak} day streak? That's not luck, that's discipline. The market rewards people who show up every day. 📈`
  ];
  return praises[Math.floor(Math.random() * praises.length)];
};

module.exports = {
  generateRoast,
  generatePraise,
  generateCardTitle,
  generateCardDescription
};