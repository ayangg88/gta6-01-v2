(() => {
  'use strict';
  let audioContext;
  let master;
  let engine;
  let engineGain;

  function audio() {
    if (audioContext) return audioContext;
    audioContext = new AudioContext();
    master = audioContext.createGain();
    master.gain.value = 0.18;
    master.connect(audioContext.destination);
    return audioContext;
  }

  function playTone(frequency, duration, wave = 'sine', volume = 0.1) {
    const ctx = audio();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = wave;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }

  function gunSound(weapon) {
    playTone(weapon === 'Shotgun' ? 90 : weapon === 'SMG' ? 205 : 145, 0.12, 'sawtooth', 0.16);
    playTone(weapon === 'Shotgun' ? 58 : 68, 0.18, 'triangle', 0.09);
  }

  function sirenSound() {
    playTone(620, 0.22, 'square', 0.035);
    playTone(460, 0.22, 'square', 0.035);
  }

  function pickupSound() {
    playTone(720, 0.12, 'sine', 0.09);
    playTone(1080, 0.17, 'sine', 0.06);
  }

  function updateEngine(speed, driving) {
    if (!audioContext) return;
    if (!driving) {
      engineGain?.gain.setTargetAtTime(0, audioContext.currentTime, 0.08);
      return;
    }
    if (!engine) {
      engine = audioContext.createOscillator();
      engineGain = audioContext.createGain();
      engine.type = 'sawtooth';
      engineGain.gain.value = 0;
      engine.connect(engineGain);
      engineGain.connect(master);
      engine.start();
    }
    engine.frequency.setTargetAtTime(60 + Math.abs(speed) * 0.72, audioContext.currentTime, 0.08);
    engineGain.gain.setTargetAtTime(0.012 + Math.min(0.035, Math.abs(speed) / 8000), audioContext.currentTime, 0.12);
  }

  function setMuted(muted) {
    if (!audioContext) audio();
    master.gain.setTargetAtTime(muted ? 0 : 0.18, audioContext.currentTime, 0.03);
  }

  const NOTES = [0, 3, 7, 10, 7, 3, 0, -2];
  function radioStep(state) {
    if (!state.radioOn || state.muted || state.time - state.lastRadioNote < 0.28) return;
    state.lastRadioNote = state.time;
    const step = state.radioStep++ % NOTES.length;
    const roots = [146.83, 164.81, 130.81];
    const frequency = roots[state.save.radio % roots.length] * 2 ** (NOTES[step] / 12);
    playTone(frequency, 0.19, state.save.radio === 1 ? 'triangle' : 'sine', 0.025);
    if (step === 0 || step === 4) playTone(frequency / 2, 0.23, 'triangle', 0.018);
  }

  globalThis.Meridian['audio'] = { playTone, gunSound, sirenSound, pickupSound, updateEngine, setMuted, radioStep };
})();
