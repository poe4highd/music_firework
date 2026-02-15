# Visual Mode Technical Features

This document details the two primary visual visualization modes implemented in Music Firework.

---

## 🌌 Universe Mode (宇宙模式)

The original visualization mode inspired by cosmic beauty.

### Key Features
- **Dynamic Starfield**: A real-time generated background of stars that pulses with the audio's sub-bass.
- **Audio Sensitivity**:
  - **Sub-Bass (20-60Hz)**: Controls starfield pulse and supernova intensity.
  - **Kick (60-250Hz)**: Triggers meteor strikes across the screen.
  - **Vocals (500-2000Hz)**: Adjusts the glow intensity of the central core.
  - **Highs (4000Hz+)**: Triggers lightning-fast projectile particles.
- **Supernova Events**: Major energy spikes trigger a full-screen supernova explosion that clears the current particle field.
- **Particle Physics**: Complex interactions including gravity, friction, and "ships" that navigate the audio waves.

---

## 🎆 Firework Mode (钢琴烟火模式)

A premium, interactive visualization tailored for melodic music (especially piano).

### Key Features
- **88-Key Piano Visualization**:
  - A horizontal line of piano keys that react individually to their corresponding musical frequency.
  - **Logarithmic Mapping**: Uses a precise log-scale (20Hz to 5000Hz) to map 1024-bin FFT data to 88 keys, ensuring a balanced visual distribution across the central keyboard area.
- **Musical Note Particles**:
  - Instead of simple dots, this mode triggers floating musical symbols (**♩, ♪, ♫, ♬**) from active key positions.
  - **Physics-based Ascent**: Notes float upwards with randomized rotation and a "buoyancy" effect.
- **Dynamic Smoke Effects**:
  - Notes leave a trail of dissipating smoke particles, creating a soft, premium aesthetic.
- **Integrated Environment**:
  - **Active Grass**: The bottom grassy area glows and changes hue dynamically based on the intensity of local frequency clusters.
  - **Center-Traced Emitters**: Firework sparks and notes are calculated to erupt perfectly from the center of each active piano key.
