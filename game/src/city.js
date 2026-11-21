(() => {
  'use strict';
  const { WORLD } = globalThis.Meridian['config'];
  const { createVehicle, drawVehicle } = globalThis.Meridian['vehicles'];

  const PARKS = [{ x: 260, y: 250, w: 220, h: 180 }, { x: 1780, y: 880, w: 280, h: 230 }, { x: 1650, y: 1540, w: 300, h: 220 }];
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
    { x: 2224, y: 1576, name: 'SALT & CITRUS', kind: 'market' },
    { x: 2514, y: 1576, name: 'BLUE CRAB', kind: 'market' },
    { x: 2804, y: 1576, name: 'COASTAL GOODS', kind: 'market' },
    { x: 1855, y: 1086, name: 'BAY ARMS', kind: 'arms' },
    { x: 2662, y: 1486, name: 'MERIDIAN MOTORS', kind: 'garage' }
  ];
  const BUILDING_COLORS = ['#db9f72', '#e2c58d', '#a9c3b6', '#d58968', '#8fb4b8', '#ded1ae', '#bb9ec1', '#d9ac62'];
  const ROOF_COLORS = ['#a95f4a', '#517d7b', '#d18a55', '#776d88', '#54748c', '#bd674d', '#809765', '#b49a68'];

  function box(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawCity(ctx, camera, rng, time, state = {}) {
    ctx.fillStyle = '#58b7b0';
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    box(ctx, 0, 0, WORLD.width, 250, '#4aaeb1');
    box(ctx, 0, 0, 200, WORLD.height, '#4aaeb1');
    box(ctx, 0, 1950, WORLD.width, 650, '#43b3bd');
    box(ctx, 3100, 0, 300, WORLD.height, '#43b3bd');
    box(ctx, 2050, 0, 112, 2100, '#38a4aa');
    box(ctx, 2185, 0, 112, 1940, '#39a9ae');
    box(ctx, 2297, 1950, 803, 120, '#69c3bc');
    for (let stripe = 0; stripe < 9; stripe += 1) {
      box(ctx, 60 + stripe * 28, 2015, 18, 585, stripe % 2 ? '#e6d497' : '#d7c484');
    }
    box(ctx, 200, 180, 2900, 1770, '#e0cc9e');
    box(ctx, 2050, 0, 112, 2100, '#38a4aa');
    box(ctx, 0, 250, 3100, 180, '#756858');
    box(ctx, 200, 0, 2900, 180, '#756858');
    box(ctx, 200, 1050, 2900, 180, '#756858');
    box(ctx, 200, 1850, 2900, 180, '#756858');
    for (let x = 200; x <= 3100; x += 400) box(ctx, x, 180, 180, 1850, '#756858');
    for (let y = 250; y < 2030; y += 800) {
      for (let x = 210; x < 3100; x += 400) {
        ctx.strokeStyle = '#f3d982';
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
    let footprint = 0;
    for (const top of [430, 690, 1230, 1510]) {
      for (let streetX = 380; streetX < 3100; streetX += 400) {
        for (let lot = 0; lot < 2; lot += 1) {
          const x = streetX + 12 + lot * 106 + (footprint % 3) * 3;
          const y = top + 34 + (footprint % 4) * 23;
          const width = 78 + (footprint % 3) * 8;
          const height = 150 + (footprint % 4) * 20;
          const color = BUILDING_COLORS[footprint % BUILDING_COLORS.length];
          const floors = 2 + footprint % 5;
          box(ctx, x + 9, y + 11, width, height, 'rgba(45,51,46,.22)');
          box(ctx, x, y, width, height, color);
          box(ctx, x + 5, y + 5, width - 10, 14, ROOF_COLORS[footprint % ROOF_COLORS.length]);
          box(ctx, x + 9, y + 21, width - 18, 3, 'rgba(255,239,199,.72)');
          for (let floor = 0; floor < floors; floor += 1) {
            const windowY = y + 30 + floor * 20;
            for (let window = 0; window < 3; window += 1) {
              const windowX = x + 10 + window * ((width - 28) / 2);
              box(ctx, windowX, windowY, 10, 11, (footprint + floor + window) % 4 === 0 ? '#f0ce83' : '#537c7c');
              box(ctx, windowX, windowY + 10, 10, 2, '#e8d9b4');
            }
          }
          box(ctx, x + width / 2 - 8, y + height - 25, 16, 25, '#65534b');
          footprint += 1;
        }
      }
    }
    for (const district of DISTRICTS) {
      const label = district.name;
      ctx.font = 'bold 13px Arial';
      if (!coveredLabel(ctx, camera, district.x, district.y - 8, ctx.measureText(label).width, 18, state)) {
        ctx.fillStyle = '#f8e6bd';
        ctx.shadowColor = 'rgba(42,54,52,.8)';
        ctx.shadowBlur = 3;
        ctx.fillText(label, district.x, district.y);
        ctx.shadowBlur = 0;
      }
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
      box(ctx, store.x + 7, store.y + 8, 128, 76, 'rgba(38,44,41,.23)');
      box(ctx, store.x, store.y, 128, 76, store.kind === 'arms' ? '#a66e51' : store.kind === 'garage' ? '#7c997e' : '#e4d39e');
      box(ctx, store.x + 8, store.y + 8, 112, 18, store.kind === 'arms' ? '#d77a58' : '#329b91');
      box(ctx, store.x + 14, store.y + 34, 30, 24, '#477477');
      box(ctx, store.x + 52, store.y + 34, 30, 24, '#477477');
      ctx.fillStyle = '#f2eee1';
      ctx.font = 'bold 11px Arial';
      if (!coveredLabel(ctx, camera, store.x + 8, store.y + 66, ctx.measureText(store.name).width, 16, state)) ctx.fillText(store.name, store.x + 8, store.y + 66);
    }
    drawStreetFurniture(ctx);
    drawParkedCars(ctx);
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

  function drawParkedCars(ctx) {
    for (let row = 0; row < 3; row += 1) {
      for (let block = 0; block < 7; block += 1) {
        if ((row + block) % 2) continue;
        const y = [250, 1050, 1850][row] + (block % 3 === 0 ? 20 : 150);
        const car = createVehicle(450 + block * 400, y, (row + block) % 5, block % 2 ? Math.PI : 0);
        car.color = BUILDING_COLORS[(row * 3 + block) % BUILDING_COLORS.length];
        drawVehicle(ctx, car);
      }
    }
  }

  function drawStreetFurniture(ctx) {
    for (let x = 410; x < 3100; x += 400) {
      for (const y of [444, 1064, 1244, 1864]) {
        const px = x + 11;
        ctx.fillStyle = '#805e44';
        ctx.fillRect(px, y, 5, 16);
        ctx.fillStyle = '#4f9660';
        ctx.beginPath();
        ctx.arc(px + 2, y - 8, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c9a868';
        ctx.fillRect(px + 23, y + 4, 3, 20);
        ctx.beginPath();
        ctx.arc(px + 24, y + 2, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(246,238,212,.9)';
    for (const roadY of [250, 1050, 1850]) {
      for (let roadX = 200; roadX < 3100; roadX += 400) {
        for (let stripe = 0; stripe < 6; stripe += 1) ctx.fillRect(roadX + 27 + stripe * 17, roadY + 42, 9, 94);
      }
      for (let dash = 0; dash < 24; dash += 1) {
        ctx.fillRect(410 + dash * 112, roadY + 88, 46, 4);
        ctx.fillRect(410 + dash * 112, roadY + 108, 46, 3);
      }
    }
    for (let x = 200; x < 3100; x += 400) {
      for (let y = 0; y < 2030; y += 800) {
        for (let stripe = 0; stripe < 6; stripe += 1) ctx.fillRect(x + 42, y + 24 + stripe * 17, 94, 9);
      }
    }
  }

  function coveredLabel(ctx, camera, x, baseline, width, height, state = {}) {
    const left = x - camera.x - 5;
    const top = baseline - camera.y - height;
    const right = left + width + 10;
    const bottom = top + height + 4;
    const reserved = [[0, 0, 296, 232], [1048, 10, 1270, 232], [0, 606, 722, 720], state.vehicle ? [780, 614, 1030, 706] : [1028, 614, 1270, 706]];
    if (state.toastTimer > 0 && !state.dialogue) reserved.push([441, 44, 839, 92]);
    if (state.dialogue) reserved.push([335, 495, 945, 615]);
    if (state.shop) reserved.push([402, 124, 878, 528]);
    return left < 0 || top < 0 || right > 1280 || bottom > 690 || reserved.some(([x1, y1, x2, y2]) => left < x2 && right > x1 && top < y2 && bottom > y1);
  }

  function getStores() {
    return STORES;
  }

  function getParks() {
    return PARKS;
  }

  function drawWorldLabel(ctx, text, x, y, color) {
    ctx.font = 'bold 12px Arial';
    if (coveredLabel(ctx, { x: 0, y: 0 }, x, y, ctx.measureText(text).width, 16)) return;
    ctx.fillStyle = 'rgba(18,28,31,.84)';
    ctx.fillRect(x - 5, y - 16, ctx.measureText(text).width + 10, 22);
    ctx.fillStyle = color;
    ctx.font = 'bold 12px Arial';
    ctx.fillText(text, x, y);
  }

  globalThis.Meridian['city'] = { drawCity, getStores, getParks, drawWorldLabel };
})();
