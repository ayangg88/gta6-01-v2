(() => {
  'use strict';
  const { WORLD } = globalThis.Meridian['config'];
  const { missionMarker } = globalThis.Meridian['missions'];
  const { getStores } = globalThis.Meridian['city'];

  function drawMinimap(ctx, state) {
    const x = 1060;
    const y = 22;
    const size = 196;
    const mapX = x + 5;
    const mapY = y + 23;
    const mapW = size - 10;
    const mapH = size - 28;
    const scaleX = mapW / WORLD.width;
    const scaleY = mapH / WORLD.height;
    ctx.save();
    ctx.fillStyle = '#10282e';
    ctx.fillRect(x, y, size, size);
    ctx.beginPath();
    ctx.rect(mapX, mapY, mapW, mapH);
    ctx.clip();
    ctx.fillStyle = '#278caa';
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.fillStyle = '#bfaa79';
    ctx.fillRect(mapX + 200 * scaleX, mapY + 180 * scaleY, 2900 * scaleX, 1770 * scaleY);
    ctx.fillStyle = '#2f9caa';
    ctx.fillRect(mapX + 2050 * scaleX, mapY, 112 * scaleX, 2100 * scaleY);
    ctx.fillRect(mapX + 2185 * scaleX, mapY, 112 * scaleX, 1940 * scaleY);
    ctx.fillStyle = '#e1d2a5';
    for (let roadX = 200; roadX < 3100; roadX += 400) {
      ctx.fillRect(mapX + roadX * scaleX, mapY + 180 * scaleY, 180 * scaleX, 1850 * scaleY);
    }
    for (const roadY of [250, 1050, 1850]) {
      ctx.fillRect(mapX + 200 * scaleX, mapY + roadY * scaleY, 2900 * scaleX, 180 * scaleY);
    }
    ctx.fillStyle = '#e8d9b4';
    for (let roadX = 380; roadX < 3100; roadX += 400) {
      for (const roadY of [430, 1230]) {
        ctx.fillRect(mapX + (roadX + 12) * scaleX, mapY + (roadY + 32) * scaleY, 205 * scaleX, 6 * scaleY);
      }
    }
    const center = state.vehicle || state.player;
    const point = (world) => ({ x: mapX + world.x * scaleX, y: mapY + world.y * scaleY });
    const blip = (world, color, radius) => {
      const at = point(world);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(at.x, at.y, radius, 0, Math.PI * 2);
      ctx.fill();
    };
    const marker = missionMarker(state);
    if (marker) {
      const at = point(marker);
      ctx.save();
      ctx.translate(at.x, at.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#f1c85a';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }
    for (const store of getStores()) blip(store, store.kind === 'arms' ? '#f07c58' : '#f4dfaa', 2.2);
    for (let index = 0; index < state.police.cruisers.length; index += 1) {
      blip(state.police.cruisers[index], index % 2 ? '#e84e50' : '#5ea9ff', 3);
    }
    const player = point(center);
    ctx.fillStyle = '#f8f1dc';
    ctx.strokeStyle = '#d7ae4a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(244,238,218,.75)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    ctx.fillStyle = '#f1eee1';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('N', x + size - 13, y + 13);
    ctx.fillStyle = '#e4ce8d';
    ctx.beginPath();
    ctx.moveTo(x + size - 12, y + 18);
    ctx.lineTo(x + size - 16, y + 26);
    ctx.lineTo(x + size - 8, y + 26);
    ctx.closePath();
    ctx.fill();
  }

  globalThis.Meridian['minimap'] = { drawMinimap };
})();
