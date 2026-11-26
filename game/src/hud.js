// Kakatua-9 — HUD and cockpit instruments. The HUD is DOM so it stays
// crisp at any size: altitude, speed, heading, throttle, fuel, damage,
// mission line, timer and score. In cockpit view a canvas panel draws
// lit gauges — altimeter, speedometer, compass tape and an artificial
// horizon — so the instruments look flown, not drawn on.
export function createHud(documentRef) {
  const doc = documentRef || document;
  const root = doc.getElementById('hud');
  const el = {};
  for (const id of ['alt', 'speed', 'heading', 'throttle', 'fuel', 'damage', 'score', 'timer', 'mission', 'message', 'fuelbar', 'dmgbar', 'thrbar']) {
    el[id] = doc.getElementById(`hud-${id}`);
  }
  const panel = doc.getElementById('cockpit');
  const panelCtx = panel ? panel.getContext('2d') : null;

  let messageTimer = 0;
  let lastMessage = '';

  function showMessage(text, seconds = 3) {
    lastMessage = text;
    messageTimer = seconds;
    if (el.message) el.message.textContent = text;
  }

  function drawGauge(ctx, cx, cy, r, label, value, max, unit, color) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10,14,28,0.82)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.stroke();
    const frac = Math.max(0, Math.min(1, value / max));
    ctx.beginPath();
    ctx.arc(cx, cy, r - 5, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffd166';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.round(value)), cx, cy - 4);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#9fd8e8';
    ctx.fillText(`${label} ${unit}`, cx, cy + 20);
    ctx.restore();
  }

  function drawHorizon(ctx, cx, cy, r, pitch, roll) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(cx, cy);
    ctx.rotate(-roll);
    const horizonY = pitch * r * 2.2;
    ctx.fillStyle = '#3a6fd8';
    ctx.fillRect(-r, -r + horizonY, r * 2, r - horizonY);
    ctx.fillStyle = '#c98a4a';
    ctx.fillRect(-r, horizonY, r * 2, r - horizonY + r);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r, horizonY);
    ctx.lineTo(r, horizonY);
    ctx.stroke();
    ctx.rotate(roll);
    ctx.translate(-cx, -cy);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffd166';
    ctx.stroke();
    // Fixed wings marker.
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy);
    ctx.lineTo(cx - 8, cy);
    ctx.moveTo(cx + 8, cy);
    ctx.lineTo(cx + 26, cy);
    ctx.stroke();
  }

  function drawCompass(ctx, cx, y, headingDeg, width) {
    ctx.save();
    ctx.fillStyle = 'rgba(10,14,28,0.82)';
    ctx.fillRect(cx - width / 2, y - 18, width, 36);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - width / 2, y - 18, width, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let d = -60; d <= 60; d += 15) {
      const deg = ((Math.round(headingDeg) + d) % 360 + 360) % 360;
      const x = cx + (d / 60) * (width / 2 - 8);
      const label = deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : String(deg);
      ctx.fillText(label, x, y);
    }
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(cx, y - 18);
    ctx.lineTo(cx - 6, y - 28);
    ctx.lineTo(cx + 6, y - 28);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function update(state, dt) {
    if (el.message) el.message.style.bottom = state.cockpit ? '270px' : '110px';
    const help = doc.getElementById('hud-help');
    if (help) help.style.display = state.cockpit ? 'none' : 'block';
    if (messageTimer > 0) {
      messageTimer -= dt;
      if (messageTimer <= 0 && el.message) el.message.textContent = '';
    }
    const a = state.aircraft;
    if (el.alt) el.alt.textContent = `${Math.round(a.altitudeFeet())} ft`;
    if (el.speed) el.speed.textContent = `${Math.round(a.speedKnots())} kt`;
    if (el.heading) el.heading.textContent = `${String(Math.round(a.headingDegrees())).padStart(3, '0')}°`;
    if (el.throttle) el.throttle.textContent = `${Math.round(a.state.throttle * 100)}%`;
    if (el.fuel) el.fuel.textContent = `${Math.round(a.state.fuel)}%`;
    if (el.damage) el.damage.textContent = `${Math.round(a.state.damage)}%`;
    if (el.score) el.score.textContent = String(state.score);
    if (el.timer) {
      const t = Math.max(0, state.elapsed);
      const mm = String(Math.floor(t / 60)).padStart(2, '0');
      const ss = String(Math.floor(t % 60)).padStart(2, '0');
      el.timer.textContent = `${mm}:${ss}`;
    }
    if (el.mission) el.mission.textContent = state.missionLine || 'Pick a mission — press 1, 2 or 3';
    if (el.fuelbar) {
      el.fuelbar.style.width = `${a.state.fuel}%`;
      el.fuelbar.style.background = a.state.fuel < 20 ? '#e83a3a' : '#37c978';
    }
    if (el.dmgbar) el.dmgbar.style.width = `${a.state.damage}%`;
    if (el.thrbar) el.thrbar.style.width = `${a.state.throttle * 100}%`;
    if (panel && panelCtx && state.cockpit) {
      panel.style.display = 'block';
      const w = panel.width;
      const h = panel.height;
      panelCtx.clearRect(0, 0, w, h);
      drawGauge(panelCtx, 110, 90, 62, 'ALT', a.altitudeFeet(), 3000, 'ft', '#4fc3f7');
      drawGauge(panelCtx, w - 110, 90, 62, 'SPD', a.speedKnots(), 180, 'kt', '#4fc3f7');
      drawHorizon(panelCtx, w / 2, 95, 58, a.state.pitch, a.state.roll);
      drawCompass(panelCtx, w / 2, 185, a.headingDegrees(), 320);
      panelCtx.fillStyle = '#9fd8e8';
      panelCtx.font = '13px system-ui, sans-serif';
      panelCtx.textAlign = 'center';
      panelCtx.fillText(`FUEL ${Math.round(a.state.fuel)}%   THR ${Math.round(a.state.throttle * 100)}%   DMG ${Math.round(a.state.damage)}%`, w / 2, 225);
    } else if (panel) {
      panel.style.display = 'none';
    }
  }

  return { update, showMessage, get lastMessage() { return lastMessage; } };
}
