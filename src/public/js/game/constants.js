(function(root) {
  const UnoConstants = {
    MODES: {
      CLASSIC: 'classic',
      FLIP: 'flip',
      NO_MERCY: 'no_mercy'
    },
    COLORS: {
      RED: 'red',
      YELLOW: 'yellow',
      GREEN: 'green',
      BLUE: 'blue',
      PINK: 'pink',
      TEAL: 'teal',
      ORANGE: 'orange',
      PURPLE: 'purple',
      WILD: 'wild'
    },
    FLIP_SIDES: {
      LIGHT: 'light',
      DARK: 'dark'
    },
    MERCY_CARD_LIMIT: 25
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnoConstants;
  }
  if (typeof window !== 'undefined') {
    window.UnoConstants = UnoConstants;
  }
})(typeof self !== 'undefined' ? self : this);
