(() => {
  'use strict';
  const { payTaxiFare } = globalThis.Meridian['economy'];

  const FARES = [
    { pickup: { x: 1480, y: 880 }, drop: { x: 1490, y: 1150 } },
    { pickup: { x: 1550, y: 1150 }, drop: { x: 1900, y: 1160 } }
  ];
  const RAMP = { x: 2300, y: 1920 };
  const RACE = [{ x: 1490, y: 1920 }, { x: 1880, y: 1920 }, { x: 2240, y: 1920 }];

  function taxiTarget(state) {
    if (state.vehicle?.type !== 1) return null;
    const fare = FARES[state.taxiFares % FARES.length];
    return state.taxiPassenger ? fare.drop : fare.pickup;
  }

  function updateActivities(state) {
    const car = state.vehicle;
    if (!car) {
      state.taxiPassenger = false;
      state.raceGate = 0;
      return;
    }
    const target = taxiTarget(state);
    if (target && Math.hypot(car.x - target.x, car.y - target.y) < 65 && Math.abs(car.speed) < 35) {
      if (state.taxiPassenger) {
        payTaxiFare(state);
        state.taxiPassenger = false;
      } else {
        state.taxiPassenger = true;
        state.toast = 'PASSENGER ABOARD  /  FOLLOW THE GOLD MARKER';
        state.toastTimer = 3;
      }
    }
    if (!state.jumped && car.type !== 7 && Math.abs(car.speed) > 140 && Math.hypot(car.x - RAMP.x, car.y - RAMP.y) < 30) {
      state.jumped = true;
      car.airborne = 0.8;
      state.save.cash += 300;
      state.toast = 'SEAWALL STUNT  +$300';
      state.toastTimer = 3;
    }
    car.airborne = Math.max(0, (car.airborne || 0) - 1 / 60);
    const gate = state.raceGate || 0;
    if (gate && state.time - state.raceStart > 22) state.raceGate = 0;
    if (Math.hypot(car.x - RACE[gate].x, car.y - RACE[gate].y) < 45 && gate === (state.raceGate || 0)) {
      if (!gate) state.raceStart = state.time;
      state.raceGate = gate + 1;
      if (state.raceGate === RACE.length) {
        state.raceGate = 0;
        state.save.cash += 500;
        state.save.respect += 3;
        state.toast = 'SEAWALL SPRINT  +$500';
        state.toastTimer = 3;
      }
    }
  }

  function drawActivities(ctx, state, camera = { x: 0, y: 0 }) {
    const entries = [[RAMP, 'STUNT RAMP'], [RACE[state.raceGate || 0], 'SEAWALL SPRINT']];
    const target = taxiTarget(state);
    if (target) entries.push([target, state.taxiPassenger ? 'FARE DROP' : 'TAXI PICKUP']);
    const panels = [[0, 0, 296, 232], [1048, 10, 1270, 232], [0, 606, 722, 720], state.vehicle ? [780, 614, 1030, 706] : [1028, 614, 1270, 706]];
    if (state.toastTimer > 0 && !state.dialogue) panels.push([441, 44, 839, 92]);
    if (state.dialogue) panels.push([335, 495, 945, 615]);
    if (state.shop) panels.push([402, 124, 878, 528]);
    const overlaps = (left, top, right, bottom) => panels.some(([x1, y1, x2, y2]) => left < x2 && right > x1 && top < y2 && bottom > y1);
    for (const [point, label] of entries) {
      ctx.font = 'bold 12px Arial';
      const x = point.x - camera.x;
      const y = point.y - camera.y;
      const visible = x - 24 >= 0 && y - 17 >= 0 && x + 24 <= 1280 && y + 17 <= 720 && !overlaps(x - 24, y - 17, x + 24, y + 17);
      if (visible) {
        ctx.strokeStyle = '#f0c35f';
        ctx.lineWidth = 3;
        ctx.strokeRect(point.x - 23, point.y - 16, 46, 32);
      }
      const labelX = x - 34;
      const labelY = y - 22;
      if (labelX >= 0 && labelY - 14 >= 0 && labelX + ctx.measureText(label).width <= 1280 && labelY + 2 <= 690 && !overlaps(labelX, labelY - 14, labelX + ctx.measureText(label).width, labelY + 2)) {
        ctx.fillStyle = '#fff1bc';
        ctx.fillText(label, point.x - 34, point.y - 22);
      }
    }
  }

  globalThis.Meridian['activities'] = { taxiTarget, updateActivities, drawActivities };
})();
