const { MODES, COLORS } = require('./constants');

class Deck {
  static createDeck(mode) {
    if (mode === MODES.FLIP) {
      return this.createFlipDeck();
    } else if (mode === MODES.NO_MERCY) {
      return this.createNoMercyDeck();
    } else {
      return this.createClassicDeck();
    }
  }

  static createClassicDeck() {
    const cards = [];
    let idCounter = 1;
    const colors = [COLORS.RED, COLORS.YELLOW, COLORS.GREEN, COLORS.BLUE];

    colors.forEach(color => {
      // 1x 0 card
      cards.push({ id: `c_${idCounter++}`, color, value: '0', type: 'number' });

      // 2x 1-9
      for (let i = 1; i <= 9; i++) {
        cards.push({ id: `c_${idCounter++}`, color, value: String(i), type: 'number' });
        cards.push({ id: `c_${idCounter++}`, color, value: String(i), type: 'number' });
      }

      // 2x skip, reverse, draw2
      for (let i = 0; i < 2; i++) {
        cards.push({ id: `c_${idCounter++}`, color, value: 'skip', type: 'action' });
        cards.push({ id: `c_${idCounter++}`, color, value: 'reverse', type: 'action' });
        cards.push({ id: `c_${idCounter++}`, color, value: 'draw2', type: 'action' });
      }
    });

    // 4x wild, 4x wild_draw4
    for (let i = 0; i < 4; i++) {
      cards.push({ id: `c_${idCounter++}`, color: COLORS.WILD, value: 'wild', type: 'wild' });
      cards.push({ id: `c_${idCounter++}`, color: COLORS.WILD, value: 'wild_draw4', type: 'wild' });
    }

    return this.shuffle(cards);
  }

  static createFlipDeck() {
    const cards = [];
    let idCounter = 1;
    const lightColors = [COLORS.RED, COLORS.YELLOW, COLORS.GREEN, COLORS.BLUE];
    const darkColors = [COLORS.PINK, COLORS.TEAL, COLORS.ORANGE, COLORS.PURPLE];

    // Generate 112 cards with light and dark properties
    const lightPool = [];
    const darkPool = [];

    // Light pool
    lightColors.forEach(color => {
      // 1-9 twice
      for (let i = 1; i <= 9; i++) {
        lightPool.push({ color, value: String(i), type: 'number' });
        lightPool.push({ color, value: String(i), type: 'number' });
      }
      // Action cards: draw1, reverse, skip, flip (2 each)
      for (let i = 0; i < 2; i++) {
        lightPool.push({ color, value: 'draw1', type: 'action' });
        lightPool.push({ color, value: 'reverse', type: 'action' });
        lightPool.push({ color, value: 'skip', type: 'action' });
        lightPool.push({ color, value: 'flip', type: 'action' });
      }
    });
    // 4x wild, 4x wild_draw2
    for (let i = 0; i < 4; i++) {
      lightPool.push({ color: COLORS.WILD, value: 'wild', type: 'wild' });
      lightPool.push({ color: COLORS.WILD, value: 'wild_draw2', type: 'wild' });
    }

    // Dark pool
    darkColors.forEach(color => {
      // 1-9 twice
      for (let i = 1; i <= 9; i++) {
        darkPool.push({ color, value: String(i), type: 'number' });
        darkPool.push({ color, value: String(i), type: 'number' });
      }
      // Action cards: draw5, reverse, skip_everyone, flip (2 each)
      for (let i = 0; i < 2; i++) {
        darkPool.push({ color, value: 'draw5', type: 'action' });
        darkPool.push({ color, value: 'reverse', type: 'action' });
        darkPool.push({ color, value: 'skip_everyone', type: 'action' });
        darkPool.push({ color, value: 'flip', type: 'action' });
      }
    });
    // 4x wild, 4x wild_draw_color
    for (let i = 0; i < 4; i++) {
      darkPool.push({ color: COLORS.WILD, value: 'wild', type: 'wild' });
      darkPool.push({ color: COLORS.WILD, value: 'wild_draw_color', type: 'wild' });
    }

    // Shuffle darkPool to pair randomly with lightPool
    const shuffledDark = this.shuffle(darkPool);

    for (let i = 0; i < lightPool.length; i++) {
      cards.push({
        id: `flip_${idCounter++}`,
        isFlipCard: true,
        light: lightPool[i],
        dark: shuffledDark[i]
      });
    }

    return this.shuffle(cards);
  }

  static createNoMercyDeck() {
    const cards = [];
    let idCounter = 1;
    const colors = [COLORS.RED, COLORS.YELLOW, COLORS.GREEN, COLORS.BLUE];

    colors.forEach(color => {
      // 1x 0 (Pass Hand rule)
      cards.push({ id: `nm_${idCounter++}`, color, value: '0', type: 'number', special: 'pass_all' });

      // 2x 1-9 (Note: 7 has swap hand rule)
      for (let i = 1; i <= 9; i++) {
        const special = i === 7 ? 'swap_hand' : null;
        cards.push({ id: `nm_${idCounter++}`, color, value: String(i), type: 'number', special });
        cards.push({ id: `nm_${idCounter++}`, color, value: String(i), type: 'number', special });
      }

      // Actions per color:
      // 2x draw2
      // 2x draw4
      // 2x skip
      // 2x reverse
      // 2x discard_all
      // 2x skip_everyone
      // 2x color_roulette
      for (let i = 0; i < 2; i++) {
        cards.push({ id: `nm_${idCounter++}`, color, value: 'draw2', type: 'action' });
        cards.push({ id: `nm_${idCounter++}`, color, value: 'draw4', type: 'action' });
        cards.push({ id: `nm_${idCounter++}`, color, value: 'skip', type: 'action' });
        cards.push({ id: `nm_${idCounter++}`, color, value: 'reverse', type: 'action' });
        cards.push({ id: `nm_${idCounter++}`, color, value: 'discard_all', type: 'action' });
        cards.push({ id: `nm_${idCounter++}`, color, value: 'skip_everyone', type: 'action' });
        cards.push({ id: `nm_${idCounter++}`, color, value: 'color_roulette', type: 'action' });
      }
    });

    // Wilds in No Mercy:
    // 8x Wild
    // 4x Wild Draw 6
    // 4x Wild Draw 10
    // 4x Wild Reverse Draw 4
    for (let i = 0; i < 8; i++) {
      cards.push({ id: `nm_${idCounter++}`, color: COLORS.WILD, value: 'wild_color_roulette', type: 'wild' });
    }
    for (let i = 0; i < 4; i++) {
      cards.push({ id: `nm_${idCounter++}`, color: COLORS.WILD, value: 'wild_draw6', type: 'wild' });
      cards.push({ id: `nm_${idCounter++}`, color: COLORS.WILD, value: 'wild_draw10', type: 'wild' });
      cards.push({ id: `nm_${idCounter++}`, color: COLORS.WILD, value: 'wild_reverse_draw4', type: 'wild' });
    }

    return this.shuffle(cards);
  }

  static shuffle(deck) {
    const arr = [...deck];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

module.exports = Deck;
