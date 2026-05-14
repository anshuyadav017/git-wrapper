const express = require('express');
const router = express.Router();
const { getAllStats } = require('../services/statsService');
const { generateRoast } = require('../services/aiService');
const { drawCompareCard } = require('../services/imageService');

router.get('/:username1/:username2', async (req, res, next) => {
  try {
    const { username1, username2 } = req.params;

    const [stats1, stats2] = await Promise.all([
      getAllStats(username1),
      getAllStats(username2)
    ]);

    const [roast1, roast2] = await Promise.all([
      generateRoast(stats1),
      generateRoast(stats2)
    ]);

    const imageBuffer = await drawCompareCard(
      { ...stats1, roast: roast1 },
      { ...stats2, roast: roast2 }
    );

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(imageBuffer);
  } catch (error) {
    next(error);
  }
});

module.exports = router;