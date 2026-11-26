# STUDY.md — how Kakatua-9 was chosen (blind round, 26 Nov 2026)

## What the brief asks for

This competition is a **blind round**: the leaderboard is empty, no entry has
been submitted yet, and no top-10 exists to study. So the study is the brief
itself (RULES.txt) plus the judge's five criteria, in order:

1. **A complete flight game, visible in the screenshots**: cockpit or chase
   view over recognisable terrain, the aircraft in frame with instruments lit,
   a runway or a target ring ahead, and altitude / speed / heading on the HUD.
2. **Fun and depth**: flying that rewards throttle and turn discipline,
   missions with different goals, fuel or damage that turns a sortie into
   decisions.
3. **Feel and polish**: controls that answer at every speed, a camera that
   never fights the pilot, landings and crashes that read as what happened.
4. **Look and originality**: terrain and sky in one style, an aircraft that
   looks built, instruments that look flown rather than drawn, and an original
   game — nothing copied from a commercial game.
5. **Structure**: source split into files with one clear job each, named for
   what they do, because the judge sees mostly file and function names.

Two facts from the brief shaped everything else. First, the judge sees the
game almost entirely through the screenshots (the contact sheet eats most of
its 1,536-token view), so the screenshots — not the code — carry criterion 1.
Second, the starter kit is itself a plain 2D canvas game and its dossier is
house game #2, so anything that looks like the starter loses: the entry had
to be unmistakably a 3D flight game from the first screenshot.

## Candidates scored against the five criteria

| # | Candidate | K1 complete | K2 depth | K3 feel | K4 look | K5 structure | Verdict |
|---|---|---|---|---|---|---|---|
| A | Island-hopper bush pilot 3D (Three.js): grass strip in a tropical chain, 8 glowing rings over islands / volcano / lighthouse, second strip across the lagoon, 3 missions, fuel + damage | Strong: runway + rings + recognisable terrain + full HUD | Strong: 3 missions, fuel, wind of decisions | Strong: landing/crash read clearly | Strong: one low-poly sunset style | Strong: one file per system | **CHOSEN** |
| B | Canyon courier 3D: parcels through a red-rock canyon, dust storms, fuel stops | Medium: canyon reads, but no clear runway | Strong | Strong | Strong | Strong | Reserve — loses to A on K1 (no runway in frame) |
| C | Alpine rescue helicopter 3D: hover + winch on snowy peaks | Weak: a helicopter is not a plane, no runway | Medium | Weak: hover is hard to make feel good | Strong | Strong | Rejected — K1/K3 weak |
| D | Arcade 2D (canvas): side-view plane | WEAK: cockpit/chase view and recognisable terrain are near-impossible in 2D; the starter is already 2D, so a 2D entry risks reading as the house game | Medium | Medium | Weak | Medium | REJECTED — never 2D |
| E | Carrier landing 3D: deck, arrested landings | Strong: runway + instruments | Weak: one loop (take off, land, repeat) | Strong | Medium: open sea is not recognisable terrain | Strong | Rejected — K2 weak |
| F | Stunt airshow 3D: aerobatics, rings, smoke trails | Medium: rings yes, runway no | Weak: no fuel or damage | Strong | Strong | Strong | Rejected — K2 weak |
| G | **(mine) Seaplane lagoon racer 3D**: floats, buoy gates, water takeoffs | Medium: no runway at all, buoys read weaker than rings | Medium: one race loop | Medium: water handling is fiddly | Strong | Strong | Rejected — K1 weaker than A (buoys ≠ runway/ring, and water takeoffs hide the landing skill the judge wants to see) |
| H | **(mine) Night mail run 3D**: dusk island chain, lit beacons, storm cells, instrument-only legs | Strong: runway + beacons + HUD | Strong: weather + fuel decisions | Medium: night flying hides the terrain the judge needs to recognise | Medium: night hides the low-poly look that makes the terrain read | Strong | Rejected — K1/K4 weaker than A: the brief wants *recognisable* terrain, and a sunset shows it while night hides it |

## Why A wins

A is the only candidate that is strong on **all five** criteria at once. It
puts every element of criterion 1 in a single frame — chase view, a built
bush plane, a runway with centre dashes and a windsock, glowing rings ahead,
and a HUD with altitude, speed and heading — over terrain a judge can name
at a glance (sea, beach, palms, volcano, lighthouse, village). Its depth
comes from three missions that ask for genuinely different flying (a timed
ring tour, a precision drop, a two-leg ferry with a landing in the middle)
plus fuel and damage, so a sortie is a set of decisions, not a loop. Its
look is one style throughout (low-poly sunset: orange-purple sky, blue sea,
green islands), and its structure is one file per system
(`aircraft.js`, `terrain.js`, `sky.js`, `hud.js`, `missions.js`,
`camera.js`, `input.js`, `audio.js`, `config.js`, `main.js`, `shots.js`).

G and H were my own additions to the coordinator's list. G lost because a
seaplane has no runway and buoy gates read weaker than rings; H lost because
night flying hides exactly the terrain criterion 1 wants recognised. The
sunset in A is the deliberate middle ground: dramatic like night, but the
terrain stays fully readable.

## What was verified by playing, not by assuming

- **Takeoff actually works**: driven in headless Chrome over CDP — mission
  starts with `1`, throttle climbs with `W`, the plane lifts off past
  ~28 m/s, and climbs (altitude 26 m → 94 m in the test run) with no page
  errors. An early bug made takeoffs immediately re-ground the plane and
  reset its pitch; the takeoff path was fixed (clean break + slack in the
  ground-contact check) and re-verified.
- **Both cameras work**: chase view follows without fighting the pilot;
  cockpit view hides the airframe (it blocked the windscreen) and shows lit
  gauges — altimeter, speedometer, artificial horizon, compass tape.
- **Rings face the pilot**: each ring is oriented at the pilot flying in
  from the previous ring, so it reads as a gate, not an edge. An early ring
  sat inside the volcano slope and was moved around the cone.
- **Screenshots are real renders** of the game's own code (`?shot=` stages a
  real game state and the renderer draws it): cover = takeoff roll on the
  home strip with ring 1 ahead; cockpit = lit instruments over the lagoon;
  ring = the plane centred in ring 3; landing = final approach to the far
  strip at sunset.

## Originality

Kakatua-9, Pulau Kakatua, Pulau Merak, and every mesh, mission, name and
sound in the game are original to this entry. Three.js (MIT) is vendored as
`game/vendor/three.min.js` only; no commercial game's names, characters,
art, music or levels are used.
