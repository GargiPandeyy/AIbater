const express = require('express');
const router = express.Router();
const debateRoutes = require('../routes/debate');

router.use('/debate', debateRoutes);

router.get('/', (req, res) => {
  res.json({
    name: 'Cosmic Debate Arena API',
    version: '1.0.0',
    endpoints: {
      debate: '/api/debate'
    }
  });
});

module.exports = router;
