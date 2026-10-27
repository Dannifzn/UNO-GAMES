// ========================================================
// UI CONTROLLER & SVG VECTOR ICONS SYSTEM (NO EMOJIS)
// ========================================================

const UI = {
  // SVG Vector Icons for all UNO Cards & UI Elements
  getSvgIcon(value, colorClass = '') {
    switch (value) {
      case 'skip':
        return `
          <svg viewBox="0 0 100 100" class="card-svg-icon" fill="none" stroke="currentColor">
            <circle cx="50" cy="50" r="38" stroke-width="12"/>
            <line x1="24" y1="24" x2="76" y2="76" stroke-width="12"/>
          </svg>
        `;

      case 'reverse':
        return `
          <svg viewBox="0 0 100 100" class="card-svg-icon" fill="currentColor">
            <!-- Top curved arrow pointing right -->
            <path d="M 22 42 A 28 28 0 0 1 76 34 L 76 22 L 95 38 L 76 54 L 76 44 A 18 18 0 0 0 26 48 Z"/>
            <!-- Bottom curved arrow pointing left -->
            <path d="M 78 58 A 28 28 0 0 1 24 66 L 24 78 L 5 62 L 24 46 L 24 56 A 18 18 0 0 0 74 52 Z"/>
          </svg>
        `;

      case 'flip':
        return `
          <svg viewBox="0 0 100 100" class="card-svg-icon" fill="none" stroke="currentColor">
            <!-- Front card rectangle -->
            <rect x="26" y="24" width="36" height="52" rx="6" stroke-width="8" fill="currentColor" fill-opacity="0.15"/>
            <!-- Back card rectangle offset -->
            <rect x="38" y="16" width="36" height="52" rx="6" stroke-width="8" stroke-dasharray="6 4"/>
            <!-- Circular rotation arrow -->
            <path d="M 16 50 A 34 34 0 0 1 78 20" stroke-width="8" stroke-linecap="round"/>
            <polygon points="78,10 90,22 74,30" fill="currentColor"/>
          </svg>
        `;

      case 'draw1':
        return `
          <div class="draw-symbol-wrapper">
            <span class="draw-num-text">+1</span>
            <svg viewBox="0 0 60 70" class="mini-card-icon" fill="none" stroke="currentColor" stroke-width="6">
              <rect x="12" y="8" width="36" height="52" rx="5" fill="currentColor" fill-opacity="0.25"/>
            </svg>
          </div>
        `;

      case 'draw2':
      case 'wild_draw2':
        return `
          <div class="draw-symbol-wrapper">
            <span class="draw-num-text">+2</span>
            <svg viewBox="0 0 80 70" class="mini-card-icon" fill="none" stroke="currentColor" stroke-width="6">
              <rect x="10" y="14" width="34" height="48" rx="5" fill="currentColor" fill-opacity="0.2"/>
              <rect x="32" y="8" width="34" height="48" rx="5" fill="currentColor" fill-opacity="0.4"/>
            </svg>
          </div>
        `;

      case 'draw4':
      case 'wild_draw4':
        return `
          <div class="draw-symbol-wrapper">
            <span class="draw-num-text">+4</span>
            <svg viewBox="0 0 90 70" class="mini-card-icon" fill="none" stroke="currentColor" stroke-width="6">
              <rect x="6" y="16" width="32" height="46" rx="4" fill="currentColor" fill-opacity="0.2"/>
              <rect x="26" y="11" width="32" height="46" rx="4" fill="currentColor" fill-opacity="0.3"/>
              <rect x="48" y="6" width="32" height="46" rx="4" fill="currentColor" fill-opacity="0.5"/>
            </svg>
          </div>
        `;

      case 'draw5':
        return `
          <div class="draw-symbol-wrapper">
            <span class="draw-num-text">+5</span>
            <svg viewBox="0 0 90 70" class="mini-card-icon" fill="none" stroke="currentColor" stroke-width="6">
              <rect x="8" y="16" width="32" height="46" rx="4" fill="currentColor" fill-opacity="0.2"/>
              <rect x="30" y="11" width="32" height="46" rx="4" fill="currentColor" fill-opacity="0.4"/>
              <rect x="50" y="6" width="32" height="46" rx="4" fill="currentColor" fill-opacity="0.6"/>
            </svg>
          </div>
        `;

      case 'wild_draw6':
        return `
          <div class="draw-symbol-wrapper">
            <span class="draw-num-text" style="color: #ff0055;">+6</span>
            <svg viewBox="0 0 90 70" class="mini-card-icon" fill="none" stroke="#ff0055" stroke-width="6">
              <rect x="8" y="16" width="32" height="46" rx="4" fill="#ff0055" fill-opacity="0.2"/>
              <rect x="30" y="11" width="32" height="46" rx="4" fill="#ff0055" fill-opacity="0.4"/>
              <rect x="52" y="6" width="32" height="46" rx="4" fill="#ff0055" fill-opacity="0.7"/>
            </svg>
          </div>
        `;

      case 'wild_draw10':
        return `
          <div class="draw-symbol-wrapper">
            <span class="draw-num-text" style="color: #ff0055; font-size: 26px;">+10</span>
            <svg viewBox="0 0 90 70" class="mini-card-icon" fill="none" stroke="#ff0055" stroke-width="6">
              <rect x="10" y="14" width="32" height="46" rx="4" fill="#ff0055" fill-opacity="0.3"/>
              <rect x="42" y="8" width="32" height="46" rx="4" fill="#ff0055" fill-opacity="0.7"/>
            </svg>
          </div>
        `;

      case 'wild_reverse_draw4':
        return `
          <div class="draw-symbol-wrapper">
            <span class="draw-num-text">+4</span>
            <svg viewBox="0 0 100 100" class="card-svg-icon" style="width: 28px; height: 28px;" fill="currentColor">
              <path d="M 22 42 A 28 28 0 0 1 76 34 L 76 22 L 95 38 L 76 54 L 76 44 A 18 18 0 0 0 26 48 Z"/>
              <path d="M 78 58 A 28 28 0 0 1 24 66 L 24 78 L 5 62 L 24 46 L 24 56 A 18 18 0 0 0 74 52 Z"/>
            </svg>
          </div>
        `;

      case 'skip_everyone':
        return `
          <svg viewBox="0 0 100 100" class="card-svg-icon" fill="none" stroke="currentColor">
            <circle cx="50" cy="50" r="40" stroke-width="10"/>
            <circle cx="50" cy="50" r="26" stroke-width="8"/>
            <line x1="22" y1="22" x2="78" y2="78" stroke-width="12"/>
          </svg>
        `;

      case 'wild':
        return `
          <svg viewBox="0 0 100 100" class="card-svg-icon" viewBox="0 0 100 100">
            <!-- 4 Segmented Wild circle -->
            <path d="M 50 50 L 50 12 A 38 38 0 0 1 88 50 Z" fill="#ff2b38"/>
            <path d="M 50 50 L 88 50 A 38 38 0 0 1 50 88 Z" fill="#1e90ff"/>
            <path d="M 50 50 L 50 88 A 38 38 0 0 1 12 50 Z" fill="#ffd000"/>
            <path d="M 50 50 L 12 50 A 38 38 0 0 1 50 12 Z" fill="#10ac84"/>
            <circle cx="50" cy="50" r="14" fill="#ffffff"/>
          </svg>
        `;

      case 'wild_draw_color':
        return `
          <svg viewBox="0 0 100 100" class="card-svg-icon" viewBox="0 0 100 100">
            <path d="M 50 50 L 50 12 A 38 38 0 0 1 88 50 Z" fill="#ff2a8d"/>
            <path d="M 50 50 L 88 50 A 38 38 0 0 1 50 88 Z" fill="#00e5ff"/>
            <path d="M 50 50 L 50 88 A 38 38 0 0 1 12 50 Z" fill="#ff6d00"/>
            <path d="M 50 50 L 12 50 A 38 38 0 0 1 50 12 Z" fill="#9c27b0"/>
            <rect x="36" y="32" width="28" height="38" rx="4" fill="#ffffff" stroke="#121318" stroke-width="4"/>
          </svg>
        `;

      case 'discard_all':
        return `
          <svg viewBox="0 0 100 100" class="card-svg-icon" fill="currentColor">
            <!-- 3 cards discarding outwards with down arrow -->
            <rect x="18" y="24" width="28" height="42" rx="4" transform="rotate(-20 32 45)" fill-opacity="0.5"/>
            <rect x="54" y="24" width="28" height="42" rx="4" transform="rotate(20 68 45)" fill-opacity="0.5"/>
            <rect x="36" y="18" width="28" height="42" rx="4" fill-opacity="0.8"/>
            <path d="M 50 62 L 66 74 L 56 74 L 56 94 L 44 94 L 44 74 L 34 74 Z" fill="currentColor"/>
          </svg>
        `;

      case 'color_roulette':
        return `
          <svg viewBox="0 0 100 100" class="card-svg-icon">
            <circle cx="50" cy="50" r="42" stroke="currentColor" stroke-width="6" fill="none"/>
            <path d="M 50 50 L 50 14 A 36 36 0 0 1 86 50 Z" fill="#ff2b38"/>
            <path d="M 50 50 L 86 50 A 36 36 0 0 1 50 86 Z" fill="#1e90ff"/>
            <path d="M 50 50 L 50 86 A 36 36 0 0 1 14 50 Z" fill="#ffd000"/>
            <path d="M 50 50 L 14 50 A 36 36 0 0 1 50 14 Z" fill="#10ac84"/>
            <polygon points="50,28 56,46 44,46" fill="#ffffff"/>
            <circle cx="50" cy="50" r="10" fill="#ffffff"/>
          </svg>
        `;

      default:
        // Plain numbers 0-9
        return `<span class="card-pure-number">${value}</span>`;
    }
  },

  getCornerLabel(value) {
    switch (value) {
      case 'skip': return 'Q';
      case 'reverse': return 'R';
      case 'flip': return 'F';
      case 'draw1': return '+1';
      case 'draw2': return '+2';
      case 'draw4': return '+4';
      case 'draw5': return '+5';
      case 'skip_everyone': return 'ALL';
      case 'wild': return 'W';
      case 'wild_draw2': return '+2';
      case 'wild_draw4': return '+4';
      case 'wild_reverse_draw4': return '+4';
      case 'wild_draw6': return '+6';
      case 'wild_draw10': return '+10';
      case 'wild_draw_color': return 'WDC';
      case 'discard_all': return 'ALL';
      case 'color_roulette': return 'ROU';
      default: return value;
    }
  },

  getBotAvatarSvg() {
    return `
      <svg viewBox="0 0 100 100" class="bot-svg-avatar" fill="currentColor">
        <rect x="25" y="35" width="50" height="42" rx="8" fill="#10ac84"/>
        <circle cx="38" cy="52" r="6" fill="#ffffff"/>
        <circle cx="62" cy="52" r="6" fill="#ffffff"/>
        <rect x="36" y="66" width="28" height="4" rx="2" fill="#ffffff"/>
        <line x1="50" y1="35" x2="50" y2="20" stroke="#10ac84" stroke-width="6"/>
        <circle cx="50" cy="18" r="6" fill="#ffd000"/>
        <rect x="15" y="48" width="6" height="16" rx="3" fill="#10ac84"/>
        <rect x="79" y="48" width="6" height="16" rx="3" fill="#10ac84"/>
      </svg>
    `;
  },

  getCardImageFilename(face, mode = 'classic', side = 'light') {
    if (!face) return 'classic_back.png';
    const color = face.color || 'wild';
    const val = face.value || '0';

    if (mode === 'flip') {
      const isDark = (side === 'dark');
      const pfx = isDark ? 'flip_dark_' : 'flip_light_';
      if (color === 'wild') {
        if (val === 'wild_draw_color') return 'flip_dark_wild_draw_color.png';
        if (val === 'wild_draw2') return 'flip_light_wild_draw2.png';
        return isDark ? 'flip_dark_wild.png' : 'flip_light_wild.png';
      }
      return `${pfx}${color}_${val}.png`;
    } else if (mode === 'no_mercy') {
      if (color === 'wild') {
        if (val === 'wild_draw6') return 'nomercy_wild_draw6.png';
        if (val === 'wild_draw10') return 'nomercy_wild_draw10.png';
        if (val === 'wild_reverse_draw4') return 'nomercy_wild_reverse_draw4.png';
        return 'nomercy_wild_color_roulette.png';
      }
      return `nomercy_${color}_${val}.png`;
    } else {
      // Classic
      if (color === 'wild') {
        if (val === 'wild_draw4') return 'classic_wild_draw4.png';
        return 'classic_wild.png';
      }
      return `classic_${color}_${val}.png`;
    }
  },

  getCardImageSrc(face, mode = 'classic', side = 'light') {
    return `assets/cards/sliced/${this.getCardImageFilename(face, mode, side)}`;
  },

  getCardBackSrc(mode = 'classic', side = 'light') {
    if (mode === 'flip') {
      return side === 'dark' ? 'assets/cards/sliced/flip_dark_back.png' : 'assets/cards/sliced/flip_light_back.png';
    } else if (mode === 'no_mercy') {
      return 'assets/cards/sliced/nomercy_back.png';
    } else {
      return 'assets/cards/sliced/classic_back.png';
    }
  },

  createCardElement(card, isFlippedMode = false, currentFlipSide = 'light', isPlayerHand = false, mode = 'classic') {
    const cardEl = document.createElement('div');
    cardEl.className = 'uno-card';
    cardEl.dataset.id = card.id;

    if (card.playable) {
      cardEl.classList.add('playable');
    }

    const face = card.displayFace || card;

    if (card.isFlipCard) {
      // 3D Flip Card structure
      if (currentFlipSide === 'dark') {
        cardEl.classList.add('flipped');
      }

      const inner = document.createElement('div');
      inner.className = 'card-inner';

      // Light face
      const lightFace = this.renderSingleFace(card.light, false, false, 'flip');
      // Dark face
      const darkFace = this.renderSingleFace(card.dark, true, false, 'flip');

      inner.appendChild(lightFace);
      inner.appendChild(darkFace);
      cardEl.appendChild(inner);

      // SISI BALIK PEEK BADGE (for cards in player hand)
      if (isPlayerHand) {
        const oppositeFace = currentFlipSide === 'dark' ? card.light : card.dark;
        const oppSide = currentFlipSide === 'dark' ? 'light' : 'dark';
        const peekBadge = document.createElement('div');
        peekBadge.className = 'flip-peek-badge';
        peekBadge.title = `Sisi Balik: ${oppositeFace.color.toUpperCase()} ${oppositeFace.value.toUpperCase()}`;
        
        peekBadge.innerHTML = `
          <span class="peek-tag">BALIK:</span>
          <img class="peek-mini-img" src="${this.getCardImageSrc(oppositeFace, 'flip', oppSide)}" alt="balik">
        `;
        cardEl.appendChild(peekBadge);
      }
    } else {
      // Single sided standard card
      const singleFace = this.renderSingleFace(face, false, false, mode);
      cardEl.appendChild(singleFace);
    }

    return cardEl;
  },

  renderSingleFace(face, isDarkSide = false, isNoMercyWild = false, mode = 'classic') {
    const faceEl = document.createElement('div');
    faceEl.className = `card-face ${isDarkSide ? 'dark-side' : ''}`;

    const side = isDarkSide ? 'dark' : 'light';
    const imgSrc = this.getCardImageSrc(face, mode, side);

    const img = document.createElement('img');
    img.className = 'card-img';
    img.src = imgSrc;
    img.alt = `${face.color} ${face.value}`;
    img.loading = 'lazy';
    img.onerror = () => {
      if (mode === 'no_mercy') {
        img.src = 'assets/cards/sliced/nomercy_wild_color_roulette.png';
      } else if (mode === 'flip') {
        img.src = side === 'dark' ? 'assets/cards/sliced/flip_dark_wild.png' : 'assets/cards/sliced/flip_light_wild.png';
      } else {
        img.src = 'assets/cards/sliced/classic_wild.png';
      }
    };
    faceEl.appendChild(img);

    return faceEl;
  },

  renderHand(cards, container, onCardClick, isFlip = false, flipSide = 'light', mode = 'classic') {
    container.innerHTML = '';
    cards.forEach((card, idx) => {
      const cardEl = this.createCardElement(card, isFlip, flipSide, true, mode);
      cardEl.style.zIndex = idx + 1;

      // Always attach click listener to cards in hand
      cardEl.addEventListener('click', () => {
        onCardClick(card);
      });

      container.appendChild(cardEl);
    });
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

window.UI = UI;
