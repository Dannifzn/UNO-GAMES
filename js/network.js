/**
 * Network & Session Manager for UNO Web
 * Supports:
 * 1. Local Offline Mode (Standalone vs AI bots in browser)
 * 2. P2P WebRTC Mode (Multiplayer mabar teman via PeerJS)
 * 3. Socket.IO Mode (Fallback to Node.js server if available)
 */

class NetworkManager {
  constructor() {
    this.mode = 'idle'; // 'local', 'p2p_host', 'p2p_client', 'socket'
    this.listeners = new Map();
    this.playerId = 'p_' + Math.random().toString(36).substring(2, 9);
    this.roomId = null;
    this.isHost = false;

    // Local / P2P Host state
    this.localGame = null;
    this.aiTimer = null;

    // PeerJS state
    this.peer = null;
    this.connections = new Map(); // peerId -> DataConnection
    this.hostConnection = null;

    // Socket.IO fallback instance
    this.socket = null;
    this.initSocketIfAvailable();
  }

  initSocketIfAvailable() {
    if (typeof io !== 'undefined') {
      try {
        // Attempt connect with timeout
        this.socket = io({ timeout: 3000, reconnectionAttempts: 2 });
        this.socket.on('connect', () => {
          this.playerId = this.socket.id;
          this.trigger('connect');
        });
        this.socket.on('room_created', d => this.trigger('room_created', d));
        this.socket.on('room_joined', d => this.trigger('room_joined', d));
        this.socket.on('game_state_update', d => this.trigger('game_state_update', d));
        this.socket.on('uno_call_result', d => this.trigger('uno_call_result', d));
        this.socket.on('player_emote', d => this.trigger('player_emote', d));
        this.socket.on('error_message', d => this.trigger('error_message', d));
        this.socket.on('action_failed', d => this.trigger('action_failed', d));
        this.socket.on('left_room_success', d => this.trigger('left_room_success', d));
      } catch (e) {
        console.warn('Socket.IO not available or offline, operating in standalone mode:', e);
      }
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  trigger(event, data) {
    const cbs = this.listeners.get(event) || [];
    cbs.forEach(cb => {
      try { cb(data); } catch (e) { console.error(`Error in event listener ${event}:`, e); }
    });
  }

  // ==========================================
  // DISPATCH EMIT CALLS
  // ==========================================
  emit(event, data = {}) {
    if (this.mode === 'local') {
      this.handleLocalAction(event, data);
    } else if (this.mode === 'p2p_host') {
      this.handleP2PHostAction(this.playerId, event, data);
    } else if (this.mode === 'p2p_client') {
      if (this.hostConnection && this.hostConnection.open) {
        this.hostConnection.send({ event, data, senderId: this.playerId });
      }
    } else if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      // Default to local handler
      this.handleLocalAction(event, data);
    }
  }

  // ==========================================
  // 1. LOCAL STANDALONE MODE (VS AI)
  // ==========================================
  startLocalGame(playerName, mode, options = {}) {
    this.mode = 'local';
    this.isHost = true;
    this.roomId = 'LOCAL_' + Math.floor(Math.random() * 9000 + 1000);
    this.playerId = 'human_player';

    if (this.aiTimer) clearTimeout(this.aiTimer);

    const UnoGameClass = window.UnoGame || UnoGame;
    this.localGame = new UnoGameClass(this.roomId, {
      mode: mode || 'classic',
      stacking: options.stacking !== undefined ? options.stacking : true,
      mercyKnockout: options.mercyKnockout !== undefined ? options.mercyKnockout : true,
      allowSevenZero: options.allowSevenZero !== undefined ? options.allowSevenZero : true,
      endGameCondition: options.endGameCondition || 'first_winner'
    });

    this.localGame.addPlayer(this.playerId, playerName || 'Pemain 1', false);
    this.localGame.addPlayer('bot_robo', 'Bot Robo', true);
    this.localGame.addPlayer('bot_blitz', 'Bot Blitz', true);
    this.localGame.addPlayer('bot_cypher', 'Bot Cypher', true);

    this.localGame.start();

    this.trigger('room_created', {
      roomId: this.roomId,
      hostId: this.playerId,
      isHost: true,
      options: { mode, ...options }
    });

    this.broadcastLocalState();
    this.checkLocalAITurn();
  }

  broadcastLocalState() {
    if (!this.localGame) return;
    const state = this.localGame.getGameState(this.playerId);
    this.trigger('game_state_update', {
      ...state,
      roomId: this.roomId,
      isHost: true,
      options: {
        mode: this.localGame.mode,
        allowSevenZero: this.localGame.allowSevenZero,
        stacking: this.localGame.stacking,
        mercyKnockout: this.localGame.mercyKnockout,
        endGameCondition: this.localGame.endGameCondition
      }
    });
  }

  handleLocalAction(event, data) {
    if (!this.localGame) return;
    const game = this.localGame;

    switch (event) {
      case 'play_card': {
        const res = game.playCard(
          this.playerId,
          data.cardIds || data.cardId,
          data.chosenColor,
          data.targetSwapPlayerId
        );
        if (!res.success) {
          this.trigger('action_failed', res.message);
        } else {
          this.broadcastLocalState();
          this.checkLocalAITurn();
        }
        break;
      }
      case 'draw_card': {
        const res = game.playerDraw(this.playerId);
        if (!res.success) {
          this.trigger('action_failed', res.message);
        } else {
          this.broadcastLocalState();
          this.checkLocalAITurn();
        }
        break;
      }
      case 'call_uno': {
        const res = game.callUno(this.playerId);
        this.trigger('uno_call_result', {
          callerId: this.playerId,
          ...res
        });
        this.broadcastLocalState();
        break;
      }
      case 'challenge_uno': {
        const res = game.challengeUno(this.playerId, data.targetPlayerId);
        this.trigger('uno_call_result', {
          callerId: this.playerId,
          ...res
        });
        this.broadcastLocalState();
        break;
      }
      case 'cancel_pending_action': {
        game.cancelPendingAction(this.playerId);
        this.broadcastLocalState();
        break;
      }
      case 'send_emote': {
        this.trigger('player_emote', {
          playerId: this.playerId,
          emoji: data.emoji,
          text: data.text
        });
        break;
      }
      case 'restart_game': {
        game.start();
        this.broadcastLocalState();
        this.checkLocalAITurn();
        break;
      }
      case 'leave_room': {
        if (this.aiTimer) clearTimeout(this.aiTimer);
        this.localGame = null;
        this.mode = 'idle';
        this.trigger('left_room_success');
        break;
      }
    }
  }

  checkLocalAITurn() {
    if (!this.localGame || this.localGame.gameOver) return;
    const current = this.localGame.getCurrentPlayer();
    if (!current || !current.isBot) return;

    if (this.aiTimer) clearTimeout(this.aiTimer);

    this.aiTimer = setTimeout(() => {
      if (!this.localGame || this.localGame.gameOver) return;

      const BotAIClass = window.BotAI || BotAI;
      const targetChallenge = BotAIClass.checkUnoChallenge(this.localGame);
      if (targetChallenge) {
        this.localGame.challengeUno(current.id, targetChallenge);
        this.broadcastLocalState();
      }

      const move = BotAIClass.decideMove(current, this.localGame);
      if (move) {
        if (move.callUno) {
          this.localGame.callUno(current.id);
        }
        if (move.action === 'play_card') {
          this.localGame.playCard(current.id, move.cardId, move.chosenColor, move.targetSwapPlayerId);
        } else if (move.action === 'draw_card') {
          this.localGame.playerDraw(current.id);
        }
      } else {
        this.localGame.playerDraw(current.id);
      }

      this.broadcastLocalState();
      this.checkLocalAITurn();
    }, 900);
  }

  // ==========================================
  // 2. P2P MULTIPLAYER MODE (PEERJS)
  // ==========================================
  createP2PRoom(playerName, mode, options = {}) {
    if (typeof Peer === 'undefined') {
      this.trigger('error_message', 'Modul P2P WebRTC belum siap. Pastikan koneksi internet aktif.');
      return;
    }

    const cleanRoomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const peerId = 'UNO_' + cleanRoomCode;
    this.mode = 'p2p_host';
    this.isHost = true;
    this.roomId = cleanRoomCode;
    this.playerId = 'host_' + Math.random().toString(36).substring(2, 6);

    try {
      this.peer = new Peer(peerId);
    } catch (e) {
      this.peer = new Peer();
    }

    this.peer.on('open', id => {
      const UnoGameClass = window.UnoGame || UnoGame;
      this.localGame = new UnoGameClass(cleanRoomCode, {
        mode: mode || 'classic',
        stacking: options.stacking !== undefined ? options.stacking : true,
        mercyKnockout: options.mercyKnockout !== undefined ? options.mercyKnockout : true,
        allowSevenZero: options.allowSevenZero !== undefined ? options.allowSevenZero : true,
        endGameCondition: options.endGameCondition || 'first_winner'
      });

      this.localGame.addPlayer(this.playerId, playerName || 'Host', false);

      this.trigger('room_created', {
        roomId: cleanRoomCode,
        hostId: this.playerId,
        isHost: true,
        options: { mode, ...options }
      });
      this.broadcastP2PState();
    });

    this.peer.on('connection', conn => {
      conn.on('data', data => {
        if (data.event === 'join') {
          this.connections.set(conn.peer, conn);
          this.localGame.addPlayer(data.senderId, data.name, false);
          conn.send({
            event: 'room_joined',
            data: {
              roomId: this.roomId,
              hostId: this.playerId,
              isHost: false,
              options: this.localGame ? { mode: this.localGame.mode } : {}
            }
          });
          this.broadcastP2PState();
        } else {
          this.handleP2PHostAction(data.senderId, data.event, data.data);
        }
      });

      conn.on('close', () => {
        this.connections.delete(conn.peer);
      });
    });

    this.peer.on('error', err => {
      console.warn('Peer error:', err);
      this.trigger('error_message', 'Koneksi P2P: ' + (err.message || 'Gagal'));
    });
  }

  joinP2PRoom(cleanRoomCode, playerName) {
    if (typeof Peer === 'undefined') {
      this.trigger('error_message', 'Modul P2P WebRTC belum siap.');
      return;
    }

    this.mode = 'p2p_client';
    this.isHost = false;
    this.roomId = cleanRoomCode.toUpperCase();
    this.playerId = 'guest_' + Math.random().toString(36).substring(2, 6);

    this.peer = new Peer();
    this.peer.on('open', () => {
      const hostPeerId = 'UNO_' + this.roomId;
      this.hostConnection = this.peer.connect(hostPeerId, { reliable: true });

      this.hostConnection.on('open', () => {
        this.hostConnection.send({
          event: 'join',
          senderId: this.playerId,
          name: playerName || 'Pemain'
        });
      });

      this.hostConnection.on('data', msg => {
        if (msg.event) {
          this.trigger(msg.event, msg.data);
        }
      });

      this.hostConnection.on('error', err => {
        this.trigger('error_message', 'Gagal terhubung ke Host: ' + err);
      });
    });

    this.peer.on('error', err => {
      this.trigger('error_message', 'Kode Room tidak ditemukan atau Host sedang offline.');
    });
  }

  handleP2PHostAction(senderId, event, data) {
    if (!this.localGame) return;
    const game = this.localGame;

    switch (event) {
      case 'add_bot': {
        const botCount = game.players.filter(p => p.isBot).length + 1;
        const botNames = ['Bot Robo', 'Bot Blitz', 'Bot Cypher', 'Bot Nova', 'Bot Spark'];
        const name = botNames[botCount - 1] || `Bot ${botCount}`;
        game.addPlayer('bot_' + botCount + '_' + Math.random().toString(36).substring(2, 5), name, true);
        this.broadcastP2PState();
        break;
      }
      case 'remove_bot': {
        if (data.botId) {
          game.removePlayer(data.botId);
          this.broadcastP2PState();
        }
        break;
      }
      case 'start_game': {
        if (senderId === this.playerId) {
          game.start();
          this.broadcastP2PState();
          this.checkLocalAITurn();
        }
        break;
      }
      case 'play_card': {
        const res = game.playCard(
          senderId,
          data.cardIds || data.cardId,
          data.chosenColor,
          data.targetSwapPlayerId
        );
        if (!res.success) {
          this.sendToPeer(senderId, 'action_failed', res.message);
        } else {
          this.broadcastP2PState();
          this.checkLocalAITurn();
        }
        break;
      }
      case 'draw_card': {
        const res = game.playerDraw(senderId);
        if (!res.success) {
          this.sendToPeer(senderId, 'action_failed', res.message);
        } else {
          this.broadcastP2PState();
          this.checkLocalAITurn();
        }
        break;
      }
      case 'call_uno': {
        const res = game.callUno(senderId);
        this.broadcastP2PMessage('uno_call_result', { callerId: senderId, ...res });
        this.broadcastP2PState();
        break;
      }
      case 'challenge_uno': {
        const res = game.challengeUno(senderId, data.targetPlayerId);
        this.broadcastP2PMessage('uno_call_result', { callerId: senderId, ...res });
        this.broadcastP2PState();
        break;
      }
      case 'cancel_pending_action': {
        game.cancelPendingAction(senderId);
        this.broadcastP2PState();
        break;
      }
      case 'send_emote': {
        this.broadcastP2PMessage('player_emote', {
          playerId: senderId,
          emoji: data.emoji,
          text: data.text
        });
        break;
      }
      case 'restart_game': {
        if (senderId === this.playerId) {
          game.start();
          this.broadcastP2PState();
          this.checkLocalAITurn();
        }
        break;
      }
      case 'leave_room': {
        game.removePlayer(senderId);
        this.broadcastP2PState();
        break;
      }
    }
  }

  sendToPeer(peerPlayerId, event, data) {
    if (peerPlayerId === this.playerId) {
      this.trigger(event, data);
      return;
    }
    this.connections.forEach(conn => {
      conn.send({ event, data });
    });
  }

  broadcastP2PMessage(event, data) {
    this.trigger(event, data);
    this.connections.forEach(conn => {
      conn.send({ event, data });
    });
  }

  broadcastP2PState() {
    if (!this.localGame) return;
    const baseOptions = {
      mode: this.localGame.mode,
      allowSevenZero: this.localGame.allowSevenZero,
      stacking: this.localGame.stacking,
      mercyKnockout: this.localGame.mercyKnockout,
      endGameCondition: this.localGame.endGameCondition
    };

    // Broadcast tailored state to Host
    this.trigger('game_state_update', {
      ...this.localGame.getGameState(this.playerId),
      roomId: this.roomId,
      isHost: true,
      options: baseOptions
    });

    // Broadcast tailored state to each Guest
    this.connections.forEach(conn => {
      const guestPlayer = this.localGame.players.find(p => !p.isBot && p.id !== this.playerId);
      const targetId = guestPlayer ? guestPlayer.id : null;
      conn.send({
        event: 'game_state_update',
        data: {
          ...this.localGame.getGameState(targetId),
          roomId: this.roomId,
          isHost: false,
          options: baseOptions
        }
      });
    });
  }
}

// Global instance
window.networkManager = new NetworkManager();
