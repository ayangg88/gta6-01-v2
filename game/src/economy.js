(() => {
  'use strict';
  const { CAR_TYPES } = globalThis.Meridian['config'];

  function buyWeapon(state, weapon) {
    const prices = { Shotgun: 650, SMG: 1100, Armor: 450 };
    const price = prices[weapon];
    if (!price || state.save.cash < price) {
      state.toast = 'NOT ENOUGH CASH';
      state.toastTimer = 2;
      return false;
    }
    state.save.cash -= price;
    if (weapon === 'Armor') state.save.armor = Math.min(100, state.save.armor + 60);
    else {
      if (!state.save.weapons.includes(weapon)) state.save.weapons.push(weapon);
      state.save.ammo[weapon] = (state.save.ammo[weapon] || 0) + (weapon === 'Shotgun' ? 16 : 90);
    }
    state.toast = `${weapon.toUpperCase()} PURCHASED`;
    state.toastTimer = 2.6;
    return true;
  }

  function buyCar(state, type) {
    const car = CAR_TYPES[type];
    if (!car || state.save.cash < car.value) {
      state.toast = 'GARAGE: INSUFFICIENT FUNDS';
      state.toastTimer = 2;
      return false;
    }
    state.save.cash -= car.value;
    state.save.owned.push(car.name);
    state.toast = `${car.name.toUpperCase()} ADDED TO THE GARAGE`;
    state.toastTimer = 2.6;
    return true;
  }

  function payTaxiFare(state) {
    state.save.cash += 180;
    state.save.respect += 2;
    state.taxiFares += 1;
    state.toast = 'FARE COMPLETE  +$180';
    state.toastTimer = 3;
  }

  function robTill(state) {
    if (state.time - state.lastRobbery < 28) {
      state.toast = 'THE SHOPKEEPER IS WATCHING';
      state.toastTimer = 2;
      return;
    }
    state.lastRobbery = state.time;
    state.save.cash += 340 + (state.save.respect % 4) * 20;
    state.save.respect += 5;
    state.crime('store robbery', 2);
    state.toast = 'TILL CLEARED  +$340';
    state.toastTimer = 2.5;
  }

  globalThis.Meridian['economy'] = { buyWeapon, buyCar, payTaxiFare, robTill };
})();
