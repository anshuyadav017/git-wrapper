const express = require('express');
const router = express.Router();
const { getAllStats } = require('../services/statsService');
const { generateRoast } = require('../services/aiService');
const { drawWrappedCard } = require('../services/imageService');

router.get('/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const stats = await getAllStats(username);
    const roast = await generateRoast(stats);

    const imageBuffer = await drawWrappedCard({ ...stats, roast });

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Card generation error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate card image'
    });
  }
});

module.exports = router;