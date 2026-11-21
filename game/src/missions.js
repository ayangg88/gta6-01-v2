import { MISSIONS } from './config.js';

const MARKERS = [
  { x: 1460, y: 700 }, { x: 685, y: 320 }, { x: 2470, y: 2200 }, { x: 1500, y: 880 },
  { x: 1990, y: 1120 }, { x: 2620, y: 1100 }, { x: 2540, y: 1900 }, { x: 2240, y: 730 }
];

const FINISH = [
  { x: 1720, y: 1140 }, { x: 1080, y: 540 }, { x: 2870, y: 2260 }, { x: 1480, y: 880 },
  { x: 1800, y: 1480 }, { x: 2810, y: 1920 }, { x: 935, y: 700 }, { x: 2770, y: 1910 }
];
const SECOND_LINES = [
  'Keep driving to the freight ward rendezvous.',
  'Register is empty. Get to the next block.',
  'They spotted our wake. Run the skiff east to the outer buoy.',
  'One fare down. Pick up and deliver another passenger.',
  'Case secured. Get it to the freight yard fence.',
  'Clear the last gate at speed.',
  'Dani is with you. Bring her back to Crown Center.',
  'Bonds are aboard. Get the car to the south seawall.'
];

export function missionByNumber(number) {
  return MISSIONS[number % MISSIONS.length];
}

export function startMission(state, number = state.save.mission) {
  if (!MISSIONS[number]) return;
  const mission = missionByNumber(number);
  state.jobStarted = state.time;
  state.jobFares = state.taxiFares;
  state.activeMission = number;
  state.missionStep = 0;
  state.dialogue = { name: mission.giver, text: mission.brief, progress: 0.1, time: 0 };
  state.toast = `NEW JOB  /  ${mission.name.toUpperCase()}`;
  state.toastTimer = 3.4;
  return mission;
}

export function advanceDialogue(state) {
  if (!state.dialogue) return;
  if (state.dialogue.progress < 1) state.dialogue.progress = 1;
  else state.dialogue = null;
}

export function updateMission(state) {
  if (state.dialogue) {
    state.dialogue.progress = Math.min(1, state.dialogue.progress + 0.55 / 60);
    state.dialogue.time += 1 / 60;
  }
  if (state.activeMission == null || state.dialogue) return;
  const mission = missionByNumber(state.activeMission);
  const marker = missionMarker(state);
  const actor = state.vehicle || state.player;
  const near = Math.hypot(actor.x - marker.x, actor.y - marker.y) < 78;
  const driving = state.vehicle && state.vehicle.type !== 7;
  const boating = state.vehicle?.type === 7;
  let ready = false;
  switch (mission.type) {
    case 'drive': ready = near && driving; break;
    case 'robbery': ready = state.missionStep ? near : !state.vehicle && state.lastRobbery >= state.jobStarted; break;
    case 'boat': ready = near && boating; break;
    case 'taxi': ready = state.taxiFares - state.jobFares >= (state.missionStep ? 2 : 1); break;
    case 'deal': ready = near && (state.missionStep || !state.vehicle); break;
    case 'race': ready = near && driving && Math.abs(actor.speed) > 80; break;
    case 'rescue': ready = near && (state.missionStep || !state.vehicle); break;
    case 'heist': ready = near && driving; break;
  }
  if (ready && !state.missionStep) {
    state.missionStep = 1;
    if (['boat', 'deal', 'heist'].includes(mission.type)) state.crime(mission.type, 2);
    state.dialogue = { name: mission.giver, text: SECOND_LINES[state.activeMission], progress: 0, time: 0 };
    ready = false;
  }
  if (ready) {
    state.save.cash += mission.payout;
    state.save.respect += 12;
    state.save.mission = Math.max(state.save.mission, state.activeMission + 1);
    state.completedMissions += 1;
    state.activeMission = null;
    state.objective = 'Job complete - find the next contact';
    state.toast = `${mission.name.toUpperCase()}  +$${mission.payout.toLocaleString()}`;
    state.toastTimer = 4;
  } else {
    state.objective = state.missionStep ? SECOND_LINES[state.activeMission] : mission.objective;
  }
}

export function missionMarker(state) {
  if (state.activeMission != null) return (state.missionStep ? FINISH : MARKERS)[state.activeMission];
  return state.save.mission < MISSIONS.length ? { x: 935, y: 700 } : null;
}

export function drawMissionMarker(ctx, state) {
  const marker = missionMarker(state);
  if (!marker) return;
  const pulse = 1 + Math.sin(state.time * 4) * 0.08;
  ctx.strokeStyle = '#65d7d1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(marker.x, marker.y, 31 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(76,202,187,.22)';
  ctx.beginPath();
  ctx.arc(marker.x, marker.y, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0eee2';
  ctx.font = 'bold 13px Arial';
  ctx.fillText(state.activeMission == null ? `CONTACT: ${missionByNumber(state.save.mission).giver}` : missionByNumber(state.activeMission).name.toUpperCase(), marker.x - 44, marker.y - 43);
}
