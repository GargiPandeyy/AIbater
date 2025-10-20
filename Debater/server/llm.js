const { GoogleGenerativeAI } = require('@google/generative-ai');

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (e) {
    return null;
  }
}

function formatHistoryForPrompt(history, maxItems = 8) {
  const items = history.slice(-maxItems);

  return items.map(it => {
    const who = it.origin === 'user' ? 'User' : 'AI';
    const side = it.stance.toUpperCase();
    return `#${it.index + 1} [${who} ${side}] ${it.content}`;
  }).join('\n');
}

function createMockLLM() {
  const openings = {
    for: [
      'Logically speaking, this approach maximizes overall benefit for the greatest number of people.',
      'The evidence clearly demonstrates that this solution addresses the core issue effectively.',
      'From a systematic perspective, this method provides the most comprehensive solution.',

      'This aligns with our fundamental values of fairness and equality for all individuals.',
      'We have a moral obligation to pursue solutions that benefit future generations.',
      'This represents the compassionate choice that puts human dignity first.',

      'Real-world implementation shows this approach works effectively in similar situations.',
      'Practical experience demonstrates the reliability and sustainability of this method.',
      'This solution has been successfully applied in comparable scenarios with positive results.'
    ],
    against: [
      'The proposed solution overlooks critical flaws that would lead to unintended consequences.',
      'Available evidence suggests this approach would create more problems than it solves.',
      'A careful analysis reveals fundamental weaknesses in the underlying assumptions.',

      'This approach raises serious ethical questions about individual rights and autonomy.',
      'We must consider the potential harm to vulnerable populations before proceeding.',
      'The moral implications of this decision cannot be ignored or minimized.',

      'Practical implementation challenges make this solution unworkable in real-world conditions.',
      'Resource constraints and logistical issues render this approach impractical.',
      'Historical attempts to implement similar solutions have consistently failed.'
    ]
  };

  const connectors = [
    'Furthermore', 'Additionally', 'Moreover', 'Equally important', 'Building on this',
    'To elaborate further', 'Consider also that', 'Another key point is',
    'This is supported by', 'Evidence suggests', 'Experience shows', 'Research indicates'
  ];

  const counterResponses = {
    for: [
      'While the previous point raises valid concerns, the overall benefits still outweigh the risks.',
      'Although there are challenges, this approach provides the best path forward.',
      'The concerns mentioned are real, but the proposed solution addresses them effectively.'
    ],
    against: [
      'This approach fails to account for the significant drawbacks that have been identified.',
      'The proposed benefits are theoretical, while the real-world problems are substantial.',
      'Previous attempts at similar solutions have demonstrated these fundamental flaws.'
    ]
  };

  function sample(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  return {
    async generateArgument(topic, stance, history) {
      const debateLength = history.length;
      const lastArgument = history[history.length - 1];
      const opposingArguments = history.filter(h => h.stance !== stance);

      let argumentStyle = 'opening';
      if (debateLength > 2 && opposingArguments.length > 0) {
        argumentStyle = 'rebuttal';
      } else if (debateLength > 6) {
        argumentStyle = 'closing';
      }

      const opening = sample(openings[stance]);

      const connector = sample(connectors);

      let contextualElement = '';

      if (argumentStyle === 'rebuttal' && lastArgument) {
        contextualElement = ` Addressing the previous point about ${topic.toLowerCase()},`;
      } else if (argumentStyle === 'closing') {
        contextualElement = ' Ultimately,';
      }

      const baseArgument = `${opening}.${contextualElement} ${connector}, this ${stance === 'for' ? 'affirmative' : 'negative'} position on "${topic}" is not only defensible but essential for progress.`;

      if (debateLength < 3) {
        return `${baseArgument} The fundamental principles supporting this view are well-established and widely recognized.`;
      } else if (opposingArguments.length > 2) {
        return `${baseArgument} While counterarguments have been raised, they fail to account for the comprehensive benefits this approach delivers.`;
      } else {
        return `${baseArgument} Building on the points already established, we can see that this solution provides the most balanced and effective path forward.`;
      }
    },

    async generateConclusion(topic, history) {
      const forCount = history.filter(h => h.stance === 'for').length;
      const againstCount = history.filter(h => h.stance === 'against').length;
      const totalArguments = history.length;

      let verdict = 'FOR';
      let reasoning = '';

      if (forCount > againstCount) {
        verdict = 'FOR';
        reasoning = 'the affirmative arguments presented a more comprehensive and well-supported case';
      } else if (againstCount > forCount) {
        verdict = 'AGAINST';
      } else {
        const recentFor = history.slice(-3).filter(h => h.stance === 'for').length;
        const recentAgainst = history.slice(-3).filter(h => h.stance === 'against').length;

        if (recentFor >= recentAgainst) {
          verdict = 'FOR';
          reasoning = 'the affirmative side maintained stronger momentum in the latter stages of the debate';
        } else {
          verdict = 'AGAINST';
          reasoning = 'the negative side raised compelling final objections that were not adequately addressed';
        }
      }

      return `After a thoughtful and comprehensive examination of "${topic}", this debate has explored the nuances and implications from multiple perspectives. The discussion revealed ${totalArguments} distinct arguments, with ${forCount} in favor and ${againstCount} opposed.

The key insights that emerged include the importance of considering long-term consequences, the value of empirical evidence, and the need to balance competing priorities. While both sides presented compelling points, ${reasoning}.

Conclusion: The weight of evidence and reasoning presented throughout this debate leads to a verdict in favor of the ${verdict} position. This resolution encourages continued dialogue and consideration of the complex factors involved in addressing "${topic}".`;
    }
  };
}

function createGeminiLLM(client) {
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  return {
    async generateArgument(topic, stance, history) {
      const model = client.getGenerativeModel({ model: modelName });

      const context = formatHistoryForPrompt(history);

      const prompt = [
        'System: You are a concise, rigorous debate assistant. Provide 1-3 sentence arguments.',
        `Topic: "${topic}"`,
        `You argue for the ${stance.toUpperCase()} side. Consider prior points, avoid repetition, and add new reasoning.`,
        '',
        'Recent arguments:',
        context || '(none yet)',
        '',
        `Your ${stance} argument:`
      ].join('\n');

      try {
        const result = await model.generateContent(prompt);

        const text = result?.response?.text?.();
        if (text && typeof text === 'string' && text.trim()) {
          console.log('✅ Gemini API success');
          return text.trim();
        }
        console.warn('⚠️ Gemini returned empty response, using mock');
      } catch (e) {
        console.error('❌ Gemini API error:', e.message);
      }

      return createMockLLM().generateArgument(topic, stance, history);
    },

    async generateConclusion(topic, history) {
      const model = client.getGenerativeModel({ model: modelName });

      const context = formatHistoryForPrompt(history, 24);

      const prompt = [
        'System: You are a neutral debate judge. Write a balanced conclusion with a clear verdict.',
        `Topic: "${topic}"`,
        'Summarize the strongest points from each side in 2-4 sentences and then provide a single-sentence verdict beginning with "Conclusion:" choosing either FOR or AGAINST.',
        '',
        'Debate transcript (most recent last):',
        context || '(no arguments)'
      ].join('\n');

      try {
        const result = await model.generateContent(prompt);

        const text = result?.response?.text?.();
        if (text && typeof text === 'string' && text.trim()) {
          return text.trim();
        }
      } catch (e) {
      }

      return createMockLLM().generateConclusion(topic, history);
    }
  };
}

function createLLM() {
  if (process.env.USE_MOCK === '1') {
    return createMockLLM();
  }

  const client = createGeminiClient();

  if (!client) {
    return createMockLLM();
  }

  return createGeminiLLM(client);
}

module.exports = { createLLM };