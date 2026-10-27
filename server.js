const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const UnoGame = require('./src/game/UnoGame');
const BotAI = require('./src/game/BotAI');
const { MODES } = require('./src/game/constants');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Active rooms storage: roomId -> { id, hostId, game, options, botsCount }
const rooms = new Map();

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function broadcastGameState(room) {
  if (!room || !room.game) return;

  // Send personalized state to each human player
  room.game.players.forEach(player => {
    if (!player.isBot) {
      const state = room.game.getGameState(player.id);
      io.to(player.id).emit('game_state_update', {
        ...state,
        roomId: room.id,
        isHost: room.hostId === player.id,
        options: room.options
      });
    }
  });

  // If it's a bot's turn, trigger bot thinking
  triggerBotTurnIfNeeded(room);
}

function triggerBotTurnIfNeeded(room) {
  if (!room || !room.game || !room.game.gameStarted || room.game.gameOver) return;

  const current = room.game.getCurrentPlayer();
  if (current && current.isBot && !current.eliminated && !current.finished) {
    const delay = Math.floor(Math.random() * 600) + 900; // 900ms - 1500ms for realistic pacing

    setTimeout(() => {
      // Re-verify it's still current bot's turn
      if (!room.game || room.game.gameOver) return;
      const cur = room.game.getCurrentPlayer();
      if (!cur || cur.id !== current.id) return;

      const botDecision = BotAI.decideMove(current, room.game);
      if (!botDecision) return;

      if (botDecision.callUno) {
        room.game.callUno(current.id);
      }

      if (botDecision.action === 'play_card') {
        const res = room.game.playCard(
          current.id,
          botDecision.cardId,
          botDecision.chosenColor,
          botDecision.targetSwapPlayerId
        );
        if (res.needsColor && !botDecision.chosenColor) {
          // If needed color immediately resolve
          const bestCol = BotAI.getBestColor(current.hand, room.game);
          room.game.playCard(current.id, botDecision.cardId, bestCol);
        }
      } else if (botDecision.action === 'draw') {
        room.game.playerDraw(current.id);
      }

      // Bot opportunistic UNO challenge against humans
      const vulnerableId = BotAI.checkUnoChallenge(room.game);
      if (vulnerableId && Math.random() < 0.8) {
        setTimeout(() => {
          room.game.challengeUno(current.id, vulnerableId);
          broadcastGameState(room);
        }, 1200);
      }

      broadcastGameState(room);
    }, delay);
  }
}

io.on('connection', socket => {
  let currentRoomId = null;
  let playerName = 'Pemain';

  socket.on('create_room', ({ name, mode, stacking, mercyKnockout, allowSevenZero, endGameCondition }) => {
    playerName = name || 'Pemain 1';
    const roomId = generateRoomId();
    currentRoomId = roomId;

    const game = new UnoGame(roomId, {
      mode: mode || MODES.CLASSIC,
      stacking: stacking !== undefined ? stacking : true,
      mercyKnockout: mercyKnockout !== undefined ? mercyKnockout : true,
      allowSevenZero: allowSevenZero !== undefined ? allowSevenZero : true,
      endGameCondition: endGameCondition || 'first_winner'
    });

    game.addPlayer(socket.id, playerName, false);

    const room = {
      id: roomId,
      hostId: socket.id,
      game,
      options: {
        mode: mode || MODES.CLASSIC,
        stacking: stacking !== undefined ? stacking : true,
        mercyKnockout: mercyKnockout !== undefined ? mercyKnockout : true,
        allowSevenZero: allowSevenZero !== undefined ? allowSevenZero : true,
        endGameCondition: endGameCondition || 'first_winner'
      },
      botCounter: 1
    };

    rooms.set(roomId, room);
    socket.join(roomId);

    socket.emit('room_created', {
      roomId,
      isHost: true,
      gameState: game.getGameState(socket.id)
    });

    broadcastGameState(room);
  });

  socket.on('join_room', ({ roomId, name }) => {
    const cleanRoomId = (roomId || '').trim().toUpperCase();
    const room = rooms.get(cleanRoomId);

    if (!room) {
      return socket.emit('error_message', 'Room tidak ditemukan! Periksa kembali kode room.');
    }

    if (room.game.gameStarted && !room.game.gameOver) {
      return socket.emit('error_message', 'Permainan di room ini sudah berlangsung!');
    }

    if (room.game.players.length >= 8) {
      return socket.emit('error_message', 'Room sudah penuh (Maks. 8 pemain)!');
    }

    playerName = name || `Pemain ${room.game.players.length + 1}`;
    currentRoomId = cleanRoomId;

    room.game.addPlayer(socket.id, playerName, false);
    socket.join(cleanRoomId);

    socket.emit('room_joined', {
      roomId: cleanRoomId,
      isHost: room.hostId === socket.id,
      gameState: room.game.getGameState(socket.id)
    });

    broadcastGameState(room);
  });

  socket.on('add_bot', () => {
    const room = rooms.get(currentRoomId);
    if (!room || room.hostId !== socket.id) return;
    if (room.game.players.length >= 8) {
      return socket.emit('error_message', 'Maksimal 8 pemain dalam satu room!');
    }

    const botNames = ['Bot Robo', 'Bot Blitz', 'Bot Cypher', 'Bot Nova', 'Bot Spark', 'Bot Titan', 'Bot Pixel'];
    const botName = botNames[(room.botCounter - 1) % botNames.length];
    const botId = `bot_${room.botCounter++}_${Date.now()}`;

    room.game.addPlayer(botId, botName, true);
    broadcastGameState(room);
  });

  socket.on('remove_bot', ({ botId }) => {
    const room = rooms.get(currentRoomId);
    if (!room || room.hostId !== socket.id) return;

    room.game.removePlayer(botId);
    broadcastGameState(room);
  });

  socket.on('update_room_settings', ({ mode, stacking, mercyKnockout, allowSevenZero, endGameCondition }) => {
    const room = rooms.get(currentRoomId);
    if (!room || room.hostId !== socket.id || room.game.gameStarted) return;

    if (mode) room.game.mode = mode;
    if (stacking !== undefined) room.game.stacking = stacking;
    if (mercyKnockout !== undefined) room.game.mercyKnockout = mercyKnockout;
    if (allowSevenZero !== undefined) room.game.allowSevenZero = allowSevenZero;
    if (endGameCondition) room.game.endGameCondition = endGameCondition;

    room.options = {
      mode: room.game.mode,
      stacking: room.game.stacking,
      mercyKnockout: room.game.mercyKnockout,
      allowSevenZero: room.game.allowSevenZero,
      endGameCondition: room.game.endGameCondition
    };

    broadcastGameState(room);
  });

  socket.on('start_game', () => {
    const room = rooms.get(currentRoomId);
    if (!room || room.hostId !== socket.id) return;

    if (room.game.players.length < 2) {
      return socket.emit('error_message', 'Minimal butuh 2 pemain (Bisa tambahkan Bot untuk main langsung)!');
    }

    const success = room.game.start();
    if (success) {
      broadcastGameState(room);
    }
  });

  socket.on('play_card', ({ cardId, cardIds, chosenColor, targetSwapPlayerId }) => {
    const room = rooms.get(currentRoomId);
    if (!room || !room.game.gameStarted) return;

    const cardsToPlay = cardIds || cardId;
    const res = room.game.playCard(socket.id, cardsToPlay, chosenColor, targetSwapPlayerId);
    if (!res.success) {
      socket.emit('action_failed', res.message);
    } else {
      broadcastGameState(room);
    }
  });

  socket.on('cancel_pending_action', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || !room.game) return;

    room.game.cancelPendingAction(socket.id);
    broadcastGameState(room);
  });

  socket.on('draw_card', () => {
    const room = rooms.get(currentRoomId);
    if (!room || !room.game.gameStarted) return;

    const res = room.game.playerDraw(socket.id);
    if (!res.success) {
      socket.emit('action_failed', res.message);
    } else {
      broadcastGameState(room);
    }
  });

  socket.on('call_uno', () => {
    const room = rooms.get(currentRoomId);
    if (!room || !room.game.gameStarted) return;

    const res = room.game.callUno(socket.id);
    socket.emit('uno_call_result', res);
    broadcastGameState(room);
  });

  socket.on('challenge_uno', ({ targetPlayerId }) => {
    const room = rooms.get(currentRoomId);
    if (!room || !room.game.gameStarted) return;

    room.game.challengeUno(socket.id, targetPlayerId);
    broadcastGameState(room);
  });

  socket.on('restart_game', () => {
    const room = rooms.get(currentRoomId);
    if (!room || room.hostId !== socket.id) return;

    // Preserves previousWinnerId so they play first in the next game
    room.game.start();
    broadcastGameState(room);
  });

  // Emote / Taunt Interactivity Event
  socket.on('send_emote', ({ emoteText, emoteCategory }) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const sender = room.game.players.find(p => p.id === socket.id);
    if (!sender) return;

    io.to(currentRoomId).emit('player_emote', {
      playerId: socket.id,
      playerName: sender.name,
      emoteText,
      emoteCategory
    });
  });

  // Explicit Leave Room (Back Button)
  socket.on('leave_room', (data) => {
    const targetRoomId = (data && data.roomId) || currentRoomId;
    let room = targetRoomId ? rooms.get(targetRoomId) : null;

    if (!room) {
      for (const [rId, r] of rooms.entries()) {
        if (r.game && r.game.players.some(p => p.id === socket.id)) {
          room = r;
          break;
        }
      }
    }

    if (room) {
      room.game.removePlayer(socket.id);
      socket.leave(room.id);
      const remainingHumans = room.game.players.filter(p => !p.isBot);
      if (remainingHumans.length === 0) {
        rooms.delete(room.id);
      } else {
        if (room.hostId === socket.id) {
          room.hostId = remainingHumans[0].id;
        }
        broadcastGameState(room);
      }
    }
    currentRoomId = null;
    socket.emit('left_room_success');
  });

  socket.on('disconnect', () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.game.removePlayer(socket.id);
        if (room.game.players.filter(p => !p.isBot).length === 0) {
          // No more human players, remove room
          rooms.delete(currentRoomId);
        } else {
          // If host left, reassign host
          if (room.hostId === socket.id) {
            const nextHuman = room.game.players.find(p => !p.isBot);
            if (nextHuman) room.hostId = nextHuman.id;
          }
          broadcastGameState(room);
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` UNO Web Server running on port ${PORT}`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
