(() => {
  'use strict';
  const { MISSIONS } = globalThis.Meridian['config'];

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

  function missionByNumber(number) {
    return MISSIONS[number % MISSIONS.length];
  }

  function startMission(state, number = state.save.mission) {
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

  function advanceDialogue(state) {
    if (!state.dialogue) return;
    if (state.dialogue.progress < 1) state.dialogue.progress = 1;
    else state.dialogue = null;
  }

  function updateMission(state) {
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

  function missionMarker(state) {
    if (state.activeMission != null) return (state.missionStep ? FINISH : MARKERS)[state.activeMission];
    return state.save.mission < MISSIONS.length ? { x: 935, y: 700 } : null;
  }

  function drawMissionMarker(ctx, state, camera = { x: 0, y: 0 }) {
    const marker = missionMarker(state);
    if (!marker) return;
    const screenX = marker.x - camera.x;
    const screenY = marker.y - camera.y;
    const panels = [[0, 0, 296, 232], [1048, 10, 1270, 232], [0, 606, 722, 720], state.vehicle ? [780, 614, 1030, 706] : [1028, 614, 1270, 706]];
    if (state.toastTimer > 0 && !state.dialogue) panels.push([441, 44, 839, 92]);
    if (state.dialogue) panels.push([335, 495, 945, 615]);
    if (state.shop) panels.push([402, 124, 878, 528]);
    const overlaps = (left, top, right, bottom) => panels.some(([x1, y1, x2, y2]) => left < x2 && right > x1 && top < y2 && bottom > y1);
    if (screenX - 36 < 0 || screenY - 36 < 0 || screenX + 36 > 1280 || screenY + 36 > 720 || overlaps(screenX - 36, screenY - 36, screenX + 36, screenY + 36)) return;
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
    const label = state.activeMission == null ? `CONTACT: ${missionByNumber(state.save.mission).giver}` : missionByNumber(state.activeMission).name.toUpperCase();
    ctx.font = 'bold 13px Arial';
    const labelX = screenX - 44;
    const labelY = screenY - 43;
    if (labelX >= 0 && labelY - 15 >= 0 && labelX + ctx.measureText(label).width <= 1280 && labelY + 3 <= 690 && !overlaps(labelX, labelY - 15, labelX + ctx.measureText(label).width, labelY + 3)) {
      ctx.fillStyle = '#f0eee2';
      ctx.fillText(label, marker.x - 44, marker.y - 43);
    }
  }

  globalThis.Meridian['missions'] = { missionByNumber, startMission, advanceDialogue, updateMission, missionMarker, drawMissionMarker };
})();
