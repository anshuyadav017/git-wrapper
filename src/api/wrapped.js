const express = require('express');
const router = express.Router();
const { getAllStats } = require('../services/statsService');
const { generateRoast, generatePraise } = require('../services/aiService');

router.get('/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const stats = await getAllStats(username);

    const [roast, praise] = await Promise.all([
      generateRoast(stats),
      generatePraise(stats)
    ]);

    res.json({
      success: true,
      data: {
        ...stats,
        roast,
        praise
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;