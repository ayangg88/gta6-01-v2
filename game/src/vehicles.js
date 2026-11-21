(() => {
  'use strict';
  const { CAR_TYPES, WORLD } = globalThis.Meridian['config'];

  const PALETTE = ['#528e93', '#e0ae38', '#a8aaa1', '#c65243', '#d0c9b3', '#eee8d9', '#62a651', '#dce7df'];

  function createVehicle(x, y, type = 0, angle = 0, civilian = false) {
    return { x, y, type, angle, speed: civilian ? 75 : 0, health: 100, color: CAR_TYPES[type].color, civilian, crashed: false, width: type === 6 ? 28 : type === 7 ? 44 : 54, height: type === 6 ? 19 : type === 7 ? 30 : 30 };
  }

  function seedTraffic(rng) {
    const cars = [];
    for (let index = 0; index < 38; index += 1) {
      const horizontal = index % 2 === 0;
      const road = 300 + Math.floor(rng() * 4) * 800;
      const position = 220 + Math.floor(rng() * 7) * 400;
      const vehicle = createVehicle(horizontal ? position : road, horizontal ? road : position, Math.floor(rng() * 5), horizontal ? (rng() > 0.5 ? 0 : Math.PI) : (rng() > 0.5 ? Math.PI / 2 : -Math.PI / 2), true);
      vehicle.speed = 44 + rng() * 30;
      vehicle.color = PALETTE[Math.floor(rng() * PALETTE.length)];
      cars.push(vehicle);
    }
    return cars;
  }

  function updateVehicles(state, dt) {
    for (const car of state.traffic) {
      if (car === state.vehicle || !car.civilian) continue;
      car.x += Math.cos(car.angle) * car.speed * dt;
      car.y += Math.sin(car.angle) * car.speed * dt;
      if (car.x < 160 || car.x > WORLD.width - 170) car.angle = Math.PI - car.angle;
      if (car.y < 170 || car.y > 2030) car.angle = -car.angle;
      const nearJunction = Math.abs(((car.x - 200) % 400) - 200) < 10 || Math.abs(((car.y - 250) % 800) - 400) < 10;
      if (nearJunction && Math.floor(state.time * 2 + car.x) % 5 === 0) car.speed = 15;
      else car.speed = Math.min(76, car.speed + 18 * dt);
      for (const other of state.traffic) {
        if (other === car || other === state.vehicle) continue;
        if (Math.hypot(car.x - other.x, car.y - other.y) < 45 && Math.cos(car.angle) * (other.x - car.x) + Math.sin(car.angle) * (other.y - car.y) > 0) car.speed = Math.max(12, car.speed - 45 * dt);
      }
    }
    const player = state.vehicle;
    if (!player) return;
    const throttle = state.controls.accelerate ? 1 : state.controls.brake ? -1.2 : 0;
    player.speed += throttle * 210 * dt;
    player.speed *= state.controls.handbrake ? 0.975 : 0.992;
    player.speed = Math.max(-85, Math.min(CAR_TYPES[player.type].speed, player.speed));
    const steering = (state.controls.left ? -1 : 0) + (state.controls.right ? 1 : 0);
    const grip = state.controls.handbrake ? 0.0047 : 0.0026;
    player.angle += steering * Math.min(1, Math.abs(player.speed) / 75) * grip * player.speed * dt;
    player.x += Math.cos(player.angle) * player.speed * dt;
    player.y += Math.sin(player.angle) * player.speed * dt;
    if (player.type !== 7 && (player.x < 190 || player.x > 3085 || player.y < 205 || player.y > 1950)) {
      player.x -= Math.cos(player.angle) * player.speed * dt;
      player.y -= Math.sin(player.angle) * player.speed * dt;
      player.speed *= -0.23;
      player.health = Math.max(0, player.health - 7);
      state.effects.push({ x: player.x, y: player.y, life: 0.45, kind: 'spark' });
      state.shake = 5;
      state.crime('crash');
    }
    if (Math.abs(player.speed) > 100 && Math.floor(state.time * 5) % 2 === 0) state.skids.push({ x: player.x - Math.cos(player.angle) * 20, y: player.y - Math.sin(player.angle) * 20, angle: player.angle, life: 3 });
    for (const other of state.traffic) {
      if (other === player) continue;
      if (Math.hypot(player.x - other.x, player.y - other.y) < 44) {
        player.speed *= -0.25;
        player.health = Math.max(0, player.health - 15);
        other.speed *= 0.25;
        other.crashed = true;
        state.shake = 9;
        state.effects.push({ x: player.x, y: player.y, life: 0.6, kind: 'spark' });
        state.crime('crash');
        break;
      }
    }
    if (player.health < 58 && Math.floor(state.time * 3) % 2 === 0) state.effects.push({ x: player.x - 16, y: player.y - 17, life: 0.7, kind: 'smoke' });
  }

  function drawVehicle(ctx, car, isPlayer = false) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    if (car.type === 7) {
      ctx.fillStyle = '#173d44';
      ctx.beginPath();
      ctx.moveTo(-24, -13);
      ctx.lineTo(17, -13);
      ctx.lineTo(27, 0);
      ctx.lineTo(17, 13);
      ctx.lineTo(-24, 13);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = car.color;
      ctx.fillRect(-18, -10, 34, 20);
      ctx.fillStyle = '#76aeb0';
      ctx.fillRect(-6, -8, 13, 16);
    } else if (car.type === 6) {
      ctx.fillStyle = '#17272a';
      ctx.fillRect(-16, -3, 32, 6);
      ctx.fillStyle = car.color;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#1b2324';
      ctx.fillRect(-27, -17, 54, 34);
      ctx.fillStyle = car.color;
      ctx.fillRect(-25, -14, 49, 28);
      ctx.fillStyle = '#263a3d';
      ctx.fillRect(-9, -11, 20, 22);
      ctx.fillStyle = '#a9d2d0';
      ctx.fillRect(11, -11, 8, 22);
      ctx.fillStyle = '#f8e7a7';
      ctx.fillRect(20, -11, 4, 6);
      ctx.fillRect(20, 5, 4, 6);
      ctx.fillStyle = '#f0725d';
      ctx.fillRect(-25, -10, 4, 5);
      ctx.fillRect(-25, 5, 4, 5);
      if (car.type === 5) {
        ctx.fillStyle = '#fff2d1';
        ctx.fillRect(-11, -12, 18, 3);
        ctx.fillStyle = '#cf5549';
        ctx.fillRect(-2, -17, 11, 4);
      }
      if (car.type === 1) {
        ctx.fillStyle = '#272d2b';
        ctx.fillRect(-2, -9, 5, 18);
      }
    }
    if (isPlayer) {
      ctx.strokeStyle = '#f3d274';
      ctx.lineWidth = 2;
      ctx.strokeRect(-29, -19, 58, 38);
    }
    ctx.restore();
  }

  globalThis.Meridian['vehicles'] = { createVehicle, seedTraffic, updateVehicles, drawVehicle };
})();
