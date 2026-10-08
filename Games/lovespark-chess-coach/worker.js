'use strict';

importScripts('vendor/chess.js', 'vendor/betafish.js');

const DEFAULT_MOVETIME_MS = 1200;
const MATE_THRESHOLD = 28900;
const MATE_BASE = 29000;
const MAX_PV_PLIES = 6;

const sharedEngine = globalThis.LoveSparkBetafishEngine();

function normalizeInput(inputType, inputText) {
  const trimmed = (inputText || '').trim();

  if (!trimmed) {
    throw new Error(inputType === 'pgn' ? 'Paste a PGN first.' : 'Paste a FEN first.');
  }

  const chess = new Chess();

  if (inputType === 'fen') {
    chess.load(trimmed);
  } else if (inputType === 'pgn') {
    chess.loadPgn(trimmed);
  } else {
    throw new Error('Unknown input type.');
  }

  if (chess.moves().length === 0) {
    throw new Error('This position has no legal moves to analyze.');
  }

  return {
    normalizedFen: chess.fen(),
  };
}

function parseUciMove(moveUci) {
  if (!moveUci || moveUci.length < 4) {
    return null;
  }

  return {
    from: moveUci.slice(0, 2),
    to: moveUci.slice(2, 4),
    promotion: moveUci.length > 4 ? moveUci.slice(4, 5).toLowerCase() : undefined,
  };
}

function buildSanLine(startFen, moveList) {
  const chess = new Chess(startFen);
  const sanMoves = [];

  for (const moveUci of moveList.slice(0, MAX_PV_PLIES)) {
    const parsedMove = parseUciMove(moveUci);
    if (!parsedMove) {
      break;
    }

    const result = chess.move(parsedMove);
    if (!result) {
      break;
    }

    sanMoves.push(result.san);
  }

  return sanMoves;
}

function toWhitePerspective(rawScore, sideToMove) {
  return sideToMove === 'w' ? rawScore : -rawScore;
}

function toMateScore(rawScore, sideToMove) {
  if (Math.abs(rawScore) < MATE_THRESHOLD) {
    return null;
  }

  const movesToMate = Math.max(1, Math.ceil((MATE_BASE - Math.abs(rawScore)) / 2));
  const sideToMoveMate = rawScore > 0 ? movesToMate : -movesToMate;
  return sideToMove === 'w' ? sideToMoveMate : -sideToMoveMate;
}

function analyzeFen(normalizedFen, movetimeMs) {
  sharedEngine.reset();
  sharedEngine.setFEN(normalizedFen);
  sharedEngine.setThinkingTime(Math.max(0.2, movetimeMs / 1000));

  const originalConsoleLog = console.log;
  try {
    console.log = function() {};
    return sharedEngine.analyzePosition();
  } finally {
    console.log = originalConsoleLog;
  }
}

function analyzeRequest(request) {
  let normalizedFen = '';

  try {
    normalizedFen = normalizeInput(request.inputType, request.inputText).normalizedFen;
  } catch (error) {
    return {
      status: 'invalid_input',
      errorMessage: error instanceof Error ? error.message : 'Invalid notation.',
    };
  }

  const sideToMove = normalizedFen.split(' ')[1] || 'w';

  try {
    const engineResult = analyzeFen(normalizedFen, request.movetimeMs || DEFAULT_MOVETIME_MS);
    if (!engineResult || !engineResult.bestMove) {
      throw new Error('The local engine did not return a move.');
    }

    const bestMoveSan = buildSanLine(normalizedFen, [engineResult.bestMove])[0] || engineResult.bestMove;
    const pvSan = buildSanLine(normalizedFen, engineResult.pv || []);
    const mateScore = toMateScore(engineResult.score, sideToMove);
    const sanMateScore = mateScore === null && bestMoveSan.endsWith('#')
      ? (sideToMove === 'w' ? 1 : -1)
      : mateScore;

    return {
      status: 'ok',
      normalizedFen: normalizedFen,
      bestMoveSan: bestMoveSan,
      bestMoveUci: engineResult.bestMove,
      evaluationCp: sanMateScore === null ? toWhitePerspective(engineResult.score, sideToMove) : undefined,
      evaluationMate: sanMateScore === null ? undefined : sanMateScore,
      pvSan: pvSan.length ? pvSan : [bestMoveSan],
    };
  } catch (error) {
    return {
      status: 'engine_error',
      errorMessage: error instanceof Error ? error.message : 'Local engine failure.',
    };
  }
}

self.addEventListener('message', function(event) {
  const data = event.data || {};
  if (data.type !== 'ANALYZE' || !data.requestId) {
    return;
  }

  const result = analyzeRequest(data.payload || {});
  self.postMessage({ requestId: data.requestId, result: result });
});
