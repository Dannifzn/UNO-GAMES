const socket = io();

// State
let myPlayerId = null;
let currentRoomId = null;
let isHost = false;
let currentGameState = null;
let pendingWildCardId = null;
let pendingSwapCardId = null;
let pendingChosenColor = null;
let isPeekActive = false;

// Audio toggle
document.getElementById('sound-toggle-btn').addEventListener('click', () => {
  const enabled = soundManager.toggle();
  document.getElementById('sound-toggle-btn').textContent = enabled ? '🔊' : '🔇';
});

// View switcher
function showView(viewId) {
  document.querySelectorAll('.app-view').forEach(v => v.style.display = 'none');
  const target = document.getElementById(viewId);
  if (target) target.style.display = 'flex';
}

// ==========================================
// BACK BUTTONS (LEAVE ROOM TO LOBBY)
// ==========================================
function returnToLobby() {
  const prevRoomId = currentRoomId;
  currentRoomId = null;
  currentGameState = null;
  isHost = false;
  selectedComboCardIds = [];
  updateComboBar();

  // Close all open modals
  const gameOverModal = document.getElementById('modal-game-over');
  if (gameOverModal) gameOverModal.classList.remove('active');
  const colorModal = document.getElementById('modal-color-picker');
  if (colorModal) colorModal.classList.remove('active');
  const swapModal = document.getElementById('modal-swap-picker');
  if (swapModal) swapModal.classList.remove('active');
  const emoteModalEl = document.getElementById('modal-emote-picker');
  if (emoteModalEl) emoteModalEl.classList.remove('active');
  const rulebook = document.getElementById('rulebook-modal');
  if (rulebook) rulebook.classList.remove('active');

  showView('view-lobby');
  if (prevRoomId) {
    socket.emit('leave_room', { roomId: prevRoomId });
  }
  UI.showToast('Kembali ke lobi utama');
}

const leaveWaitingBtn = document.getElementById('btn-leave-waiting');
const leaveArenaBtn = document.getElementById('btn-leave-arena');

if (leaveWaitingBtn) {
  leaveWaitingBtn.addEventListener('click', returnToLobby);
}

if (leaveArenaBtn) {
  leaveArenaBtn.addEventListener('click', returnToLobby);
}

socket.on('left_room_success', () => {
  returnToLobby();
});

// ==========================================
// EMOTE & QUICK CHAT SYSTEM
// ==========================================
const emoteModal = document.getElementById('modal-emote-picker');
const openEmotesBtn = document.getElementById('btn-open-emotes');
const closeEmotesBtn = document.getElementById('btn-close-emotes');

if (openEmotesBtn) {
  openEmotesBtn.addEventListener('click', () => {
    emoteModal.classList.add('active');
  });
}

if (closeEmotesBtn) {
  closeEmotesBtn.addEventListener('click', () => {
    emoteModal.classList.remove('active');
  });
}

// Emote Category tabs
document.querySelectorAll('.emote-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.emote-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.emote-section').forEach(s => s.classList.remove('active'));

    btn.classList.add('active');
    const targetCat = btn.dataset.cat;
    const targetSection = document.getElementById(targetCat);
    if (targetSection) targetSection.classList.add('active');
  });
});

// Emote click triggers
document.querySelectorAll('.emote-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.dataset.text;
    emoteModal.classList.remove('active');
    socket.emit('send_emote', {
      emoteText: text,
      emoteCategory: 'taunt'
    });
  });
});

// Receive Emote from any player
socket.on('player_emote', data => {
  soundManager.playCard(); // subtle audio pop

  if (data.playerId === myPlayerId) {
    // Show on local player dock
    const bubble = document.getElementById('local-player-speech-bubble');
    if (bubble) {
      bubble.textContent = `💬 "${data.emoteText}"`;
      bubble.style.display = 'block';
      setTimeout(() => {
        bubble.style.display = 'none';
      }, 3500);
    }
  } else {
    // Show on opponent seat
    const oppSeat = document.querySelector(`.opponent-seat[data-player-id="${data.playerId}"]`);
    if (oppSeat) {
      let bubble = oppSeat.querySelector('.player-speech-bubble');
      if (!bubble) {
        bubble = document.createElement('div');
        bubble.className = 'player-speech-bubble';
        oppSeat.appendChild(bubble);
      }
      bubble.textContent = `💬 "${data.emoteText}"`;
      bubble.style.display = 'block';
      setTimeout(() => {
        bubble.style.display = 'none';
      }, 3500);
    }
  }

  UI.showToast(`${data.playerName}: "${data.emoteText}"`);
});

// ==========================================
// RULEBOOK MODAL CONTROLS
// ==========================================
const rulebookModal = document.getElementById('modal-rulebook');
const openRulesHeader = document.getElementById('btn-open-rules-header');
const openRulesArena = document.getElementById('btn-open-rules-arena');
const closeRulesBtn = document.getElementById('btn-close-rules');

function openRulebook() {
  if (rulebookModal) rulebookModal.classList.add('active');
}

function closeRulebook() {
  if (rulebookModal) rulebookModal.classList.remove('active');
}

if (openRulesHeader) openRulesHeader.addEventListener('click', openRulebook);
if (openRulesArena) openRulesArena.addEventListener('click', openRulebook);
if (closeRulesBtn) closeRulesBtn.addEventListener('click', closeRulebook);

// Tab switching inside rulebook
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.rulebook-section').forEach(s => s.classList.remove('active'));

    btn.classList.add('active');
    const targetId = btn.dataset.tab;
    const targetSection = document.getElementById(targetId);
    if (targetSection) targetSection.classList.add('active');
  });
});

// Minimize / Expand Game Log Panel
const logPanel = document.getElementById('game-log-panel-box');
const toggleLogBtn = document.getElementById('btn-toggle-log');
if (toggleLogBtn && logPanel) {
  toggleLogBtn.addEventListener('click', () => {
    logPanel.classList.toggle('minimized');
    toggleLogBtn.textContent = logPanel.classList.contains('minimized') ? '+' : '−';
  });
}

// Peek Mode Toggle for UNO Flip
const peekFlipBtn = document.getElementById('btn-peek-flip-mode');
if (peekFlipBtn) {
  peekFlipBtn.addEventListener('click', () => {
    isPeekActive = !isPeekActive;
    const hand = document.getElementById('player-cards-container');
    if (hand) {
      if (isPeekActive) {
        hand.classList.add('peek-active');
        peekFlipBtn.classList.add('active');
        peekFlipBtn.textContent = '👁️ Kembali ke Depan';
      } else {
        hand.classList.remove('peek-active');
        peekFlipBtn.classList.remove('active');
        peekFlipBtn.textContent = '👁️ Intip Sisi Balik';
      }
    }
  });
}

// ==========================================
// LOBBY ACTIONS
// ==========================================

// Quick Play vs AI
document.getElementById('btn-play-ai').addEventListener('click', () => {
  soundManager.init();
  const name = document.getElementById('player-name-input').value.trim() || 'Player';
  const mode = document.querySelector('input[name="game-mode"]:checked').value;
  const stacking = document.getElementById('setting-stacking').checked;
  const mercyKnockout = document.getElementById('setting-mercy').checked;
  const allowSevenZero = document.getElementById('setting-seven-zero').checked;
  const endGameCondition = document.getElementById('setting-end-condition').value;

  socket.emit('create_room', {
    name,
    mode,
    stacking,
    mercyKnockout,
    allowSevenZero,
    endGameCondition
  });

  // Auto add 3 bots after room creation
  socket.once('room_created', () => {
    socket.emit('add_bot');
    socket.emit('add_bot');
    socket.emit('add_bot');
    setTimeout(() => {
      socket.emit('start_game');
    }, 400);
  });
});

// Create Room for Friends
document.getElementById('btn-create-room').addEventListener('click', () => {
  soundManager.init();
  const name = document.getElementById('player-name-input').value.trim() || 'Player';
  const mode = document.querySelector('input[name="game-mode"]:checked').value;
  const stacking = document.getElementById('setting-stacking').checked;
  const mercyKnockout = document.getElementById('setting-mercy').checked;
  const allowSevenZero = document.getElementById('setting-seven-zero').checked;
  const endGameCondition = document.getElementById('setting-end-condition').value;

  socket.emit('create_room', {
    name,
    mode,
    stacking,
    mercyKnockout,
    allowSevenZero,
    endGameCondition
  });
});

// Join Room
document.getElementById('btn-join-room').addEventListener('click', () => {
  soundManager.init();
  const name = document.getElementById('player-name-input').value.trim() || 'Player';
  const roomId = document.getElementById('join-room-input').value.trim();

  if (!roomId) {
    return UI.showToast('Masukkan kode room terlebih dahulu!', 'error');
  }

  socket.emit('join_room', { roomId, name });
});

// Waiting Room Controls
document.getElementById('btn-add-bot').addEventListener('click', () => {
  socket.emit('add_bot');
});

document.getElementById('btn-start-game').addEventListener('click', () => {
  socket.emit('start_game');
});

document.getElementById('btn-copy-room').addEventListener('click', () => {
  if (currentRoomId) {
    navigator.clipboard.writeText(currentRoomId).then(() => {
      UI.showToast(`Kode room ${currentRoomId} berhasil disalin!`);
    });
  }
});

// Restart Game (Winner of previous game goes first!)
document.getElementById('btn-restart-game').addEventListener('click', () => {
  document.getElementById('modal-game-over').classList.remove('active');
  socket.emit('restart_game');
});

// UNO! Button
document.getElementById('btn-call-uno').addEventListener('click', () => {
  socket.emit('call_uno');
});

socket.on('uno_call_result', res => {
  if (res.valid) {
    soundManager.unoAlert();
    UI.showToast('📢 ANDA MENERIAKKAN: "UNO!"', 'warning');
  } else if (res.penalty) {
    soundManager.penalty();
    UI.showToast('🚨 ANDA BERTERIAK UNO PALSU (KARTU BUKAN 1)! PENALTI +1 KARTU!', 'error');
  }
});

// Draw Card Deck click
document.getElementById('draw-deck-pile').addEventListener('click', () => {
  if (currentGameState && currentGameState.currentTurnPlayerId === myPlayerId) {
    soundManager.drawCard();
    socket.emit('draw_card');
  }
});

// ==========================================
// SOCKET EVENTS
// ==========================================

socket.on('connect', () => {
  myPlayerId = socket.id;
});

socket.on('room_created', data => {
  currentRoomId = data.roomId;
  isHost = true;
  document.getElementById('display-room-code').textContent = data.roomId;
  showView('view-waiting-room');
  UI.showToast(`Room ${data.roomId} dibuat!`);
});

socket.on('room_joined', data => {
  currentRoomId = data.roomId;
  isHost = data.isHost;
  document.getElementById('display-room-code').textContent = data.roomId;
  showView('view-waiting-room');
  UI.showToast(`Bergabung ke room ${data.roomId}`);
});

socket.on('error_message', msg => {
  UI.showToast(msg, 'error');
});

socket.on('action_failed', msg => {
  UI.showToast(msg, 'error');
});

// Main Game State Update Handler
socket.on('game_state_update', state => {
  currentGameState = state;
  isHost = state.isHost;

  if (!state.gameOver && !document.getElementById('view-game-arena').offsetParent && state.players.length >= 2 && state.deckCount > 0) {
    showView('view-game-arena');
    soundManager.playCard();
  }

  // Update Waiting Room if visible
  renderWaitingRoom(state);

  // Update Game Arena
  renderGameArena(state);
});

// ==========================================
// RENDERING FUNCTIONS
// ==========================================

function renderWaitingRoom(state) {
  const container = document.getElementById('waiting-players-container');
  if (!container) return;
  container.innerHTML = '';

  state.players.forEach(p => {
    const card = document.createElement('div');
    card.className = 'player-card-badge';

    const avatar = document.createElement('div');
    avatar.className = `player-avatar ${p.isBot ? 'bot-avatar' : ''}`;
    avatar.innerHTML = p.isBot ? UI.getBotAvatarSvg() : p.name.charAt(0).toUpperCase();

    const nameTag = document.createElement('div');
    nameTag.className = 'player-name-tag';
    nameTag.textContent = p.name + (p.id === myPlayerId ? ' (Anda)' : '');

    card.appendChild(avatar);
    card.appendChild(nameTag);

    if (p.id === currentRoomId || (state.isHost && p.id === myPlayerId)) {
      const hostTag = document.createElement('span');
      hostTag.className = 'host-tag';
      hostTag.textContent = 'HOST';
      card.appendChild(hostTag);
    }

    if (p.isBot && isHost) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-secondary';
      removeBtn.style.padding = '4px 10px';
      removeBtn.style.fontSize = '11px';
      removeBtn.textContent = 'Hapus';
      removeBtn.addEventListener('click', () => {
        socket.emit('remove_bot', { botId: p.id });
      });
      card.appendChild(removeBtn);
    }

    container.appendChild(card);
  });

  const startBtn = document.getElementById('btn-start-game');
  const addBotBtn = document.getElementById('btn-add-bot');
  if (startBtn) startBtn.style.display = isHost ? 'block' : 'none';
  if (addBotBtn) addBotBtn.style.display = isHost ? 'block' : 'none';
}

function renderGameArena(state) {
  const arena = document.getElementById('view-game-arena');
  if (!arena) return;

  // Apply arena theme classes
  arena.classList.remove('dark-mode', 'no-mercy-mode');
  if (state.mode === 'flip' && state.flipSide === 'dark') {
    arena.classList.add('dark-mode');
  } else if (state.mode === 'no_mercy') {
    arena.classList.add('no-mercy-mode');
  }

  // Display peek mode button if in UNO Flip mode
  const peekBtn = document.getElementById('btn-peek-flip-mode');
  if (peekBtn) {
    peekBtn.style.display = state.mode === 'flip' ? 'flex' : 'none';
  }

  // 1. Render Opponents
  const oppBar = document.getElementById('opponents-container');
  oppBar.innerHTML = '';
  const myPlayer = state.players.find(p => p.id === myPlayerId);

  state.players.forEach(p => {
    if (p.id !== myPlayerId) {
      const seat = document.createElement('div');
      seat.className = 'opponent-seat';
      seat.dataset.playerId = p.id;

      if (p.id === state.currentTurnPlayerId) seat.classList.add('active-turn');
      if (p.eliminated) seat.classList.add('eliminated');
      if (p.finished) seat.classList.add('finished');

      const avatar = document.createElement('div');
      avatar.className = `player-avatar ${p.isBot ? 'bot-avatar' : ''}`;
      avatar.style.width = '36px';
      avatar.style.height = '36px';
      avatar.style.fontSize = '16px';
      avatar.innerHTML = p.isBot ? UI.getBotAvatarSvg() : p.name.charAt(0).toUpperCase();

      const info = document.createElement('div');
      info.style.display = 'flex';
      info.style.flexDirection = 'column';

      const name = document.createElement('span');
      name.style.fontSize = '13px';
      name.style.fontWeight = '700';
      name.textContent = p.name;

      const cardsCount = document.createElement('span');
      cardsCount.className = 'opp-cards-count';
      if (p.finished) {
        cardsCount.textContent = `Juara ${p.rank}`;
        cardsCount.style.background = '#2ed573';
      } else {
        cardsCount.textContent = `${p.cardCount} kartu`;
      }

      info.appendChild(name);
      info.appendChild(cardsCount);

      // In UNO Flip: render the opposite side of opponent's cards facing us!
      if (state.mode === 'flip' && p.oppositeCards && p.oppositeCards.length > 0) {
        const oppCardsRow = document.createElement('div');
        oppCardsRow.className = 'opponent-flip-cards-row';
        oppCardsRow.title = `Kartu sisi balik yang dipegang ${p.name} (${p.oppositeCards.length} kartu)`;
        const oppSide = state.flipSide === 'light' ? 'dark' : 'light';
        p.oppositeCards.forEach(c => {
          const miniImg = document.createElement('img');
          miniImg.className = 'opponent-mini-card';
          miniImg.src = UI.getCardImageSrc(c.oppositeFace, 'flip', oppSide);
          miniImg.alt = `${c.oppositeFace.color} ${c.oppositeFace.value}`;
          miniImg.title = `Sisi balik: ${c.oppositeFace.color.toUpperCase()} ${c.oppositeFace.value.toUpperCase()}`;
          oppCardsRow.appendChild(miniImg);
        });
        info.appendChild(oppCardsRow);
      }

      seat.appendChild(avatar);
      seat.appendChild(info);

      // Challenge UNO button if vulnerable (+1 penalty card)
      if (p.cardCount === 1 && !p.calledUno && !p.eliminated && !p.finished) {
        const challengeBtn = document.createElement('button');
        challengeBtn.className = 'btn-primary';
        challengeBtn.style.padding = '4px 8px';
        challengeBtn.style.fontSize = '10px';
        challengeBtn.textContent = 'TANTANG UNO! (+1)';
        challengeBtn.addEventListener('click', () => {
          socket.emit('challenge_uno', { targetPlayerId: p.id });
        });
        seat.appendChild(challengeBtn);
      }

      oppBar.appendChild(seat);
    }
  });

  // 2. Render Center Table Discard & Draw Decks
  const discardContainer = document.getElementById('discard-pile-container');
  discardContainer.innerHTML = '';
  if (state.topDiscardCard) {
    const isFlip = state.mode === 'flip';
    const topCardEl = UI.createCardElement(state.topDiscardCard, isFlip, state.flipSide, false, state.mode);
    discardContainer.appendChild(topCardEl);
  }

  // Draw Deck Image & Count
  const drawDeckPile = document.getElementById('draw-deck-pile');
  if (drawDeckPile) {
    drawDeckPile.innerHTML = '';
    const deckCard = document.createElement('div');
    deckCard.className = 'uno-card';
    const deckFace = document.createElement('div');
    deckFace.className = 'card-face';
    const deckImg = document.createElement('img');
    deckImg.className = 'deck-top-img';
    if (state.mode === 'flip' && state.deckTopOppositeFace) {
      const deckSide = state.flipSide === 'light' ? 'dark' : 'light';
      deckImg.src = UI.getCardImageSrc(state.deckTopOppositeFace, 'flip', deckSide);
      deckImg.title = `Tumpukan Deck Flip (Sisi Terbuka: ${state.deckTopOppositeFace.color.toUpperCase()} ${state.deckTopOppositeFace.value.toUpperCase()})`;
    } else {
      deckImg.src = UI.getCardBackSrc(state.mode, state.flipSide);
      deckImg.title = 'Tumpukan Ambil Kartu';
    }
    deckFace.appendChild(deckImg);
    deckCard.appendChild(deckFace);
    drawDeckPile.appendChild(deckCard);
  }

  document.getElementById('draw-deck-count').textContent = `${state.deckCount} kartu`;

  // Turn status & Active color
  const turnIndicator = document.getElementById('turn-status-text');
  const colorDot = document.getElementById('active-color-dot');
  const activeColor = state.currentColor || 'white';
  colorDot.style.background = getColorHex(activeColor);

  const isMyTurn = state.currentTurnPlayerId === myPlayerId;
  const currentP = state.players.find(p => p.id === state.currentTurnPlayerId);

  if (myPlayer && myPlayer.finished) {
    turnIndicator.textContent = `Anda Selesai (Juara ${myPlayer.rank}) - Menonton`;
    turnIndicator.style.color = '#2ed573';
  } else if (isMyTurn) {
    turnIndicator.textContent = `GILIRAN ANDA!`;
    turnIndicator.style.color = '#ffd000';
  } else {
    turnIndicator.textContent = `Giliran: ${currentP ? currentP.name : '...'}`;
    turnIndicator.style.color = '#f1f2f6';
  }

  // Direction symbol
  document.getElementById('direction-arrow').textContent = state.direction === 1 ? '↻' : '↺';

  // Pending penalty warning
  const penaltyBadge = document.getElementById('pending-penalty-badge');
  if (state.pendingDrawCount > 0) {
    penaltyBadge.style.display = 'block';
    penaltyBadge.textContent = `PENALTI BERTUMPUK: +${state.pendingDrawCount}!`;
  } else {
    penaltyBadge.style.display = 'none';
  }

  // 3. Render Player's Hand
  if (myPlayer && myPlayer.hand) {
    const handContainer = document.getElementById('player-cards-container');
    const isFlip = state.mode === 'flip';
    UI.renderHand(myPlayer.hand, handContainer, onPlayCardClicked, isFlip, state.flipSide, state.mode);

    document.getElementById('player-card-total').textContent = `${myPlayer.hand.length} kartu`;
  }

  // 4. Render Game Logs & Auto-Scroll to Bottom
  const logContainer = document.getElementById('game-log-entries');
  if (logContainer && state.logs) {
    logContainer.innerHTML = '';
    state.logs.forEach(l => {
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.textContent = l.text;
      logContainer.appendChild(entry);
    });
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // 5. Handle Pending Actions for this player
  if (state.pendingAction && state.pendingAction.playerId === myPlayerId) {
    if (state.pendingAction.type === 'color_picker') {
      openColorPicker(state.mode, state.flipSide, state.pendingAction.cardId);
    } else if (state.pendingAction.type === 'swap_target') {
      const opponents = state.players.filter(p => p.id !== myPlayerId && !p.eliminated && !p.finished);
      openSwapPicker(opponents, state.pendingAction.cardId, state.pendingAction.chosenColor);
    }
  }

  // 6. Game Over Modal with Podium Rankings
  if (state.gameOver && state.winner) {
    soundManager.winFanfare();
    const modal = document.getElementById('modal-game-over');
    document.getElementById('winner-name-display').textContent = `🏆 ${state.winner.name} Menang!`;
    document.getElementById('btn-restart-game').style.display = isHost ? 'block' : 'none';

    const podiumList = document.getElementById('game-over-rankings');
    if (podiumList) {
      podiumList.innerHTML = '';
      if (state.rankings && state.rankings.length > 0) {
        state.rankings.forEach(r => {
          const item = document.createElement('div');
          item.className = 'podium-item';

          let rankBadgeClass = 'rank-other';
          if (r.rank === 1) rankBadgeClass = 'rank-1';
          else if (r.rank === 2) rankBadgeClass = 'rank-2';
          else if (r.rank === 3) rankBadgeClass = 'rank-3';

          item.innerHTML = `
            <span>${r.name}</span>
            <span class="podium-rank-badge ${rankBadgeClass}">Juara ${r.rank}</span>
          `;
          podiumList.appendChild(item);
        });
      }
    }

    modal.classList.add('active');
  }
}

function getColorHex(color) {
  switch (color) {
    case 'red': return '#ff2b38';
    case 'yellow': return '#ffd000';
    case 'green': return '#10ac84';
    case 'blue': return '#1e90ff';
    case 'pink': return '#ff2a8d';
    case 'teal': return '#00e5ff';
    case 'orange': return '#ff6d00';
    case 'purple': return '#9c27b0';
    default: return '#ffffff';
  }
}

// ==========================================
// CARD PLAY CLICK HANDLING & COMBO STACKING
// ==========================================
let selectedComboCardIds = [];
let pendingWildCardIds = null;
let pendingSwapCardIds = null;

function updateComboBar() {
  const bar = document.getElementById('combo-play-bar');
  const countText = document.getElementById('combo-count-text');
  if (!bar) return;

  // Clear existing badges & classes
  document.querySelectorAll('.uno-card').forEach(el => {
    el.classList.remove('selected-combo');
    el.classList.remove('combo-candidate');
    const badge = el.querySelector('.combo-badge');
    if (badge) badge.remove();
  });

  if (selectedComboCardIds.length === 0) {
    bar.style.display = 'none';
    return;
  }

  bar.style.display = 'flex';
  countText.textContent = `${selectedComboCardIds.length} Kartu Terpilih`;

  const myPlayer = currentGameState ? currentGameState.players.find(p => p.id === myPlayerId) : null;
  const firstSelectedCard = myPlayer ? myPlayer.hand.find(c => c.id === selectedComboCardIds[0]) : null;
  const firstFace = firstSelectedCard ? (firstSelectedCard.displayFace || firstSelectedCard) : null;

  // Highlight all twin/matching candidate cards in hand that can be added to this combo!
  if (myPlayer && firstFace) {
    myPlayer.hand.forEach(c => {
      const cFace = c.displayFace || c;
      if (cFace.value === firstFace.value && !selectedComboCardIds.includes(c.id)) {
        const el = document.querySelector(`.uno-card[data-id="${c.id}"]`);
        if (el) el.classList.add('combo-candidate');
      }
    });
  }

  // Highlight selected cards with combo badge
  selectedComboCardIds.forEach((id, idx) => {
    const cardEl = document.querySelector(`.uno-card[data-id="${id}"]`);
    if (cardEl) {
      cardEl.classList.add('selected-combo');
      const badge = document.createElement('div');
      badge.className = 'combo-badge';
      badge.textContent = `[${idx + 1}]`;
      cardEl.appendChild(badge);
    }
  });
}

const playComboBtn = document.getElementById('btn-play-combo');
if (playComboBtn) {
  playComboBtn.addEventListener('click', () => {
    if (selectedComboCardIds.length > 0) {
      executePlayCards(selectedComboCardIds);
    }
  });
}

const cancelComboBtn = document.getElementById('btn-cancel-combo');
if (cancelComboBtn) {
  cancelComboBtn.addEventListener('click', () => {
    selectedComboCardIds = [];
    updateComboBar();
  });
}

const cancelColorPickBtn = document.getElementById('btn-cancel-color-pick');
if (cancelColorPickBtn) {
  cancelColorPickBtn.addEventListener('click', () => {
    document.getElementById('modal-color-picker').classList.remove('active');
    socket.emit('cancel_pending_action');
    pendingWildCardIds = null;
    selectedComboCardIds = [];
    updateComboBar();
    UI.showToast('Pemilihan kartu dibatalkan', 'info');
  });
}

function onPlayCardClicked(card) {
  const myPlayer = currentGameState ? currentGameState.players.find(p => p.id === myPlayerId) : null;
  if (!myPlayer) return;

  // Verify it is my turn
  if (currentGameState.currentTurnPlayerId !== myPlayerId) {
    UI.showToast('Bukan giliran Anda!', 'error');
    return;
  }

  const face = card.displayFace || card;

  // If already selecting cards for combo stacking:
  if (selectedComboCardIds.length > 0) {
    const alreadyIdx = selectedComboCardIds.indexOf(card.id);
    if (alreadyIdx !== -1) {
      // Toggle off this card
      selectedComboCardIds.splice(alreadyIdx, 1);
      updateComboBar();
      return;
    }

    // Check if card matches value of already selected cards
    const firstSelectedCard = myPlayer.hand.find(c => c.id === selectedComboCardIds[0]);
    const firstFace = firstSelectedCard ? (firstSelectedCard.displayFace || firstSelectedCard) : null;

    if (firstFace && face.value === firstFace.value) {
      selectedComboCardIds.push(card.id);
      updateComboBar();
      return;
    } else {
      // Different card clicked: clear old selection and check if this new card has matches
      selectedComboCardIds = [];
      updateComboBar();
    }
  }

  // Check if player has other cards in hand with the exact same value or action
  const matchingCards = myPlayer.hand.filter(c => {
    const cFace = c.displayFace || c;
    return cFace.value === face.value;
  });

  // If multiple matching cards exist:
  if (matchingCards.length > 1) {
    // Check if at least one of these matching cards can be played on current table
    const hasPlayableSibling = matchingCards.some(c => c.playable);
    if (hasPlayableSibling) {
      selectedComboCardIds = [card.id];
      updateComboBar();
      UI.showToast(`Pilih kartu kembar [${face.value.toUpperCase()}] lain untuk ditumpuk, atau klik 'Tumpuk & Mainkan'`, 'info');
      return;
    }
  }

  // If card cannot be played singly
  if (!card.playable) {
    UI.showToast('Kartu ini tidak cocok dengan kartu di meja!', 'error');
    return;
  }

  // Otherwise, play single card immediately
  executePlayCards([card.id]);
}

function executePlayCards(cardIds, chosenColor = null) {
  const myPlayer = currentGameState ? currentGameState.players.find(p => p.id === myPlayerId) : null;
  if (!myPlayer || cardIds.length === 0) return;

  const firstCard = myPlayer.hand.find(c => c.id === cardIds[0]);
  if (!firstCard) return;
  const face = firstCard.displayFace || firstCard;

  // If wild, open color picker
  if (face.type === 'wild' && !chosenColor) {
    pendingWildCardIds = cardIds;
    openColorPicker(currentGameState.mode, currentGameState.flipSide, cardIds);
    return;
  }

  // In No Mercy, 7 swaps hand
  if (currentGameState.mode === 'no_mercy' && face.value === '7' && currentGameState.options.allowSevenZero) {
    const opponents = currentGameState.players.filter(p => p.id !== myPlayerId && !p.eliminated && !p.finished);
    if (opponents.length > 0) {
      pendingSwapCardIds = cardIds;
      openSwapPicker(opponents, cardIds, chosenColor);
      return;
    }
  }

  soundManager.playCard();
  socket.emit('play_card', { cardIds, chosenColor });
  selectedComboCardIds = [];
  updateComboBar();
}

// Color Picker Modal
function openColorPicker(mode, flipSide, cardIds) {
  const modal = document.getElementById('modal-color-picker');
  const grid = document.getElementById('color-picker-buttons');
  grid.innerHTML = '';

  const isDarkSide = mode === 'flip' && flipSide === 'dark';
  const colors = isDarkSide
    ? [
        { id: 'pink', name: 'Pink', bg: '#ff2a8d' },
        { id: 'teal', name: 'Teal', bg: '#00e5ff' },
        { id: 'orange', name: 'Orange', bg: '#ff6d00' },
        { id: 'purple', name: 'Purple', bg: '#9c27b0' }
      ]
    : [
        { id: 'red', name: 'Merah', bg: '#ff2b38' },
        { id: 'yellow', name: 'Kuning', bg: '#ffd000' },
        { id: 'green', name: 'Hijau', bg: '#10ac84' },
        { id: 'blue', name: 'Biru', bg: '#1e90ff' }
      ];

  colors.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'color-pick-btn';
    btn.style.background = c.bg;
    btn.textContent = c.name;
    btn.addEventListener('click', () => {
      modal.classList.remove('active');
      const targetIds = pendingWildCardIds || (cardIds ? (Array.isArray(cardIds) ? cardIds : [cardIds]) : null);
      socket.emit('play_card', {
        cardIds: targetIds,
        chosenColor: c.id
      });
      pendingWildCardIds = null;
      selectedComboCardIds = [];
      updateComboBar();
    });
    grid.appendChild(btn);
  });

  modal.classList.add('active');
}

// Swap Player Target Picker Modal (No Mercy 7)
function openSwapPicker(opponents, cardIds, chosenColor) {
  const modal = document.getElementById('modal-swap-picker');
  const list = document.getElementById('swap-targets-container');
  list.innerHTML = '';

  opponents.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'swap-target-btn';
    btn.textContent = `Tukar dengan ${p.name} (${p.cardCount} kartu)`;
    btn.addEventListener('click', () => {
      modal.classList.remove('active');
      const targetIds = pendingSwapCardIds || (cardIds ? (Array.isArray(cardIds) ? cardIds : [cardIds]) : null);
      socket.emit('play_card', {
        cardIds: targetIds,
        chosenColor,
        targetSwapPlayerId: p.id
      });
      pendingSwapCardIds = null;
      selectedComboCardIds = [];
      updateComboBar();
    });
    list.appendChild(btn);
  });

  modal.classList.add('active');
}
