(function(root) {
  const { MODES, COLORS, FLIP_SIDES } = (typeof module !== 'undefined' && module.exports && typeof require === 'function')
    ? require('./constants')
    : (root.UnoConstants || window.UnoConstants);

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

      if (playableCards.length === 0) {
        return { action: 'draw_card' };
      }

      // Priority Strategy:
      // 1. Play draw penalties if pending or available
      // 2. Play action cards (Skip, Reverse, Discard All)
      // 3. Play matching number cards
      // 4. Play Wild cards last to preserve color flexibility
      let chosenCard = null;

      const penaltyCards = playableCards.filter(c => {
        const f = game.getCardFace(c);
        return f.value.startsWith('draw') || f.value.includes('draw');
      });

      const actionCards = playableCards.filter(c => {
        const f = game.getCardFace(c);
        return f.type === 'action';
      });

      const numberCards = playableCards.filter(c => {
        const f = game.getCardFace(c);
        return f.type === 'number';
      });

      const wildCards = playableCards.filter(c => {
        const f = game.getCardFace(c);
        return f.type === 'wild';
      });

      if (game.pendingDrawCount > 0 && penaltyCards.length > 0) {
        chosenCard = penaltyCards[0];
      } else if (actionCards.length > 0) {
        chosenCard = actionCards[0];
      } else if (numberCards.length > 0) {
        // Prefer number of bot's dominant color
        const bestColor = this.getBestColor(botPlayer.hand, game);
        const matchDominant = numberCards.filter(c => game.getCardFace(c).color === bestColor);
        chosenCard = matchDominant.length > 0 ? matchDominant[0] : numberCards[0];
      } else if (penaltyCards.length > 0) {
        chosenCard = penaltyCards[0];
      } else if (wildCards.length > 0) {
        chosenCard = wildCards[0];
      } else {
        chosenCard = playableCards[0];
      }

      const cardFace = game.getCardFace(chosenCard);
      let chosenColor = null;
      let targetSwapPlayerId = null;

      // Call UNO if 2 cards remain before playing this card (1 left after play)
      const willCallUno = botPlayer.hand.length === 2;

      if (cardFace.type === 'wild' || cardFace.color === COLORS.WILD) {
        chosenColor = this.getBestColor(botPlayer.hand, game);
      }

      // If Rule 7 card (swap hands)
      if (game.allowSevenZero && cardFace.value === '7') {
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
      const vulnerable = game.getActivePlayers().filter(p => p.hand.length === 1 && !p.calledUno && !p.isBot);
      if (vulnerable.length > 0) {
        return vulnerable[0].id;
      }
      return null;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BotAI;
  }
  if (typeof window !== 'undefined') {
    window.BotAI = BotAI;
  }
})(typeof self !== 'undefined' ? self : this);
