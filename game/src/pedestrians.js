const SHIRTS = ['#d94d3f', '#f0c952', '#557f84', '#eee4ca', '#715b83', '#4f8554', '#e58c4f'];

export function seedPedestrians(rng) {
  const people = [];
  for (let index = 0; index < 110; index += 1) {
    const horizontal = index % 2 === 0;
    const road = 205 + Math.floor(rng() * 5) * 400;
    const along = 250 + Math.floor(rng() * 6) * 400;
    people.push({ x: horizontal ? along : road, y: horizontal ? road : along, angle: rng() * Math.PI * 2, shirt: SHIRTS[Math.floor(rng() * SHIRTS.length)], flee: 0, step: rng() * 8, alive: true });
  }
  return people;
}

export function updatePedestrians(state, dt) {
  for (const person of state.pedestrians) {
    if (!person.alive) continue;
    person.flee = Math.max(0, person.flee - dt);
    person.step += dt * (person.flee ? 9 : 2.2);
    const pace = person.flee ? 82 : 17;
    person.x += Math.cos(person.angle) * pace * dt;
    person.y += Math.sin(person.angle) * pace * dt;
    if (Math.abs((person.x % 400) - 200) > 88 || Math.abs((person.y - 250) % 800) > 122) person.angle += Math.PI * 0.55;
    if (state.vehicle && Math.hypot(person.x - state.vehicle.x, person.y - state.vehicle.y) < 31 && Math.abs(state.vehicle.speed) > 64) {
      person.alive = false;
      state.vehicle.speed *= 0.84;
      state.vehicle.health = Math.max(0, state.vehicle.health - 3);
      state.crime('hit pedestrian');
      state.shake = 4;
      for (let puff = 0; puff < 4; puff += 1) state.effects.push({ x: person.x, y: person.y, life: 0.45, kind: 'dust' });
      for (const nearby of state.pedestrians) if (Math.hypot(nearby.x - person.x, nearby.y - person.y) < 250) nearby.flee = 5;
    }
  }
}

export function fleeFrom(state, x, y, radius = 450) {
  for (const person of state.pedestrians) {
    const distance = Math.hypot(person.x - x, person.y - y);
    if (!person.alive || distance > radius) continue;
    person.flee = 7;
    person.angle = Math.atan2(person.y - y, person.x - x);
  }
}

export function drawPedestrians(ctx, state) {
  for (const person of state.pedestrians) {
    if (!person.alive) continue;
    const arm = Math.sin(person.step) * 3;
    ctx.fillStyle = '#29373a';
    ctx.fillRect(person.x - 4, person.y + 2, 3, 8 + arm);
    ctx.fillRect(person.x + 1, person.y + 2, 3, 8 - arm);
    ctx.fillStyle = person.shirt;
    ctx.beginPath();
    ctx.arc(person.x, person.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#edc29a';
    ctx.beginPath();
    ctx.arc(person.x, person.y - 6, 3.3, 0, Math.PI * 2);
    ctx.fill();
  }
}
