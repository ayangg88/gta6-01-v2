(() => {
  'use strict';
  const { createVehicle, drawVehicle } = globalThis.Meridian['vehicles'];

  function createPolice() {
    return { officers: [], cruisers: [], roadblocks: [], helicopter: null, wanted: 0, heat: 0, lastCrime: 0 };
  }

  function addHeat(state, amount = 1) {
    const police = state.police;
    police.wanted = Math.min(5, police.wanted + amount);
    police.heat = 1;
    police.lastCrime = state.time;
  }

  function updatePolice(state, dt) {
    const police = state.police;
    const player = state.vehicle || state.player;
    const seen = police.cruisers.some(car => Math.hypot(car.x - player.x, car.y - player.y) < 165);
    if (police.wanted && !seen && state.time - police.lastCrime > 6) {
      police.heat -= dt / 12;
      if (police.heat <= 0) {
        police.wanted -= 1;
        police.heat = 1;
      }
    } else if (seen) police.heat = 1;
    police.cruisers.length = Math.min(police.cruisers.length, police.wanted);
    while (police.cruisers.length < police.wanted && police.cruisers.length < 5) {
      const angle = state.rng() * Math.PI * 2;
      const car = createVehicle(player.x + Math.cos(angle) * 460, player.y + Math.sin(angle) * 460, police.wanted === 5 && police.cruisers.length === 4 ? 4 : 5, angle + Math.PI, false);
      car.health = 100;
      police.cruisers.push(car);
    }
    police.officers = police.officers.slice(0, police.wanted >= 2 ? 6 : police.wanted);
    while (police.officers.length < (police.wanted >= 2 ? 6 : police.wanted)) {
      police.officers.push({ x: player.x + 270 + state.rng() * 140, y: player.y + 240 + state.rng() * 140, angle: 0, firing: 0 });
    }
    if (police.wanted >= 2 && police.roadblocks.length < 2) {
      police.roadblocks.push({ x: player.x + 560, y: player.y + 430, angle: -0.4 });
    }
    if (police.wanted < 2) police.roadblocks.length = 0;
    if (police.wanted >= 3 && !police.helicopter) police.helicopter = { x: player.x + 160, y: player.y - 380, beam: 360, orbit: 0 };
    if (police.wanted < 3) police.helicopter = null;
    if (police.helicopter) {
      const heli = police.helicopter;
      heli.orbit += dt * 0.35;
      heli.x += (player.x + Math.cos(heli.orbit) * 180 - heli.x) * dt * 0.16;
      heli.y += (player.y - 360 + Math.sin(heli.orbit) * 75 - heli.y) * dt * 0.16;

    }
    for (const cruiser of police.cruisers) {
      const target = state.vehicle || state.player;
      const dx = target.x - cruiser.x;
      const dy = target.y - cruiser.y;
      const desired = Math.atan2(dy, dx);
      let turn = ((desired - cruiser.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      cruiser.angle += Math.max(-1, Math.min(1, turn)) * dt * 1.8;
      cruiser.speed = Math.min(230 + police.wanted * 22, cruiser.speed + dt * 110);
      cruiser.x += Math.cos(cruiser.angle) * cruiser.speed * dt;
      cruiser.y += Math.sin(cruiser.angle) * cruiser.speed * dt;
      if (Math.hypot(dx, dy) < 42 && state.time - police.lastCrime > 4) state.busted = true;
    }
    for (const officer of police.officers) {
      const target = state.vehicle || state.player;
      officer.angle = Math.atan2(target.y - officer.y, target.x - officer.x);
      officer.x += Math.cos(officer.angle) * 43 * dt;
      officer.y += Math.sin(officer.angle) * 43 * dt;
      if (Math.hypot(target.x - officer.x, target.y - officer.y) < 340 && state.time - officer.firing > 2.4) {
        officer.firing = state.time;
        state.effects.push({ x: target.x, y: target.y, life: 0.2, kind: 'impact' });
        if (state.vehicle) state.vehicle.health = Math.max(0, state.vehicle.health - 4);
        else state.damage(5);
      }
    }
    if (police.wanted === 5) state.armored = true;
    else state.armored = false;
  }

  function drawPolice(ctx, state) {
    const police = state.police;
    for (const cruiser of police.cruisers) drawVehicle(ctx, cruiser);
    for (const officer of police.officers) {
      ctx.fillStyle = '#192d47';
      ctx.beginPath();
      ctx.arc(officer.x, officer.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e3c18d';
      ctx.beginPath();
      ctx.arc(officer.x + Math.cos(officer.angle) * 6, officer.y + Math.sin(officer.angle) * 6, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const block of police.roadblocks) {
      ctx.save();
      ctx.translate(block.x, block.y);
      ctx.rotate(block.angle);
      ctx.fillStyle = '#e1c13a';
      ctx.fillRect(-68, -9, 136, 18);
      ctx.fillStyle = '#334651';
      ctx.fillRect(-52, -9, 8, 18);
      ctx.fillRect(35, -9, 8, 18);
      ctx.restore();
    }
    if (police.helicopter) {
      const heli = police.helicopter;
      const target = state.vehicle || state.player;
      ctx.fillStyle = 'rgba(246,229,156,.12)';
      ctx.beginPath();
      ctx.moveTo(heli.x, heli.y + 14);
      ctx.lineTo(target.x - 135, target.y + 365);
      ctx.lineTo(target.x + 135, target.y + 365);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(248,236,193,.46)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(heli.x, heli.y + 12);
      ctx.lineTo(target.x, target.y + 340);
      ctx.stroke();
      ctx.fillStyle = '#26363b';
      ctx.fillRect(heli.x - 17, heli.y - 9, 34, 18);
      ctx.fillStyle = '#a8c6c3';
      ctx.fillRect(heli.x - 6, heli.y - 7, 12, 10);
      ctx.strokeStyle = '#37484a';
      ctx.beginPath();
      ctx.moveTo(heli.x - 34, heli.y - 14);
      ctx.lineTo(heli.x + 34, heli.y - 14);
      ctx.moveTo(heli.x, heli.y - 17);
      ctx.lineTo(heli.x, heli.y - 21);
      ctx.stroke();
    }
  }

  globalThis.Meridian['police'] = { createPolice, addHeat, updatePolice, drawPolice };
})();
