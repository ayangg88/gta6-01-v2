(() => {
  'use strict';
  const { fleeFrom } = globalThis.Meridian['pedestrians'];

  const WEAPONS = ['Pistol', 'Shotgun', 'SMG'];

  function fireWeapon(state) {
    if (!state.onFoot || state.dialogue || state.screen !== 'play') return;
    const weapon = WEAPONS[state.weaponIndex];
    if (!state.save.weapons.includes(weapon) || state.save.ammo[weapon] <= 0) return;
    state.save.ammo[weapon] -= 1;
    const origin = state.player;
    const reach = weapon === 'Shotgun' ? 380 : 620;
    const width = weapon === 'Shotgun' ? 100 : 43;
    const target = { x: origin.x + Math.cos(state.aim) * reach, y: origin.y + Math.sin(state.aim) * reach };
    state.effects.push({ x: origin.x, y: origin.y, life: 0.15, kind: 'muzzle', angle: state.aim });
    state.effects.push({ x: target.x, y: target.y, life: 0.28, kind: 'impact' });
    state.lastShot = { x1: origin.x, y1: origin.y, x2: target.x, y2: target.y, life: 0.09 };
    state.shake = 2;
    state.crime('gunfire');
    fleeFrom(state, origin.x, origin.y);
    const hit = state.police.officers.find((officer) => Math.hypot(officer.x - target.x, officer.y - target.y) < width);
    if (hit) {
      hit.down = true;
      state.police.officers = state.police.officers.filter((officer) => officer !== hit);
    }
    const civilian = state.pedestrians.find((person) => person.alive && Math.hypot(person.x - target.x, person.y - target.y) < width);
    if (civilian) civilian.alive = false;
  }

  function collectAmmo(state, weapon, amount) {
    state.save.ammo[weapon] = (state.save.ammo[weapon] || 0) + amount;
    if (!state.save.weapons.includes(weapon)) state.save.weapons.push(weapon);
    state.toast = `${weapon.toUpperCase()} AMMO +${amount}`;
    state.toastTimer = 2.2;
  }

  function drawWeaponEffects(ctx, state) {
    if (state.lastShot?.life > 0) {
      ctx.strokeStyle = 'rgba(255,244,194,.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(state.lastShot.x1, state.lastShot.y1);
      ctx.lineTo(state.lastShot.x2, state.lastShot.y2);
      ctx.stroke();
    }
    for (const effect of state.effects) {
      if (effect.kind === 'muzzle') {
        ctx.fillStyle = '#ffdf78';
        ctx.beginPath();
        ctx.arc(effect.x + Math.cos(effect.angle) * 28, effect.y + Math.sin(effect.angle) * 28, 10 * effect.life, 0, Math.PI * 2);
        ctx.fill();
      }
      if (effect.kind === 'spark' || effect.kind === 'impact') {
        ctx.fillStyle = effect.kind === 'spark' ? '#ffcf6c' : '#f3df98';
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 5 + effect.life * 9, 0, Math.PI * 2);
        ctx.fill();
      }
      if (effect.kind === 'smoke' || effect.kind === 'dust') {
        ctx.fillStyle = effect.kind === 'smoke' ? 'rgba(67,68,62,.43)' : 'rgba(232,221,194,.5)';
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 8 + (1 - effect.life) * 18, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  globalThis.Meridian['weapons'] = { WEAPONS, fireWeapon, collectAmmo, drawWeaponEffects };
})();
