// Kakatua-9 — all sound is synthesised with WebAudio. No audio files,
// no network: an engine hum, wind, a ring chime, a landing thud and a
// crash rumble, all built from oscillators and filtered noise.
export function createAudio() {
  let ctx = null;
  let engineOsc = null;
  let engineGain = null;
  let windSource = null;
  let windGain = null;
  let windFilter = null;
  let enabled = true;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 55;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 320;
      engineOsc.connect(lowpass);
      lowpass.connect(engineGain);
      engineGain.connect(ctx.destination);
      engineOsc.start();

      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      windSource = ctx.createBufferSource();
      windSource.buffer = buffer;
      windSource.loop = true;
      windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 500;
      windGain = ctx.createGain();
      windGain.gain.value = 0;
      windSource.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(ctx.destination);
      windSource.start();
    } catch (err) {
      enabled = false;
      return false;
    }
    return true;
  }

  // Call from the first user gesture; browsers block audio before that.
  function unlock() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
  }

  function setEngine(throttle, speed, airborne) {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime;
    engineOsc.frequency.setTargetAtTime(48 + throttle * 70, t, 0.1);
    engineGain.gain.setTargetAtTime(airborne ? 0.045 + throttle * 0.05 : 0.02 + throttle * 0.04, t, 0.15);
    windGain.gain.setTargetAtTime(Math.min(0.09, speed * 0.0011), t, 0.2);
    windFilter.frequency.setTargetAtTime(300 + speed * 9, t, 0.2);
  }

  function blip(frequency, duration, type, volume, when = 0) {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  return {
    unlock,
    setEngine,
    ringChime() { blip(880, 0.35, 'sine', 0.14); blip(1318, 0.5, 'sine', 0.1, 0.08); },
    thud() { blip(70, 0.25, 'sine', 0.22); },
    crash() { blip(55, 0.7, 'sawtooth', 0.2); blip(38, 0.9, 'sine', 0.22, 0.05); },
    pickup() { blip(660, 0.2, 'triangle', 0.12); blip(990, 0.3, 'triangle', 0.1, 0.1); },
    click() { blip(520, 0.07, 'square', 0.05); },
    toggle() { enabled = !enabled; return enabled; },
  };
}
