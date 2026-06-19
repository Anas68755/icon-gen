import {
  type GameState, type SlimeData, type FoodData, type PlortData, type Particle,
  type BiomeData, type Vec2, type InventorySlot,
  type DayNightCycle, type WeatherState, type RanchData,
  type SaveData, type GameStats,
  SLIME_CONFIG, FOOD_CONFIG, BIOME_CONFIG,
  type SlimeType, type FoodType, type BiomeType,
} from './types';
import { InputManager } from './InputManager';

const GAME_VERSION = '1.0';
const VACUUM_RANGE = 180;
const VACUUM_STRENGTH = 350;
const BLOWER_RANGE = 220;
const BLOWER_STRENGTH = 450;
const FEED_RANGE = 100;
const INTERACT_RANGE = 80;
const DASH_DURATION = 0.25;
const DASH_COOLDOWN = 1.0;
const PLORT_COOLDOWN_BASE = 8;
const HUNGER_DECAY = 2; // per minute
const DAY_DURATION = 20 * 60; // 20 minutes in seconds
const MAX_INVENTORY_SLOTS = 9;
const OBJECT_POOL_SIZE = 200;

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input: InputManager;
  state: GameState;
  lastTime: number = 0;
  accumulator: number = 0;
  fixedDelta: number = 1 / 60;
  running: boolean = false;
  animationId: number = 0;

  // Object pools
  particlePool: Particle[] = [];
  usedParticles: number = 0;

  // Background images
  bgImages: Map<string, HTMLImageElement> = new Map();
  goldenSlimeImg: HTMLImageElement | null = null;
  playerImg: HTMLImageElement | null = null;
  imagesLoaded: boolean = false;

  // Audio context
  audioCtx: AudioContext | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.input = new InputManager();

    // Initialize state
    this.state = this.createInitialState();

    // Initialize particle pool
    for (let i = 0; i < OBJECT_POOL_SIZE; i++) {
      this.particlePool.push({
        x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1,
        color: '#fff', size: 3, type: 'sparkle', gravity: 0,
      });
    }
  }

  async init() {
    this.input.init(this.canvas);
    await this.loadImages();
    this.loadGame();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    this.input.destroy();
    window.removeEventListener('resize', () => this.resize());
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
  }

  async loadImages() {
    const loadImg = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
        img.src = src;
      });
    };

    // Load biome backgrounds
    for (const [key, config] of Object.entries(BIOME_CONFIG)) {
      const img = await loadImg(config.bgImage);
      this.bgImages.set(key, img);
    }

    this.goldenSlimeImg = await loadImg('/assets/slimes/golden_slime.png');
    this.playerImg = await loadImg('/assets/ui/player_character.png');
    this.imagesLoaded = true;
  }

  createInitialState(): GameState {
    const ranchBiome = this.createBiomeData('ranch');

    const dayNight: DayNightCycle = {
      time: 0.25,
      day: 1,
      cycleDuration: DAY_DURATION,
      isDay: true,
      isDusk: false,
      isNight: false,
      skyColor: '#87CEEB',
      lightIntensity: 1,
    };

    const weather: WeatherState = {
      current: 'clear',
      transitionTimer: 0,
      windDirection: { x: 1, y: 0 },
      windStrength: 0,
      nextWeatherCheck: 60,
      rainIntensity: 0,
    };

    const player = {
      x: 1000, y: 1000,
      vx: 0, vy: 0,
      radius: 16,
      speed: 200,
      sprintSpeed: 300,
      dashSpeed: 500,
      dashCooldown: DASH_COOLDOWN,
      dashTimer: 0,
      vacuumActive: false,
      blowerActive: false,
      vacuumCharge: 100,
      vacuumOverheat: false,
      aimAngle: 0,
      aimX: 0,
      aimY: 0,
      inventory: [],
      selectedSlot: 0,
      newbucks: 500,
      isSprinting: false,
      isDashing: false,
      dashDirection: { x: 0, y: 0 },
      interactRange: INTERACT_RANGE,
    };

    const ranch: RanchData = {
      corrals: [
        { id: 1, x: 800, y: 800, width: 200, height: 200, slimes: [], upgrades: [], hasAutoFeeder: false, hasPlortCollector: false, hasHighWalls: false, hasAirNet: false, hasMusicBox: false },
        { id: 2, x: 1100, y: 800, width: 200, height: 200, slimes: [], upgrades: [], hasAutoFeeder: false, hasPlortCollector: false, hasHighWalls: false, hasAirNet: false, hasMusicBox: false },
        { id: 3, x: 800, y: 1100, width: 200, height: 200, slimes: [], upgrades: [], hasAutoFeeder: false, hasPlortCollector: false, hasHighWalls: false, hasAirNet: false, hasMusicBox: false },
        { id: 4, x: 1100, y: 1100, width: 200, height: 200, slimes: [], upgrades: [], hasAutoFeeder: false, hasPlortCollector: false, hasHighWalls: false, hasAirNet: false, hasMusicBox: false },
      ],
      gardens: [],
      upgrades: [],
      newbucks: 500,
    };

    const stats: GameStats = {
      totalPlortsSold: 0,
      totalNewbucksEarned: 0,
      totalSlimesFed: 0,
      largestRanch: 0,
      playTime: 0,
      goldenSlimesFound: 0,
    };

    return {
      screen: 'main_menu',
      previousScreen: 'main_menu',
      player,
      slimes: new Map(),
      foods: new Map(),
      plorts: new Map(),
      particles: [],
      currentBiome: ranchBiome,
      dayNight,
      weather,
      ranch,
      traders: [],
      camera: { x: 1000, y: 1000 },
      cameraZoom: 1,
      stats,
      unlockedBiomes: ['ranch'],
      discoveredSlimes: [],
      paused: false,
      showInventory: false,
      showMinimap: false,
      notifications: [],
      screenshake: { intensity: 0, duration: 0, timer: 0 },
      goldenSlimeEvent: { active: false, timer: 0, announcement: false },
    };
  }

  createBiomeData(type: BiomeType): BiomeData {
    const config = BIOME_CONFIG[type];
    const waterAreas: any[] = [];
    const obstacles: any[] = [];
    const spawnPoints: Vec2[] = [];

    // Generate water areas and obstacles based on biome
    if (type === 'ranch') {
      waterAreas.push({ x: 400, y: 600, width: 300, height: 200 });
    } else if (type === 'dry_reef') {
      waterAreas.push({ x: 200, y: 300, width: 400, height: 250 });
      obstacles.push({ x: 800, y: 500, width: 100, height: 150, type: 'rock' as const });
    } else if (type === 'moss_blanket') {
      obstacles.push({ x: 300, y: 200, width: 80, height: 200, type: 'tree' as const });
      obstacles.push({ x: 600, y: 400, width: 80, height: 200, type: 'tree' as const });
    } else if (type === 'indigo_quarry') {
      obstacles.push({ x: 500, y: 300, width: 120, height: 100, type: 'crystal' as const });
      waterAreas.push({ x: 200, y: 800, width: 300, height: 150 });
    } else if (type === 'ancient_ruins') {
      obstacles.push({ x: 400, y: 300, width: 200, height: 180, type: 'rock' as const });
    } else if (type === 'glass_desert') {
      obstacles.push({ x: 700, y: 400, width: 100, height: 200, type: 'crystal' as const });
    }

    // Generate spawn points
    for (let i = 0; i < 8; i++) {
      spawnPoints.push({
        x: 200 + Math.random() * (config.width - 400),
        y: 200 + Math.random() * (config.height - 400),
      });
    }

    return {
      type,
      name: config.name,
      width: config.width,
      height: config.height,
      bgImage: config.bgImage,
      unlockCost: config.unlockCost,
      slimeTypes: config.slimeTypes,
      foodTypes: config.foodTypes,
      waterAreas,
      obstacles,
      spawnPoints,
      slugSpawns: config.slimeTypes.map((st, i) => ({
        x: spawnPoints[i % spawnPoints.length].x,
        y: spawnPoints[i % spawnPoints.length].y,
        slimeType: st,
        interval: 15 + Math.random() * 30,
        timer: 5 + Math.random() * 10,
      })),
    };
  }

  // ===== GAME LOOP =====
  gameLoop = (timestamp: number) => {
    if (!this.running) return;

    const delta = Math.min((timestamp - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = timestamp;
    this.accumulator += delta;

    // Fixed timestep physics
    while (this.accumulator >= this.fixedDelta) {
      if (this.state.screen === 'playing' && !this.state.paused) {
        this.update(this.fixedDelta);
      }
      this.accumulator -= this.fixedDelta;
    }

    // Render every frame
    this.render(delta);
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  update(delta: number) {
    const s = this.state;
    s.stats.playTime += delta;

    // Update day/night cycle
    this.updateDayNight(delta);

    // Update weather
    this.updateWeather(delta);

    // Update player
    this.updatePlayer(delta);

    // Update camera
    this.updateCamera(delta);

    // Update slimes
    this.updateSlimes(delta);

    // Update foods
    this.updateFoods(delta);

    // Update plorts
    this.updatePlorts(delta);

    // Update vacuum/blower
    this.updateVacuumBlower(delta);

    // Update particles
    this.updateParticles(delta);

    // Spawn entities
    this.updateSpawning(delta);

    // Check golden slime event
    this.updateGoldenSlimeEvent(delta);

    // Update notifications
    this.updateNotifications(delta);

    // Update screenshake
    if (s.screenshake.timer > 0) {
      s.screenshake.timer -= delta;
    }

    // Auto-save every 2 minutes
    if (Math.floor(s.stats.playTime) % 120 === 0 && Math.floor(s.stats.playTime) > 0) {
      this.saveGame();
    }

    // Update input camera
    this.input.updateCamera(s.camera, s.cameraZoom);
  }

  // ===== PLAYER UPDATE =====
  updatePlayer(delta: number) {
    const p = this.state.player;
    const move = this.input.getMovementVector();

    // Sprint
    p.isSprinting = this.input.isKeyDown('shift') && !p.isDashing;
    const speed = p.isDashing ? p.dashSpeed : (p.isSprinting ? p.sprintSpeed : p.speed);

    // Dash
    if (p.dashTimer > 0) {
      p.dashTimer -= delta;
      if (p.dashTimer <= 0) {
        p.isDashing = false;
      }
    }

    if (this.input.isKeyPressed(' ') && p.dashCooldown <= 0 && !p.isDashing) {
      p.isDashing = true;
      p.dashTimer = DASH_DURATION;
      p.dashCooldown = DASH_COOLDOWN;
      p.dashDirection = { ...move };
      if (p.dashDirection.x === 0 && p.dashDirection.y === 0) {
        // Dash in aim direction
        p.dashDirection = { x: Math.cos(p.aimAngle), y: Math.sin(p.aimAngle) };
      }
      this.addScreenshake(3, 0.2);
    }

    if (p.dashCooldown > 0) {
      p.dashCooldown -= delta;
    }

    // Movement
    let ax = 0;
    let ay = 0;

    if (p.isDashing) {
      ax = p.dashDirection.x * p.dashSpeed * 5;
      ay = p.dashDirection.y * p.dashSpeed * 5;
    } else {
      ax = move.x * speed * 4;
      ay = move.y * speed * 4;
    }

    // Apply acceleration with friction
    p.vx += ax * delta;
    p.vy += ay * delta;
    const friction = p.isDashing ? 0.95 : 0.85;
    p.vx *= friction;
    p.vy *= friction;

    // Clamp velocity
    const maxVel = p.isDashing ? p.dashSpeed : (p.isSprinting ? p.sprintSpeed : p.speed);
    const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (vel > maxVel) {
      p.vx = (p.vx / vel) * maxVel;
      p.vy = (p.vy / vel) * maxVel;
    }

    // Update position
    p.x += p.vx * delta;
    p.y += p.vy * delta;

    // Clamp to biome bounds
    p.x = Math.max(p.radius, Math.min(this.state.currentBiome.width - p.radius, p.x));
    p.y = Math.max(p.radius, Math.min(this.state.currentBiome.height - p.radius, p.y));

    // Update aim angle
    p.aimAngle = this.input.getAimAngle(p.x, p.y);
    p.aimX = this.input.mouseWorldPos.x;
    p.aimY = this.input.mouseWorldPos.y;

    // Vacuum / Blower
    p.vacuumActive = this.input.mouseDown && !p.vacuumOverheat;
    p.blowerActive = this.input.rightMouseDown;

    // Vacuum charge
    if (p.vacuumActive || p.blowerActive) {
      p.vacuumCharge -= 20 * delta;
      if (p.vacuumCharge <= 0) {
        p.vacuumCharge = 0;
        p.vacuumOverheat = true;
      }
    } else {
      p.vacuumCharge = Math.min(100, p.vacuumCharge + 30 * delta);
      if (p.vacuumCharge > 30) {
        p.vacuumOverheat = false;
      }
    }

    // Quick inventory toggle
    if (this.input.isKeyPressed('q')) {
      this.state.showInventory = !this.state.showInventory;
    }

    // Minimap toggle
    if (this.input.isKeyPressed('m')) {
      this.state.showMinimap = !this.state.showMinimap;
    }

    // Pause
    if (this.input.isKeyPressed('escape')) {
      this.state.paused = !this.state.paused;
    }

    // Feed
    if (this.input.isKeyPressed('f')) {
      this.tryFeedSlime();
    }

    // Interact
    if (this.input.isKeyPressed('e')) {
      this.tryInteract();
    }

    // Number keys for inventory
    for (let i = 1; i <= 9; i++) {
      if (this.input.isKeyPressed(i.toString())) {
        p.selectedSlot = i - 1;
      }
    }
  }

  // ===== CAMERA =====
  updateCamera(delta: number) {
    const targetX = this.state.player.x;
    const targetY = this.state.player.y;
    const lerp = 5 * delta;
    this.state.camera.x += (targetX - this.state.camera.x) * lerp;
    this.state.camera.y += (targetY - this.state.camera.y) * lerp;
  }

  // ===== SLIME UPDATE =====
  updateSlimes(delta: number) {
    const s = this.state;
    const player = s.player;

    for (const [id, slime] of s.slimes) {
      // Hunger decay
      slime.hunger = Math.max(0, slime.hunger - HUNGER_DECAY * delta / 60);

      // Overfed timer
      if (slime.overfedTimer > 0) {
        slime.overfedTimer -= delta;
      }

      // Plort cooldown
      if (slime.plortCooldown > 0) {
        slime.plortCooldown -= delta;
      }

      // Wobble phase
      slime.wobblePhase += delta * 3;

      // Squash and stretch recovery
      slime.squashStretch += (1 - slime.squashStretch) * 5 * delta;

      // Sleeping at night
      slime.sleeping = s.dayNight.isNight && slime.type !== 'phosphor' && slime.type !== 'tarr';

      // Spawn timer (for golden slime)
      if (slime.type === 'golden') {
        slime.spawnTimer -= delta;
        if (slime.spawnTimer <= 0) {
          s.slimes.delete(id);
          s.goldenSlimeEvent.active = false;
          continue;
        }
        // Golden slime flees from player
        const dx = slime.x - player.x;
        const dy = slime.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 300 && dist > 0) {
          slime.vx += (dx / dist) * 400 * delta;
          slime.vy += (dy / dist) * 400 * delta;
        }
      }

      // Tarr behavior - chase slimes
      if (slime.type === 'tarr') {
        let nearestSlime: SlimeData | null = null;
        let nearestDist = Infinity;
        for (const [, other] of s.slimes) {
          if (other.type === 'tarr') continue;
          const ddx = other.x - slime.x;
          const ddy = other.y - slime.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < nearestDist && d < 400) {
            nearestDist = d;
            nearestSlime = other;
          }
        }
        if (nearestSlime) {
          const ddx = nearestSlime.x - slime.x;
          const ddy = nearestSlime.y - slime.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d > 0) {
            slime.vx += (ddx / d) * 200 * delta;
            slime.vy += (ddy / d) * 200 * delta;
          }
        }
      }

      // Bounce timer
      slime.bounceTimer -= delta;
      if (slime.bounceTimer <= 0 && !slime.sleeping) {
        slime.bounceTimer = slime.bounceInterval * (slime.overfedTimer > 0 ? 0.6 : 1);

        // Random movement direction
        if (slime.type !== 'golden' && slime.type !== 'tarr') {
          const angle = Math.random() * Math.PI * 2;
          const spd = slime.overfedTimer > 0 ? slime.speed * 1.5 : slime.speed;
          slime.vx += Math.cos(angle) * spd * 0.5;
          slime.vy += Math.sin(angle) * spd * 0.5;
        }

        // Squash on bounce
        slime.squashStretch = 0.7;
      }

      // Honey slime attracts nearby slimes
      if (slime.type === 'honey') {
        for (const [, other] of s.slimes) {
          if (other === slime) continue;
          const ddx = slime.x - other.x;
          const ddy = slime.y - other.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < 200 && d > 30) {
            other.vx += (ddx / d) * 30 * delta;
            other.vy += (ddy / d) * 30 * delta;
          }
        }
      }

      // Phosphor flies (less gravity)
      const gravity = slime.type === 'phosphor' ? 50 : 200;

      // Water slowdown
      let inWater = false;
      for (const water of s.currentBiome.waterAreas) {
        if (slime.x > water.x && slime.x < water.x + water.width &&
            slime.y > water.y && slime.y < water.y + water.height) {
          inWater = true;
          break;
        }
      }

      const waterMultiplier = inWater ? 0.3 : 1;
      const speedMultiplier = slime.sleeping ? 0.1 : (slime.overfedTimer > 0 ? 1.5 : 1);

      // Apply velocity
      slime.vy += gravity * delta;
      slime.vx *= (1 - 2 * delta) * waterMultiplier;
      slime.vy *= (1 - 2 * delta) * waterMultiplier;

      const maxSpeed = slime.speed * speedMultiplier;
      const currentSpeed = Math.sqrt(slime.vx * slime.vx + slime.vy * slime.vy);
      if (currentSpeed > maxSpeed) {
        slime.vx = (slime.vx / currentSpeed) * maxSpeed;
        slime.vy = (slime.vy / currentSpeed) * maxSpeed;
      }

      slime.x += slime.vx * delta;
      slime.y += slime.vy * delta;

      // Obstacle collision
      for (const obs of s.currentBiome.obstacles) {
        if (this.circleRectCollision(slime.x, slime.y, slime.radius, obs.x, obs.y, obs.width, obs.height)) {
          // Push out
          const cx = obs.x + obs.width / 2;
          const cy = obs.y + obs.height / 2;
          const dx = slime.x - cx;
          const dy = slime.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            slime.vx = (dx / dist) * Math.abs(slime.vx) * 0.8;
            slime.vy = (dy / dist) * Math.abs(slime.vy) * 0.8;
          }
        }
      }

      // Clamp to bounds
      slime.x = Math.max(slime.radius, Math.min(s.currentBiome.width - slime.radius, slime.x));
      slime.y = Math.max(slime.radius, Math.min(s.currentBiome.height - slime.radius, slime.y));

      // Produce plorts if fed and happy
      if (slime.hunger > 30 && slime.happiness > 40 && slime.plortCooldown <= 0 && slime.type !== 'tarr') {
        const happyBonus = slime.happiness > 70 ? 0.5 : 1;
        slime.plortCooldown = PLORT_COOLDOWN_BASE * happyBonus;

        // Create plort
        const plortId = `plort_${Date.now()}_${Math.random()}`;
        const config = SLIME_CONFIG[slime.type];
        s.plorts.set(plortId, {
          slimeType: slime.plortType,
          x: slime.x + (Math.random() - 0.5) * 30,
          y: slime.y + slime.radius + 5,
          vx: (Math.random() - 0.5) * 50,
          vy: -30 - Math.random() * 30,
          value: config.plortValue * (slime.happiness > 70 ? 1.5 : 1),
          color: config.color,
          radius: 6,
          sparkleTimer: 0,
        });

        // Happy particles
        if (slime.happiness > 70) {
          this.spawnParticles(slime.x, slime.y - 10, 'sparkle', 5, config.color);
        }
      }

      // Largo fusion check
      if (slime.fuseTimer > 0) {
        slime.fuseTimer -= delta;
      }

      // Happiness decay
      slime.happiness = Math.max(0, slime.happiness - 0.5 * delta);
    }

    // Largo fusion: check slime collisions
    this.checkLargoFusion();

    // Tarr slime eating other slimes
    this.checkTarrEating(delta);
  }

  checkLargoFusion() {
    const s = this.state;
    const slimes = Array.from(s.slimes.values());

    for (let i = 0; i < slimes.length; i++) {
      for (let j = i + 1; j < slimes.length; j++) {
        const a = slimes[i];
        const b = slimes[j];

        if (a.type === b.type) continue;
        if (a.isLargo || b.isLargo) continue;
        if (a.type === 'tarr' || b.type === 'tarr') continue;
        if (a.type === 'golden' || b.type === 'golden') continue;

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < a.radius + b.radius && a.fuseTimer > 0 && b.fuseTimer > 0) {
          // Fuse!
          const idA = Array.from(s.slimes.entries()).find(([, v]) => v === a)?.[0];
          const idB = Array.from(s.slimes.entries()).find(([, v]) => v === b)?.[0];
          if (!idA || !idB) continue;

          s.slimes.delete(idA);
          s.slimes.delete(idB);

          const fusedType = a.type < b.type ? a.type : b.type;
          const largoId = `slime_${Date.now()}_${Math.random()}`;
          const fusedSlime = this.createSlime('pink', (a.x + b.x) / 2, (a.y + b.y) / 2);
          fusedSlime.isLargo = true;
          fusedSlime.type = fusedType;
          fusedSlime.parentTypes = [a.type, b.type];
          fusedSlime.radius = 30;
          fusedSlime.hunger = Math.max(a.hunger, b.hunger);
          fusedSlime.happiness = Math.max(a.happiness, b.happiness);
          fusedSlime.plortValue = a.plortValue + b.plortValue;
          fusedSlime.speed = (a.speed + b.speed) / 2;

          s.slimes.set(largoId, fusedSlime);

          // Fusion effect
          this.spawnParticles(fusedSlime.x, fusedSlime.y, 'sparkle', 15, '#FFD700');
          this.addNotification('Largo Fusion!', '#FFD700');
        }
      }
    }
  }

  checkTarrEating(_delta: number) {
    const s = this.state;
    for (const [tarrId, tarr] of s.slimes) {
      if (tarr.type !== 'tarr') continue;

      for (const [slimeId, slime] of s.slimes) {
        if (slime.type === 'tarr') continue;

        const dx = tarr.x - slime.x;
        const dy = tarr.y - slime.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < tarr.radius + slime.radius) {
          // Tarr eats slime!
          s.slimes.delete(slimeId);

          // Spawn new tarr
          const newTarrId = `slime_${Date.now()}_${Math.random()}`;
          const newTarr = this.createSlime('tarr', slime.x, slime.y);
          s.slimes.set(newTarrId, newTarr);

          this.spawnParticles(slime.x, slime.y, 'smoke', 8, '#2D004D');
        }
      }

      // Tarr dies in water or after 2 minutes
      for (const water of s.currentBiome.waterAreas) {
        if (tarr.x > water.x && tarr.x < water.x + water.width &&
            tarr.y > water.y && tarr.y < water.y + water.height) {
          s.slimes.delete(tarrId);
          this.spawnParticles(tarr.x, tarr.y, 'smoke', 10, '#4444FF');
          break;
        }
      }
    }
  }

  // ===== FOOD UPDATE =====
  updateFoods(delta: number) {
    const s = this.state;
    const rainMultiplier = s.weather.current === 'rain' ? 2 : 1;

    for (const [, food] of s.foods) {
      // Growth
      if (food.planted && !food.mature) {
        food.growthTimer += delta * rainMultiplier;
        food.growthStage = Math.min(1, food.growthTimer / food.maxGrowthTime);
        if (food.growthStage >= 1) {
          food.mature = true;
        }
      }

      // Physics
      food.vy += 200 * delta;
      food.vx *= 0.95;
      food.vy *= 0.95;

      food.x += food.vx * delta;
      food.y += food.vy * delta;

      // Clamp to bounds
      food.x = Math.max(food.radius, Math.min(s.currentBiome.width - food.radius, food.x));
      food.y = Math.max(food.radius, Math.min(s.currentBiome.height - food.radius, food.y));
    }
  }

  // ===== PLORT UPDATE =====
  updatePlorts(delta: number) {
    for (const [, plort] of this.state.plorts) {
      plort.vy += 300 * delta;
      plort.vx *= 0.9;
      plort.vy *= 0.9;

      plort.x += plort.vx * delta;
      plort.y += plort.vy * delta;

      plort.sparkleTimer += delta;

      // Clamp
      plort.x = Math.max(plort.radius, Math.min(this.state.currentBiome.width - plort.radius, plort.x));
      plort.y = Math.max(plort.radius, Math.min(this.state.currentBiome.height - plort.radius, plort.y));
    }
  }

  // ===== VACUUM & BLOWER =====
  updateVacuumBlower(delta: number) {
    const p = this.state.player;
    if (!p.vacuumActive && !p.blowerActive) return;

    const isVacuum = p.vacuumActive;
    const range = isVacuum ? VACUUM_RANGE : BLOWER_RANGE;
    const strength = isVacuum ? VACUUM_STRENGTH : BLOWER_STRENGTH;

    // Vacuum/blower slimes
    for (const [id, slime] of this.state.slimes) {
      if (slime.type === 'golden') continue; // Golden immune

      const dx = slime.x - p.x;
      const dy = slime.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < range && dist > 10) {
        const angle = Math.atan2(dy, dx);
        const aimAngle = p.aimAngle;
        const angleDiff = Math.abs(this.angleDifference(angle, aimAngle));

        if (angleDiff < Math.PI / 3) { // 60 degree cone
          const force = strength * (1 - dist / range);

          if (isVacuum) {
            // Pull toward player
            slime.vx -= Math.cos(angle) * force * delta;
            slime.vy -= Math.sin(angle) * force * delta;

            // Check if close enough to collect
            if (dist < 30 && !slime.isLargo) {
              // Collect slime
              if (this.addToInventory('slime', slime.type, 1, slime.color)) {
                this.state.slimes.delete(id);
                this.spawnParticles(slime.x, slime.y, 'sparkle', 5, slime.color);
              }
            } else if (dist < 30 && slime.isLargo) {
              // Largo takes longer to collect
              if (Math.random() < delta * 0.5) {
                if (this.addToInventory('slime', slime.type, 1, slime.color)) {
                  this.state.slimes.delete(id);
                  this.spawnParticles(slime.x, slime.y, 'sparkle', 8, slime.color);
                }
              }
            }
          } else {
            // Push away
            slime.vx += Math.cos(aimAngle) * force * delta;
            slime.vy += Math.sin(aimAngle) * force * delta;
            slime.squashStretch = 0.6;

            // Boom slime might explode
            if (slime.type === 'boom' && force > 200) {
              if (Math.random() < delta * 0.3) {
                this.explodeBoomSlime(slime);
              }
            }
          }
        }
      }
    }

    // Vacuum/blower food
    for (const [id, food] of this.state.foods) {
      const dx = food.x - p.x;
      const dy = food.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < range && dist > 10) {
        const angle = Math.atan2(dy, dx);
        const aimAngle = p.aimAngle;
        const angleDiff = Math.abs(this.angleDifference(angle, aimAngle));

        if (angleDiff < Math.PI / 3) {
          const force = strength * (1 - dist / range);

          if (isVacuum) {
            food.vx -= Math.cos(angle) * force * delta;
            food.vy -= Math.sin(angle) * force * delta;

            if (dist < 25) {
              if (this.addToInventory('food', food.type, 1, food.color)) {
                this.state.foods.delete(id);
                this.spawnParticles(food.x, food.y, 'sparkle', 3, food.color);
              }
            }
          } else {
            food.vx += Math.cos(aimAngle) * force * delta;
            food.vy += Math.sin(aimAngle) * force * delta;
          }
        }
      }
    }

    // Vacuum plorts
    for (const [plortId, plort] of this.state.plorts) {
      const dx = plort.x - p.x;
      const dy = plort.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < range && dist > 10 && isVacuum) {
        const angle = Math.atan2(dy, dx);
        const aimAngle = p.aimAngle;
        const angleDiff = Math.abs(this.angleDifference(angle, aimAngle));

        if (angleDiff < Math.PI / 3) {
          const force = strength * (1 - dist / range);
          plort.vx -= Math.cos(angle) * force * delta;
          plort.vy -= Math.sin(angle) * force * delta;

          if (dist < 20) {
            if (this.addToInventory('plort', plort.slimeType, 1, plort.color)) {
              this.state.plorts.delete(plortId);
            }
          }
        }
      }
    }
  }

  explodeBoomSlime(slime: SlimeData) {
    // Push all nearby entities
    for (const [, s] of this.state.slimes) {
      const dx = s.x - slime.x;
      const dy = s.y - slime.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150 && dist > 0) {
        s.vx += (dx / dist) * 400;
        s.vy += (dy / dist) * 400;
      }
    }
    // Push player
    const pdx = this.state.player.x - slime.x;
    const pdy = this.state.player.y - slime.y;
    const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
    if (pdist < 150 && pdist > 0) {
      this.state.player.vx += (pdx / pdist) * 500;
      this.state.player.vy += (pdy / pdist) * 500;
    }

    this.addScreenshake(8, 0.3);
    this.spawnParticles(slime.x, slime.y, 'smoke', 15, '#FF4500');

    // Find and remove this slime
    for (const [id, s] of this.state.slimes) {
      if (s === slime) {
        this.state.slimes.delete(id);
        break;
      }
    }
  }

  // ===== SPAWNING =====
  updateSpawning(delta: number) {
    const s = this.state;
    const biome = s.currentBiome;

    // Spawn slimes
    for (const spawn of biome.slugSpawns) {
      spawn.timer -= delta;
      if (spawn.timer <= 0) {
        spawn.timer = spawn.interval + Math.random() * 15;

        // Check slime cap per biome
        if (s.slimes.size >= 30) continue;

        // Check if it's night and trying to spawn non-phosphor
        if (s.dayNight.isNight && spawn.slimeType !== 'phosphor' && spawn.slimeType !== 'pink') continue;

        const x = spawn.x + (Math.random() - 0.5) * 200;
        const y = spawn.y + (Math.random() - 0.5) * 200;
        const id = `slime_${Date.now()}_${Math.random()}`;
        s.slimes.set(id, this.createSlime(spawn.slimeType, x, y));
      }
    }

    // Spawn food
    if (s.foods.size < 20) {
      for (const foodType of biome.foodTypes) {
        if (Math.random() < delta * 0.3) {
          const x = 100 + Math.random() * (biome.width - 200);
          const y = 100 + Math.random() * (biome.height - 200);
          const id = `food_${Date.now()}_${Math.random()}`;
          s.foods.set(id, this.createFood(foodType, x, y));
        }
      }
    }
  }

  // ===== GOLDEN SLIME EVENT =====
  updateGoldenSlimeEvent(delta: number) {
    const s = this.state;

    if (!s.goldenSlimeEvent.active) {
      // 1% chance per minute = small chance per frame
      if (Math.random() < delta * 0.00015) {
        this.triggerGoldenSlimeEvent();
      }
      return;
    }

    s.goldenSlimeEvent.timer -= delta;

    if (s.goldenSlimeEvent.timer <= 0) {
      s.goldenSlimeEvent.active = false;
      // Remove any remaining golden slimes
      for (const [id, slime] of s.slimes) {
        if (slime.type === 'golden') {
          s.slimes.delete(id);
        }
      }
    }
  }

  triggerGoldenSlimeEvent() {
    const s = this.state;
    s.goldenSlimeEvent.active = true;
    s.goldenSlimeEvent.timer = 30;
    s.goldenSlimeEvent.announcement = true;

    // Spawn golden slime
    const spawnPoint = s.currentBiome.spawnPoints[Math.floor(Math.random() * s.currentBiome.spawnPoints.length)];
    const id = `slime_${Date.now()}_golden`;
    const slime = this.createSlime('golden', spawnPoint.x, spawnPoint.y);
    slime.spawnTimer = 30;
    s.slimes.set(id, slime);

    this.addNotification('A GOLDEN SLIME has appeared!', '#FFD700');
    this.spawnParticles(spawnPoint.x, spawnPoint.y, 'star', 20, '#FFD700');

    setTimeout(() => {
      s.goldenSlimeEvent.announcement = false;
    }, 5000);
  }

  // ===== DAY/NIGHT CYCLE =====
  updateDayNight(delta: number) {
    const cycle = this.state.dayNight;
    cycle.time += delta / cycle.cycleDuration;

    if (cycle.time >= 1) {
      cycle.time -= 1;
      cycle.day++;
    }

    // Calculate lighting
    const t = cycle.time;
    cycle.isDay = t >= 0.2 && t < 0.7;
    cycle.isDusk = t >= 0.7 && t < 0.85;
    cycle.isNight = t >= 0.85 || t < 0.2;

    // Sky color
    if (cycle.isDay) {
      cycle.skyColor = '#87CEEB';
      cycle.lightIntensity = 1;
    } else if (cycle.isDusk) {
      cycle.skyColor = '#FF8C42';
      cycle.lightIntensity = 0.6;
    } else {
      cycle.skyColor = '#1a1a2e';
      cycle.lightIntensity = 0.3;
    }
  }

  // ===== WEATHER =====
  updateWeather(delta: number) {
    const w = this.state.weather;
    w.nextWeatherCheck -= delta;

    if (w.nextWeatherCheck <= 0) {
      w.nextWeatherCheck = 120; // Check every 2 minutes

      const rand = Math.random();
      if (rand < 0.6) {
        w.current = 'clear';
        w.rainIntensity = 0;
      } else if (rand < 0.85) {
        w.current = 'rain';
        w.rainIntensity = 0.5 + Math.random() * 0.5;
      } else if (rand < 0.95) {
        w.current = 'storm';
        w.rainIntensity = 1;
      } else {
        w.current = 'wind';
        w.windDirection = { x: Math.random() * 2 - 1, y: Math.random() * 0.5 - 0.25 };
        w.windStrength = 50 + Math.random() * 100;
      }
    }

    // Wind pushes unsecured objects
    if (w.current === 'wind') {
      for (const [, food] of this.state.foods) {
        food.vx += w.windDirection.x * w.windStrength * delta * 0.1;
        food.vy += w.windDirection.y * w.windStrength * delta * 0.1;
      }
      for (const [, plort] of this.state.plorts) {
        plort.vx += w.windDirection.x * w.windStrength * delta * 0.1;
        plort.vy += w.windDirection.y * w.windStrength * delta * 0.1;
      }
    }
  }

  // ===== PARTICLES =====
  updateParticles(delta: number) {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.state.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.vy += p.gravity * delta;
    }
  }

  spawnParticles(x: number, y: number, type: Particle['type'], count: number, color: string) {
    for (let i = 0; i < count; i++) {
      if (this.state.particles.length >= OBJECT_POOL_SIZE) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;

      this.state.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        life: 0.5 + Math.random() * 1.5,
        maxLife: 2,
        color,
        size: 2 + Math.random() * 4,
        type,
        gravity: type === 'heart' || type === 'sparkle' ? -20 : 50,
      });
    }
  }

  // ===== INVENTORY =====
  addToInventory(type: 'food' | 'plort' | 'slime', itemType: string, count: number, color: string): boolean {
    const inv = this.state.player.inventory;

    // Find existing stack
    for (const slot of inv) {
      if (slot.type === type && slot.itemType === itemType) {
        slot.count += count;
        return true;
      }
    }

    // Find empty slot
    if (inv.length < MAX_INVENTORY_SLOTS) {
      inv.push({ type, itemType, count, color });
      return true;
    }

    return false; // Inventory full
  }

  removeFromInventory(slotIndex: number, count: number = 1): boolean {
    const inv = this.state.player.inventory;
    if (slotIndex >= inv.length) return false;

    inv[slotIndex].count -= count;
    if (inv[slotIndex].count <= 0) {
      inv.splice(slotIndex, 1);
      if (this.state.player.selectedSlot >= inv.length) {
        this.state.player.selectedSlot = Math.max(0, inv.length - 1);
      }
    }
    return true;
  }

  // ===== FEED =====
  tryFeedSlime() {
    const p = this.state.player;
    const slot = p.inventory[p.selectedSlot];
    if (!slot || slot.type !== 'food') {
      this.addNotification('Select food to feed!', '#FF1744');
      return;
    }

    // Find nearest slime
    let nearestSlime: { id: string; slime: SlimeData } | null = null;
    let nearestDist = FEED_RANGE;

    for (const [id, slime] of this.state.slimes) {
      const dx = slime.x - p.x;
      const dy = slime.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestSlime = { id, slime };
      }
    }

    if (!nearestSlime) {
      this.addNotification('No slime nearby!', '#FF1744');
      return;
    }

    const { slime } = nearestSlime;

    // Check diet
    const config = SLIME_CONFIG[slime.type];
    const foodConfig = FOOD_CONFIG[slot.itemType as FoodType];
    if (!config || !foodConfig) return;

    const isFavorite = config.favoriteFood === slot.itemType;
    const dietMatch = config.diet === 'everything' || config.diet === foodConfig.dietCategory;

    if (!dietMatch) {
      this.addNotification('That slime doesn\'t eat that!', '#FF8C00');
      return;
    }

    // Feed the slime
    this.removeFromInventory(p.selectedSlot, 1);

    const hungerGain = 30;
    const happinessGain = isFavorite ? 40 : 20;

    slime.hunger = Math.min(100, slime.hunger + hungerGain);
    slime.happiness = Math.min(100, slime.happiness + happinessGain);
    slime.fuseTimer = 30; // Can fuse for 30 seconds after eating

    // Overfed check
    if (slime.hunger > 90) {
      slime.overfedTimer = 10;
      this.addNotification('Slime is overfed! Bouncing faster!', '#FF69B4');
    }

    // Favorite food bonus
    if (isFavorite) {
      this.spawnParticles(slime.x, slime.y - 20, 'heart', 8, '#FF1493');
      this.addNotification('Favorite food! Double happiness!', '#FF1493');
    } else {
      this.spawnParticles(slime.x, slime.y - 10, 'heart', 4, '#FF69B4');
    }

    this.state.stats.totalSlimesFed++;

    // Discover slime type
    if (!this.state.discoveredSlimes.includes(slime.type)) {
      this.state.discoveredSlimes.push(slime.type);
    }
  }

  // ===== INTERACT =====
  tryInteract() {
    const p = this.state.player;

    // Check for nearby traders
    for (const trader of this.state.traders) {
      const dx = trader.x - p.x;
      const dy = trader.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < p.interactRange) {
        this.state.previousScreen = this.state.screen;
        this.state.screen = 'market';
        return;
      }
    }

    // Check for corrals on ranch
    if (this.state.currentBiome.type === 'ranch') {
      for (const corral of this.state.ranch.corrals) {
        const cx = corral.x + corral.width / 2;
        const cy = corral.y + corral.height / 2;
        const dx = cx - p.x;
        const dy = cy - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < p.interactRange + 50) {
          this.state.previousScreen = this.state.screen;
          this.state.screen = 'ranch_view';
          return;
        }
      }
    }

    this.addNotification('Nothing to interact with nearby', '#888');
  }

  // ===== UTILITY =====
  createSlime(type: SlimeType, x: number, y: number): SlimeData {
    const config = SLIME_CONFIG[type];
    return {
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      hunger: 50 + Math.random() * 30,
      happiness: 40 + Math.random() * 40,
      radius: config.radius,
      color: config.color,
      secondaryColor: config.secondaryColor,
      glowColor: config.glowColor,
      diet: config.diet,
      favoriteFood: config.favoriteFood,
      plortValue: config.plortValue,
      plortType: type,
      speed: config.speed,
      bounceInterval: 1 + Math.random() * 2,
      bounceTimer: Math.random() * 2,
      isLargo: false,
      parentTypes: undefined,
      overfedTimer: 0,
      sleeping: false,
      fleeing: false,
      fuseTimer: 0,
      plortCooldown: 5 + Math.random() * 5,
      wobblePhase: Math.random() * Math.PI * 2,
      squashStretch: 1,
      opacity: 1,
      spawnTimer: 0,
    };
  }

  createFood(type: FoodType, x: number, y: number): FoodData {
    const config = FOOD_CONFIG[type];
    return {
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      growthStage: 1,
      growthTimer: config.growthTime,
      maxGrowthTime: config.growthTime,
      dietCategory: config.dietCategory,
      color: config.color,
      radius: config.radius,
      planted: false,
      mature: true,
    };
  }

  angleDifference(a: number, b: number): number {
    let diff = a - b;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  }

  circleRectCollision(cx: number, cy: number, cr: number, rx: number, ry: number, rw: number, rh: number): boolean {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (cr * cr);
  }

  addNotification(text: string, color: string) {
    this.state.notifications.push({
      id: `notif_${Date.now()}_${Math.random()}`,
      text,
      color,
      timer: 3,
      maxTime: 3,
    });
  }

  updateNotifications(delta: number) {
    for (let i = this.state.notifications.length - 1; i >= 0; i--) {
      this.state.notifications[i].timer -= delta;
      if (this.state.notifications[i].timer <= 0) {
        this.state.notifications.splice(i, 1);
      }
    }
  }

  addScreenshake(intensity: number, duration: number) {
    this.state.screenshake = { intensity, duration, timer: duration };
  }

  // ===== SAVE/LOAD =====
  saveGame() {
    const saveData: SaveData = {
      version: GAME_VERSION,
      player: {
        x: this.state.player.x,
        y: this.state.player.y,
        inventory: this.state.player.inventory,
        selectedSlot: this.state.player.selectedSlot,
        newbucks: this.state.player.newbucks,
      },
      ranch: this.state.ranch,
      currentBiome: this.state.currentBiome.type,
      unlockedBiomes: this.state.unlockedBiomes,
      discoveredSlimes: this.state.discoveredSlimes,
      dayNight: {
        time: this.state.dayNight.time,
        day: this.state.dayNight.day,
      },
      stats: this.state.stats,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem('slimeRancherSave', JSON.stringify(saveData));
      console.log('Game saved');
    } catch (e) {
      console.error('Failed to save:', e);
    }
  }

  loadGame() {
    try {
      const saved = localStorage.getItem('slimeRancherSave');
      if (!saved) return;

      const data: SaveData = JSON.parse(saved);
      if (data.version !== GAME_VERSION) {
        console.warn('Save version mismatch');
        return;
      }

      // Restore player
      if (data.player) {
        Object.assign(this.state.player, data.player);
      }

      // Restore ranch
      if (data.ranch) {
        this.state.ranch = data.ranch;
      }

      // Restore biome
      if (data.currentBiome) {
        this.state.currentBiome = this.createBiomeData(data.currentBiome);
      }

      // Restore progress
      if (data.unlockedBiomes) {
        this.state.unlockedBiomes = data.unlockedBiomes;
      }
      if (data.discoveredSlimes) {
        this.state.discoveredSlimes = data.discoveredSlimes;
      }
      if (data.dayNight) {
        Object.assign(this.state.dayNight, data.dayNight);
      }
      if (data.stats) {
        this.state.stats = { ...this.state.stats, ...data.stats };
      }

      console.log('Game loaded');
    } catch (e) {
      console.error('Failed to load:', e);
    }
  }

  // ===== RENDERING =====
  render(_delta: number) {
    const ctx = this.ctx;
    const s = this.state;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Apply screenshake
    let shakeX = 0;
    let shakeY = 0;
    if (s.screenshake.timer > 0) {
      const intensity = s.screenshake.intensity * (s.screenshake.timer / s.screenshake.duration);
      shakeX = (Math.random() - 0.5) * intensity * 2;
      shakeY = (Math.random() - 0.5) * intensity * 2;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    if (s.screen === 'playing' || s.screen === 'paused') {
      this.renderGameWorld(ctx, w, h);
      this.renderHUD(ctx, w, h);
    }

    ctx.restore();
  }

  renderGameWorld(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const s = this.state;
    const camX = s.camera.x;
    const camY = s.camera.y;

    ctx.save();
    ctx.translate(w / 2 - camX, h / 2 - camY);

    // Background image
    const bgImg = this.bgImages.get(s.currentBiome.type);
    if (bgImg && bgImg.complete) {
      ctx.drawImage(bgImg, 0, 0, s.currentBiome.width, s.currentBiome.height);
    } else {
      // Fallback gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, s.currentBiome.height);
      gradient.addColorStop(0, s.dayNight.skyColor);
      gradient.addColorStop(1, '#4a7c59');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, s.currentBiome.width, s.currentBiome.height);
    }

    // Water areas
    for (const water of s.currentBiome.waterAreas) {
      ctx.fillStyle = 'rgba(41, 182, 246, 0.5)';
      ctx.fillRect(water.x, water.y, water.width, water.height);
      // Water shimmer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      for (let i = 0; i < 5; i++) {
        const sx = water.x + Math.random() * water.width;
        const sy = water.y + Math.random() * water.height;
        ctx.fillRect(sx, sy, 10, 2);
      }
    }

    // Obstacles
    for (const obs of s.currentBiome.obstacles) {
      ctx.fillStyle = obs.type === 'rock' ? '#808080' : obs.type === 'tree' ? '#4a7c3f' : obs.type === 'crystal' ? '#9370DB' : '#666';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }

    // Sort entities by Y for depth
    const allEntities: Array<{ type: string; y: number; render: () => void }> = [];

    // Foods
    for (const [, food] of s.foods) {
      allEntities.push({
        type: 'food',
        y: food.y,
        render: () => this.renderFood(ctx, food),
      });
    }

    // Plorts
    for (const [, plort] of s.plorts) {
      allEntities.push({
        type: 'plort',
        y: plort.y,
        render: () => this.renderPlort(ctx, plort),
      });
    }

    // Slimes
    for (const [, slime] of s.slimes) {
      allEntities.push({
        type: 'slime',
        y: slime.y,
        render: () => this.renderSlime(ctx, slime),
      });
    }

    // Sort by Y
    allEntities.sort((a, b) => a.y - b.y);

    // Render sorted entities
    for (const entity of allEntities) {
      entity.render();
    }

    // Player
    this.renderPlayer(ctx);

    // Vacuum/Blower beam
    if (s.player.vacuumActive || s.player.blowerActive) {
      this.renderVacuumBlowerBeam(ctx);
    }

    // Particles
    for (const particle of s.particles) {
      this.renderParticle(ctx, particle);
    }

    // Weather
    this.renderWeather(ctx, s.currentBiome.width, s.currentBiome.height);

    // Day/night overlay
    if (!s.dayNight.isDay) {
      const alpha = s.dayNight.isNight ? 0.4 : 0.2;
      ctx.fillStyle = `rgba(10, 10, 40, ${alpha})`;
      ctx.fillRect(0, 0, s.currentBiome.width, s.currentBiome.height);
    }

    ctx.restore();
  }

  renderSlime(ctx: CanvasRenderingContext2D, slime: SlimeData) {
    ctx.save();
    ctx.translate(slime.x, slime.y);

    // Wobble
    const wobble = Math.sin(slime.wobblePhase) * 0.05;
    const scaleX = slime.squashStretch + wobble;
    const scaleY = 1 / slime.squashStretch - wobble;
    ctx.scale(scaleX, scaleY);

    // Glow for phosphor/golden
    if (slime.glowColor) {
      ctx.shadowColor = slime.glowColor;
      ctx.shadowBlur = 15;
    }

    // Opacity for golden slime spawn/despawn
    ctx.globalAlpha = slime.type === 'golden' && slime.spawnTimer < 3 ? slime.spawnTimer / 3 : 1;

    // Main body
    ctx.beginPath();
    ctx.arc(0, 0, slime.radius, 0, Math.PI * 2);

    if (slime.isLargo && slime.parentTypes) {
      // Split color for largo
      const grad = ctx.createLinearGradient(-slime.radius, 0, slime.radius, 0);
      const configA = SLIME_CONFIG[slime.parentTypes[0]];
      const configB = SLIME_CONFIG[slime.parentTypes[1]];
      grad.addColorStop(0, configA.color);
      grad.addColorStop(1, configB.color);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = slime.color;
    }
    ctx.fill();

    // Secondary color overlay (top half for rock, stripes for tabby)
    if (slime.secondaryColor) {
      if (slime.type === 'rock') {
        ctx.beginPath();
        ctx.arc(0, -slime.radius * 0.2, slime.radius * 0.9, Math.PI, 0);
        ctx.fillStyle = slime.secondaryColor;
        ctx.fill();
      } else if (slime.type === 'tabby') {
        // Tabby stripes
        ctx.fillStyle = slime.secondaryColor;
        for (let i = -1; i <= 1; i++) {
          ctx.fillRect(i * 6 - 1, -slime.radius * 0.5, 2, slime.radius);
        }
      }
    }

    // Special effects
    if (slime.type === 'phosphor') {
      // Wings
      ctx.fillStyle = 'rgba(64, 224, 208, 0.4)';
      ctx.beginPath();
      ctx.ellipse(-slime.radius * 0.8, -slime.radius * 0.3, 10, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(slime.radius * 0.8, -slime.radius * 0.3, 10, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (slime.type === 'boom') {
      // Pulsing glow
      const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
      ctx.fillStyle = `rgba(255, 69, 0, ${pulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(0, 0, slime.radius * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (slime.type === 'tarr') {
      // Smoke particles
      ctx.fillStyle = 'rgba(45, 0, 77, 0.3)';
      for (let i = 0; i < 3; i++) {
        const sx = (Math.random() - 0.5) * slime.radius * 2;
        const sy = -slime.radius - Math.random() * 10;
        ctx.beginPath();
        ctx.arc(sx, sy, 3 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Face
    ctx.shadowBlur = 0;
    const eyeOffset = slime.sleeping ? 2 : 0;
    ctx.fillStyle = '#000';

    // Left eye
    ctx.beginPath();
    ctx.arc(-slime.radius * 0.3, -slime.radius * 0.15 + eyeOffset, 3, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    ctx.beginPath();
    ctx.arc(slime.radius * 0.3, -slime.radius * 0.15 + eyeOffset, 3, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    if (slime.sleeping) {
      ctx.beginPath();
      ctx.arc(0, slime.radius * 0.2, 3, 0, Math.PI);
      ctx.stroke();
    } else if (slime.happiness > 70) {
      ctx.beginPath();
      ctx.arc(0, slime.radius * 0.15, 5, 0, Math.PI);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(-3, slime.radius * 0.25);
      ctx.lineTo(3, slime.radius * 0.25);
      ctx.stroke();
    }

    // Overfed indicator
    if (slime.overfedTimer > 0) {
      ctx.fillStyle = 'rgba(255, 105, 180, 0.5)';
      ctx.beginPath();
      ctx.arc(0, -slime.radius - 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderFood(ctx: CanvasRenderingContext2D, food: FoodData) {
    ctx.save();
    ctx.translate(food.x, food.y);

    const scale = food.planted ? (0.3 + food.growthStage * 0.7) : 1;
    ctx.scale(scale, scale);

    ctx.fillStyle = food.color;

    if (food.type === 'carrot') {
      // Triangle body
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(-5, 8);
      ctx.lineTo(5, 8);
      ctx.closePath();
      ctx.fill();
      // Green top
      ctx.fillStyle = '#228B22';
      ctx.fillRect(-2, -12, 4, 6);
    } else if (food.type === 'pogofruit') {
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#228B22';
      ctx.fillRect(-1, -9, 2, 4);
    } else if (food.type === 'hen' || food.type === 'stony_hen' || food.type === 'briar_hen') {
      // Simple chicken shape
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.beginPath();
      ctx.arc(6, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.moveTo(10, -4);
      ctx.lineTo(13, -3);
      ctx.lineTo(10, -2);
      ctx.fill();
    } else {
      // Generic round food
      ctx.beginPath();
      ctx.arc(0, 0, food.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderPlort(ctx: CanvasRenderingContext2D, plort: PlortData) {
    ctx.save();
    ctx.translate(plort.x, plort.y);

    // Sparkle
    if (Math.sin(plort.sparkleTimer * 5) > 0.5) {
      ctx.shadowColor = plort.color;
      ctx.shadowBlur = 8;
    }

    // Diamond shape
    ctx.fillStyle = plort.color;
    ctx.beginPath();
    ctx.moveTo(0, -plort.radius);
    ctx.lineTo(plort.radius * 0.7, 0);
    ctx.lineTo(0, plort.radius);
    ctx.lineTo(-plort.radius * 0.7, 0);
    ctx.closePath();
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(0, -plort.radius * 0.5);
    ctx.lineTo(plort.radius * 0.3, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.state.player;
    ctx.save();
    ctx.translate(p.x, p.y);

    // Flip based on aim direction
    if (Math.cos(p.aimAngle) < 0) {
      ctx.scale(-1, 1);
    }

    // Player image
    if (this.playerImg && this.playerImg.complete) {
      const size = 48;
      ctx.drawImage(this.playerImg, -size / 2, -size, size, size * 1.5);
    } else {
      // Fallback: simple character
      ctx.fillStyle = '#4A90D9';
      ctx.fillRect(-10, -30, 20, 25);
      ctx.fillStyle = '#FFD4A0';
      ctx.beginPath();
      ctx.arc(0, -34, 8, 0, Math.PI * 2);
      ctx.fill();
      // Hat
      ctx.fillStyle = '#D4A04A';
      ctx.fillRect(-12, -42, 24, 6);
      ctx.fillRect(-8, -48, 16, 8);
    }

    ctx.restore();
  }

  renderVacuumBlowerBeam(ctx: CanvasRenderingContext2D) {
    const p = this.state.player;
    const isVacuum = p.vacuumActive;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.aimAngle);

    const range = isVacuum ? VACUUM_RANGE : BLOWER_RANGE;
    const grad = ctx.createRadialGradient(0, 0, 5, range * 0.7, 0, range);

    if (isVacuum) {
      grad.addColorStop(0, 'rgba(100, 200, 255, 0.4)');
      grad.addColorStop(1, 'rgba(100, 200, 255, 0)');
    } else {
      grad.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
      grad.addColorStop(1, 'rgba(255, 255, 200, 0)');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, range, -0.5, 0.5);
    ctx.closePath();
    ctx.fill();

    // Animated particles in beam
    const t = Date.now() * 0.005;
    ctx.fillStyle = isVacuum ? 'rgba(150, 220, 255, 0.6)' : 'rgba(255, 255, 200, 0.6)';
    for (let i = 0; i < 8; i++) {
      const dist = ((t * (isVacuum ? -50 : 80) + i * 30) % range);
      const spread = dist * 0.15;
      ctx.beginPath();
      ctx.arc(dist, Math.sin(t + i) * spread, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderParticle(ctx: CanvasRenderingContext2D, particle: Particle) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;

    if (particle.type === 'heart') {
      const size = particle.size;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.3);
      ctx.bezierCurveTo(-size, -size, -size, size * 0.3, 0, size);
      ctx.bezierCurveTo(size, size * 0.3, size, -size, 0, -size * 0.3);
      ctx.fill();
    } else if (particle.type === 'star') {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? particle.size : particle.size * 0.5;
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return; // Already translated
    } else {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  renderWeather(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const w = this.state.weather;
    if (w.current === 'clear') return;

    const t = Date.now() * 0.001;

    if (w.current === 'rain' || w.current === 'storm') {
      ctx.strokeStyle = w.current === 'storm' ? 'rgba(150, 180, 220, 0.5)' : 'rgba(150, 180, 220, 0.3)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 100 * w.rainIntensity; i++) {
        const x = (Math.random() * width);
        const y = (Math.random() * height);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y + 15);
        ctx.stroke();
      }

      if (w.current === 'storm' && Math.random() < 0.01) {
        // Lightning flash
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(0, 0, width, height);
      }
    }

    if (w.current === 'wind') {
      ctx.strokeStyle = 'rgba(200, 220, 200, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 30; i++) {
        const x = (t * 100 + i * 50) % (width + 100) - 50;
        const y = Math.random() * height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 30, y + Math.random() * 5);
        ctx.stroke();
      }
    }
  }

  renderHUD(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const s = this.state;

    // Top bar - Time and Newbucks
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, w, 50);

    // Day/Time
    const timeStr = s.dayNight.isDay ? 'Day' : s.dayNight.isDusk ? 'Dusk' : 'Night';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Day ${s.dayNight.day} - ${timeStr}`, w / 2, 32);

    // Weather icon
    const weatherIcon = s.weather.current === 'clear' ? '☀' : s.weather.current === 'rain' ? '🌧' : s.weather.current === 'storm' ? '⛈' : '💨';
    ctx.fillText(weatherIcon, w / 2 + 120, 32);

    // Newbucks
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`$${s.player.newbucks}`, w - 20, 32);

    // Bottom bar - Quick inventory
    if (s.showInventory) {
      const slotSize = 50;
      const slotGap = 5;
      const totalWidth = MAX_INVENTORY_SLOTS * (slotSize + slotGap);
      const startX = (w - totalWidth) / 2;
      const startY = h - 70;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(startX - 10, startY - 10, totalWidth + 20, slotSize + 20);

      for (let i = 0; i < MAX_INVENTORY_SLOTS; i++) {
        const x = startX + i * (slotSize + slotGap);
        const isSelected = i === s.player.selectedSlot;

        // Slot background
        ctx.fillStyle = isSelected ? 'rgba(255, 200, 50, 0.5)' : 'rgba(50, 50, 50, 0.6)';
        ctx.strokeStyle = isSelected ? '#FFD700' : '#666';
        ctx.lineWidth = 2;
        ctx.fillRect(x, startY, slotSize, slotSize);
        ctx.strokeRect(x, startY, slotSize, slotSize);

        // Item
        if (i < s.player.inventory.length) {
          const item = s.player.inventory[i];
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.arc(x + slotSize / 2, startY + slotSize / 2, 15, 0, Math.PI * 2);
          ctx.fill();

          // Count
          if (item.count > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${item.count}`, x + slotSize - 4, startY + slotSize - 4);
          }
        }

        // Number key
        ctx.fillStyle = '#aaa';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}`, x + 3, startY + 12);
      }
    }

    // Vacuum charge bar
    if (s.player.vacuumCharge < 100 || s.player.vacuumOverheat) {
      const barWidth = 120;
      const barHeight = 8;
      const bx = w / 2 - barWidth / 2;
      const by = 58;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(bx - 2, by - 2, barWidth + 4, barHeight + 4);

      ctx.fillStyle = s.player.vacuumOverheat ? '#FF1744' : '#29B6F6';
      ctx.fillRect(bx, by, barWidth * (s.player.vacuumCharge / 100), barHeight);
    }

    // Notifications
    ctx.textAlign = 'center';
    for (let i = 0; i < s.notifications.length; i++) {
      const notif = s.notifications[i];
      const alpha = Math.min(1, notif.timer / 0.5);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = notif.color;
      ctx.font = 'bold 16px Nunito, sans-serif';
      ctx.fillText(notif.text, w / 2, 100 + i * 25);
    }
    ctx.globalAlpha = 1;

    // Golden slime announcement
    if (s.goldenSlimeEvent.announcement) {
      const pulse = 0.5 + Math.sin(Date.now() * 0.008) * 0.5;
      ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
      ctx.font = 'bold 28px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ GOLDEN SLIME APPEARED! ★', w / 2, h / 3);
    }

    // Minimap
    if (s.showMinimap) {
      const mmSize = 120;
      const mmX = w - mmSize - 15;
      const mmY = h - mmSize - 15;
      const biome = s.currentBiome;
      const scaleX = mmSize / biome.width;
      const scaleY = mmSize / biome.height;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(mmX - 5, mmY - 5, mmSize + 10, mmSize + 10);

      // Slimes on minimap
      for (const [, slime] of s.slimes) {
        const sx = mmX + slime.x * scaleX;
        const sy = mmY + slime.y * scaleY;
        ctx.fillStyle = slime.color;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(mmX + s.player.x * scaleX, mmY + s.player.y * scaleY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ===== PUBLIC METHODS FOR REACT UI =====
  startGame() {
    this.state.screen = 'playing';
    this.state.paused = false;

    // Spawn some initial slimes
    if (this.state.slimes.size === 0) {
      for (let i = 0; i < 5; i++) {
        const x = 800 + Math.random() * 400;
        const y = 800 + Math.random() * 400;
        const types: SlimeType[] = ['pink', 'pink', 'pink', 'tabby', 'rock'];
        const id = `slime_${Date.now()}_${i}`;
        this.state.slimes.set(id, this.createSlime(types[i], x, y));
      }
    }

    // Spawn initial food
    if (this.state.foods.size === 0) {
      for (let i = 0; i < 8; i++) {
        const x = 600 + Math.random() * 800;
        const y = 600 + Math.random() * 800;
        const types: FoodType[] = ['carrot', 'pogofruit', 'carrot', 'carrot', 'pogofruit', 'carrot', 'pogofruit', 'heart_beet'];
        const id = `food_${Date.now()}_${i}`;
        this.state.foods.set(id, this.createFood(types[i], x, y));
      }
    }
  }

  travelToBiome(biomeType: BiomeType) {
    if (!this.state.unlockedBiomes.includes(biomeType)) {
      const cost = BIOME_CONFIG[biomeType].unlockCost;
      if (this.state.player.newbucks >= cost) {
        this.state.player.newbucks -= cost;
        this.state.unlockedBiomes.push(biomeType);
        this.addNotification(`Unlocked ${BIOME_CONFIG[biomeType].name}!`, '#00E676');
      } else {
        this.addNotification(`Need $${cost} to unlock!`, '#FF1744');
        return;
      }
    }

    this.state.currentBiome = this.createBiomeData(biomeType);
    // Clear entities from previous biome
    this.state.slimes.clear();
    this.state.foods.clear();
    this.state.plorts.clear();
    this.saveGame();
  }

  sellPlort(plortType: string, count: number): number {
    const slot = this.state.player.inventory.findIndex(
      (s) => s.type === 'plort' && s.itemType === plortType
    );
    if (slot === -1) return 0;

    const item = this.state.player.inventory[slot];
    const sellCount = Math.min(count, item.count);

    // Get value
    const slimeType = plortType as SlimeType;
    const baseValue = SLIME_CONFIG[slimeType]?.plortValue || 10;
    const totalValue = baseValue * sellCount;

    item.count -= sellCount;
    if (item.count <= 0) {
      this.state.player.inventory.splice(slot, 1);
    }

    this.state.player.newbucks += totalValue;
    this.state.stats.totalPlortsSold += sellCount;
    this.state.stats.totalNewbucksEarned += totalValue;

    this.addNotification(`Sold ${sellCount} plorts for $${totalValue}!`, '#FFD700');
    return totalValue;
  }

  sellAllPlorts(): number {
    let total = 0;
    const plortSlots = this.state.player.inventory.filter((s) => s.type === 'plort');
    for (const slot of plortSlots) {
      total += this.sellPlort(slot.itemType, slot.count);
    }
    return total;
  }

  getInventoryItems(): InventorySlot[] {
    return this.state.player.inventory;
  }

  getPlortMarketData(): Array<{ type: string; name: string; value: number; count: number; color: string }> {
    const result: Array<{ type: string; name: string; value: number; count: number; color: string }> = [];

    for (const [slimeType, config] of Object.entries(SLIME_CONFIG)) {
      if (slimeType === 'tarr') continue;
      const count = this.state.player.inventory
        .filter((s) => s.type === 'plort' && s.itemType === slimeType)
        .reduce((sum, s) => sum + s.count, 0);

      result.push({
        type: slimeType,
        name: `${slimeType.charAt(0).toUpperCase() + slimeType.slice(1)} Plort`,
        value: config.plortValue,
        count,
        color: config.color,
      });
    }

    return result;
  }

  getCorralData() {
    return this.state.ranch.corrals;
  }

  purchaseUpgrade(upgradeId: string, cost: number): boolean {
    if (this.state.player.newbucks < cost) {
      this.addNotification('Not enough Newbucks!', '#FF1744');
      return false;
    }

    this.state.player.newbucks -= cost;
    this.state.ranch.upgrades.push(upgradeId);
    this.addNotification('Upgrade purchased!', '#00E676');
    return true;
  }

  getState() {
    return this.state;
  }
}
