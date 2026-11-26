[![Make the best flight game](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Rank](https://make.fun/badge/best-flight-game-20261126-0057/azkamahvin88/best-flight-game-20261126/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Reward](https://make.fun/badge/best-flight-game-20261126-0057/azkamahvin88/best-flight-game-20261126/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

# Kakatua-9 — Island Hopper Bush Pilot

A 3D bush-pilot flight game in a tropical island chain at sunset: fly the little coral bush plane Kakatua-9 out of the grass strip on Pulau Kakatua, through glowing rings, over the smoking volcano, past the lighthouse, and home again.

## How to play

Serve the game and open it in desktop Chrome:

```
node serve.ts
```

Then open http://localhost:8080. No build step, no network requests: every file the game loads lives under `game/`, and Three.js is vendored as `game/vendor/three.min.js`.

## Controls

- **W / S** — throttle up / down
- **Arrow keys** — pitch and roll (mouse steers too)
- **A / D** — yaw
- **F** — flaps
- **C** — toggle chase view / cockpit view (lit instruments: altimeter, speedometer, artificial horizon, compass tape)
- **SPACE** — drop cargo
- **P** — pause, **R** — restart
- **1 / 2 / 3** — pick a mission, or click its button on the menu

Lift off past 45 kt — below 24 kt the wings give up and the nose drops.

## Missions

1. **Ring Course** — fly through all 8 glowing rings as fast as you can; each ring banks time back onto the clock.
2. **Cargo Drop** — carry the supply crate to Pulau Merak and press SPACE over the yellow target circle.
3. **Island Rescue** — land on the far strip, pick up the stranded ranger, and fly them home before the fuel runs out.

Fuel burns with throttle, hard landings damage the airframe, and a crash ends the sortie. A smooth landing back home banks a bonus.

## Credits

Kakatua-9 is an original game: its plane, islands, volcano, lighthouse, missions, art and synthesised WebAudio sounds were all made for this entry. No commercial game's names, characters, art, music or levels are used. Three.js (MIT) is vendored under `game/vendor/`.

[Make the best flight game](https://make.fun/bounty/best-flight-game-20261126-0057)
