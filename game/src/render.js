(() => {
  'use strict';
  const { drawActivities } = globalThis.Meridian['activities'];
  const { WORLD } = globalThis.Meridian['config'];
  const { drawCity } = globalThis.Meridian['city'];
  const { drawHud } = globalThis.Meridian['hud'];
  const { drawMissionMarker } = globalThis.Meridian['missions'];
  const { drawPedestrians } = globalThis.Meridian['pedestrians'];
  const { drawPolice } = globalThis.Meridian['police'];
  const { drawVehicle } = globalThis.Meridian['vehicles'];
  const { drawWeaponEffects } = globalThis.Meridian['weapons'];

  function createRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    const view = { scale: 1, x: 0, y: 0 };
    function resize() {
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      view.scale = Math.min(canvas.width / 1280, canvas.height / 720);
      view.x = (canvas.width - 1280 * view.scale) / 2;
      view.y = (canvas.height - 720 * view.scale) / 2;
    }
    function paint(state, screen) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#0d1619';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
      const focus = state.vehicle || state.player;
      const ahead = state.vehicle ? state.vehicle.speed * 0.3 : 0;
      const camX = Math.max(0, Math.min(WORLD.width - 1280, focus.x - 640 + Math.cos(state.vehicle?.angle || 0) * ahead));
      const camY = Math.max(0, Math.min(WORLD.height - 720, focus.y - 360 + Math.sin(state.vehicle?.angle || 0) * ahead));
      const shakeX = state.shake ? Math.sin(state.time * 80) * state.shake : 0;
      const shakeY = state.shake ? Math.cos(state.time * 68) * state.shake : 0;
      ctx.save();
      ctx.translate(-camX + shakeX, -camY + shakeY);
      drawCity(ctx, { x: camX, y: camY }, state.cityRng, Math.floor(state.dayClock));
      drawMissionMarker(ctx, state);
      drawActivities(ctx, state);
      if (state.vehicle && !state.traffic.includes(state.vehicle) && !state.boats.includes(state.vehicle)) drawVehicle(ctx, state.vehicle, true);
      for (const skid of state.skids) {
        ctx.save();
        ctx.translate(skid.x, skid.y);
        ctx.rotate(skid.angle);
        ctx.fillStyle = 'rgba(21,28,28,.36)';
        ctx.fillRect(-8, -11, 16, 3);
        ctx.fillRect(-8, 8, 16, 3);
        ctx.restore();
      }
      for (const packageItem of state.packages) {
        if (packageItem.collected) continue;
        ctx.fillStyle = '#f2cf5e';
        ctx.save();
        ctx.translate(packageItem.x, packageItem.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-7, -7, 14, 14);
        ctx.restore();
      }
      for (const skiff of state.boats) drawVehicle(ctx, skiff);
      for (const traffic of state.traffic) drawVehicle(ctx, traffic, traffic === state.vehicle);
      drawPedestrians(ctx, state);
      drawPolice(ctx, state);
      for (const effect of state.effects) {
        if (effect.kind === 'muzzle' || effect.kind === 'spark' || effect.kind === 'impact' || effect.kind === 'smoke' || effect.kind === 'dust') continue;
        ctx.fillStyle = 'rgba(227,229,213,.72)';
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 6 + effect.life * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      drawWeaponEffects(ctx, state);
      if (!state.vehicle) drawPlayer(ctx, state);
      if (state.rain) drawRain(ctx, state, camX, camY);
      ctx.restore();
      drawLighting(ctx, state);
      drawHud(ctx, state, screen);
    }
    resize();
    window.addEventListener('resize', resize);
    return { paint };
  }

  function drawPlayer(ctx, state) {
    const player = state.player;
    ctx.fillStyle = '#28373a';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 4, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cb6a4d';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#edc89f';
    ctx.beginPath();
    ctx.arc(player.x + Math.cos(state.aim) * 3, player.y - 7 + Math.sin(state.aim) * 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#232c2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(state.aim) * 20, player.y + Math.sin(state.aim) * 20);
    ctx.stroke();
  }

  function drawRain(ctx, state, camX, camY) {
    ctx.strokeStyle = 'rgba(216,235,230,.27)';
    ctx.lineWidth = 1;
    for (let index = 0; index < 100; index += 1) {
      const x = (index * 137 + Math.floor(state.time * 90)) % 1280;
      const y = (index * 71 + Math.floor(state.time * 150)) % 720;
      ctx.beginPath();
      ctx.moveTo(camX + x, camY + y);
      ctx.lineTo(camX + x - 6, camY + y + 17);
      ctx.stroke();
    }
  }

  function drawLighting(ctx, state) {
    const night = Math.max(0, Math.min(0.55, (Math.sin((state.dayClock / 24) * Math.PI * 2 - Math.PI / 2) + 0.15) * 0.32));
    if (night > 0.02) {
      ctx.fillStyle = `rgba(15,32,49,${night})`;
      ctx.fillRect(0, 0, 1280, 720);
    }
    if (state.rain) {
      ctx.fillStyle = 'rgba(35,60,68,.12)';
      ctx.fillRect(0, 0, 1280, 720);
    }
  }

  globalThis.Meridian['render'] = { createRenderer };
})();
