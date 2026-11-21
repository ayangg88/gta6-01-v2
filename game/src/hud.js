(() => {
  'use strict';
  const { WEAPONS } = globalThis.Meridian['weapons'];
  const { MISSIONS } = globalThis.Meridian['config'];
  const { drawMinimap } = globalThis.Meridian['minimap'];
  const { missionByNumber } = globalThis.Meridian['missions'];
  const { typewriter } = globalThis.Meridian['dialogue'];

  function text(ctx, value, x, y, size, color = '#f4f0e5', weight = 'normal') {
    ctx.font = `${weight} ${size}px Arial`;
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }

  function panel(ctx, x, y, width, height, color = 'rgba(14,23,26,.88)') {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#d8b45f';
    ctx.fillRect(x, y, 4, height);
  }

  function drawHud(ctx, state, screen) {
    const save = state.save;
    panel(ctx, 22, 20, 262, 103);
    text(ctx, 'RAE DELGADO', 38, 44, 14, '#e7c46f', 'bold');
    text(ctx, `$${save.cash.toLocaleString()}`, 38, 78, 27, '#f6f1e4', 'bold');
    text(ctx, `HEAT  ${'★'.repeat(state.police.wanted)}${'☆'.repeat(5 - state.police.wanted)}`, 38, 107, 15, state.police.wanted ? '#f08d70' : '#c5c8b9', 'bold');
    panel(ctx, 22, 139, 262, 83);
    text(ctx, 'HEALTH', 38, 162, 11, '#d9dfd4', 'bold');
    ctx.fillStyle = '#384548';
    ctx.fillRect(38, 171, 225, 11);
    ctx.fillStyle = '#d45948';
    ctx.fillRect(38, 171, 225 * save.health / 100, 11);
    text(ctx, 'ARMOR', 38, 198, 11, '#d9dfd4', 'bold');
    ctx.fillStyle = '#384548';
    ctx.fillRect(38, 205, 225, 9);
    ctx.fillStyle = '#65b4ab';
    ctx.fillRect(38, 205, 225 * save.armor / 100, 9);
    drawMinimap(ctx, state);
    if (!state.vehicle) {
      const weapon = WEAPONS[state.weaponIndex];
      panel(ctx, 1035, 625, 221, 72);
      text(ctx, weapon.toUpperCase(), 1053, 652, 16, '#e7c46f', 'bold');
      text(ctx, save.weapons.includes(weapon) ? String(save.ammo[weapon]) + ' ROUNDS' : 'LOCKED', 1053, 679, 14);
    }
    panel(ctx, 22, 617, 690, 80);
    text(ctx, 'PORT MERIDIAN  /  ' + state.district, 40, 642, 12, '#d5bd7d', 'bold');
    text(ctx, state.objective, 40, 669, 17, '#f2eee2', 'bold');
    const hour = Math.floor(state.dayClock) % 24;
    const minute = Math.floor((state.dayClock % 1) * 60);
    text(ctx, `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, 660, 642, 14, '#f0ebdb', 'bold');
    const rank = save.respect > 90 ? 'LOCAL LEGEND' : save.respect > 48 ? 'KNOWN FACE' : save.respect > 18 ? 'STREET NAME' : 'NEW ARRIVAL';
    text(ctx, rank, 660, 674, 11, '#b7c4ba', 'bold');
    if (state.vehicle) {
      panel(ctx, 792, 625, 230, 72);
      text(ctx, `${Math.round(Math.abs(state.vehicle.speed) * 0.46)} KM/H`, 814, 658, 25, '#f2eee1', 'bold');
      text(ctx, MISSIONS.length ? (state.vehicle.type === 7 ? 'SKIFF' : state.vehicle.type === 6 ? 'MOTORCYCLE' : 'VEHICLE') : '', 814, 682, 10, '#c5c1ae', 'bold');
    }
    if (state.toastTimer > 0 && !state.dialogue) {
      panel(ctx, 441, 44, 398, 48);
      text(ctx, state.toast, 461, 74, 14, '#f2e8c8', 'bold');
    }
    if (state.dialogue) typewriter(ctx, state.dialogue.name, state.dialogue.text, state.dialogue.progress, 335, 495, 610);
    if (state.shop) drawShop(ctx, state);
    if (screen === 'paused') drawOverlay(ctx, 'ON PAUSE', ['The city holds its breath.', 'P / Esc returns to the street', 'M mutes  •  R changes the radio'], 'PORT MERIDIAN');
    if (screen === 'title') drawOverlay(ctx, 'MERIDIAN HEAT', ['RAE DELGADO  /  ONE LAST RUN', 'WASD move and drive   •   E enter / interact', 'Mouse aim and fire   •   1 2 3 weapons   •   P pause', 'The city keeps score. Find Inez at the Crown Center.'], 'PRESS ENTER TO BEGIN');
    if (screen === 'wasted') drawOverlay(ctx, 'WASTED', [`Cash on hand: $${save.cash.toLocaleString()}`, 'A friend has pulled Rae out of the tide.', 'Your run begins again at the safehouse.'], 'PRESS ENTER TO RETURN');
    if (screen === 'busted') drawOverlay(ctx, 'BUSTED', ['The patrol put an end to this run.', 'The city took a cut of your cash.'], 'PRESS ENTER TO RETURN');
    if (state.missionComplete) drawOverlay(ctx, 'JOB COMPLETE', [state.missionComplete.name, `$${state.missionComplete.payout.toLocaleString()} paid  •  Respect +12`, 'A new contact is waiting in the city.'], 'PRESS ENTER TO CONTINUE');
  }

  function drawShop(ctx, state) {
    panel(ctx, 402, 124, 476, 404, 'rgba(13,22,24,.96)');
    text(ctx, state.shop === 'arms' ? 'BAY ARMS' : state.shop === 'garage' ? 'MERIDIAN MOTORS' : 'CORNER MARKET', 430, 160, 22, '#e8c46c', 'bold');
    const rows = state.shop === 'arms' ? ['1  Shotgun   $650', '2  SMG       $1,100', '3  Armor     $450'] : state.shop === 'garage' ? ['1  Buy Comet Sport  $4,200', '2  Buy Ranch Pickup $1,600', '3  Buy Van          $2,100'] : ['E  Rob the till   (heat +2)', '1  Pistol ammo  $120', '3  First aid    $220'];
    for (let index = 0; index < rows.length; index += 1) text(ctx, rows[index], 438, 222 + index * 52, 18, '#f0eee4');
    text(ctx, `Cash available  $${state.save.cash.toLocaleString()}`, 438, 420, 15, '#8ed1c1', 'bold');
    text(ctx, 'ESC closes the counter', 438, 486, 12, '#aaa995');
  }

  function drawOverlay(ctx, title, lines, footer) {
    ctx.fillStyle = 'rgba(7,13,15,.77)';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#1c2a2c';
    ctx.fillRect(296, 150, 688, 422);
    ctx.fillStyle = '#c19a4f';
    ctx.fillRect(296, 150, 7, 422);
    text(ctx, title, 342, 219, 36, '#f0ca70', 'bold');
    for (let index = 0; index < lines.length; index += 1) text(ctx, lines[index], 344, 284 + index * 37, 16, '#e2e5d7');
    text(ctx, footer, 344, 528, 15, '#82cec3', 'bold');
  }

  function districtName(x, y) {
    if (y > 1900) return 'SOUTH BEACH';
    if (x > 2750) return 'CITRUS RIDGE';
    if (x > 1950 && y < 850) return 'OLD QUAY';
    if (x > 2050) return 'MARINA VERDE';
    if (y > 950) return 'FREIGHT WARD';
    return 'CROWN CENTER';
  }

  function missionName(index) {
    return missionByNumber(index).name;
  }

  globalThis.Meridian['hud'] = { drawHud, drawOverlay, districtName, missionName };
})();
