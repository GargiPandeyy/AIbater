const express = require('express');
const { initialState, getPublicState, opposite } = require('../state');

function createDebateRouter(llm) {
  const router = express.Router();
  let state = initialState();
  let generating = false;

  async function maybeConclude() {
    if (state.currentTurn >= state.totalTurns && !state.concluded) {
      const conclusion = await llm.generateConclusion(state.topic, state.history);
      state.concluded = true;
      state.conclusion = conclusion;
    }
  }

  router.post('/start', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const { topic, totalTurns, startSide } = req.body || {};
    if (!topic || !['for', 'against'].includes(startSide)) {
      return res.status(400).json({ error: 'topic and startSide required' });
    }
    const turns = Math.max(2, Math.min(200, parseInt(totalTurns, 10) || 20));
    state = initialState();
    state.topic = String(topic);
    state.totalTurns = turns;
    state.nextSide = startSide;
    generating = false;
    
    const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const response = getPublicState(state);
    response.sessionId = sessionId;
    return res.json(response);
  });

  router.get('/state', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    return res.json(getPublicState(state));
  });

  router.post('/next', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    if (state.concluded) return res.json(getPublicState(state));
    if (generating) return res.json(getPublicState(state));
    generating = true;
    try {
      const stance = state.nextSide;
      const content = await llm.generateArgument(state.topic, stance, state.history);
      const index = state.history.length;
      state.history.push({ index, origin: 'ai', stance, content });
      state.currentTurn += 1;
      state.nextSide = opposite(stance);
      await maybeConclude();
      return res.json(getPublicState(state));
    } catch (err) {
      console.error('Error generating argument', err);
      return res.status(500).json({ error: 'generation_failed' });
    } finally {
      generating = false;
    }
  });

  router.post('/conclude', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    if (!state.concluded) {
      await maybeConclude();
    }
    return res.json(getPublicState(state));
  });

  return router;
}

module.exports = { createDebateRouter };


