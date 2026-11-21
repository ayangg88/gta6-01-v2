import { MISSIONS } from './config.js';

const MARKERS = [
  { x: 1460, y: 700 }, { x: 685, y: 320 }, { x: 2470, y: 2200 }, { x: 1500, y: 880 },
  { x: 1990, y: 1120 }, { x: 2620, y: 1100 }, { x: 2540, y: 2160 }, { x: 2240, y: 730 }
];

export function missionByNumber(number) {
  return MISSIONS[number % MISSIONS.length];
}

export function startMission(state, number = state.save.mission) {
  const mission = missionByNumber(number);
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
  const marker = MARKERS[state.activeMission];
  const actor = state.vehicle || state.player;
  if (mission.type === 'robbery' && !state.missionStep && Math.hypot(actor.x - marker.x, actor.y - marker.y) < 100) {
    state.objective = 'Hold E at the till';
    if (state.controls.interact && state.time - state.lastRobbery > 2) {
      state.missionStep = 1;
      state.objective = 'Leave the block';
      state.crime('store robbery', 2);
    }
    return;
  }
  if (mission.type === 'taxi' && state.taxiFares >= 2) state.missionStep = 1;
  if (mission.type === 'deal' && !state.missionStep && Math.hypot(actor.x - marker.x, actor.y - marker.y) < 115) {
    state.missionStep = 1;
    state.save.cash += 360;
    state.save.respect += 6;
    state.crime('arms deal', 2);
  }
  if (mission.type === 'rescue' && !state.missionStep && Math.hypot(actor.x - marker.x, actor.y - marker.y) < 105) state.missionStep = 1;
  if (Math.hypot(actor.x - marker.x, actor.y - marker.y) < 68 && mission.type !== 'robbery' && mission.type !== 'taxi' && mission.type !== 'deal' && mission.type !== 'rescue') state.missionStep = 1;
  if (state.missionStep) {
    state.save.cash += mission.payout;
    state.save.respect += 12;
    state.save.mission = Math.max(state.save.mission, state.activeMission + 1);
    state.completedMissions += 1;
    state.activeMission = null;
    state.objective = 'Job complete - find the next contact';
    state.toast = `${mission.name.toUpperCase()}  +$${mission.payout.toLocaleString()}`;
    state.toastTimer = 4;
  } else {
    state.objective = mission.type === 'robbery' ? 'Reach the market marker' : mission.objective;
  }
}

export function missionMarker(state) {
  if (state.activeMission != null) return MARKERS[state.activeMission];
  return state.save.mission < MISSIONS.length ? MARKERS[state.save.mission] : null;
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
