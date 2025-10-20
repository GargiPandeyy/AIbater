function validateTopic(topic) {
  if (!topic || typeof topic !== 'string') {
    throw new Error('Topic is required');
  }

  const trimmed = topic.trim();

  if (trimmed.length < 5) {
    throw new Error('Topic too short (min 5 characters)');
  }

  if (trimmed.length > 500) {
    throw new Error('Topic too long (max 500 characters)');
  }

  return trimmed;
}

function validateTurns(turns) {
  const num = parseInt(turns, 10);

  if (isNaN(num) || num < 2 || num > 200) {
    throw new Error('Turns must be between 2 and 200');
  }

  return num;
}

function validateSide(side) {
  if (!side || typeof side !== 'string') {
    throw new Error('Side is required');
  }

  const lower = side.toLowerCase().trim();

  if (lower !== 'for' && lower !== 'against') {
    throw new Error('Side must be "for" or "against"');
  }

  return lower;
}

function validateArgument(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('Argument content is required');
  }

  const trimmed = content.trim();

  if (trimmed.length < 10) {
    throw new Error('Argument too short (min 10 characters)');
  }

  if (trimmed.length > 1000) {
    throw new Error('Argument too long (max 1000 characters)');
  }

  return trimmed;
}

function validateSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Session ID is required');
  }

  if (sessionId.length < 8) {
    throw new Error('Invalid session ID');
  }

  return sessionId.trim();
}

module.exports = {
  validateTopic,
  validateTurns,
  validateSide,
  validateArgument,
  validateSessionId
};
