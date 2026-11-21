import { payTaxiFare } from './economy.js';

const FARES = [
  { pickup: { x: 1480, y: 880 }, drop: { x: 1490, y: 1150 } },
  { pickup: { x: 1550, y: 1150 }, drop: { x: 1900, y: 1160 } }
];
const RAMP = { x: 2300, y: 1920 };
const RACE = [{ x: 1490, y: 1920 }, { x: 1880, y: 1920 }, { x: 2240, y: 1920 }];

export function taxiTarget(state) {
  if (state.vehicle?.type !== 1) return null;
  const fare = FARES[state.taxiFares % FARES.length];
  return state.taxiPassenger ? fare.drop : fare.pickup;
}

export function updateActivities(state) {
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

export function drawActivities(ctx, state) {
  const entries = [[RAMP, 'STUNT RAMP'], [RACE[state.raceGate || 0], 'SEAWALL SPRINT']];
  const target = taxiTarget(state);
  if (target) entries.push([target, state.taxiPassenger ? 'FARE DROP' : 'TAXI PICKUP']);
  for (const [point, label] of entries) {
    ctx.strokeStyle = '#f0c35f';
    ctx.lineWidth = 3;
    ctx.strokeRect(point.x - 23, point.y - 16, 46, 32);
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#fff1bc';
    ctx.fillText(label, point.x - 34, point.y - 22);
  }
}
