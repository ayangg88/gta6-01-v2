(() => {
  'use strict';
  const { WORLD } = globalThis.Meridian['config'];
  const { missionMarker } = globalThis.Meridian['missions'];
  const { getStores } = globalThis.Meridian['city'];

  function drawMinimap(ctx, state) {
    const x = 1060;
    const y = 22;
    const size = 196;
    const scale = size / WORLD.width;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();
    ctx.fillStyle = '#24595d';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#c5b68e';
    ctx.fillRect(x + 200 * scale, y, 2900 * scale, 2030 * scale);
    ctx.fillStyle = '#364247';
    for (let roadX = 200; roadX < 3100; roadX += 400) ctx.fillRect(x + roadX * scale, y + 180 * scale, 112 * scale, 1850 * scale);
    for (let roadY = 250; roadY < 2030; roadY += 800) ctx.fillRect(x + 200 * scale, y + roadY * scale, 2900 * scale, 112 * scale);
    ctx.fillStyle = '#2d8384';
    ctx.fillRect(x + 2050 * scale, y, 112 * scale, 2100 * scale);
    ctx.fillRect(x, y + 1950 * scale, size, 650 * scale);
    const center = state.vehicle || state.player;
    const originX = x + size / 2 - center.x * scale;
    const originY = y + size / 2 - center.y * scale;
    const blip = (point, color, radius) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(originX + point.x * scale, originY + point.y * scale, radius, 0, Math.PI * 2);
      ctx.fill();
    };
    const marker = missionMarker(state);
    if (marker) blip(marker, '#52e3cf', 4);
    for (const store of getStores()) blip(store, store.kind === 'arms' ? '#f07c58' : '#ebdcab', 3);
    for (let index = 0; index < 20; index += 1) {
      if (state.packages[index].collected) continue;
      blip(state.packages[index], '#e6bf4e', 2.3);
    }
    for (const cruiser of state.police.cruisers) blip(cruiser, '#ea6256', 3.5);
    blip(center, '#f6f1dc', 4.5);
    ctx.restore();
    ctx.strokeStyle = 'rgba(244,238,218,.75)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    ctx.fillStyle = '#f1eee1';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('N', x + size - 13, y + 13);
    ctx.fillStyle = '#e4ce8d';
    ctx.fillRect(x + size - 11, y + 20, 2, 11);
  }

  globalThis.Meridian['minimap'] = { drawMinimap };
})();
