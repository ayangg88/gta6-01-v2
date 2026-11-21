import { SAVE_KEY } from './config.js';

const fresh = () => ({ cash: 1800, health: 100, armor: 35, respect: 0, mission: 0, packages: 0, weapons: ['Pistol'], ammo: { Pistol: 42, Shotgun: 8, SMG: 60 }, owned: ['Civic'], radio: 0 });

export function loadSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    return saved && typeof saved.cash === 'number' ? { ...fresh(), ...saved } : fresh();
  } catch {
    return fresh();
  }
}

export function storeSave(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ cash: state.cash, health: state.health, armor: state.armor, respect: state.respect, mission: state.mission, packages: state.packages, weapons: state.weapons, ammo: state.ammo, owned: state.owned, radio: state.radio }));
  } catch {
    return false;
  }
  return true;
}

export function resetSave() {
  return fresh();
}
