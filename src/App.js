import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============== AUDIO ENGINE ==============
class AudioEngine {
  constructor() { this.ctx = null; this.initialized = false; this.masterGain = null; }
  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.3;
      this.initialized = true;
    } catch (e) { console.log('Audio not supported'); }
  }
  play(type) {
    if (!this.initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.masterGain);
    const now = this.ctx.currentTime;
    const sounds = {
      jump: () => { osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(400, now + 0.1); gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15); osc.start(now); osc.stop(now + 0.15); },
      mask: () => { osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(900, now + 0.2); gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(now); osc.stop(now + 0.3); },
      death: () => { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.4); gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4); osc.start(now); osc.stop(now + 0.4); },
      collect: () => { osc.type = 'triangle'; osc.frequency.setValueAtTime(880, now); osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1); gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15); osc.start(now); osc.stop(now + 0.15); },
      dash: () => { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(300, now + 0.08); gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15); osc.start(now); osc.stop(now + 0.15); },
      goal: () => { [0, 0.1, 0.2, 0.3].forEach((d, i) => { const o = this.ctx.createOscillator(); const g = this.ctx.createGain(); o.connect(g); g.connect(this.masterGain); o.frequency.value = [523, 659, 784, 1047][i]; g.gain.setValueAtTime(0.2, now + d); g.gain.exponentialRampToValueAtTime(0.01, now + d + 0.2); o.start(now + d); o.stop(now + d + 0.2); }); },
      achievement: () => { [0, 0.08, 0.16, 0.24, 0.32].forEach((d, i) => { const o = this.ctx.createOscillator(); const g = this.ctx.createGain(); o.connect(g); g.connect(this.masterGain); o.type = 'sine'; o.frequency.value = [392, 523, 659, 784, 1047][i]; g.gain.setValueAtTime(0.15, now + d); g.gain.exponentialRampToValueAtTime(0.01, now + d + 0.15); o.start(now + d); o.stop(now + d + 0.15); }); },
      boss_hit: () => { osc.type = 'square'; osc.frequency.setValueAtTime(80, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.2); gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25); osc.start(now); osc.stop(now + 0.25); },
      portal: () => { osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1); gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2); osc.start(now); osc.stop(now + 0.2); },
    };
    (sounds[type] || sounds.collect)();
  }
}
const audio = new AudioEngine();

// ============== CONSTANTS ==============
// ============== CONSTANTS ==============
const T = 32, GRAVITY = 0.4, JUMP = -11, SPEED = 3.5, DASH_SPEED = 15, DASH_DUR = 10, DASH_CD = 45;

// ============== ACHIEVEMENTS ==============
const ACHIEVEMENTS = {
  first_mask: { name: 'Primera Máscara', desc: 'Recoge tu primera máscara', icon: '🎭' },
  all_masks: { name: 'Coleccionista', desc: 'Recoge todas las máscaras', icon: '👑' },
  speed_demon: { name: 'Demonio Veloz', desc: 'Nivel en <30s', icon: '⚡' },
  no_death: { name: 'Inmortal', desc: 'Nivel sin morir', icon: '💀' },
  combo_master: { name: 'Combo Maestro', desc: 'Combo x10', icon: '🔥' },
  dasher: { name: 'Dasher', desc: '50 dashes', icon: '💨' },
  boss_slayer: { name: 'Cazador', desc: 'Derrota al jefe', icon: '⚔️' },
  perfectionist: { name: 'Perfeccionista', desc: 'Rango S', icon: '🌟' },
  explorer: { name: 'Explorador', desc: 'Encuentra secreto', icon: '🔮' },
  true_ending: { name: 'Final Verdadero', desc: 'El vacío revelado', icon: '🌌' },
};

// ============== MASKS ==============
const MASKS = {
  none: { name: 'Sin Máscara', color: '#FFD93D', glow: '#FFD93D50', abilities: [], desc: 'Tu verdadero rostro', icon: '😊' },
  ghost: { name: 'Espíritu', color: '#7FDBDA', glow: '#7FDBDA60', abilities: ['phase'], desc: 'Atraviesa muros espectrales', icon: '👻' },
  fire: { name: 'Llama', color: '#FF6B6B', glow: '#FF6B6B70', abilities: ['burn', 'light'], desc: 'Derrite hielo, ilumina', icon: '🔥' },
  shadow: { name: 'Sombra', color: '#2C2C54', glow: '#2C2C5460', abilities: ['invisible', 'wallclimb'], desc: 'Escala paredes, invisible', icon: '🌑' },
  time: { name: 'Tiempo', color: '#A17FE0', glow: '#A17FE080', abilities: ['slow'], desc: 'Ralentiza el mundo', icon: '⏳' },
  nature: { name: 'Naturaleza', color: '#2ECC71', glow: '#2ECC7160', abilities: ['grow'], desc: 'Crea plataformas', icon: '🌿' },
  water: { name: 'Agua', color: '#3498DB', glow: '#3498DB70', abilities: ['swim'], desc: 'Nada libremente', icon: '💧' },
  storm: { name: 'Tormenta', color: '#9B59B6', glow: '#9B59B680', abilities: ['windride'], desc: 'Domina el viento', icon: '⚡' },
};

const POWERUPS = {
  shield: { icon: '🛡️', color: '#4FC3F7', dur: 300 },
  speed: { icon: '⚡', color: '#FFD54F', dur: 250 },
  double_jump: { icon: '🦘', color: '#69F0AE', dur: 350 },
};

// ============== STORY ==============
const STORY = {
  intro: ["En un mundo donde las máscaras definen quién eres...", "Tú has perdido la tuya.", "Viaja a través de reinos olvidados...", "Y descubre quién eras realmente."],
  ending: ["Has reunido todas las máscaras...", "Cada una era un aspecto de tu ser.", "Ahora eres completo."],
  true_ending: ["Has atravesado el vacío...", "No eran máscaras lo que necesitabas...", "Sino el coraje de mostrar tu verdadero rostro.", "FIN VERDADERO"]
};

// ============== LEVELS ==============
const LEVELS = [
  // Level 1: Tutorial
  { name: "El Despertar", sub: "Tutorial", w: 35, h: 17, bg: 'linear-gradient(180deg, #1a1a2e 0%, #0f3460 100%)',
    player: { x: 2, y: 14 }, goal: { x: 32, y: 14 }, masks: [], checkpoints: [{ x: 16, y: 14 }],
    orbs: [{ x: 8, y: 13 }, { x: 15, y: 11 }, { x: 22, y: 13 }, { x: 28, y: 10 }],
    powerups: [{ x: 18, y: 12, type: 'speed' }], secrets: [{ x: 33, y: 5 }], parTime: 30,
    tiles: [...Array(35).fill(0).map((_, i) => ({ x: i, y: 16, t: 's' })), ...Array(35).fill(0).map((_, i) => ({ x: i, y: 15, t: 's' })),
      { x: 6, y: 14, t: 's' }, { x: 7, y: 14, t: 's' }, { x: 10, y: 12, t: 's' }, { x: 11, y: 12, t: 's' }, { x: 12, y: 12, t: 's' },
      { x: 16, y: 13, t: 's' }, { x: 17, y: 13, t: 's' }, { x: 18, y: 13, t: 's' }, { x: 22, y: 11, t: 's' }, { x: 23, y: 11, t: 's' },
      { x: 26, y: 13, t: 's' }, { x: 27, y: 13, t: 's' }, { x: 28, y: 11, t: 's' }, { x: 31, y: 8, t: 's' }, { x: 32, y: 8, t: 's' }, { x: 33, y: 8, t: 's' }, { x: 33, y: 7, t: 's' }, { x: 33, y: 6, t: 's' }],
    hint: "← → mover • ↑/ESPACIO saltar • SHIFT dash", dialogue: ["Despierta, viajero...", "Tu camino comienza."] },
  
  // Level 2: Ghost
  { name: "Templo Espíritu", sub: "Fase a través", w: 40, h: 17, bg: 'linear-gradient(180deg, #0f3460 0%, #1a1a2e 100%)',
    player: { x: 2, y: 14 }, goal: { x: 37, y: 8 }, masks: [{ type: 'ghost', x: 7, y: 14 }], checkpoints: [{ x: 18, y: 14 }],
    orbs: [{ x: 12, y: 14 }, { x: 20, y: 11 }, { x: 28, y: 8 }, { x: 35, y: 9 }], powerups: [], secrets: [{ x: 5, y: 8 }], parTime: 40,
    tiles: [...Array(40).fill(0).map((_, i) => ({ x: i, y: 16, t: 's' })), ...Array(40).fill(0).map((_, i) => ({ x: i, y: 15, t: 's' })),
      { x: 10, y: 14, t: 'g' }, { x: 10, y: 13, t: 'g' }, { x: 10, y: 12, t: 'g' }, { x: 14, y: 13, t: 's' }, { x: 15, y: 13, t: 's' },
      { x: 17, y: 12, t: 's' }, { x: 18, y: 12, t: 's' }, { x: 21, y: 11, t: 'g' }, { x: 21, y: 10, t: 'g' }, { x: 21, y: 9, t: 'g' },
      { x: 24, y: 9, t: 's' }, { x: 25, y: 9, t: 's' }, { x: 27, y: 8, t: 'g' }, { x: 30, y: 9, t: 's' }, { x: 31, y: 9, t: 's' },
      { x: 33, y: 8, t: 'g' }, { x: 35, y: 9, t: 's' }, { x: 36, y: 9, t: 's' }, { x: 37, y: 9, t: 's' },
      { x: 3, y: 10, t: 's' }, { x: 4, y: 10, t: 's' }, { x: 5, y: 10, t: 's' }, { x: 5, y: 9, t: 's' }],
    hint: "Máscara Espíritu atraviesa bloques cyan", dialogue: ["Los espíritus te observan...", "Toma su esencia."] },
  
  // Level 3: Fire
  { name: "Forja Ardiente", sub: "Derrite el hielo", w: 45, h: 17, bg: 'linear-gradient(180deg, #1a0a0a 0%, #4a2020 100%)',
    player: { x: 2, y: 14 }, goal: { x: 42, y: 5 }, masks: [{ type: 'fire', x: 8, y: 14 }], checkpoints: [{ x: 15, y: 14 }, { x: 30, y: 10 }],
    enemies: [{ x: 22, y: 14, patrol: [20, 26], type: 'walker' }],
    orbs: [{ x: 14, y: 14 }, { x: 25, y: 10 }, { x: 35, y: 6 }], powerups: [{ x: 28, y: 8, type: 'shield' }], secrets: [{ x: 2, y: 2 }], parTime: 50,
    tiles: [...Array(45).fill(0).map((_, i) => ({ x: i, y: 16, t: 's' })), ...Array(45).fill(0).map((_, i) => ({ x: i, y: 15, t: 's' })),
      { x: 12, y: 14, t: 'i' }, { x: 12, y: 13, t: 'i' }, { x: 15, y: 13, t: 's' }, { x: 16, y: 13, t: 's' },
      { x: 19, y: 11, t: 's' }, { x: 20, y: 11, t: 's' }, { x: 24, y: 10, t: 'i' }, { x: 24, y: 9, t: 'i' },
      { x: 27, y: 9, t: 's' }, { x: 28, y: 9, t: 's' }, { x: 32, y: 7, t: 'i' }, { x: 34, y: 6, t: 's' }, { x: 35, y: 6, t: 's' },
      { x: 39, y: 6, t: 's' }, { x: 40, y: 6, t: 's' }, { x: 41, y: 6, t: 's' }, { x: 42, y: 6, t: 's' },
      { x: 0, y: 5, t: 's' }, { x: 1, y: 5, t: 's' }, { x: 2, y: 5, t: 's' }, { x: 2, y: 4, t: 's' }, { x: 2, y: 3, t: 's' }],
    dark: [{ x: 30, y: 0, w: 15, h: 17 }],
    hint: "Fuego derrite hielo e ilumina", dialogue: ["El calor te llama...", "Abraza las llamas."] },
  
  // Level 4: Shadow
  { name: "Abismo Sombrío", sub: "Escala y escóndete", w: 45, h: 18, bg: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
    player: { x: 2, y: 15 }, goal: { x: 42, y: 4 }, masks: [{ type: 'shadow', x: 6, y: 15 }], checkpoints: [{ x: 18, y: 15 }, { x: 32, y: 8 }],
    enemies: [{ x: 14, y: 15, patrol: [12, 18], type: 'sentry', vision: 5 }, { x: 28, y: 11, patrol: [26, 32], type: 'sentry', vision: 4 }],
    orbs: [{ x: 10, y: 12 }, { x: 22, y: 15 }, { x: 35, y: 8 }, { x: 40, y: 4 }], powerups: [], secrets: [{ x: 43, y: 16 }], parTime: 55,
    tiles: [...Array(45).fill(0).map((_, i) => ({ x: i, y: 17, t: 's' })), ...Array(45).fill(0).map((_, i) => ({ x: i, y: 16, t: 's' })),
      { x: 8, y: 15, t: 'w' }, { x: 8, y: 14, t: 'w' }, { x: 8, y: 13, t: 'w' }, { x: 8, y: 12, t: 'w' },
      { x: 9, y: 13, t: 's' }, { x: 10, y: 13, t: 's' }, { x: 20, y: 14, t: 's' }, { x: 21, y: 14, t: 's' },
      { x: 24, y: 12, t: 'w' }, { x: 24, y: 11, t: 'w' }, { x: 24, y: 10, t: 'w' },
      { x: 25, y: 12, t: 's' }, { x: 26, y: 12, t: 's' }, { x: 32, y: 9, t: 's' }, { x: 33, y: 9, t: 's' },
      { x: 37, y: 6, t: 's' }, { x: 38, y: 6, t: 's' }, { x: 40, y: 5, t: 's' }, { x: 41, y: 5, t: 's' }, { x: 42, y: 5, t: 's' }],
    hint: "Sombra escala paredes e invisible a centinelas", dialogue: ["En la oscuridad...", "Encuentra tu fuerza."] },
  
  // Level 5: Crystals with Portals
  { name: "Cavernas Cristal", sub: "Portales y reflejos", w: 50, h: 18, bg: 'linear-gradient(180deg, #1a1a3a 0%, #3a3a7a 100%)',
    player: { x: 2, y: 15 }, goal: { x: 47, y: 10 }, masks: [], checkpoints: [{ x: 20, y: 15 }, { x: 35, y: 12 }],
    enemies: [{ x: 15, y: 15, patrol: [12, 18], type: 'walker' }],
    orbs: [{ x: 10, y: 13 }, { x: 28, y: 15 }, { x: 38, y: 11 }, { x: 45, y: 10 }],
    powerups: [{ x: 25, y: 12, type: 'double_jump' }], secrets: [{ x: 48, y: 3 }],
    portals: [{ x: 22, y: 15, tx: 40, ty: 12, color: '#FF69B4' }, { x: 42, y: 12, tx: 24, ty: 15, color: '#69FFB4' }], parTime: 60,
    tiles: [...Array(50).fill(0).map((_, i) => ({ x: i, y: 17, t: 's' })), ...Array(50).fill(0).map((_, i) => ({ x: i, y: 16, t: 's' })),
      { x: 8, y: 14, t: 'c' }, { x: 9, y: 14, t: 's' }, { x: 14, y: 12, t: 's' }, { x: 15, y: 12, t: 's' },
      { x: 17, y: 11, t: 'c' }, { x: 18, y: 11, t: 's' }, { x: 24, y: 13, t: 's' }, { x: 25, y: 13, t: 's' },
      { x: 32, y: 14, t: 's' }, { x: 33, y: 14, t: 's' }, { x: 36, y: 12, t: 'c' }, { x: 37, y: 12, t: 's' }, { x: 38, y: 12, t: 's' },
      { x: 44, y: 11, t: 's' }, { x: 45, y: 11, t: 's' }, { x: 46, y: 11, t: 's' }, { x: 47, y: 11, t: 's' },
      { x: 47, y: 5, t: 's' }, { x: 48, y: 5, t: 's' }, { x: 48, y: 4, t: 's' }],
    hint: "Los portales te teletransportan", dialogue: ["Los cristales guardan memorias...", "¿Qué reflejos verás?"] },
  
  // Level 6: Water
  { name: "Océano Profundo", sub: "Respira bajo el agua", w: 50, h: 20, bg: 'linear-gradient(180deg, #0a2a4a 0%, #0a4a6a 100%)',
    player: { x: 2, y: 8 }, goal: { x: 47, y: 17 }, masks: [{ type: 'water', x: 8, y: 8 }], checkpoints: [{ x: 20, y: 10 }, { x: 35, y: 15 }],
    enemies: [{ x: 18, y: 12, patrol: [15, 22], type: 'fish' }, { x: 32, y: 15, patrol: [30, 36], type: 'fish' }],
    orbs: [{ x: 12, y: 12 }, { x: 25, y: 15 }, { x: 40, y: 17 }], powerups: [{ x: 28, y: 14, type: 'shield' }], secrets: [{ x: 48, y: 5 }],
    water: [{ x: 0, y: 10, w: 50, h: 10 }], parTime: 65,
    tiles: [...Array(50).fill(0).map((_, i) => ({ x: i, y: 19, t: 's' })),
      { x: 5, y: 9, t: 's' }, { x: 6, y: 9, t: 's' }, { x: 7, y: 9, t: 's' }, { x: 8, y: 9, t: 's' },
      { x: 18, y: 13, t: 's' }, { x: 19, y: 13, t: 's' }, { x: 20, y: 13, t: 's' },
      { x: 33, y: 16, t: 's' }, { x: 34, y: 16, t: 's' }, { x: 35, y: 16, t: 's' },
      { x: 44, y: 18, t: 's' }, { x: 45, y: 18, t: 's' }, { x: 46, y: 18, t: 's' }, { x: 47, y: 18, t: 's' },
      { x: 46, y: 7, t: 's' }, { x: 47, y: 7, t: 's' }, { x: 48, y: 7, t: 's' }, { x: 48, y: 6, t: 's' }],
    hint: "Máscara Agua para nadar. Sin ella, te ahogas.", dialogue: ["Las profundidades guardan secretos...", "Sumérgete."] },
  
  // Level 7: Sky with Wind
  { name: "Cielos Etéreos", sub: "Surfea el viento", w: 55, h: 22, bg: 'linear-gradient(180deg, #87CEEB 0%, #B3E5FC 100%)',
    player: { x: 2, y: 19 }, goal: { x: 52, y: 3 }, masks: [{ type: 'storm', x: 10, y: 17 }], checkpoints: [{ x: 18, y: 17 }, { x: 35, y: 10 }],
    enemies: [{ x: 25, y: 14, patrol: [22, 28], type: 'flyer' }, { x: 40, y: 7, patrol: [38, 44], type: 'flyer' }],
    orbs: [{ x: 15, y: 16 }, { x: 28, y: 12 }, { x: 42, y: 6 }, { x: 50, y: 4 }], powerups: [], secrets: [{ x: 54, y: 20 }],
    wind: [{ x: 12, y: 12, w: 8, h: 8, dir: 'up', str: 0.5 }, { x: 30, y: 5, w: 10, h: 8, dir: 'right', str: 0.3 }, { x: 45, y: 0, w: 8, h: 10, dir: 'up', str: 0.6 }],
    moving: [{ x: 20, y: 15, ex: 26, sp: 0.03 }, { x: 35, y: 11, ex: 42, sp: 0.04 }], parTime: 75,
    tiles: [...Array(55).fill(0).map((_, i) => ({ x: i, y: 21, t: 'cl' })),
      { x: 5, y: 18, t: 'cl' }, { x: 6, y: 18, t: 'cl' }, { x: 10, y: 18, t: 's' }, { x: 11, y: 18, t: 's' },
      { x: 14, y: 17, t: 'cl' }, { x: 15, y: 17, t: 'cl' }, { x: 28, y: 13, t: 'cl' }, { x: 29, y: 13, t: 'cl' },
      { x: 33, y: 11, t: 's' }, { x: 34, y: 11, t: 's' }, { x: 44, y: 9, t: 'cl' }, { x: 45, y: 9, t: 'cl' },
      { x: 50, y: 4, t: 's' }, { x: 51, y: 4, t: 's' }, { x: 52, y: 4, t: 's' }, { x: 53, y: 20, t: 'cl' }, { x: 54, y: 20, t: 'cl' }],
    hint: "Zonas de viento te impulsan. Tormenta da control.", dialogue: ["Por encima de las nubes...", "El cielo es tu hogar."] },
  
  // Level 8: Time
  { name: "Jardín del Tiempo", sub: "Cada segundo cuenta", w: 50, h: 18, bg: 'linear-gradient(180deg, #1a0a2e 0%, #4a2c7a 100%)',
    player: { x: 2, y: 15 }, goal: { x: 47, y: 3 }, masks: [{ type: 'time', x: 8, y: 15 }], checkpoints: [{ x: 18, y: 15 }, { x: 35, y: 10 }],
    enemies: [{ x: 20, y: 15, patrol: [18, 24], type: 'fast', speed: 2 }, { x: 32, y: 11, patrol: [30, 36], type: 'fast', speed: 2.5 }],
    hazards: [{ x: 14, y: 15 }, { x: 28, y: 12 }, { x: 38, y: 8 }],
    orbs: [{ x: 16, y: 13 }, { x: 28, y: 10 }, { x: 40, y: 6 }, { x: 45, y: 3 }], powerups: [{ x: 25, y: 12, type: 'speed' }], secrets: [{ x: 48, y: 15 }],
    moving: [{ x: 22, y: 13, ex: 28, sp: 0.04 }, { x: 36, y: 9, ex: 42, sp: 0.05 }], parTime: 60,
    tiles: [...Array(50).fill(0).map((_, i) => ({ x: i, y: 17, t: 's' })), ...Array(50).fill(0).map((_, i) => ({ x: i, y: 16, t: 's' })),
      { x: 10, y: 14, t: 's' }, { x: 11, y: 14, t: 's' }, { x: 14, y: 14, t: 's' }, { x: 15, y: 14, t: 's' },
      { x: 28, y: 12, t: 's' }, { x: 29, y: 12, t: 's' }, { x: 32, y: 11, t: 's' }, { x: 33, y: 11, t: 's' },
      { x: 40, y: 7, t: 's' }, { x: 41, y: 7, t: 's' }, { x: 45, y: 4, t: 's' }, { x: 46, y: 4, t: 's' }, { x: 47, y: 4, t: 's' }],
    hint: "Tiempo ralentiza enemigos y plataformas (E)", dialogue: ["El tiempo fluye diferente...", "Tómalo."] },
  
  // Level 9: Nature
  { name: "Bosque Primordial", sub: "La vida florece", w: 50, h: 18, bg: 'linear-gradient(180deg, #0a2a0a 0%, #1a4a2a 100%)',
    player: { x: 2, y: 15 }, goal: { x: 47, y: 5 }, masks: [{ type: 'nature', x: 7, y: 15 }], checkpoints: [{ x: 20, y: 15 }, { x: 35, y: 10 }],
    enemies: [{ x: 15, y: 15, patrol: [12, 18], type: 'walker' }],
    orbs: [{ x: 12, y: 13 }, { x: 25, y: 10 }, { x: 38, y: 7 }, { x: 45, y: 5 }], powerups: [{ x: 30, y: 10, type: 'shield' }], secrets: [{ x: 48, y: 16 }],
    grow: [{ x: 18, y: 15, ty: 12 }, { x: 32, y: 12, ty: 9 }, { x: 42, y: 9, ty: 6 }], parTime: 65,
    tiles: [...Array(50).fill(0).map((_, i) => ({ x: i, y: 17, t: 's' })), ...Array(50).fill(0).map((_, i) => ({ x: i, y: 16, t: 's' })),
      { x: 10, y: 14, t: 's' }, { x: 11, y: 14, t: 's' }, { x: 22, y: 12, t: 's' }, { x: 23, y: 12, t: 's' },
      { x: 28, y: 11, t: 's' }, { x: 29, y: 11, t: 's' }, { x: 36, y: 9, t: 's' }, { x: 37, y: 9, t: 's' },
      { x: 44, y: 6, t: 's' }, { x: 45, y: 6, t: 's' }, { x: 46, y: 6, t: 's' }, { x: 47, y: 6, t: 's' }],
    hint: "Naturaleza crea plataformas al acercarte", dialogue: ["La vida responde a tu llamado...", "Hazla florecer."] },
  
  // Level 10: Final Boss
  { name: "Santuario Final", sub: "El Guardián espera", w: 60, h: 22, bg: 'linear-gradient(180deg, #0a0a1a 0%, #2a2a5a 60%, #3a3a7a 100%)',
    player: { x: 2, y: 19 }, goal: { x: 57, y: 5 }, masks: [], checkpoints: [{ x: 15, y: 19 }, { x: 32, y: 14 }, { x: 48, y: 10 }],
    enemies: [{ x: 18, y: 19, patrol: [16, 22], type: 'walker' }, { x: 35, y: 14, patrol: [33, 38], type: 'sentry', vision: 4 }],
    hazards: [{ x: 24, y: 19 }, { x: 40, y: 12 }],
    orbs: [{ x: 12, y: 17 }, { x: 22, y: 16 }, { x: 36, y: 12 }, { x: 50, y: 8 }, { x: 55, y: 5 }],
    powerups: [{ x: 28, y: 16, type: 'shield' }, { x: 50, y: 9, type: 'double_jump' }], secrets: [{ x: 58, y: 20, true_ending: true }],
    grow: [{ x: 20, y: 19, ty: 16 }, { x: 42, y: 14, ty: 11 }],
    moving: [{ x: 26, y: 17, ex: 30, sp: 0.02 }, { x: 52, y: 8, ex: 56, sp: 0.03 }], parTime: 100,
    boss: { x: 52, y: 10, hp: 6 },
    tiles: [...Array(60).fill(0).map((_, i) => ({ x: i, y: 21, t: 's' })), ...Array(60).fill(0).map((_, i) => ({ x: i, y: 20, t: 's' })),
      { x: 10, y: 19, t: 'g' }, { x: 10, y: 18, t: 'g' }, { x: 14, y: 18, t: 'i' }, { x: 14, y: 17, t: 'i' },
      { x: 18, y: 19, t: 'w' }, { x: 18, y: 18, t: 'w' }, { x: 18, y: 17, t: 'w' }, { x: 19, y: 17, t: 's' }, { x: 20, y: 17, t: 's' },
      { x: 32, y: 15, t: 's' }, { x: 33, y: 15, t: 's' }, { x: 34, y: 15, t: 's' }, { x: 35, y: 15, t: 's' },
      { x: 37, y: 14, t: 'g' }, { x: 37, y: 13, t: 'g' }, { x: 40, y: 13, t: 's' }, { x: 41, y: 13, t: 's' },
      { x: 44, y: 11, t: 's' }, { x: 45, y: 11, t: 's' }, { x: 46, y: 11, t: 's' },
      { x: 55, y: 6, t: 's' }, { x: 56, y: 6, t: 's' }, { x: 57, y: 6, t: 's' }, { x: 58, y: 6, t: 's' }],
    dark: [{ x: 35, y: 0, w: 12, h: 22 }],
    hint: "Usa TODAS las máscaras. Dash al jefe para dañarlo.", dialogue: ["El final está cerca...", "El Guardián te espera..."] },
  
  // Level 11: Secret Void Level
  { name: "El Vacío", sub: "La verdad revelada", w: 70, h: 25, bg: 'linear-gradient(180deg, #000 0%, #050510 100%)', secret: true,
    player: { x: 2, y: 22 }, goal: { x: 67, y: 3 }, masks: [], checkpoints: [{ x: 20, y: 22 }, { x: 40, y: 15 }, { x: 55, y: 8 }],
    enemies: [{ x: 15, y: 22, patrol: [12, 20], type: 'void' }, { x: 30, y: 18, patrol: [28, 35], type: 'sentry', vision: 6 }, { x: 45, y: 12, patrol: [42, 50], type: 'fast', speed: 3 }],
    hazards: [{ x: 18, y: 22 }, { x: 35, y: 16 }, { x: 50, y: 10 }, { x: 62, y: 5 }],
    orbs: [{ x: 12, y: 20 }, { x: 28, y: 18 }, { x: 42, y: 12 }, { x: 55, y: 7 }, { x: 65, y: 3 }],
    powerups: [{ x: 18, y: 20, type: 'shield' }, { x: 40, y: 13, type: 'speed' }], secrets: [{ x: 68, y: 22, true_ending: true }],
    portals: [{ x: 25, y: 20, tx: 35, ty: 18, color: '#8B00FF' }, { x: 48, y: 12, tx: 55, ty: 8, color: '#FF00FF' }],
    wind: [{ x: 30, y: 15, w: 8, h: 6, dir: 'up', str: 0.4 }],
    moving: [{ x: 22, y: 20, ex: 28, sp: 0.05 }, { x: 38, y: 14, ex: 45, sp: 0.06 }, { x: 60, y: 5, ex: 65, sp: 0.04 }], parTime: 120,
    boss: { x: 62, y: 6, hp: 10, void: true },
    tiles: [...Array(70).fill(0).map((_, i) => ({ x: i, y: 24, t: 'v' })), ...Array(70).fill(0).map((_, i) => ({ x: i, y: 23, t: 'v' })),
      { x: 8, y: 22, t: 'v' }, { x: 9, y: 22, t: 'v' }, { x: 14, y: 21, t: 'v' }, { x: 15, y: 21, t: 'v' },
      { x: 20, y: 20, t: 'v' }, { x: 21, y: 20, t: 'v' }, { x: 32, y: 18, t: 'v' }, { x: 33, y: 18, t: 'v' },
      { x: 38, y: 16, t: 'v' }, { x: 39, y: 16, t: 'v' }, { x: 45, y: 13, t: 'v' }, { x: 46, y: 13, t: 'v' },
      { x: 52, y: 10, t: 'v' }, { x: 53, y: 10, t: 'v' }, { x: 57, y: 8, t: 'v' }, { x: 58, y: 8, t: 'v' },
      { x: 65, y: 4, t: 'v' }, { x: 66, y: 4, t: 'v' }, { x: 67, y: 4, t: 'v' }, { x: 68, y: 4, t: 'v' }],
    hint: "El Vacío consume todo. Usa TODAS tus habilidades.", dialogue: ["Has encontrado la entrada prohibida...", "¿Tienes el coraje?"] }
];

// ============== MAIN COMPONENT ==============
export default function MaskShiftUltimate() {
  const [state, setState] = useState('intro');
  const [lvl, setLvl] = useState(0);
  const [player, setPlayer] = useState({ x: 0, y: 0, vx: 0, vy: 0, grounded: false, face: 1 });
  const [mask, setMask] = useState('none');
  const [masks, setMasks] = useState(['none']);
  const [tiles, setTiles] = useState([]);
  const [maskItems, setMaskItems] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [orbs, setOrbs] = useState([]);
  const [orbCount, setOrbCount] = useState(0);
  const [particles, setParticles] = useState([]);
  const [shake, setShake] = useState({ x: 0, y: 0 });
  const [keys, setKeys] = useState({});
  const [deaths, setDeaths] = useState(0);
  const [checkpoint, setCheckpoint] = useState(null);
  const [dialogIdx, setDialogIdx] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [coyote, setCoyote] = useState(0);
  const [jumpBuf, setJumpBuf] = useState(0);
  const [slow, setSlow] = useState(false);
  const [moving, setMoving] = useState([]);
  const [grow, setGrow] = useState([]);
  const [introIdx, setIntroIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const [cam, setCam] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState([]);
  const [dash, setDash] = useState({ on: false, cd: 0, dir: 0, t: 0 });
  const [combo, setCombo] = useState({ c: 0, t: 0, m: 1 });
  const [score, setScore] = useState(0);
  const [lvlTime, setLvlTime] = useState(0);
  const [best, setBest] = useState({});
  const [achs, setAchs] = useState([]);
  const [newAch, setNewAch] = useState(null);
  const [secrets, setSecrets] = useState([]);
  const [powerups, setPowerups] = useState([]);
  const [active, setActive] = useState({});
  const [challenge, setChallenge] = useState(false);
  const [done, setDone] = useState(false);
  const [lvlDeaths, setLvlDeaths] = useState(0);
  const [lvlOrbs, setLvlOrbs] = useState(0);
  const [totalOrbs, setTotalOrbs] = useState(0);
  const [dashes, setDashes] = useState(0);
  const [flash, setFlash] = useState(null);
  const [boss, setBoss] = useState(null);
  const [bossDown, setBossDown] = useState(false);
  const [ranks, setRanks] = useState({});
  const [totalTime, setTotalTime] = useState(0);
  const [dblJump, setDblJump] = useState(false);
  const [jumped2, setJumped2] = useState(false);
  const [portals, setPortals] = useState([]);
  const [portalCd, setPortalCd] = useState(0);
  const [water, setWater] = useState([]);
  const [inWater, setInWater] = useState(false);
  const [wind, setWind] = useState([]);
  const [unlocked, setUnlocked] = useState([0]);
  const [trueEnd, setTrueEnd] = useState(false);
  
  const loopRef = useRef();
  const startRef = useRef(0);
  const W = 896, H = 576;

  const unlock = useCallback((id) => {
    if (!achs.includes(id) && ACHIEVEMENTS[id]) {
      setAchs(p => [...p, id]);
      setNewAch(ACHIEVEMENTS[id]);
      audio.play('achievement');
      setFlash('#FFD700');
      setTimeout(() => setNewAch(null), 3000);
    }
  }, [achs]);

  const rank = (t, d, o, tot, par) => {
    let s = 100;
    if (t > par) s -= Math.min(30, (t - par) * 0.5);
    else s += (par - t) * 0.5;
    s -= d * 10;
    s += (tot > 0 ? o / tot : 1) * 20;
    return s >= 95 ? 'S' : s >= 80 ? 'A' : s >= 65 ? 'B' : s >= 50 ? 'C' : 'D';
  };

  useEffect(() => {
    const init = () => { audio.init(); window.removeEventListener('click', init); window.removeEventListener('keydown', init); };
    window.addEventListener('click', init); window.addEventListener('keydown', init);
    return () => { window.removeEventListener('click', init); window.removeEventListener('keydown', init); };
  }, []);

  const load = useCallback((i) => {
    const L = LEVELS[i];
    if (!L) return;
    setPlayer({ x: L.player.x * T, y: L.player.y * T, vx: 0, vy: 0, grounded: false, face: 1 });
    setTiles([...L.tiles]);
    setMaskItems(L.masks ? [...L.masks] : []);
    setEnemies(L.enemies ? L.enemies.map(e => ({ ...e, dir: 1, alert: 0 })) : []);
    setOrbs(L.orbs ? [...L.orbs] : []);
    setTotalOrbs(L.orbs?.length || 0);
    setLvlOrbs(0);
    setMoving(L.moving ? L.moving.map(p => ({ ...p, cx: p.x, dir: 1 })) : []);
    setGrow(L.grow ? L.grow.map(g => ({ ...g, on: false, h: 0 })) : []);
    setSecrets(L.secrets ? [...L.secrets] : []);
    setPowerups(L.powerups ? [...L.powerups] : []);
    setPortals(L.portals ? [...L.portals] : []);
    setWater(L.water ? [...L.water] : []);
    setWind(L.wind ? [...L.wind] : []);
    setMask('none');
    setCheckpoint(challenge ? null : null);
    setShowHint(true);
    setParticles([]);
    setTrail([]);
    setSlow(false);
    setDialogIdx(0);
    setLvlDeaths(0);
    setLvlTime(0);
    setCombo({ c: 0, t: 0, m: 1 });
    setActive({});
    setDash({ on: false, cd: 0, dir: 0, t: 0 });
    setDblJump(false);
    setJumped2(false);
    setPortalCd(0);
    setInWater(false);
    startRef.current = Date.now();
    if (L.boss) { setBoss({ ...L.boss, cx: L.boss.x, dir: 1, timer: 0, inv: 0 }); setBossDown(false); }
    else { setBoss(null); }
    setState('dialogue');
  }, [challenge]);

  const start = (ch = false) => {
    setChallenge(ch); setLvl(0); setDeaths(0); setOrbCount(0); setMasks(['none']);
    setScore(0); setTotalTime(0); load(0);
  };

  const next = () => {
    audio.play('goal');
    const L = LEVELS[lvl];
    const t = Math.floor((Date.now() - startRef.current) / 1000);
    const r = rank(t, lvlDeaths, lvlOrbs, totalOrbs, L.parTime);
    setRanks(p => ({ ...p, [lvl]: r }));
    setUnlocked(p => !p.includes(lvl + 1) && lvl + 1 < LEVELS.length ? [...p, lvl + 1] : p);
    setBest(p => (!p[lvl] || t < p[lvl]) ? { ...p, [lvl]: t } : p);
    if (t < 30) unlock('speed_demon');
    if (lvlDeaths === 0) unlock('no_death');
    if (r === 'S') unlock('perfectionist');
    setOrbCount(p => p + lvlOrbs);
    setTotalTime(p => p + t);
    if (lvl < LEVELS.length - 1) { setLvl(p => p + 1); load(lvl + 1); }
    else { setDone(true); if (challenge) unlock('challenger'); setIntroIdx(0); setState('win'); }
  };

  const respawn = useCallback(() => {
    audio.play('death'); setDeaths(d => d + 1); setLvlDeaths(d => d + 1);
    setShake({ x: 10, y: 10 }); setFlash('#FF0000'); setCombo({ c: 0, t: 0, m: 1 });
    setParticles(p => [...p, ...Array(20).fill(0).map(() => ({ x: player.x + T / 2, y: player.y + T / 2, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15, life: 60, color: MASKS[mask].color, size: Math.random() * 8 + 4 }))]);
    setTimeout(() => {
      const L = LEVELS[lvl];
      const sp = (checkpoint && !challenge) ? checkpoint : L.player;
      setPlayer({ x: sp.x * T, y: sp.y * T, vx: 0, vy: 0, grounded: false, face: 1 });
      setSlow(false); setTrail([]); setDash({ on: false, cd: 0, dir: 0, t: 0 }); setActive({}); setJumped2(false); setFlash(null); setInWater(false);
    }, 500);
  }, [lvl, checkpoint, player.x, player.y, mask, challenge]);

  const addCombo = useCallback((pts) => {
    setCombo(p => {
      const nc = p.c + 1, nm = Math.min(10, 1 + Math.floor(nc / 3));
      if (nc >= 10) unlock('combo_master');
      return { c: nc, t: 120, m: nm };
    });
    setScore(p => p + pts * combo.m);
  }, [combo.m, unlock]);

  useEffect(() => {
    const down = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyE', 'Escape', 'ShiftLeft', 'ShiftRight'].includes(e.code) || e.code.startsWith('Digit')) e.preventDefault();
      if (e.code === 'Escape') { if (state === 'playing') setState('pause'); else if (state === 'pause') setState('playing'); return; }
      if (state === 'dialogue') {
        if (e.code === 'Space' || e.code === 'Enter') {
          const L = LEVELS[lvl];
          if (dialogIdx < L.dialogue.length - 1) setDialogIdx(d => d + 1);
          else { startRef.current = Date.now(); setState('playing'); }
        }
        return;
      }
      if (state === 'intro') {
        if (e.code === 'Space' || e.code === 'Enter') {
          if (introIdx < STORY.intro.length - 1) setIntroIdx(i => i + 1);
          else setState('menu');
        }
        return;
      }
      if (state === 'win') {
        if (e.code === 'Space' || e.code === 'Enter') {
          const end = trueEnd ? STORY.true_ending : STORY.ending;
          if (introIdx < end.length - 1) setIntroIdx(i => i + 1);
          else setState('menu');
        }
        return;
      }
      setKeys(p => ({ ...p, [e.code]: true }));
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') setJumpBuf(8);
      if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && dash.cd <= 0 && !dash.on) {
        const d = keys.ArrowRight || keys.KeyD ? 1 : keys.ArrowLeft || keys.KeyA ? -1 : player.face;
        setDash({ on: true, cd: DASH_CD, dir: d, t: DASH_DUR });
        setDashes(p => { if (p + 1 >= 50) unlock('dasher'); return p + 1; });
        audio.play('dash');
        setParticles(p => [...p, ...Array(10).fill(0).map(() => ({ x: player.x + T / 2, y: player.y + T / 2, vx: -d * (Math.random() * 8 + 4), vy: (Math.random() - 0.5) * 4, life: 20, color: MASKS[mask].color, size: Math.random() * 6 + 3 }))]);
      }
      if (e.code.startsWith('Digit')) {
        const n = parseInt(e.code.replace('Digit', ''));
        if (n <= masks.length && n > 0) {
          const nm = masks[n - 1];
          if (nm !== mask) { setMask(nm); audio.play('mask'); addCombo(50); }
        }
      }
      if (e.code === 'KeyE' && MASKS[mask].abilities.includes('slow')) { setSlow(s => !s); audio.play('mask'); }
    };
    const up = (e) => setKeys(p => ({ ...p, [e.code]: false }));
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [masks, mask, player.face, state, dialogIdx, introIdx, lvl, dash, keys, addCombo, unlock, trueEnd]);

  useEffect(() => {
    if (state !== 'playing') return;
    const L = LEVELS[lvl];
    if (!L) return;
    const ts = slow ? 0.3 : 1;
    const spd = active.speed > 0, shld = active.shield > 0, dbl = active.double_jump > 0 || dblJump;
    
    const loop = () => {
      setLvlTime(Math.floor((Date.now() - startRef.current) / 1000));
      setCombo(p => p.t > 0 ? { ...p, t: p.t - 1 } : { c: 0, t: 0, m: 1 });
      setActive(p => { const u = {}; Object.keys(p).forEach(k => { if (p[k] > 0) u[k] = p[k] - 1; }); return u; });
      setPortalCd(p => Math.max(0, p - 1));
      setShake(p => ({ x: p.x * 0.9, y: p.y * 0.9 }));
      setJumpBuf(p => Math.max(0, p - 1));
      setCoyote(p => Math.max(0, p - 1));
      setDash(p => {
        if (p.on && p.t > 0) return { ...p, t: p.t - 1 };
        if (p.on && p.t <= 0) return { on: false, cd: DASH_CD, dir: 0, t: 0 };
        return { ...p, cd: Math.max(0, p.cd - 1) };
      });

      setPlayer(prev => {
        let { x, y, vx, vy, grounded, face } = prev;
        
        // Water check
        let inW = false;
        for (const z of water) {
          if (x + T > z.x * T && x < (z.x + z.w) * T && y + T > z.y * T && y < (z.y + z.h) * T) { inW = true; break; }
        }
        setInWater(inW);
        const canSwim = MASKS[mask].abilities.includes('swim');
        if (inW && !canSwim && !shld) { respawn(); return prev; }

        // Movement
        if (dash.on && dash.t > 0) { vx = dash.dir * DASH_SPEED; vy = 0; }
        else if (inW && canSwim) {
          if (keys.ArrowRight || keys.KeyD) vx += 0.3;
          if (keys.ArrowLeft || keys.KeyA) vx -= 0.3;
          if (keys.ArrowUp || keys.KeyW || keys.Space) vy -= 0.4;
          if (keys.ArrowDown || keys.KeyS) vy += 0.3;
          vx = Math.max(-3, Math.min(3, vx)) * 0.95;
          vy = Math.max(-3, Math.min(3, vy)) * 0.95;
        } else {
          const sm = spd ? 1.5 : 1;
          const tv = (keys.ArrowRight || keys.KeyD) ? SPEED * sm : (keys.ArrowLeft || keys.KeyA) ? -SPEED * sm : 0;
          vx += (tv - vx) * 0.8;
          if (Math.abs(tv) < 0.1) vx *= 0.85;
        }
        if (vx > 0.5) face = 1; else if (vx < -0.5) face = -1;
        if (grounded) { setCoyote(8); setJumped2(false); }

        // Wind
        for (const w of wind) {
          if (x + T > w.x * T && x < (w.x + w.w) * T && y + T > w.y * T && y < (w.y + w.h) * T) {
            const wr = MASKS[mask].abilities.includes('windride') ? 1.5 : 1;
            const s = w.str * wr * ts;
            if (w.dir === 'up') vy -= s;
            else if (w.dir === 'down') vy += s;
            else if (w.dir === 'left') vx -= s;
            else if (w.dir === 'right') vx += s;
          }
        }

        // Jump
        if (jumpBuf > 0 && !inW) {
          if (grounded || coyote > 0) {
            vy = JUMP; grounded = false; setCoyote(0); setJumpBuf(0); audio.play('jump'); addCombo(10);
          } else if (!grounded && dbl && !jumped2) {
            vy = JUMP * 0.9; setJumped2(true); setJumpBuf(0); audio.play('jump'); addCombo(25);
          }
        }

        // Wall climb
        const wc = MASKS[mask].abilities.includes('wallclimb');
        let onW = false;
        if (wc) {
          for (const t of tiles) {
            if (t.t !== 'w') continue;
            if (x + T > t.x * T && x < (t.x + 1) * T && y + T > t.y * T && y < (t.y + 1) * T) {
              onW = true; vy = Math.min(vy, 1);
              if (keys.ArrowUp || keys.KeyW || keys.Space) vy = -SPEED;
            }
          }
        }

        // Physics
        if (!onW && !dash.on && !inW) vy += GRAVITY * ts;
        vy = Math.min(vy, 15);
        x += vx * ts; y += vy * ts;

        // Portals
        if (portalCd <= 0) {
          for (const p of portals) {
            if (x < (p.x + 1) * T && x + T > p.x * T && y < (p.y + 1) * T && y + T > p.y * T) {
              x = p.tx * T; y = p.ty * T; setPortalCd(30); audio.play('portal'); addCombo(30);
              setParticles(pr => [...pr, ...Array(15).fill(0).map(() => ({ x: x + T / 2, y: y + T / 2, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15, life: 40, color: p.color, size: Math.random() * 6 + 3 }))]);
              break;
            }
          }
        }

        // Collision
        grounded = false;
        const phase = MASKS[mask].abilities.includes('phase');

        // Moving platforms
        for (const p of moving) {
          const px = (p.cx || p.x) * T, py = p.y * T;
          if (x < px + T * 2 && x + T > px && y < py + T && y + T > py) {
            if (y + T - py < 15 && vy >= 0) { y = py - T; grounded = true; vy = 0; x += p.dir * p.sp * T * ts; }
          }
        }

        // Grown
        for (const g of grow) {
          if (!g.on) continue;
          const gx = g.x * T;
          for (let h = 0; h <= g.h; h++) {
            const gy = (g.y - h) * T;
            if (x < gx + T && x + T > gx && y < gy + T && y + T > gy) {
              const ox = Math.min(x + T - gx, gx + T - x), oy = Math.min(y + T - gy, gy + T - y);
              if (ox < oy) { x = x < gx ? gx - T : gx + T; vx = 0; }
              else { if (y < gy) { y = gy - T; grounded = true; vy = 0; } else { y = gy + T; vy = 0; } }
            }
          }
        }

        // Static tiles
        for (const t of tiles) {
          const tx = t.x * T, ty = t.y * T;
          if (t.t === 'g' && phase) continue;
          if (t.t === 'w') continue;
          if (t.t === 'cl' && vy < 0) continue;
          if (x < tx + T && x + T > tx && y < ty + T && y + T > ty) {
            const ox = Math.min(x + T - tx, tx + T - x), oy = Math.min(y + T - ty, ty + T - y);
            if (t.t === 'cl') { if (y + T - ty < 12 && vy >= 0) { y = ty - T; grounded = true; vy = 0; } }
            else {
              if (ox < oy) { x = x < tx ? tx - T : tx + T; vx = 0; }
              else { if (y < ty) { y = ty - T; grounded = true; vy = 0; } else { y = ty + T; vy = 0; } }
            }
          }
        }

        // Bounds
        if (x < 0) { x = 0; vx = 0; }
        if (x > L.w * T - T) { x = L.w * T - T; vx = 0; }
        if (y > L.h * T + 100) { respawn(); return prev; }

        // Trail
        if (Math.abs(vx) > 1 || Math.abs(vy) > 1 || dash.on) setTrail(t => [...t.slice(-20), { x: x + T / 2, y: y + T / 2, life: dash.on ? 25 : 15 }]);

        return { x, y, vx, vy, grounded, face };
      });

      // Camera
      setCam(p => {
        const tx = Math.max(0, Math.min(player.x - W / 2 + T, L.w * T - W));
        const ty = Math.max(0, Math.min(player.y - H / 2 + T, L.h * T - H));
        return { x: p.x + (tx - p.x) * 0.1, y: p.y + (ty - p.y) * 0.1 };
      });

      // Fire melt ice
      if (MASKS[mask].abilities.includes('burn')) {
        setTiles(p => p.filter(t => {
          if (t.t !== 'i') return true;
          const d = Math.sqrt((player.x + T / 2 - (t.x * T + T / 2)) ** 2 + (player.y + T / 2 - (t.y * T + T / 2)) ** 2);
          if (d < T * 2) { addCombo(30); setParticles(pr => [...pr, ...Array(8).fill(0).map(() => ({ x: t.x * T + T / 2, y: t.y * T + T / 2, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 4, life: 30, color: '#87CEEB', size: Math.random() * 5 + 3 }))]); return false; }
          return true;
        }));
      }

      // Nature grow
      if (MASKS[mask].abilities.includes('grow')) {
        setGrow(p => p.map(g => {
          const d = Math.sqrt((player.x + T / 2 - g.x * T - T / 2) ** 2 + (player.y + T / 2 - g.y * T - T / 2) ** 2);
          if (d < T * 3 && g.h < (g.y - g.ty)) return { ...g, on: true, h: Math.min(g.h + 0.05, g.y - g.ty) };
          return g;
        }));
      }

      // Moving platforms
      setMoving(p => p.map(m => {
        let { cx, dir, x, ex, sp } = m;
        cx = (cx || x) + dir * sp * ts;
        if (cx >= ex) dir = -1; if (cx <= x) dir = 1;
        return { ...m, cx, dir };
      }));

      // Collect masks
      setMaskItems(p => p.filter(m => {
        if (player.x < (m.x + 1) * T && player.x + T > m.x * T && player.y < (m.y + 1) * T && player.y + T > m.y * T) {
          const first = masks.length === 1;
          setMasks(c => c.includes(m.type) ? c : [...c, m.type]);
          setMask(m.type); audio.play('collect'); addCombo(100);
          if (first) unlock('first_mask');
          if (masks.length + 1 >= Object.keys(MASKS).length) unlock('all_masks');
          setParticles(pr => [...pr, ...Array(20).fill(0).map(() => ({ x: m.x * T + T / 2, y: m.y * T + T / 2, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15, life: 50, color: MASKS[m.type].color, size: Math.random() * 8 + 4 }))]);
          return false;
        }
        return true;
      }));

      // Collect orbs
      setOrbs(p => p.filter(o => {
        if (player.x < (o.x + 1) * T && player.x + T > o.x * T && player.y < (o.y + 1) * T && player.y + T > o.y * T) {
          setOrbCount(c => c + 1); setLvlOrbs(c => c + 1); audio.play('collect'); addCombo(50);
          setParticles(pr => [...pr, ...Array(8).fill(0).map(() => ({ x: o.x * T + T / 2, y: o.y * T + T / 2, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 30, color: '#FFD700', size: Math.random() * 4 + 2 }))]);
          return false;
        }
        return true;
      }));

      // Secrets
      setSecrets(p => p.filter(s => {
        if (player.x < (s.x + 1) * T && player.x + T > s.x * T && player.y < (s.y + 1) * T && player.y + T > s.y * T) {
          audio.play('achievement'); unlock('explorer'); addCombo(200); setFlash('#E040FB');
          if (s.true_ending) { setTrueEnd(true); unlock('true_ending'); }
          setOrbCount(c => c + 5); setLvlOrbs(c => c + 3);
          setParticles(pr => [...pr, ...Array(25).fill(0).map(() => ({ x: s.x * T + T / 2, y: s.y * T + T / 2, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12, life: 50, color: '#E040FB', size: Math.random() * 6 + 4 }))]);
          return false;
        }
        return true;
      }));

      // Powerups
      setPowerups(p => p.filter(pw => {
        if (!POWERUPS[pw.type]) return true;
        if (player.x < (pw.x + 1) * T && player.x + T > pw.x * T && player.y < (pw.y + 1) * T && player.y + T > pw.y * T) {
          audio.play('collect'); setActive(a => ({ ...a, [pw.type]: POWERUPS[pw.type].dur })); addCombo(75); setFlash(POWERUPS[pw.type].color);
          setParticles(pr => [...pr, ...Array(15).fill(0).map(() => ({ x: pw.x * T + T / 2, y: pw.y * T + T / 2, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 40, color: POWERUPS[pw.type].color, size: Math.random() * 5 + 3 }))]);
          return false;
        }
        return true;
      }));

      // Checkpoints
      if (L.checkpoints && !challenge) {
        for (const cp of L.checkpoints) {
          if (player.x < (cp.x + 1) * T && player.x + T > cp.x * T && player.y < (cp.y + 1) * T && player.y + T > cp.y * T) {
            if (!checkpoint || checkpoint.x !== cp.x) { setCheckpoint(cp); addCombo(25); }
          }
        }
      }

      // Hazards
      if (L.hazards && !shld) {
        for (const h of L.hazards) {
          if (player.x < (h.x + 1) * T && player.x + T > h.x * T && player.y < (h.y + 1) * T && player.y + T > h.y * T) { respawn(); return; }
        }
      }

      // Boss
      if (boss && !bossDown) {
        setBoss(p => {
          if (!p) return null;
          let { cx, dir, timer, hp, inv, x, y } = p;
          cx += dir * 0.02 * ts;
          if (cx >= x + 4) dir = -1; if (cx <= x - 4) dir = 1;
          timer += ts; if (inv > 0) inv--;
          const bx = cx * T, by = y * T, bs = p.void ? T * 3 : T * 2;
          if (dash.on && inv <= 0 && player.x < bx + bs && player.x + T > bx && player.y < by + bs && player.y + T > by) {
            hp--; inv = 60; audio.play('boss_hit'); setShake({ x: 15, y: 15 }); setFlash('#FF0000'); addCombo(150);
            setParticles(pr => [...pr, ...Array(20).fill(0).map(() => ({ x: bx + bs / 2, y: by + bs / 2, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15, life: 40, color: p.void ? '#8B00FF' : '#FF0000', size: Math.random() * 8 + 4 }))]);
            if (hp <= 0) { setBossDown(true); audio.play('achievement'); unlock('boss_slayer'); setFlash('#FFD700'); addCombo(500); }
          }
          if (!dash.on && !shld && inv <= 0 && player.x < bx + bs && player.x + T > bx && player.y < by + bs && player.y + T > by) { respawn(); }
          return { ...p, cx, dir, timer, hp, inv };
        });
      }

      // Enemies
      setEnemies(p => p.map(e => {
        let { x, patrol, dir, type, speed = 1, vision = 0, alert = 0 } = e;
        const ms = (type === 'fast' ? speed : 0.02) * ts;
        x += dir * ms;
        if (x <= patrol[0]) dir = 1; if (x >= patrol[1]) dir = -1;
        if (type === 'sentry') {
          const pd = Math.abs(player.x / T - x), pyd = Math.abs(player.y / T - e.y);
          if (pd < vision && pyd < 2) alert = Math.min(100, alert + 2);
          else alert = Math.max(0, alert - 1);
        }
        const inv = MASKS[mask].abilities.includes('invisible');
        if (!shld && (!inv || (type === 'sentry' && alert < 50))) {
          const ex = x * T, ey = e.y * T;
          if (player.x < ex + T * 0.8 && player.x + T > ex + T * 0.2 && player.y < ey + T && player.y + T > ey) {
            if (!inv && !dash.on) respawn();
          }
        }
        return { ...e, x, dir, alert };
      }));

      // Goal
      const gx = L.goal.x * T, gy = L.goal.y * T;
      if (player.x < gx + T && player.x + T > gx && player.y < gy + T && player.y + T > gy) {
        if (L.boss && !bossDown) { /* locked */ } else next();
      }

      // Particles
      setParticles(p => p.map(pt => ({ ...pt, x: pt.x + pt.vx * ts, y: pt.y + pt.vy * ts, vy: pt.vy + 0.15 * ts, life: pt.life - 1, size: pt.size * 0.98 })).filter(pt => pt.life > 0));
      setTrail(p => p.map(t => ({ ...t, life: t.life - 1 })).filter(t => t.life > 0));

      loopRef.current = requestAnimationFrame(loop);
    };

    loopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(loopRef.current);
  }, [state, lvl, keys, mask, tiles, player, respawn, checkpoint, coyote, jumpBuf, slow, moving, grow, dash, active, masks, addCombo, unlock, boss, bossDown, challenge, dblJump, jumped2, portals, portalCd, water, wind]);

  useEffect(() => { if (showHint && state === 'playing') { const t = setTimeout(() => setShowHint(false), 6000); return () => clearTimeout(t); } }, [showHint, lvl, state]);
  useEffect(() => { setFade(true); const t = setTimeout(() => setFade(false), 500); return () => clearTimeout(t); }, [state, lvl]);

  const L = LEVELS[lvl];
  const M = MASKS[mask];

  // ============== RENDERS ==============
  if (state === 'intro') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className={`text-center transition-opacity duration-1000 ${fade ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-2xl font-light tracking-wide mb-8 max-w-lg" style={{ fontFamily: 'Georgia, serif' }}>{STORY.intro[introIdx]}</p>
        <div className="flex justify-center gap-2 mb-8">{STORY.intro.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-all ${i <= introIdx ? 'bg-purple-400 scale-125' : 'bg-gray-600'}`} />)}</div>
        <p className="text-gray-500 text-sm animate-pulse">ESPACIO para continuar</p>
      </div>
    </div>
  );

  if (state === 'menu') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 text-white p-4 overflow-hidden">
      <div className={`text-center transition-all duration-700 ${fade ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Object.entries(MASKS).filter(([k]) => k !== 'none').map(([key, m], i) => (
            <div key={key} className="absolute text-5xl opacity-10" style={{ left: `${10 + i * 12}%`, top: `${15 + (i % 3) * 30}%`, animation: `float ${4 + i * 0.5}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}>{m.icon}</div>
          ))}
        </div>
        <h1 className="text-6xl font-bold mb-2"><span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">MASK SHIFT</span></h1>
        <p className="text-lg text-gray-400 mb-4 tracking-widest">ULTIMATE EDITION</p>
        <div className="flex gap-4 justify-center mb-6 text-sm flex-wrap">
          <div className="text-yellow-400">🏆 {achs.length}/{Object.keys(ACHIEVEMENTS).length}</div>
          <div className="text-cyan-400">✦ {orbCount}</div>
          {done && <div className="text-green-400">✓ Completado</div>}
          {trueEnd && <div className="text-pink-400">🌌 Final Verdadero</div>}
        </div>
        <div className="flex flex-wrap gap-3 justify-center mb-6 max-w-xl">
          {Object.entries(MASKS).filter(([k]) => k !== 'none').map(([key, m]) => (
            <div key={key} className="text-center group">
              <div className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-lg shadow-lg transition-all group-hover:scale-110"
                style={{ backgroundColor: masks.includes(key) ? m.color : '#374151', boxShadow: masks.includes(key) ? `0 0 15px ${m.glow}` : 'none', opacity: masks.includes(key) ? 1 : 0.4 }}>
                {masks.includes(key) ? m.icon : '?'}
              </div>
              <p className="text-xs text-gray-500">{m.name}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3 mb-6">
          <button onClick={() => start(false)} className="block w-64 mx-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-xl text-xl font-bold hover:scale-105 transition-all shadow-xl">🎮 JUGAR</button>
          {done && <button onClick={() => start(true)} className="block w-64 mx-auto px-8 py-3 bg-gradient-to-r from-red-700 to-orange-600 rounded-xl text-lg font-bold hover:scale-105 transition-all">💀 MODO DESAFÍO</button>}
          <button onClick={() => setState('achievements')} className="block w-64 mx-auto px-8 py-3 bg-gray-800 rounded-xl text-lg hover:bg-gray-700 transition-all">🏆 Logros ({achs.length}/{Object.keys(ACHIEVEMENTS).length})</button>
        </div>
        <div className="text-gray-500 text-sm space-y-1">
          <p>← → mover • ↑/ESPACIO saltar • SHIFT dash</p>
          <p>1-8 máscaras • E habilidad especial</p>
        </div>
      </div>
      <style>{`@keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(10deg); } }`}</style>
    </div>
  );

  if (state === 'achievements') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <h2 className="text-4xl font-bold mb-6 text-yellow-400">🏆 Logros</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mb-8">
        {Object.entries(ACHIEVEMENTS).map(([id, a]) => {
          const u = achs.includes(id);
          return <div key={id} className={`p-3 rounded-xl border-2 ${u ? 'bg-yellow-900/30 border-yellow-500' : 'bg-gray-800/50 border-gray-700 opacity-50'}`}>
            <div className="text-2xl mb-1">{u ? a.icon : '🔒'}</div>
            <div className="font-bold text-sm">{a.name}</div>
            <div className="text-xs text-gray-400">{a.desc}</div>
          </div>;
        })}
      </div>
      <button onClick={() => setState('menu')} className="px-8 py-3 bg-purple-600 rounded-xl hover:bg-purple-500 transition">Volver</button>
    </div>
  );

  if (state === 'win') {
    const end = trueEnd ? STORY.true_ending : STORY.ending;
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen text-white p-4 ${trueEnd ? 'bg-gradient-to-b from-black via-purple-900 to-black' : 'bg-gradient-to-b from-yellow-900 via-orange-900 to-purple-900'}`}>
        <div className={`text-center transition-opacity duration-1000 ${fade ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex justify-center gap-2 mb-6">
            {Object.entries(MASKS).filter(([k]) => k !== 'none').map(([key, m]) => <div key={key} className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: m.color, boxShadow: `0 0 12px ${m.glow}` }}>{m.icon}</div>)}
          </div>
          <p className="text-xl font-light mb-6 max-w-lg" style={{ fontFamily: 'Georgia, serif' }}>{end[introIdx]}</p>
          {introIdx === end.length - 1 && (
            <div className="space-y-3 mb-6 bg-black/30 p-5 rounded-xl">
              <p className="text-yellow-400 text-xl font-bold">✨ ESTADÍSTICAS</p>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div><div className="text-gray-400">Orbes</div><div className="text-yellow-300 text-lg">{orbCount}</div></div>
                <div><div className="text-gray-400">Muertes</div><div className="text-red-400 text-lg">{deaths}</div></div>
                <div><div className="text-gray-400">Tiempo</div><div className="text-blue-300 text-lg">{Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}</div></div>
                <div><div className="text-gray-400">Puntuación</div><div className="text-purple-300 text-lg">{score.toLocaleString()}</div></div>
              </div>
              {challenge && <div className="mt-3 text-red-400 font-bold">🔥 MODO DESAFÍO COMPLETADO 🔥</div>}
              {trueEnd && <div className="mt-3 text-pink-400 font-bold animate-pulse">🌌 FINAL VERDADERO DESBLOQUEADO 🌌</div>}
            </div>
          )}
          <p className="text-gray-500 text-sm animate-pulse">ESPACIO para continuar</p>
        </div>
      </div>
    );
  }

  if (state === 'pause') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black/90 text-white p-4">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-2">PAUSA</h2>
        {challenge && <p className="text-red-400 mb-4">💀 Modo Desafío</p>}
        <div className="mb-6 bg-gray-800/50 p-4 rounded-xl">
          <div className="text-sm text-gray-400 mb-2">Nivel {lvl + 1}: {L?.name}</div>
          <div className="flex gap-4 justify-center text-sm">
            <span className="text-yellow-400">✦ {lvlOrbs}/{totalOrbs}</span>
            <span className={lvlTime > L?.parTime ? 'text-red-400' : 'text-blue-300'}>⏱ {lvlTime}s/{L?.parTime}s</span>
            <span className="text-red-400">☠ {lvlDeaths}</span>
          </div>
        </div>
        <div className="space-y-3">
          <button onClick={() => setState('playing')} className="block w-48 mx-auto px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition">Continuar</button>
          <button onClick={() => { load(lvl); setState('playing'); }} className="block w-48 mx-auto px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition">Reiniciar</button>
          <button onClick={() => setState('menu')} className="block w-48 mx-auto px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">Menú</button>
        </div>
        <p className="mt-6 text-gray-500 text-sm">ESC para continuar</p>
      </div>
    </div>
  );

  if (state === 'dialogue') return (
    <div className="flex flex-col items-center justify-end min-h-screen p-4 pb-16" style={{ background: L?.bg || '#1a1a2e' }}>
      <div className={`bg-black/80 rounded-xl px-6 py-5 max-w-lg text-center transition-all duration-500 backdrop-blur ${fade ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-purple-400 text-sm tracking-widest">{L?.name}</span>
          {L?.secret && <span className="text-pink-400 text-xs">🌌 SECRETO</span>}
          {challenge && <span className="text-red-400 text-xs">💀</span>}
        </div>
        <p className="text-gray-400 text-xs mb-2">{L?.sub}</p>
        <p className="text-white text-lg mb-4" style={{ fontFamily: 'Georgia, serif' }}>{L?.dialogue[dialogIdx]}</p>
        <p className="text-gray-500 text-sm animate-pulse">ESPACIO para continuar</p>
      </div>
    </div>
  );

  // ============== GAME RENDER ==============
  if (!L) return null;
  const hasLight = MASKS[mask].abilities.includes('light');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-2">
      {newAch && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-600 to-yellow-500 px-5 py-2 rounded-xl shadow-2xl animate-bounce">
          <div className="flex items-center gap-2"><span className="text-2xl">{newAch.icon}</span><div><div className="font-bold text-black text-sm">¡LOGRO!</div><div className="text-xs text-yellow-900">{newAch.name}</div></div></div>
        </div>
      )}

      <div className="w-full max-w-4xl mb-2">
        <div className="flex justify-between items-center text-white mb-1 px-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs">Nivel {lvl + 1}</span>
            <span className="font-bold text-purple-400">{L.name}</span>
            {L.secret && <span className="text-pink-400">🌌</span>}
            <span className="text-yellow-400">✦ {lvlOrbs}/{totalOrbs}</span>
          </div>
          <div className="flex items-center gap-3">
            {combo.c > 0 && <div className={`text-orange-400 font-bold ${combo.m >= 5 ? 'animate-pulse' : ''}`}>x{combo.m}</div>}
            <span className="text-purple-300">{score.toLocaleString()}</span>
            <span className={lvlTime > L.parTime ? 'text-red-400' : 'text-blue-300'}>⏱{lvlTime}s</span>
            {slow && <span className="text-purple-400 animate-pulse">⏳</span>}
            {inWater && <span className="text-cyan-400">💧</span>}
            <span className="text-gray-500">☠{deaths}</span>
          </div>
        </div>
        <div className="flex gap-1 mb-1 flex-wrap items-center">
          {masks.map((mt, i) => (
            <button key={i} onClick={() => { setMask(mt); audio.play('mask'); }}
              className={`px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${mask === mt ? 'ring-2 ring-white scale-105' : 'opacity-50 hover:opacity-80'}`}
              style={{ backgroundColor: MASKS[mt].color, boxShadow: mask === mt ? `0 0 12px ${MASKS[mt].glow}` : 'none' }}>
              <span className="text-[10px]">{i + 1}</span><span>{MASKS[mt].icon}</span>
            </button>
          ))}
          <div className="ml-3 flex items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${dash.cd > 0 ? 'bg-gray-700' : 'bg-cyan-700'}`}>💨</div>
          </div>
          {Object.entries(active).map(([t, d]) => d > 0 && POWERUPS[t] && (
            <div key={t} className="ml-1 px-2 py-0.5 rounded text-xs flex items-center gap-1" style={{ backgroundColor: POWERUPS[t].color + '40', color: POWERUPS[t].color }}>
              {POWERUPS[t].icon}<span>{Math.ceil(d / 60)}s</span>
            </div>
          ))}
        </div>
        <div className="px-2 py-0.5 rounded text-xs inline-flex items-center gap-1" style={{ backgroundColor: M.color + '30', color: M.color }}>
          <span>{M.icon}</span><span>{M.name}</span><span className="opacity-70">- {M.desc}</span>
        </div>
      </div>

      {showHint && <div className="text-center text-gray-400 text-xs mb-1 animate-pulse">💡 {L.hint}</div>}

      <div className="relative overflow-hidden rounded-xl shadow-2xl border-2 border-gray-700" style={{ width: W, height: H, background: L.bg || '#1a1a2e' }}>
        {flash && <div className="absolute inset-0 z-50 pointer-events-none" style={{ backgroundColor: flash, opacity: 0.3 }} />}

        <div className="absolute" style={{ transform: `translate(${-cam.x + shake.x * (Math.random() - 0.5)}px, ${-cam.y + shake.y * (Math.random() - 0.5)}px)`, width: L.w * T, height: L.h * T }}>
          
          {/* Water */}
          {water.map((z, i) => <div key={`w${i}`} className="absolute pointer-events-none" style={{ left: z.x * T, top: z.y * T, width: z.w * T, height: z.h * T, background: 'linear-gradient(180deg, rgba(52,152,219,0.3) 0%, rgba(41,128,185,0.5) 100%)' }} />)}
          
          {/* Wind */}
          {wind.map((z, i) => <div key={`wi${i}`} className="absolute pointer-events-none" style={{ left: z.x * T, top: z.y * T, width: z.w * T, height: z.h * T, background: 'rgba(255,255,255,0.05)' }} />)}
          
          {/* Dark */}
          {L.dark?.map((z, i) => <div key={`d${i}`} className="absolute pointer-events-none" style={{ left: z.x * T, top: z.y * T, width: z.w * T, height: z.h * T, background: hasLight ? `radial-gradient(circle at ${player.x - z.x * T}px ${player.y - z.y * T}px, transparent 60px, rgba(0,0,0,0.95) 120px)` : 'rgba(0,0,0,0.95)' }} />)}

          {/* Tiles */}
          {tiles.map((t, i) => {
            const colors = { s: '#374151', g: '#7FDBDA', i: '#87CEEB', w: '#2C2C54', c: '#9B59B6', cl: '#ffffff', v: '#1a0a2e' };
            const phase = MASKS[mask].abilities.includes('phase');
            return <div key={`t${i}`} className="absolute" style={{ left: t.x * T, top: t.y * T, width: T, height: T, backgroundColor: colors[t.t] || '#374151', opacity: t.t === 'g' && phase ? 0.3 : t.t === 'cl' ? 0.8 : 1, borderRadius: t.t === 'cl' ? '20px' : '2px', boxShadow: t.t === 'g' ? '0 0 8px #7FDBDA50' : t.t === 'i' ? '0 0 6px #87CEEB50' : t.t === 'c' ? '0 0 15px rgba(155,89,182,0.5)' : 'inset 0 1px 2px rgba(255,255,255,0.1)' }} />;
          })}

          {/* Grown */}
          {grow.map((g, i) => g.on && Array(Math.ceil(g.h) + 1).fill(0).map((_, h) => <div key={`gr${i}${h}`} className="absolute rounded-sm" style={{ left: g.x * T, top: (g.y - h) * T, width: T, height: T, backgroundColor: '#2ECC71', boxShadow: '0 0 8px #2ECC7150' }} />))}

          {/* Moving */}
          {moving.map((p, i) => <div key={`m${i}`} className="absolute rounded" style={{ left: (p.cx || p.x) * T, top: p.y * T, width: T * 2, height: T, background: 'linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)', boxShadow: '0 3px 12px rgba(99, 102, 241, 0.4)' }} />)}

          {/* Portals */}
          {portals.map((p, i) => <div key={`p${i}`} className="absolute flex items-center justify-center" style={{ left: p.x * T, top: p.y * T, width: T, height: T }}><div className="w-7 h-7 rounded-full animate-spin" style={{ background: `conic-gradient(${p.color}, transparent, ${p.color})`, boxShadow: `0 0 20px ${p.color}` }} /></div>)}

          {/* Hazards */}
          {L.hazards?.map((h, i) => <div key={`h${i}`} className="absolute flex items-end justify-center" style={{ left: h.x * T, top: h.y * T, width: T, height: T }}><div className="text-xl">⚠️</div></div>)}

          {/* Checkpoints */}
          {L.checkpoints?.map((cp, i) => <div key={`cp${i}`} className="absolute" style={{ left: cp.x * T, top: cp.y * T, width: T, height: T }}><div className={`w-full h-full rounded flex items-center justify-center text-base transition-all ${checkpoint?.x === cp.x ? 'scale-110' : 'opacity-50'}`} style={{ backgroundColor: checkpoint?.x === cp.x ? '#10B981' : '#374151', boxShadow: checkpoint?.x === cp.x ? '0 0 12px #10B98180' : 'none' }}>🚩</div></div>)}

          {/* Orbs */}
          {orbs.map((o, i) => <div key={`o${i}`} className="absolute" style={{ left: o.x * T + 6, top: o.y * T + 6, width: T - 12, height: T - 12, animation: 'float 2s ease-in-out infinite' }}><div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, #FFD700, #FFA500)', boxShadow: '0 0 12px rgba(255,215,0,0.6)' }} /></div>)}

          {/* Secrets */}
          {secrets.map((s, i) => <div key={`s${i}`} className="absolute" style={{ left: s.x * T, top: s.y * T, width: T, height: T, animation: 'pulse 2s ease-in-out infinite' }}><div className="w-full h-full rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: '#E040FB30', boxShadow: '0 0 15px #E040FB40' }}>{s.true_ending ? '🌌' : '🔮'}</div></div>)}

          {/* Powerups */}
          {powerups.map((p, i) => POWERUPS[p.type] && <div key={`pw${i}`} className="absolute" style={{ left: p.x * T, top: p.y * T, width: T, height: T, animation: 'float 1.5s ease-in-out infinite' }}><div className="w-full h-full rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: POWERUPS[p.type].color + '40', boxShadow: `0 0 12px ${POWERUPS[p.type].color}60` }}>{POWERUPS[p.type].icon}</div></div>)}

          {/* Masks */}
          {maskItems.map((m, i) => <div key={`ma${i}`} className="absolute" style={{ left: m.x * T, top: m.y * T, width: T, height: T, animation: 'float 2s ease-in-out infinite' }}><div className="w-full h-full rounded-full flex items-center justify-center text-lg shadow-lg" style={{ backgroundColor: MASKS[m.type].color, boxShadow: `0 0 20px ${MASKS[m.type].glow}` }}>{MASKS[m.type].icon}</div></div>)}

          {/* Boss */}
          {boss && !bossDown && <div className="absolute transition-all duration-100" style={{ left: boss.cx * T, top: boss.y * T, width: boss.void ? T * 3 : T * 2, height: boss.void ? T * 3 : T * 2, opacity: boss.inv > 0 ? 0.5 : 1 }}>
            <div className="w-full h-full rounded-lg flex items-center justify-center relative" style={{ background: boss.void ? 'linear-gradient(180deg, #4a0080 0%, #1a0030 100%)' : 'linear-gradient(180deg, #8B0000 0%, #4a0000 100%)', boxShadow: boss.void ? '0 0 40px rgba(139,0,255,0.8)' : '0 0 25px rgba(139,0,0,0.8)', animation: 'pulse 1s ease-in-out infinite' }}>
              <span className="text-4xl">{boss.void ? '👁️' : '👹'}</span>
              <div className="absolute -top-3 left-0 right-0 h-2 bg-gray-800 rounded-full overflow-hidden"><div className="h-full transition-all" style={{ width: `${(boss.hp / (boss.void ? 10 : 6)) * 100}%`, backgroundColor: boss.void ? '#8B00FF' : '#FF0000' }} /></div>
            </div>
          </div>}

          {/* Enemies */}
          {enemies.map((e, i) => {
            const inv = MASKS[mask].abilities.includes('invisible');
            return <div key={`e${i}`} className="absolute transition-all duration-100" style={{ left: e.x * T, top: e.y * T, width: T, height: T, opacity: inv ? 0.4 : 1, transform: `scaleX(${e.dir})` }}>
              <div className="w-full h-full rounded flex items-center justify-center text-lg relative" style={{ backgroundColor: e.type === 'sentry' ? '#8B0000' : e.type === 'fast' ? '#FF4500' : e.type === 'fish' ? '#3498DB' : e.type === 'flyer' ? '#E74C3C' : e.type === 'void' ? '#4a0080' : '#B22222', boxShadow: e.alert > 50 ? '0 0 15px rgba(255,0,0,0.8)' : 'none' }}>
                {e.type === 'sentry' ? '👁️' : e.type === 'fish' ? '🐟' : e.type === 'flyer' ? '🦇' : e.type === 'void' ? '👤' : '💀'}
              </div>
            </div>;
          })}

          {/* Goal */}
          <div className="absolute" style={{ left: L.goal.x * T, top: L.goal.y * T, width: T, height: T }}>
            <div className="w-full h-full rounded-lg flex items-center justify-center text-xl" style={{ background: (L.boss && !bossDown) ? 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%)' : L.secret ? 'linear-gradient(180deg, #8B00FF 0%, #4a0080 100%)' : 'linear-gradient(180deg, #FFD700 0%, #FF8C00 100%)', boxShadow: (L.boss && !bossDown) ? '0 0 8px rgba(100,100,100,0.3)' : L.secret ? '0 0 25px rgba(139,0,255,0.6)' : '0 0 25px rgba(255,215,0,0.6)', animation: (L.boss && !bossDown) ? 'none' : 'pulse 1.5s ease-in-out infinite' }}>
              {(L.boss && !bossDown) ? '🔒' : L.secret ? '🌌' : '⭐'}
            </div>
          </div>

          {/* Trail */}
          {trail.map((t, i) => <div key={`tr${i}`} className="absolute rounded-full pointer-events-none" style={{ left: t.x - 3, top: t.y - 3, width: dash.on ? 10 : 6, height: dash.on ? 10 : 6, backgroundColor: dash.on ? '#00FFFF' : M.color, opacity: t.life / 30, boxShadow: dash.on ? '0 0 8px #00FFFF' : 'none' }} />)}

          {/* Player */}
          <div className="absolute transition-transform duration-50" style={{ left: player.x, top: player.y, width: T, height: T, transform: `scaleX(${player.face})` }}>
            <div className="w-full h-full rounded-lg flex items-center justify-center shadow-lg transition-all relative overflow-hidden" style={{ backgroundColor: dash.on ? '#00FFFF' : inWater ? '#3498DB' : M.color, opacity: MASKS[mask].abilities.includes('invisible') ? 0.4 : 1, boxShadow: dash.on ? '0 0 25px #00FFFF' : `0 0 12px ${M.glow}`, border: active.shield > 0 ? '2px solid #4FC3F7' : 'none' }}>
              <span className="text-base" style={{ transform: `scaleX(${player.face})` }}>{dash.on ? '💨' : inWater ? '🏊' : M.icon}</span>
              <div className="absolute inset-0 rounded-lg" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)' }} />
              {active.shield > 0 && <div className="absolute -inset-1 rounded-full border-2 animate-pulse" style={{ borderColor: '#4FC3F7', boxShadow: '0 0 12px #4FC3F750' }} />}
            </div>
          </div>

          {/* Particles */}
          {particles.map((p, i) => <div key={`pa${i}`} className="absolute rounded-full pointer-events-none" style={{ left: p.x - p.size / 2, top: p.y - p.size / 2, width: p.size, height: p.size, backgroundColor: p.color, opacity: p.life / 60, boxShadow: `0 0 ${p.size}px ${p.color}` }} />)}
        </div>

        {slow && <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle, transparent 40%, rgba(161,127,224,0.2) 100%)', mixBlendMode: 'overlay' }} />}
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5)' }} />
        {boss && !bossDown && <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-900/80 px-3 py-1 rounded-lg"><div className="text-red-300 text-xs font-bold animate-pulse">{boss.void ? '👁️ SEÑOR DEL VACÍO' : '⚔️ GUARDIÁN'} - ¡DASH PARA ATACAR!</div></div>}
      </div>

      <div className="mt-3 flex gap-2 md:hidden">
        <button onTouchStart={() => setKeys(k => ({ ...k, ArrowLeft: true }))} onTouchEnd={() => setKeys(k => ({ ...k, ArrowLeft: false }))} className="w-12 h-12 bg-gray-700/80 rounded-xl text-white text-xl active:bg-gray-600">←</button>
        <button onTouchStart={() => { setKeys(k => ({ ...k, ArrowUp: true })); setJumpBuf(8); }} onTouchEnd={() => setKeys(k => ({ ...k, ArrowUp: false }))} className="w-12 h-12 bg-purple-600/80 rounded-xl text-white text-xl active:bg-purple-500">↑</button>
        <button onTouchStart={() => setKeys(k => ({ ...k, ArrowRight: true }))} onTouchEnd={() => setKeys(k => ({ ...k, ArrowRight: false }))} className="w-12 h-12 bg-gray-700/80 rounded-xl text-white text-xl active:bg-gray-600">→</button>
        <button onTouchStart={() => { if (dash.cd <= 0) { const d = keys.ArrowRight ? 1 : keys.ArrowLeft ? -1 : player.face; setDash({ on: true, cd: DASH_CD, dir: d, t: DASH_DUR }); audio.play('dash'); } }} className={`w-12 h-12 rounded-xl text-white text-lg ${dash.cd > 0 ? 'bg-gray-600/50' : 'bg-cyan-600/80 active:bg-cyan-500'}`}>💨</button>
      </div>
      <div className="mt-2 flex gap-1 md:hidden flex-wrap justify-center">
        {masks.slice(0, 6).map((mt, i) => <button key={i} onClick={() => { setMask(mt); audio.play('mask'); }} className={`w-9 h-9 rounded-full text-sm ${mask === mt ? 'ring-2 ring-white scale-110' : 'opacity-60'}`} style={{ backgroundColor: MASKS[mt].color }}>{MASKS[mt].icon}</button>)}
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      `}</style>
    </div>
  );
}
