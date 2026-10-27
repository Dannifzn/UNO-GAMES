(function(root) {
  const { MODES, COLORS, FLIP_SIDES, MERCY_CARD_LIMIT } = (typeof module !== 'undefined' && module.exports && typeof require === 'function')
    ? require('./constants')
    : (root.UnoConstants || window.UnoConstants);
  const Deck = (typeof module !== 'undefined' && module.exports && typeof require === 'function')
    ? require('./Deck')
    : (root.Deck || window.Deck);

class UnoGame {
  constructor(id, options = {}) {
    this.id = id;
    this.mode = options.mode || MODES.CLASSIC; // classic, flip, no_mercy
    this.stacking = options.stacking !== undefined ? options.stacking : true; // allow stacking penalties
    this.mercyKnockout = options.mercyKnockout !== undefined ? options.mercyKnockout : true;
    this.allowSevenZero = options.allowSevenZero !== undefined ? options.allowSevenZero : true;
    this.endGameCondition = options.endGameCondition || 'first_winner'; // 'first_winner' or 'until_one_left'

    this.players = []; // { id, name, isBot, hand: [], calledUno: false, eliminated: false, finished: false, rank: null }
    this.deck = [];
    this.discardPile = [];
    this.currentColor = null;
    this.currentValue = null;
    this.currentTurnIndex = 0;
    this.direction = 1; // 1 = clockwise, -1 = counter-clockwise
    this.flipSide = FLIP_SIDES.LIGHT; // For UNO Flip
    this.pendingDrawCount = 0;
    this.pendingPenaltyType = null; // 'draw2', 'draw4', 'draw6', 'draw10', 'draw5'
    this.pendingAction = null; // e.g. { type: 'color_picker', playerId }, { type: 'swap_target', playerId }
    this.winner = null;
    this.previousWinnerId = null; // Stored across rounds so previous winner plays first!
    this.rankings = []; // [{ id, name, rank }]
    this.gameStarted = false;
    this.gameOver = false;
    this.logs = [];
  }

  log(msg) {
    this.logs.push({ text: msg, time: Date.now() });
    if (this.logs.length > 50) this.logs.shift();
  }

  addPlayer(id, name, isBot = false) {
    if (this.gameStarted) return false;
    if (this.players.find(p => p.id === id)) return false;
    this.players.push({
      id,
      name,
      isBot,
      hand: [],
      calledUno: false,
      eliminated: false,
      finished: false,
      rank: null
    });
    this.log(`${name} bergabung ke dalam room.`);
    return true;
  }

  removePlayer(id) {
    const idx = this.players.findIndex(p => p.id === id);
    if (idx !== -1) {
      const p = this.players[idx];
      this.log(`${p.name} keluar dari permainan.`);
      this.players.splice(idx, 1);
      if (this.gameStarted) {
        if (this.currentTurnIndex >= this.players.length) {
          this.currentTurnIndex = 0;
        }
        this.checkGameEnd();
      }
      return true;
    }
    return false;
  }

  start() {
    if (this.players.length < 2) return false;
    this.deck = Deck.createDeck(this.mode);
    this.discardPile = [];
    this.flipSide = FLIP_SIDES.LIGHT;
    this.pendingDrawCount = 0;
    this.pendingPenaltyType = null;
    this.pendingAction = null;
    this.direction = 1;
    this.winner = null;
    this.rankings = [];
    this.gameOver = false;
    this.gameStarted = true;

    // Reset player hands & statuses
    this.players.forEach(p => {
      p.hand = [];
      p.calledUno = false;
      p.eliminated = false;
      p.finished = false;
      p.rank = null;
      for (let i = 0; i < 7; i++) {
        p.hand.push(this.drawFromDeck());
      }
    });

    // Initial discard card (must not be wild)
    let initialCard = this.drawFromDeck();
    let face = this.getCardFace(initialCard);
    while (face.type === 'wild') {
      this.deck.push(initialCard);
      this.deck = Deck.shuffle(this.deck);
      initialCard = this.drawFromDeck();
      face = this.getCardFace(initialCard);
    }

    this.discardPile.push(initialCard);
    this.currentColor = face.color;
    this.currentValue = face.value;

    // Winner of previous game goes first!
    if (this.previousWinnerId) {
      const prevWinnerIdx = this.players.findIndex(p => p.id === this.previousWinnerId);
      if (prevWinnerIdx !== -1) {
        this.currentTurnIndex = prevWinnerIdx;
        this.log(`Game baru dimulai! Pemenang sebelumnya (${this.getCurrentPlayer().name}) mendapatkan giliran pertama!`);
      } else {
        this.currentTurnIndex = 0;
        this.log(`Game dimulai dengan mode: ${this.mode.toUpperCase()}! Giliran pertama: ${this.getCurrentPlayer().name}.`);
      }
    } else {
      this.currentTurnIndex = 0;
      this.log(`Game dimulai dengan mode: ${this.mode.toUpperCase()}! Giliran pertama: ${this.getCurrentPlayer().name}.`);
    }

    return true;
  }

  getCardFace(card, side = this.flipSide) {
    if (!card) return null;
    if (card.isFlipCard) {
      return side === FLIP_SIDES.DARK ? card.dark : card.light;
    }
    return {
      color: card.color,
      value: card.value,
      type: card.type,
      special: card.special
    };
  }

  drawFromDeck() {
    if (this.deck.length === 0) {
      if (this.discardPile.length <= 1) {
        // Fallback if all cards are in players hands
        this.deck = Deck.createDeck(this.mode);
        this.log(`⚠️ Tumpukan kartu telah habis! Mengambil dek baru untuk permainan.`);
      } else {
        const topCard = this.discardPile.pop();
        this.deck = Deck.shuffle(this.discardPile);
        this.discardPile = [topCard];
        this.log(`🔄 Tumpukan kartu ambil habis! Seluruh ${this.deck.length} kartu buang dikocok ulang menjadi deck baru.`);
      }
    }
    return this.deck.pop();
  }

  cancelPendingAction(playerId) {
    if (this.pendingAction && this.pendingAction.playerId === playerId) {
      this.pendingAction = null;
      const p = this.players.find(pl => pl.id === playerId);
      if (p) {
        this.log(`${p.name} membatalkan aksi dan memilih kartu lain.`);
      }
      return true;
    }
    return false;
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  getActivePlayers() {
    return this.players.filter(p => !p.eliminated && !p.finished);
  }

  advanceTurn(skipCount = 1) {
    const active = this.getActivePlayers();
    if (active.length <= 1) {
      this.checkGameEnd();
      return;
    }

    for (let i = 0; i < skipCount; i++) {
      do {
        this.currentTurnIndex = (this.currentTurnIndex + this.direction + this.players.length) % this.players.length;
      } while (this.players[this.currentTurnIndex].eliminated || this.players[this.currentTurnIndex].finished);
    }
  }

  canPlayCard(card, playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.id !== this.getCurrentPlayer().id) return false;
    if (this.pendingAction) return false;
    if (player.finished || player.eliminated) return false;

    const face = this.getCardFace(card);
    if (!face) return false;

    // Penalty Stacking Logic
    if (this.pendingDrawCount > 0 && this.stacking) {
      return this.canStackPenalty(face.value);
    } else if (this.pendingDrawCount > 0 && !this.stacking) {
      // Must draw if stacking disabled
      return false;
    }

    // Normal play logic
    if (face.type === 'wild') return true;
    if (face.color === this.currentColor) return true;
    if (face.value === this.currentValue) return true;

    return false;
  }

  canPlayInCombo(card, player) {
    if (!player || player.id !== this.getCurrentPlayer()?.id) return false;
    const cardFace = this.getCardFace(card);
    if (!cardFace) return false;

    // Check if player holds another card with the same value/action that can be played on current board
    return player.hand.some(otherCard => {
      if (otherCard.id === card.id) return false;
      const otherFace = this.getCardFace(otherCard);
      return otherFace && otherFace.value === cardFace.value && this.canPlayCard(otherCard, player.id);
    });
  }

  canStackPenalty(cardValue) {
    const penaltyRank = {
      draw1: 1,
      draw2: 2,
      draw4: 4,
      wild_draw2: 2,
      draw5: 5,
      wild_draw4: 4,
      wild_reverse_draw4: 4,
      wild_draw6: 6,
      wild_draw10: 10
    };

    const currentRank = penaltyRank[this.pendingPenaltyType] || 0;
    const incomingRank = penaltyRank[cardValue] || 0;

    if (incomingRank === 0) return false;

    if (this.mode === MODES.NO_MERCY) {
      // In No Mercy, can stack equal or higher penalty!
      return incomingRank >= currentRank;
    } else {
      // In classic/flip: stack matching rank (e.g. +2 on +2, +4 on +4)
      return incomingRank === currentRank;
    }
  }

  getPenaltyAmount(cardValue) {
    switch (cardValue) {
      case 'draw1': return 1;
      case 'draw2': return 2;
      case 'draw4': return 4;
      case 'wild_draw2': return 2;
      case 'wild_draw4': return 4;
      case 'wild_reverse_draw4': return 4;
      case 'draw5': return 5;
      case 'wild_draw6': return 6;
      case 'wild_draw10': return 10;
      default: return 0;
    }
  }

  playCard(playerId, cardIds, chosenColor = null, targetSwapPlayerId = null) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.id !== this.getCurrentPlayer().id) {
      return { success: false, message: 'Bukan giliran Anda!' };
    }

    const ids = Array.isArray(cardIds) ? cardIds : [cardIds];
    if (ids.length === 0) {
      return { success: false, message: 'Pilih minimal 1 kartu untuk dimainkan!' };
    }

    // Find all cards from player's hand
    const cardsToPlay = [];
    for (const id of ids) {
      const c = player.hand.find(card => card.id === id);
      if (!c) {
        return { success: false, message: 'Salah satu kartu tidak ada di tangan!' };
      }
      cardsToPlay.push(c);
    }

    const firstCard = cardsToPlay[0];
    const firstFace = this.getCardFace(firstCard);

    // If stacking multiple cards, all cards must have identical value or action
    if (cardsToPlay.length > 1) {
      const matchValue = firstFace.value;
      const allSameValue = cardsToPlay.every(c => this.getCardFace(c).value === matchValue);
      if (!allSameValue) {
        return { success: false, message: 'Kartu yang ditumpuk harus memiliki angka atau kegunaan aksi yang sama!' };
      }

      // Check if at least one card in the combo is directly playable on the current board
      const playableIndex = cardsToPlay.findIndex(c => this.canPlayCard(c, playerId));
      if (playableIndex === -1) {
        return { success: false, message: 'Tidak ada kartu dalam tumpukan yang cocok dengan meja!' };
      }

      // Move the playable card to be the first card (base of the discard stack)
      if (playableIndex !== 0) {
        const playableCard = cardsToPlay.splice(playableIndex, 1)[0];
        cardsToPlay.unshift(playableCard);
      }
    } else {
      // Single card must be playable on current board state
      if (!this.canPlayCard(firstCard, playerId)) {
        return { success: false, message: 'Kartu tidak cocok dengan kartu di meja!' };
      }
    }

    // If wild or wild action and no chosenColor provided, request color picker
    if (firstFace.type === 'wild' && !chosenColor) {
      this.pendingAction = {
        type: 'color_picker',
        playerId,
        cardIds: ids
      };
      return { success: true, needsColor: true };
    }

    // In No Mercy, 7 requires swapping with another player
    if (this.mode === MODES.NO_MERCY && firstFace.value === '7' && this.allowSevenZero) {
      const otherPlayers = this.getActivePlayers().filter(p => p.id !== playerId);
      if (otherPlayers.length > 0 && !targetSwapPlayerId) {
        this.pendingAction = {
          type: 'swap_target',
          playerId,
          cardIds: ids,
          chosenColor
        };
        return { success: true, needsTargetSwap: true, targets: otherPlayers.map(p => ({ id: p.id, name: p.name })) };
      }
    }

    // Remove all played cards from hand and push to discardPile
    ids.forEach(id => {
      const idx = player.hand.findIndex(c => c.id === id);
      if (idx !== -1) {
        const c = player.hand.splice(idx, 1)[0];
        this.discardPile.push(c);
      }
    });
    this.pendingAction = null;

    // Last card determines active color and value
    const lastCard = cardsToPlay[cardsToPlay.length - 1];
    const lastFace = this.getCardFace(lastCard);

    // Handle Discard All in No Mercy
    if (this.mode === MODES.NO_MERCY && firstFace.value === 'discard_all') {
      const matchColor = firstFace.color;
      const discarded = [];
      player.hand = player.hand.filter(c => {
        const cFace = this.getCardFace(c);
        if (cFace.color === matchColor) {
          discarded.push(c);
          return false;
        }
        return true;
      });
      discarded.forEach(d => this.discardPile.push(d));
      if (discarded.length > 0) {
        this.log(`${player.name} membuang ${discarded.length} kartu tambahan dengan 'Discard All'!`);
      }
    }

    // Update current card & color
    this.currentValue = lastFace.value;
    this.currentColor = chosenColor || lastFace.color;

    if (cardsToPlay.length > 1) {
      this.log(`💥 ${player.name} MENUMPUK ${cardsToPlay.length} KARTU [${firstFace.value.toUpperCase()}] SEKALIGUS! Meja menjadi [${this.currentColor.toUpperCase()} ${this.currentValue.toUpperCase()}].`);
    } else {
      this.log(`${player.name} memainkan [${firstFace.color.toUpperCase()} ${firstFace.value.toUpperCase()}].`);
    }

    // UNO call check: if player now has 1 card
    if (player.hand.length === 1 && !player.calledUno) {
      // Allowed to call UNO immediately, otherwise vulnerable
    } else if (player.hand.length > 1) {
      player.calledUno = false;
    }

    // Check Win / Finish Condition
    if (player.hand.length === 0) {
      if (this.endGameCondition === 'first_winner') {
        this.winner = player;
        this.previousWinnerId = player.id;
        this.gameOver = true;
        this.rankings = [{ id: player.id, name: player.name, rank: 1 }];
        this.log(`🏆 Selamat! ${player.name} memenangkan permainan!`);
        return { success: true, gameOver: true, winner: player, rankings: this.rankings };
      } else {
        // Multi-winner ranking ('until_one_left')
        player.finished = true;
        const currentRank = this.rankings.length + 1;
        player.rank = currentRank;
        this.rankings.push({ id: player.id, name: player.name, rank: currentRank });

        if (currentRank === 1) {
          this.previousWinnerId = player.id;
          this.winner = player;
          this.log(`🥇 ${player.name} berhasil menghabiskan kartu dan meraih JUARA 1! Permainan dilanjutkan untuk sisa pemain.`);
        } else {
          this.log(`🏅 ${player.name} meraih JUARA ${currentRank}!`);
        }

        const remainingActive = this.getActivePlayers();
        if (remainingActive.length <= 1) {
          if (remainingActive.length === 1) {
            const lastPlayer = remainingActive[0];
            lastPlayer.rank = this.rankings.length + 1;
            this.rankings.push({ id: lastPlayer.id, name: lastPlayer.name, rank: lastPlayer.rank });
          }
          this.gameOver = true;
          this.log(`🏆 Permainan selesai! Seluruh peringkat juara telah ditentukan.`);
          return { success: true, gameOver: true, winner: this.winner, rankings: this.rankings };
        }

        this.advanceTurn(1);
        return { success: true };
      }
    }

    // Process Card Effects
    this.resolveCardEffect(player, firstFace, cardsToPlay, targetSwapPlayerId);

    return { success: true };
  }

  resolveCardEffect(player, firstFace, cardsToPlay, targetSwapPlayerId) {
    const val = firstFace.value;
    const cardCount = cardsToPlay.length;
    const lastCard = cardsToPlay[cardsToPlay.length - 1];

    // 1. Flip card logic
    if (val === 'flip') {
      if (cardCount % 2 === 1) {
        this.flipSide = this.flipSide === FLIP_SIDES.LIGHT ? FLIP_SIDES.DARK : FLIP_SIDES.LIGHT;
      }
      const topDiscardFace = this.getCardFace(lastCard, this.flipSide);
      this.currentColor = topDiscardFace.color === COLORS.WILD ? COLORS.RED : topDiscardFace.color;
      this.currentValue = topDiscardFace.value;
      this.log(`🔄 Permainan di-FLIP ke sisi ${this.flipSide.toUpperCase()}! Warna sekarang: ${this.currentColor.toUpperCase()}.`);
      this.advanceTurn(1);
      return;
    }

    // 2. Reverse
    if (val === 'reverse') {
      const activeCount = this.getActivePlayers().length;
      if (activeCount === 2) {
        this.log(`Reverse pada 2 pemain berlaku sebagai Skip (${cardCount}x)!`);
        this.advanceTurn(cardCount + 1);
      } else {
        if (cardCount % 2 === 1) {
          this.direction *= -1;
          this.log(`Arah putaran dibalik!`);
        } else {
          this.log(`Reverse genap (${cardCount}x) dimainkan (arah putaran kembali seperti semula)!`);
        }
        this.advanceTurn(1);
      }
      return;
    }

    // 3. Skip
    if (val === 'skip') {
      if (cardCount > 1) {
        this.log(`⛔ ${cardCount} pemain berikutnya dilewati (Multi-Skip)!`);
        this.advanceTurn(cardCount + 1);
      } else {
        this.log(`Pemain berikutnya dilewati (Skip)!`);
        this.advanceTurn(2);
      }
      return;
    }

    // 4. Skip Everyone (Uno Flip Dark / No Mercy)
    if (val === 'skip_everyone') {
      this.log(`⛔ ${player.name} memainkan SKIP EVERYONE! Giliran kembali ke ${player.name}.`);
      return;
    }

    // 5. Penalties (Draw 1, 2, 4, 5, 6, 10, Wild Reverse Draw 4)
    const penaltyAmount = this.getPenaltyAmount(val);
    if (penaltyAmount > 0) {
      const totalPenalty = penaltyAmount * cardCount;
      if (val === 'wild_reverse_draw4') {
        if (cardCount % 2 === 1) this.direction *= -1;
        this.log(`Arah dibalik dan +${totalPenalty} penalti ditambahkan!`);
      }
      this.pendingDrawCount += totalPenalty;
      this.pendingPenaltyType = val;
      this.log(`Penalti bertumpuk menjadi +${this.pendingDrawCount}!`);
      this.advanceTurn(1);
      return;
    }

    // 6. Wild Draw Color (Uno Flip Dark)
    if (val === 'wild_draw_color') {
      this.advanceTurn(1);
      const victim = this.getCurrentPlayer();
      this.log(`🎯 ${victim.name} harus mengambil kartu sampai dapat warna ${this.currentColor.toUpperCase()}!`);
      let drawnCount = 0;
      let matched = false;
      while (!matched) {
        const drawn = this.drawFromDeck();
        victim.hand.push(drawn);
        drawnCount++;
        const dFace = this.getCardFace(drawn);
        if (dFace.color === this.currentColor || dFace.type === 'wild') {
          matched = true;
        }
        if (drawnCount > 25) break; // safety
      }
      this.log(`${victim.name} mengambil ${drawnCount} kartu dan gilirannya dilewati!`);
      this.checkMercyRule(victim);
      this.advanceTurn(1);
      return;
    }

    // 7. Color Roulette (Uno No Mercy)
    if (val === 'color_roulette') {
      this.advanceTurn(1);
      const victim = this.getCurrentPlayer();
      this.log(`🎰 Color Roulette aktif! ${victim.name} harus mengambil kartu sampai dapat warna ${this.currentColor.toUpperCase()}!`);
      let drawnCount = 0;
      let matched = false;
      while (!matched) {
        const drawn = this.drawFromDeck();
        victim.hand.push(drawn);
        drawnCount++;
        const dFace = this.getCardFace(drawn);
        if (dFace.color === this.currentColor || dFace.type === 'wild') {
          matched = true;
        }
        if (drawnCount > 25) break;
      }
      this.log(`${victim.name} menarik ${drawnCount} kartu dan giliran dilewati.`);
      this.checkMercyRule(victim);
      this.advanceTurn(1);
      return;
    }

    // 8. Number 0 (Pass Hands in current direction) - No Mercy
    if (this.mode === MODES.NO_MERCY && val === '0' && this.allowSevenZero) {
      this.log(`🌪️ KARTU 0 DIMAINKAN! Semua pemain mengoper seluruh kartu ke arah putaran!`);
      const active = this.getActivePlayers();
      if (active.length > 1) {
        if (this.direction === 1) {
          const lastHand = active[active.length - 1].hand;
          for (let i = active.length - 1; i > 0; i--) {
            active[i].hand = active[i - 1].hand;
          }
          active[0].hand = lastHand;
        } else {
          const firstHand = active[0].hand;
          for (let i = 0; i < active.length - 1; i++) {
            active[i].hand = active[i + 1].hand;
          }
          active[active.length - 1].hand = firstHand;
        }
      }
      this.advanceTurn(1);
      return;
    }

    // 9. Number 7 (Swap hand with chosen player) - No Mercy
    if (this.mode === MODES.NO_MERCY && val === '7' && this.allowSevenZero && targetSwapPlayerId) {
      const targetPlayer = this.players.find(p => p.id === targetSwapPlayerId);
      if (targetPlayer) {
        this.log(`🔄 ${player.name} bertukar seluruh kartu dengan ${targetPlayer.name}!`);
        const tempHand = player.hand;
        player.hand = targetPlayer.hand;
        targetPlayer.hand = tempHand;
      }
      this.advanceTurn(1);
      return;
    }

    // Standard card
    this.advanceTurn(1);
  }

  playerDraw(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.id !== this.getCurrentPlayer().id) {
      return { success: false, message: 'Bukan giliran Anda!' };
    }

    if (this.pendingAction) {
      return { success: false, message: 'Selesaikan aksi pemilihan terlebih dahulu!' };
    }

    // If there was a pending penalty stack (e.g. +4, +6)
    if (this.pendingDrawCount > 0) {
      const count = this.pendingDrawCount;
      for (let i = 0; i < count; i++) {
        player.hand.push(this.drawFromDeck());
      }
      this.log(`${player.name} tidak bisa/memilih tidak menumpuk penalti dan mengambil ${count} kartu!`);
      this.pendingDrawCount = 0;
      this.pendingPenaltyType = null;
      this.checkMercyRule(player);
      this.advanceTurn(1);
      return { success: true, count, penalty: true };
    }

    // Normal draw 1 card
    const drawn = this.drawFromDeck();
    player.hand.push(drawn);
    this.log(`${player.name} mengambil 1 kartu dari deck.`);
    this.checkMercyRule(player);

    this.advanceTurn(1);
    return { success: true, card: drawn };
  }

  checkMercyRule(player) {
    if (this.mode === MODES.NO_MERCY && this.mercyKnockout) {
      if (player.hand.length >= MERCY_CARD_LIMIT) {
        player.eliminated = true;
        this.log(`☠️ MERCY RULE! ${player.name} memiliki ${player.hand.length} kartu (>= 25) dan TERELIMINASI!`);
        this.checkGameEnd();
      }
    }
  }

  callUno(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.eliminated || player.finished) return { success: false };

    // If player legitimately has 1 card:
    if (player.hand.length === 1) {
      player.calledUno = true;
      this.log(`📢 ${player.name} meneriakkan: "UNO!"`);
      return { success: true, valid: true };
    } else {
      // FALSE UNO CALL PENALTY: Player does NOT have 1 card!
      player.hand.push(this.drawFromDeck());
      this.log(`🚨 ${player.name} berteriak UNO palsu (kartunya ${player.hand.length - 1}, bukan 1) dan dikenakan penalti +1 kartu!`);
      this.checkMercyRule(player);
      return { success: true, valid: false, penalty: true };
    }
  }

  challengeUno(challengerId, targetId) {
    const target = this.players.find(p => p.id === targetId);
    const challenger = this.players.find(p => p.id === challengerId);
    if (!target || !challenger) return false;

    if (target.hand.length === 1 && !target.calledUno) {
      // Caught! Penalty is drawing 1 card as requested
      target.hand.push(this.drawFromDeck());
      this.log(`🚨 ${challenger.name} memergoki ${target.name} tidak meneriakkan UNO! ${target.name} terkena penalti +1 kartu!`);
      this.checkMercyRule(target);
      return true;
    }
    return false;
  }

  checkGameEnd() {
    const active = this.getActivePlayers();
    if (active.length <= 1) {
      if (active.length === 1 && this.endGameCondition === 'until_one_left') {
        const lastPlayer = active[0];
        lastPlayer.rank = this.rankings.length + 1;
        this.rankings.push({ id: lastPlayer.id, name: lastPlayer.name, rank: lastPlayer.rank });
      } else if (active.length === 1 && !this.winner) {
        this.winner = active[0];
        this.previousWinnerId = active[0].id;
        this.rankings = [{ id: active[0].id, name: active[0].name, rank: 1 }];
      }

      this.gameOver = true;
      this.log(`🏆 Permainan selesai! Pemenang utama: ${this.winner ? this.winner.name : '-'}`);
    } else if (active.length === 0) {
      this.gameOver = true;
      this.log(`Permainan berakhir tanpa sisa pemain.`);
    }
  }

  getGameState(playerId) {
    const activeCurrent = this.getCurrentPlayer();
    const topCard = this.discardPile[this.discardPile.length - 1];
    const topFace = this.getCardFace(topCard);

    return {
      gameId: this.id,
      mode: this.mode,
      flipSide: this.flipSide,
      currentColor: this.currentColor,
      currentValue: this.currentValue,
      direction: this.direction,
      pendingDrawCount: this.pendingDrawCount,
      pendingAction: this.pendingAction,
      currentTurnPlayerId: activeCurrent ? activeCurrent.id : null,
      topDiscardCard: {
        ...topCard,
        displayFace: topFace
      },
      deckCount: this.deck.length,
      gameOver: this.gameOver,
      winner: this.winner ? { id: this.winner.id, name: this.winner.name } : null,
      previousWinnerId: this.previousWinnerId,
      rankings: this.rankings,
      endGameCondition: this.endGameCondition,
      deckTopOppositeFace: (this.mode === 'flip' && this.deck.length > 0) 
        ? (this.flipSide === 'light' ? this.deck[0].dark : this.deck[0].light) 
        : null,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        isBot: p.isBot,
        cardCount: p.hand.length,
        calledUno: p.calledUno,
        eliminated: p.eliminated,
        finished: p.finished || false,
        rank: p.rank || null,
        oppositeCards: (this.mode === 'flip' && p.id !== playerId) ? p.hand.map(c => ({
          id: c.id,
          oppositeFace: this.flipSide === 'light' ? c.dark : c.light
        })) : null,
        // Only return full hand to the player requesting it
        hand: p.id === playerId ? p.hand.map(c => ({
          ...c,
          displayFace: this.getCardFace(c),
          oppositeFace: this.mode === 'flip' ? (this.flipSide === 'light' ? c.dark : c.light) : null,
          playable: this.canPlayCard(c, p.id) || this.canPlayInCombo(c, p)
        })) : null
      })),
      logs: this.logs.slice(-10)
    };
  }
}

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnoGame;
  }
  if (typeof window !== 'undefined') {
    window.UnoGame = UnoGame;
  }
})(typeof self !== 'undefined' ? self : this);
