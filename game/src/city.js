(() => {
  'use strict';
  const { WORLD } = globalThis.Meridian['config'];

  const PARKS = [{ x: 260, y: 250, w: 220, h: 180 }, { x: 1780, y: 880, w: 280, h: 230 }, { x: 2580, y: 1780, w: 300, h: 220 }];
  const DISTRICTS = [
    { name: 'CROWN CENTER', x: 500, y: 200, color: '#53686a', height: 1.8 },
    { name: 'MARINA VERDE', x: 1200, y: 120, color: '#e1d2ad', height: 0.66 },
    { name: 'OLD QUAY', x: 2000, y: 240, color: '#9e755c', height: 0.82 },
    { name: 'FREIGHT WARD', x: 500, y: 1250, color: '#868779', height: 0.72 },
    { name: 'SOUTH BEACH', x: 2100, y: 1540, color: '#deca9b', height: 0.53 },
    { name: 'CITRUS RIDGE', x: 2900, y: 500, color: '#bd9b70', height: 0.98 }
  ];
  const STORES = [
    { x: 655, y: 286, name: 'PALM & PINE', kind: 'market' },
    { x: 1465, y: 286, name: 'SUNSET MART', kind: 'market' },
    { x: 2258, y: 286, name: 'TIDE LINE', kind: 'market' },
    { x: 1855, y: 1086, name: 'BAY ARMS', kind: 'arms' },
    { x: 2662, y: 1486, name: 'MERIDIAN MOTORS', kind: 'garage' }
  ];

  function box(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawCity(ctx, camera, rng, time) {
    ctx.fillStyle = '#4f9c9a';
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    box(ctx, 0, 0, WORLD.width, 250, '#286f75');
    box(ctx, 0, 0, 200, WORLD.height, '#286f75');
    box(ctx, 0, 1950, WORLD.width, 650, '#26777b');
    box(ctx, 3100, 0, 300, WORLD.height, '#26777b');
    box(ctx, 2050, 0, 112, 2100, '#287a7d');
    box(ctx, 2185, 0, 112, 1940, '#287a7d');
    box(ctx, 2297, 1950, 803, 120, '#52a6a0');
    for (let stripe = 0; stripe < 9; stripe += 1) {
      box(ctx, 60 + stripe * 28, 2015, 18, 585, stripe % 2 ? '#e6d497' : '#d7c484');
    }
    box(ctx, 200, 180, 2900, 1770, '#b9ad8b');
    box(ctx, 2050, 0, 112, 2100, '#287a7d');
    box(ctx, 0, 250, 3100, 180, '#343f42');
    box(ctx, 200, 0, 2900, 180, '#343f42');
    box(ctx, 200, 1050, 2900, 180, '#343f42');
    box(ctx, 200, 1850, 2900, 180, '#343f42');
    for (let x = 200; x <= 3100; x += 400) box(ctx, x, 180, 180, 1850, '#343f42');
    for (let y = 250; y < 2030; y += 800) {
      for (let x = 210; x < 3100; x += 400) {
        ctx.strokeStyle = '#d8b765';
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 22]);
        ctx.beginPath();
        ctx.moveTo(x + 18, y + 90);
        ctx.lineTo(x + 360, y + 90);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    for (let x = 182; x < 3100; x += 400) {
      box(ctx, x, 255, 16, 170, '#b8ac8e');
      box(ctx, x, 1055, 16, 170, '#b8ac8e');
      box(ctx, x, 1855, 16, 170, '#b8ac8e');
    }
    for (let y = 0; y < 2030; y += 400) {
      box(ctx, 203, y, 174, 16, '#b8ac8e');
      box(ctx, 603, y, 174, 16, '#b8ac8e');
      box(ctx, 1003, y, 174, 16, '#b8ac8e');
    }
    for (const district of DISTRICTS) {
      const baseX = Math.floor(district.x / 400) * 400 + 30;
      const baseY = Math.floor(district.y / 400) * 400 + 35;
      for (let row = 0; row < 2; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          const x = baseX + col * 118;
          const y = baseY + row * 152;
          const width = 92 + (col % 2) * 14;
          const height = 86 + row * 14;
          box(ctx, x + 8, y + 9, width, height, 'rgba(0,0,0,.19)');
          box(ctx, x, y, width, height, district.color);
          box(ctx, x + 8, y + 8, width - 16, 8, '#e7d6aa');
          const floors = Math.round(2 + district.height * 5);
          for (let floor = 0; floor < Math.min(floors, 5); floor += 1) {
            for (let window = 0; window < 3; window += 1) {
              box(ctx, x + 12 + window * 23, y + 24 + floor * 12, 10, 7, time % 2 && rng() > 0.45 ? '#efce7c' : '#5f7e79');
            }
          }
        }
      }
      ctx.fillStyle = '#f4deb0';
      ctx.font = 'bold 13px Arial';
      ctx.fillText(district.name, district.x, district.y);
    }
    for (const park of PARKS) {
      box(ctx, park.x, park.y, park.w, park.h, '#4b8a59');
      box(ctx, park.x + 15, park.y + 12, park.w - 30, park.h - 24, '#69a45c');
      for (let index = 0; index < 9; index += 1) {
        const x = park.x + 20 + (index * 71) % (park.w - 40);
        const y = park.y + 20 + (index * 43) % (park.h - 40);
        ctx.fillStyle = '#286342';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const store of STORES) {
      box(ctx, store.x, store.y, 128, 76, store.kind === 'arms' ? '#705d52' : store.kind === 'garage' ? '#596b62' : '#d1c8a9');
      box(ctx, store.x + 8, store.y + 8, 112, 16, store.kind === 'arms' ? '#d77a58' : '#54b5a4');
      ctx.fillStyle = '#f2eee1';
      ctx.font = 'bold 11px Arial';
      ctx.fillText(store.name, store.x + 8, store.y + 48);
    }
    for (let dock = 0; dock < 4; dock += 1) {
      box(ctx, 2298 + dock * 130, 2040, 18, 280, '#957d62');
      box(ctx, 2255 + dock * 130, 2090, 130, 14, '#c0ad8a');
    }
    ctx.fillStyle = 'rgba(228,240,209,.22)';
    for (let wave = 0; wave < 34; wave += 1) {
      const y = 280 + (wave * 61) % 1550;
      const x = 2100 + (wave * 97) % 100;
      ctx.fillRect(x, y, 92, 2);
    }
  }

  function getStores() {
    return STORES;
  }

  function getParks() {
    return PARKS;
  }

  function drawWorldLabel(ctx, text, x, y, color) {
    ctx.fillStyle = 'rgba(18,28,31,.84)';
    ctx.fillRect(x - 5, y - 16, ctx.measureText(text).width + 10, 22);
    ctx.fillStyle = color;
    ctx.font = 'bold 12px Arial';
    ctx.fillText(text, x, y);
  }

  globalThis.Meridian['city'] = { drawCity, getStores, getParks, drawWorldLabel };
})();
