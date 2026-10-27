const fs = require('fs');
const { PNG } = require('d:/xampp/htdocs/Uno/node_modules/pngjs');

const cardsDir = 'd:/xampp/htdocs/Uno/src/public/assets/cards/';
const slicedDir = cardsDir + 'sliced/';

if (!fs.existsSync(slicedDir)) {
  fs.mkdirSync(slicedDir, { recursive: true });
}

function slice(srcPng, col, row, outFile) {
  const x = col * 84;
  const y = row * 129;
  const w = 82;
  const h = 126;

  const out = new PNG({ width: w, height: h });
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const srcIdx = ((y + dy) * srcPng.width + (x + dx)) * 4;
      const destIdx = (dy * w + dx) * 4;
      out.data[destIdx] = srcPng.data[srcIdx];
      out.data[destIdx + 1] = srcPng.data[srcIdx + 1];
      out.data[destIdx + 2] = srcPng.data[srcIdx + 2];
      out.data[destIdx + 3] = srcPng.data[srcIdx + 3];
    }
  }
  fs.writeFileSync(slicedDir + outFile, PNG.sync.write(out));
}

console.log('1. Slicing Classic Uno...');
const classicPng = PNG.sync.read(fs.readFileSync(cardsDir + 'uno_classic.png'));

// Back & Wilds
slice(classicPng, 0, 0, 'classic_back.png');
slice(classicPng, 1, 0, 'classic_wild.png');
slice(classicPng, 5, 0, 'classic_wild_draw4.png');

// Yellow cards: Row 1
for (let i = 1; i <= 9; i++) slice(classicPng, i - 1, 1, `classic_yellow_${i}.png`);
slice(classicPng, 9, 1, 'classic_yellow_0.png');
slice(classicPng, 10, 1, 'classic_yellow_draw2.png');
slice(classicPng, 11, 1, 'classic_yellow_skip.png');
slice(classicPng, 0, 2, 'classic_yellow_reverse.png');

// Red cards: Row 2 col 1-11 & Row 3 col 0-1
for (let i = 1; i <= 9; i++) slice(classicPng, i, 2, `classic_red_${i}.png`);
slice(classicPng, 10, 2, 'classic_red_0.png');
slice(classicPng, 11, 2, 'classic_red_draw2.png');
slice(classicPng, 0, 3, 'classic_red_skip.png');
slice(classicPng, 1, 3, 'classic_red_reverse.png');

// Blue cards: Row 3 col 2-11 & Row 4 col 0-2
for (let i = 1; i <= 9; i++) slice(classicPng, i + 1, 3, `classic_blue_${i}.png`);
slice(classicPng, 11, 3, 'classic_blue_0.png');
slice(classicPng, 0, 4, 'classic_blue_draw2.png');
slice(classicPng, 1, 4, 'classic_blue_skip.png');
slice(classicPng, 2, 4, 'classic_blue_reverse.png');

// Green cards: Row 4 col 3-11 & Row 5 col 0-3
for (let i = 1; i <= 9; i++) slice(classicPng, i + 2, 4, `classic_green_${i}.png`);
slice(classicPng, 0, 5, 'classic_green_0.png');
slice(classicPng, 1, 5, 'classic_green_draw2.png');
slice(classicPng, 2, 5, 'classic_green_skip.png');
slice(classicPng, 3, 5, 'classic_green_reverse.png');

console.log('2. Slicing Flip Light...');
const flipLightPng = PNG.sync.read(fs.readFileSync(cardsDir + 'uno_flip_light.png'));
slice(flipLightPng, 0, 0, 'flip_light_back.png');
slice(flipLightPng, 1, 0, 'flip_light_wild.png');
slice(flipLightPng, 5, 0, 'flip_light_wild_draw2.png');

// Yellow Flip Light
for (let i = 1; i <= 9; i++) slice(flipLightPng, i - 1, 1, `flip_light_yellow_${i}.png`);
slice(flipLightPng, 9, 1, 'flip_light_yellow_flip.png');
slice(flipLightPng, 10, 1, 'flip_light_yellow_draw1.png');
slice(flipLightPng, 11, 1, 'flip_light_yellow_skip.png');
slice(flipLightPng, 0, 2, 'flip_light_yellow_reverse.png');

// Red Flip Light
for (let i = 1; i <= 9; i++) slice(flipLightPng, i, 2, `flip_light_red_${i}.png`);
slice(flipLightPng, 10, 2, 'flip_light_red_flip.png');
slice(flipLightPng, 11, 2, 'flip_light_red_draw1.png');
slice(flipLightPng, 0, 3, 'flip_light_red_skip.png');
slice(flipLightPng, 1, 3, 'flip_light_red_reverse.png');

// Blue Flip Light
for (let i = 1; i <= 9; i++) slice(flipLightPng, i + 1, 3, `flip_light_blue_${i}.png`);
slice(flipLightPng, 11, 3, 'flip_light_blue_flip.png');
slice(flipLightPng, 0, 4, 'flip_light_blue_draw1.png');
slice(flipLightPng, 1, 4, 'flip_light_blue_skip.png');
slice(flipLightPng, 2, 4, 'flip_light_blue_reverse.png');

// Green Flip Light
for (let i = 1; i <= 9; i++) slice(flipLightPng, i + 2, 4, `flip_light_green_${i}.png`);
slice(flipLightPng, 0, 5, 'flip_light_green_flip.png');
slice(flipLightPng, 1, 5, 'flip_light_green_draw1.png');
slice(flipLightPng, 2, 5, 'flip_light_green_skip.png');
slice(flipLightPng, 3, 5, 'flip_light_green_reverse.png');

console.log('3. Slicing Flip Dark...');
const flipDarkPng = PNG.sync.read(fs.readFileSync(cardsDir + 'uno_flip_dark.png'));
slice(flipDarkPng, 0, 0, 'flip_dark_back.png');
slice(flipDarkPng, 1, 0, 'flip_dark_wild.png');
slice(flipDarkPng, 5, 0, 'flip_dark_wild_draw_color.png');

// Orange Flip Dark (Row 1)
for (let i = 1; i <= 9; i++) slice(flipDarkPng, i - 1, 1, `flip_dark_orange_${i}.png`);
slice(flipDarkPng, 9, 1, 'flip_dark_orange_flip.png');
slice(flipDarkPng, 10, 1, 'flip_dark_orange_draw5.png');
slice(flipDarkPng, 11, 1, 'flip_dark_orange_skip_everyone.png');
slice(flipDarkPng, 0, 2, 'flip_dark_orange_reverse.png');

// Pink Flip Dark (Row 2)
for (let i = 1; i <= 9; i++) slice(flipDarkPng, i, 2, `flip_dark_pink_${i}.png`);
slice(flipDarkPng, 10, 2, 'flip_dark_pink_flip.png');
slice(flipDarkPng, 11, 2, 'flip_dark_pink_draw5.png');
slice(flipDarkPng, 0, 3, 'flip_dark_pink_skip_everyone.png');
slice(flipDarkPng, 1, 3, 'flip_dark_pink_reverse.png');

// Purple Flip Dark (Row 3)
for (let i = 1; i <= 9; i++) slice(flipDarkPng, i + 1, 3, `flip_dark_purple_${i}.png`);
slice(flipDarkPng, 11, 3, 'flip_dark_purple_flip.png');
slice(flipDarkPng, 0, 4, 'flip_dark_purple_draw5.png');
slice(flipDarkPng, 1, 4, 'flip_dark_purple_skip_everyone.png');
slice(flipDarkPng, 2, 4, 'flip_dark_purple_reverse.png');

// Teal Flip Dark (Row 4)
for (let i = 1; i <= 9; i++) slice(flipDarkPng, i + 2, 4, `flip_dark_teal_${i}.png`);
slice(flipDarkPng, 0, 5, 'flip_dark_teal_flip.png');
slice(flipDarkPng, 1, 5, 'flip_dark_teal_draw5.png');
slice(flipDarkPng, 2, 5, 'flip_dark_teal_skip_everyone.png');
slice(flipDarkPng, 3, 5, 'flip_dark_teal_reverse.png');

console.log('4. Slicing No Mercy Base...');
const nmBasePng = PNG.sync.read(fs.readFileSync(cardsDir + 'uno_nomercy_base.png'));
slice(nmBasePng, 0, 0, 'nomercy_back.png');

// Yellow No Mercy Base
for (let i = 1; i <= 9; i++) slice(nmBasePng, i - 1, 1, `nomercy_yellow_${i}.png`);
slice(nmBasePng, 9, 1, 'nomercy_yellow_0.png');
slice(nmBasePng, 10, 1, 'nomercy_yellow_draw2.png');
slice(nmBasePng, 11, 1, 'nomercy_yellow_skip.png');
slice(nmBasePng, 0, 2, 'nomercy_yellow_reverse.png');

// Red No Mercy Base
for (let i = 1; i <= 9; i++) slice(nmBasePng, i, 2, `nomercy_red_${i}.png`);
slice(nmBasePng, 10, 2, 'nomercy_red_0.png');
slice(nmBasePng, 11, 2, 'nomercy_red_draw2.png');
slice(nmBasePng, 0, 3, 'nomercy_red_skip.png');
slice(nmBasePng, 1, 3, 'nomercy_red_reverse.png');

// Blue No Mercy Base
for (let i = 1; i <= 9; i++) slice(nmBasePng, i + 1, 3, `nomercy_blue_${i}.png`);
slice(nmBasePng, 11, 3, 'nomercy_blue_0.png');
slice(nmBasePng, 0, 4, 'nomercy_blue_draw2.png');
slice(nmBasePng, 1, 4, 'nomercy_blue_skip.png');
slice(nmBasePng, 2, 4, 'nomercy_blue_reverse.png');

// Green No Mercy Base
for (let i = 1; i <= 9; i++) slice(nmBasePng, i + 2, 4, `nomercy_green_${i}.png`);
slice(nmBasePng, 0, 5, 'nomercy_green_0.png');
slice(nmBasePng, 1, 5, 'nomercy_green_draw2.png');
slice(nmBasePng, 2, 5, 'nomercy_green_skip.png');
slice(nmBasePng, 3, 5, 'nomercy_green_reverse.png');

console.log('5. Slicing No Mercy Specials...');
const nmSpecPng = PNG.sync.read(fs.readFileSync(cardsDir + 'uno_nomercy_specials.png'));

// Skip Everyone & Draw 4 (Row 1)
slice(nmSpecPng, 4, 1, 'nomercy_yellow_skip_everyone.png');
slice(nmSpecPng, 5, 1, 'nomercy_red_skip_everyone.png');
slice(nmSpecPng, 6, 1, 'nomercy_blue_skip_everyone.png');
slice(nmSpecPng, 7, 1, 'nomercy_green_skip_everyone.png');
slice(nmSpecPng, 8, 1, 'nomercy_yellow_draw4.png');
slice(nmSpecPng, 9, 1, 'nomercy_red_draw4.png');
slice(nmSpecPng, 10, 1, 'nomercy_blue_draw4.png');
slice(nmSpecPng, 11, 1, 'nomercy_green_draw4.png');

// Color Roulette & Wild Reverse Draw 4 (Row 2)
slice(nmSpecPng, 0, 2, 'nomercy_wild_color_roulette.png');
slice(nmSpecPng, 1, 2, 'nomercy_yellow_color_roulette.png');
slice(nmSpecPng, 2, 2, 'nomercy_red_color_roulette.png');
slice(nmSpecPng, 3, 2, 'nomercy_blue_color_roulette.png');
slice(nmSpecPng, 4, 2, 'nomercy_green_color_roulette.png');
slice(nmSpecPng, 5, 2, 'nomercy_wild_reverse_draw4.png');

// Wild Draw 6 & Wild Draw 10 (Row 3)
slice(nmSpecPng, 0, 3, 'nomercy_wild_draw6.png');
slice(nmSpecPng, 5, 3, 'nomercy_wild_draw10.png');

// Discard All (Row 4)
slice(nmSpecPng, 0, 4, 'nomercy_yellow_discard_all.png');
slice(nmSpecPng, 1, 4, 'nomercy_red_discard_all.png');
slice(nmSpecPng, 2, 4, 'nomercy_blue_discard_all.png');
slice(nmSpecPng, 3, 4, 'nomercy_green_discard_all.png');

console.log('All cards sliced successfully! Total files:', fs.readdirSync(slicedDir).length);
