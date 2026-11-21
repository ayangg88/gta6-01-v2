import { CAR_TYPES, MISSIONS, WORLD } from './config.js';
import { createInput } from './input.js';
import { seeded } from './random.js';
import { loadSave, resetSave, storeSave } from './save.js';
import { createVehicle, seedTraffic, updateVehicles } from './vehicles.js';
import { seedPedestrians, updatePedestrians, fleeFrom } from './pedestrians.js';
import { createPolice, addHeat, updatePolice } from './police.js';
import { startMission, advanceDialogue, updateMission, missionMarker } from './missions.js';
import { collectAmmo, fireWeapon, WEAPONS } from './weapons.js';
import { buyWeapon, buyCar, payTaxiFare, robTill } from './economy.js';
import { getStores } from './city.js';
import { createRenderer } from './render.js';
import { drawHud, districtName } from './hud.js';
import { gunSound, pickupSound, radioStep, setMuted, sirenSound, updateEngine } from './audio.js';

const STEP = 1 / 60;
const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const input = createInput();
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
const seed = Number.parseInt(query.get('seed') || '482901', 10) || 482901;

function createState(saved = loadSave()) {
  const rng = seeded(seed);
  const state = {
    rng,
    cityRng: seeded(seed ^ 0x25a4d3),
    save: saved,
    player: { x: 815, y: 700 },
    vehicle: null,
    traffic: seedTraffic(rng),
    pedestrians: seedPedestrians(rng),
    boats: [createVehicle(2410, 2192, 7, -0.18), createVehicle(2660, 2207, 7, -0.12)],
    packages: [],
    police: createPolice(),
    effects: [],
    skids: [],
    time: 0,
    dayClock: 15.4,
    rain: false,
    playerAim: 0,
    aim: 0,
    weaponIndex: 0,
    onFoot: true,
    controls: { left: false, right: false, accelerate: false, brake: false, handbrake: false, interact: false },
    objective: 'Find Inez Vale at Crown Center',
    district: 'CROWN CENTER',
    activeMission: null,
    missionStep: 0,
    dialogue: null,
    missionComplete: null,
    completedMissions: 0,
    taxiFares: 0,
    toast: 'PORT MERIDIAN  /  15:24',
    toastTimer: 4,
    lastRobbery: -40,
    lastShot: null,
    lastCrime: 0,
    shake: 0,
    busted: false,
    armored: false,
    shop: null,
    muted: false,
    radioOn: false,
    radioStep: 0,
    lastRadioNote: 0,
    screen: 'title',
    elapsed: 0,
    spentCrime: false,
    safehouse: { x: 815, y: 700 }
  };
  state.playerAim = 0;
  state.packages = Array.from({ length: 20 }, (_, index) => ({ x: 315 + (index * 397) % 2660, y: 330 + (index * 281) % 1580, collected: false }));
  state.damage = (amount) => {
    const absorbed = Math.min(state.save.armor, amount);
    state.save.armor -= absorbed;
    state.save.health = Math.max(0, state.save.health - (amount - absorbed));
    if (state.save.health <= 0) state.wasted = true;
  };
  state.crime = (kind, amount = 1) => {
    addHeat(state, amount);
    state.lastCrime = state.time;
    state.spentCrime = true;
    if (kind === 'gunfire' && state.time - state.lastSiren > 5) {
      sirenSound();
      state.lastSiren = state.time;
    }
  };
  return state;
}

let state = createState();
let screen = query.get('play') === '1' ? 'play' : 'title';
let last = performance.now();
let accumulator = 0;
let shotReady = false;

function nearestVehicle() {
  let nearest = null;
  let distance = 92;
  for (const car of state.traffic) {
    if (!car.civilian || car === state.vehicle) continue;
    const candidate = Math.hypot(car.x - state.player.x, car.y - state.player.y);
    if (candidate < distance) {
      nearest = car;
      distance = candidate;
    }
  }
  for (const boat of state.boats) {
    const candidate = Math.hypot(boat.x - state.player.x, boat.y - state.player.y);
    if (candidate < distance) {
      nearest = boat;
      distance = candidate;
    }
  }
  return nearest;
}

function nearestStore() {
  let nearest = null;
  let distance = 84;
  for (const store of getStores()) {
    const candidate = Math.hypot(store.x + 64 - state.player.x, store.y + 40 - state.player.y);
    if (candidate < distance) {
      nearest = store;
      distance = candidate;
    }
  }
  return nearest;
}

function interact() {
  if (screen !== 'play') return;
  if (state.dialogue) {
    advanceDialogue(state);
    return;
  }
  if (state.missionComplete) {
    state.missionComplete = null;
    return;
  }
  if (state.shop) {
    state.shop = null;
    return;
  }
  if (state.vehicle) {
    const exitX = state.vehicle.x - Math.sin(state.vehicle.angle) * 45;
    const exitY = state.vehicle.y + Math.cos(state.vehicle.angle) * 45;
    state.player.x = exitX;
    state.player.y = exitY;
    state.vehicle.speed = 0;
    state.vehicle = null;
    state.onFoot = true;
    return;
  }
  const car = nearestVehicle();
  if (car) {
    if (car.civilian) state.crime('carjacking');
    state.vehicle = car;
    state.vehicle.civilian = false;
    state.vehicle.speed = Math.min(state.vehicle.speed, 0);
    state.onFoot = false;
    state.toast = `HOT WIRE  /  ${CAR_TYPES[car.type].name.toUpperCase()}`;
    state.toastTimer = 2.5;
    return;
  }
  const store = nearestStore();
  if (store) {
    if (store.kind === 'market') {
      state.shop = 'market';
      robTill(state);
      return;
    }
    state.shop = store.kind;
    return;
  }
  const target = missionMarker(state);
  if (target && Math.hypot(target.x - state.player.x, target.y - state.player.y) < 120 && state.activeMission == null) {
    startMission(state, state.save.mission);
    return;
  }
  if (state.vehicle == null && state.taxiPassenger) {
    payTaxiFare(state);
    state.taxiPassenger = false;
    return;
  }
}

function updateInteractions() {
  state.controls.left = input.down('KeyA') || input.down('ArrowLeft');
  state.controls.right = input.down('KeyD') || input.down('ArrowRight');
  state.controls.accelerate = input.down('KeyW') || input.down('ArrowUp');
  state.controls.brake = input.down('KeyS') || input.down('ArrowDown');
  state.controls.handbrake = input.down('Space');
  state.controls.interact = input.down('KeyE');
  if (input.tap('Enter')) {
    if (screen === 'title') screen = 'play';
    else if (screen === 'wasted' || screen === 'busted') respawn();
    else if (state.dialogue || state.missionComplete) interact();
  }
  if (input.tap('Escape') || input.tap('KeyP')) {
    if (state.shop) state.shop = null;
    else if (screen === 'play') screen = 'paused';
    else if (screen === 'paused') screen = 'play';
  }
  if (screen === 'paused' && (input.tap('Enter') || input.tap('Space'))) screen = 'play';
  if (screen === 'wasted' || screen === 'busted') return;
  if (input.tap('KeyE') && !state.dialogue) interact();
  if (input.tap('KeyM')) {
    state.muted = !state.muted;
    setMuted(state.muted);
  }
  if (input.tap('KeyR')) {
    state.save.radio = (state.save.radio + 1) % 3;
    state.radioOn = true;
    state.toast = ['CHANNEL 1  /  LANTERN FM', 'CHANNEL 2  /  COASTAL STATIC', 'CHANNEL 3  /  NIGHT WINDOW'][state.save.radio];
    state.toastTimer = 2.5;
  }
  if (input.tap('Digit1')) state.weaponIndex = 0;
  if (input.tap('Digit2')) state.weaponIndex = 1;
  if (input.tap('Digit3')) state.weaponIndex = 2;
  if (input.tap('KeyF')) {
    const store = nearestStore();
    if (state.shop === 'arms') buyWeapon(state, 'Shotgun');
    else if (state.shop === 'garage') buyCar(state, 3);
    else if (store?.kind === 'arms') state.shop = 'arms';
    else if (store?.kind === 'garage') state.shop = 'garage';
    else fireWeapon(state);
  }
  if (input.tap('KeyG')) {
    if (state.shop === 'arms') buyWeapon(state, 'SMG');
    else if (state.shop === 'garage') buyCar(state, 2);
    else if (state.shop === 'market') collectAmmo(state, 'Pistol', 12);
    else fireWeapon(state);
  }
  if (input.tap('KeyH')) {
    if (state.shop === 'arms') buyWeapon(state, 'Armor');
    else if (state.shop === 'garage') buyCar(state, 4);
    else if (state.shop === 'market') {
      state.save.cash = Math.max(0, state.save.cash - 220);
      state.save.health = Math.min(100, state.save.health + 25);
      state.toast = 'FIRST AID  /  HEALTH RESTORED';
      state.toastTimer = 2;
    }
  }
  if (input.down('Mouse0') || input.tap('Space') && state.onFoot) fireWeapon(state);
}

function update(dt) {
  state.time += dt;
  state.elapsed += dt;
  state.dayClock = (state.dayClock + dt / 1000) % 24;
  state.rain = Math.floor(state.time / 72) % 5 === 4;
  state.toastTimer = Math.max(0, state.toastTimer - dt);
  state.shake = Math.max(0, state.shake - dt * 13);
  if (state.lastShot) state.lastShot.life -= dt;
  for (const effect of state.effects) effect.life -= dt;
  state.effects = state.effects.filter((effect) => effect.life > 0);
  for (const skid of state.skids) skid.life -= dt;
  state.skids = state.skids.filter((skid) => skid.life > 0);
  for (const packageItem of state.packages) {
    if (packageItem.collected || Math.hypot(packageItem.x - state.player.x, packageItem.y - state.player.y) > 30) continue;
    packageItem.collected = true;
    state.save.packages += 1;
    state.save.cash += 250;
    state.save.respect += 3;
    state.toast = `HIDDEN PACKAGE  ${state.save.packages}/20  +$250`;
    state.toastTimer = 3;
    pickupSound();
    storeSave(state.save);
  }
  if (!state.vehicle && Math.floor(state.time / 24) !== state.lastTaxiSpawn) {
    state.lastTaxiSpawn = Math.floor(state.time / 24);
    state.taxiPassenger = Math.hypot(state.player.x - 1460, state.player.y - 880) < 170;
  }
  updateVehicles(state, dt);
  if (state.vehicle) {
    state.player.x = state.vehicle.x;
    state.player.y = state.vehicle.y;
    updateEngine(state.vehicle.speed, true);
  }
  if (!state.vehicle && !state.dialogue && !state.shop) {
    const dx = (state.controls.right ? 1 : 0) - (state.controls.left ? 1 : 0);
    const dy = (state.controls.brake ? 1 : 0) - (state.controls.accelerate ? 1 : 0);
    const length = Math.hypot(dx, dy) || 1;
    state.player.x = Math.max(205, Math.min(3080, state.player.x + dx / length * 145 * dt));
    state.player.y = Math.max(185, Math.min(1945, state.player.y + dy / length * 145 * dt));
  }
  updatePedestrians(state, dt);
  updatePolice(state, dt);
  updateMission(state);
  state.district = districtName(state.player.x, state.player.y);
  if (state.wasted) screen = 'wasted';
  if (state.busted) screen = 'busted';
  if (state.activeMission == null && state.save.mission > 0 && state.save.mission <= MISSIONS.length && !state.dialogue && !state.objective.includes('Find next')) state.objective = 'Find the next contact';
  radioStep(state);
  if (Math.floor(state.elapsed) % 12 === 0 && Math.floor(state.elapsed) !== state.lastSave) {
    state.lastSave = Math.floor(state.elapsed);
    storeSave(state.save);
  }
}

function respawn() {
  const retained = state.save;
  retained.health = 100;
  retained.armor = Math.max(20, retained.armor);
  retained.cash = Math.max(0, retained.cash - Math.floor(retained.cash * 0.12));
  storeSave(retained);
  state = createState(retained);
  screen = 'play';
}

function render() {
  state.aim = Math.atan2(pointer.y - 360, pointer.x - 640);
  try {
    renderer.paint(state, screen);
  } catch (error) {
    status.textContent = `DRAW ERROR: ${error.message}`;
    status.style.cssText = 'position:fixed;inset:0;width:auto;height:auto;clip-path:none;background:#300;color:#fff;font:24px monospace;padding:40px;z-index:9';
    throw error;
  }
}

const pointer = { x: 640, y: 360 };
canvas.addEventListener('pointermove', (event) => {
  const bounds = canvas.getBoundingClientRect();
  pointer.x = (event.clientX - bounds.left) / bounds.width * 1280;
  pointer.y = (event.clientY - bounds.top) / bounds.height * 720;
});
canvas.addEventListener('pointerdown', () => {
  if (screen === 'title') screen = 'play';
  else if (screen === 'play' && state.onFoot) {
    fireWeapon(state);
    gunSound(WEAPONS[state.weaponIndex]);
  }
});

function frame(now) {
  requestAnimationFrame(frame);
  const delta = Math.min(0.16, (now - last) / 1000);
  last = now;
  if (screen === 'play') {
    accumulator += delta;
    updateInteractions();
    while (accumulator >= STEP) {
      update(STEP);
      accumulator -= STEP;
    }
  } else if (screen === 'title') {
    updateInteractions();
    state.time += delta;
  } else {
    updateInteractions();
    accumulator = 0;
  }
  render();
}

function stage(name) {
  state = createState(resetSave());
  state.screen = 'play';
  screen = 'play';
  state.dayClock = 16.25;
  state.player.x = 950;
  state.player.y = 700;
  state.objective = 'Lose the units along the Crown Center boulevard';
  if (name === 'street') {
    state.player.x = 830;
    state.player.y = 700;
    state.objective = 'Walk the Crown Center strip';
    state.police.wanted = 0;
    state.traffic = state.traffic.slice(0, 24);
    state.pedestrians = state.pedestrians.slice(0, 72);
  }
  if (name === 'mission') {
    state.player.x = 685;
    state.player.y = 335;
    state.police.wanted = 1;
    state.objective = 'Clear the corner market register, then leave the block';
    state.activeMission = 1;
    state.dialogue = { name: 'Milo Rusk', text: 'Keep your head down, Rae. Empty the till and lose the avenue before the patrol turns the corner.', progress: 1, time: 4 };
    state.lastRobbery = -40;
  }
  if (name === 'chase') {
    state.vehicle = createVehicle(970, 710, 3, -0.05);
    state.vehicle.speed = 265;
    state.player.x = state.vehicle.x;
    state.player.y = state.vehicle.y;
    state.police.wanted = 3;
    state.police.heat = 1;
    state.police.helicopter = { x: 1035, y: 395, beam: 360, orbit: 0.4 };
    state.police.cruisers = [createVehicle(720, 765, 5, -0.04), createVehicle(600, 646, 5, 0.04)];
    state.police.officers = [];
    state.traffic = state.traffic.slice(0, 14);
    state.objective = 'Break line of sight and reach the marina cut';
  }
  if (name === 'drive') {
    state.vehicle = createVehicle(970, 710, 3, 0.04);
    state.vehicle.speed = 226;
    state.player.x = state.vehicle.x;
    state.player.y = state.vehicle.y;
    state.police.wanted = 2;
    state.police.cruisers = [createVehicle(680, 680, 5, 0)];
    state.objective = 'Keep the wheels moving  /  lose the patrol';
  }
}

if (shot) {
  stage(shot);
  document.title = `MERIDIAN HEAT ${shot}`;
  status.textContent = 'staged';
  render();
  requestAnimationFrame(() => {
    render();
    requestAnimationFrame(() => {
      render();
      window.__shotReady = true;
    });
  });
} else {
  window.__game = { get state() { return state; }, startMission: () => startMission(state), reset: respawn };
  status.textContent = 'Meridian Heat. Press Enter to begin.';
  requestAnimationFrame(frame);
}

window.addEventListener('beforeunload', () => storeSave(state.save));
