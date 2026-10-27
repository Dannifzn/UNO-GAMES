const { MODES, COLORS, FLIP_SIDES } = require('./constants');

class BotAI {
  static getBestColor(hand, game) {
    const isDark = game.mode === MODES.FLIP && game.flipSide === FLIP_SIDES.DARK;
    const availableColors = isDark 
      ? [COLORS.PINK, COLORS.TEAL, COLORS.ORANGE, COLORS.PURPLE]
      : [COLORS.RED, COLORS.YELLOW, COLORS.GREEN, COLORS.BLUE];

    const counts = {};
    availableColors.forEach(c => (counts[c] = 0));

    hand.forEach(c => {
      const face = game.getCardFace(c);
      if (counts[face.color] !== undefined) {
        counts[face.color]++;
      }
    });

    let bestColor = availableColors[0];
    let maxCount = -1;
    availableColors.forEach(c => {
      if (counts[c] > maxCount) {
        maxCount = counts[c];
        bestColor = c;
      }
    });

    return bestColor;
  }

  static decideMove(botPlayer, game) {
    if (botPlayer.id !== game.getCurrentPlayer().id) return null;

    // Handle pending action if bot is required to respond
    if (game.pendingAction && game.pendingAction.playerId === botPlayer.id) {
      if (game.pendingAction.type === 'color_picker') {
        const chosenColor = this.getBestColor(botPlayer.hand, game);
        return {
          action: 'play_card',
          cardId: game.pendingAction.cardId,
          chosenColor
        };
      } else if (game.pendingAction.type === 'swap_target') {
        // Pick active opponent with least cards!
        const opponents = game.getActivePlayers().filter(p => p.id !== botPlayer.id);
        opponents.sort((a, b) => a.hand.length - b.hand.length);
        const target = opponents[0] || opponents[0];
        return {
          action: 'play_card',
          cardId: game.pendingAction.cardId,
          chosenColor: game.pendingAction.chosenColor,
          targetSwapPlayerId: target ? target.id : null
        };
      }
    }

    // Filter playable cards
    const playableCards = botPlayer.hand.filter(c => game.canPlayCard(c, botPlayer.id));

    // Bot UNO call logic: if bot currently has 2 cards, it will call UNO immediately when playing!
    const willCallUno = botPlayer.hand.length === 2;

    if (playableCards.length === 0) {
      // Must draw
      return { action: 'draw' };
    }

    // Prioritize cards:
    // If pending penalty stack is active, must play valid penalty card
    if (game.pendingDrawCount > 0) {
      // Pick penalty card
      const penaltyCard = playableCards[0];
      const face = game.getCardFace(penaltyCard);
      const chosenColor = face.type === 'wild' ? this.getBestColor(botPlayer.hand, game) : null;
      return {
        action: 'play_card',
        cardId: penaltyCard.id,
        chosenColor,
        callUno: willCallUno
      };
    }

    // Normal play strategy:
    // 1. Try to play matching number or action card first (save wilds for later)
    const nonWilds = playableCards.filter(c => game.getCardFace(c).type !== 'wild');
    let chosenCard = null;

    if (nonWilds.length > 0) {
      // Prefer high impact cards (skip, reverse, draw, flip) or matching color
      chosenCard = nonWilds.find(c => {
        const f = game.getCardFace(c);
        return f.type === 'action' || f.value === '0' || f.value === '7';
      }) || nonWilds[0];
    } else {
      chosenCard = playableCards[0];
    }

    const face = game.getCardFace(chosenCard);
    let chosenColor = null;
    if (face.type === 'wild') {
      chosenColor = this.getBestColor(botPlayer.hand, game);
    }

    // If card is 7 in No Mercy, prepare target swap
    let targetSwapPlayerId = null;
    if (game.mode === MODES.NO_MERCY && face.value === '7' && game.allowSevenZero) {
      const opponents = game.getActivePlayers().filter(p => p.id !== botPlayer.id);
      opponents.sort((a, b) => a.hand.length - b.hand.length);
      if (opponents.length > 0) {
        targetSwapPlayerId = opponents[0].id;
      }
    }

    return {
      action: 'play_card',
      cardId: chosenCard.id,
      chosenColor,
      targetSwapPlayerId,
      callUno: willCallUno
    };
  }

  static checkUnoChallenge(game) {
    // Check if any opponent has 1 card and forgot to call UNO
    const vulnerable = game.getActivePlayers().filter(p => p.hand.length === 1 && !p.calledUno && !p.isBot);
    if (vulnerable.length > 0) {
      // Challenge the first one
      return vulnerable[0].id;
    }
    return null;
  }
}

module.exports = BotAI;
