
function initialState() {
  return {
    topic: '',
    totalTurns: 20,
    currentTurn: 0,
    nextSide: 'for',
    concluded: false,
    conclusion: null,
    history: []
  };
}

function getPublicState(state) {
  return {
    topic: state.topic,
    totalTurns: state.totalTurns,
    currentTurn: state.currentTurn,
    nextSide: state.nextSide,
    history: state.history,
    concluded: state.concluded,
    conclusion: state.conclusion
  };
}

function opposite(side) { return side === 'for' ? 'against' : 'for'; }
module.exports = { initialState, getPublicState, opposite };
