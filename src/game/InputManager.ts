import type { Vec2 } from './types';

export class InputManager {
  keys: Map<string, boolean> = new Map();
  keysPressed: Map<string, boolean> = new Map(); // single-press detection
  mousePos: Vec2 = { x: 0, y: 0 };
  mouseWorldPos: Vec2 = { x: 0, y: 0 };
  mouseDown: boolean = false;
  rightMouseDown: boolean = false;
  canvas: HTMLCanvasElement | null = null;
  camera: Vec2 = { x: 0, y: 0 };
  cameraZoom: number = 1;

  // Touch controls for mobile
  touchActive: boolean = false;
  touchPos: Vec2 = { x: 0, y: 0 };
  touchStartPos: Vec2 = { x: 0, y: 0 };
  virtualJoystick: Vec2 = { x: 0, y: 0 };
  joystickActive: boolean = false;
  joystickCenter: Vec2 = { x: 0, y: 0 };

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundContextMenu: (e: Event) => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;

  constructor() {
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundContextMenu = this.handleContextMenu.bind(this);
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
  }

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    canvas.addEventListener('mousemove', this.boundMouseMove);
    canvas.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mouseup', this.boundMouseUp);
    canvas.addEventListener('contextmenu', this.boundContextMenu);
    canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.boundTouchEnd);
  }

  destroy() {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.boundMouseMove);
      this.canvas.removeEventListener('mousedown', this.boundMouseDown);
      this.canvas.removeEventListener('contextmenu', this.boundContextMenu);
      this.canvas.removeEventListener('touchstart', this.boundTouchStart);
      this.canvas.removeEventListener('touchmove', this.boundTouchMove);
      this.canvas.removeEventListener('touchend', this.boundTouchEnd);
    }
    window.removeEventListener('mouseup', this.boundMouseUp);
  }

  private handleKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if (!this.keys.get(key)) {
      this.keysPressed.set(key, true);
    }
    this.keys.set(key, true);

    // Prevent default for game keys
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift', 'q', 'e', 'f', 'tab'].includes(key)) {
      e.preventDefault();
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    this.keys.set(key, false);
    this.keysPressed.set(key, false);
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = this.canvas?.getBoundingClientRect();
    if (!rect) return;
    this.mousePos.x = e.clientX - rect.left;
    this.mousePos.y = e.clientY - rect.top;
    this.updateWorldPos();
  }

  private handleMouseDown(e: MouseEvent) {
    if (e.button === 0) {
      this.mouseDown = true;
    } else if (e.button === 2) {
      this.rightMouseDown = true;
    }
  }

  private handleMouseUp(e: MouseEvent) {
    if (e.button === 0) {
      this.mouseDown = false;
    } else if (e.button === 2) {
      this.rightMouseDown = false;
    }
  }

  private handleContextMenu(e: Event) {
    e.preventDefault();
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    this.touchActive = true;
    const touch = e.touches[0];
    const rect = this.canvas?.getBoundingClientRect();
    if (!rect) return;

    this.touchPos.x = touch.clientX - rect.left;
    this.touchPos.y = touch.clientY - rect.top;
    this.touchStartPos = { ...this.touchPos };

    // Virtual joystick - left half of screen
    if (this.touchPos.x < (rect.width / 2)) {
      this.joystickActive = true;
      this.joystickCenter = { ...this.touchPos };
    }
  }

  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas?.getBoundingClientRect();
    if (!rect) return;

    this.touchPos.x = touch.clientX - rect.left;
    this.touchPos.y = touch.clientY - rect.top;

    if (this.joystickActive) {
      const dx = this.touchPos.x - this.joystickCenter.x;
      const dy = this.touchPos.y - this.joystickCenter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 60;
      if (dist > 0) {
        const scale = Math.min(dist, maxDist) / dist;
        this.virtualJoystick.x = (dx * scale) / maxDist;
        this.virtualJoystick.y = (dy * scale) / maxDist;
      }
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      this.touchActive = false;
      this.joystickActive = false;
      this.virtualJoystick = { x: 0, y: 0 };
    }
  }

  updateWorldPos() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    // Convert screen coords to world coords
    this.mouseWorldPos.x = (this.mousePos.x - rect.width / 2) / this.cameraZoom + this.camera.x;
    this.mouseWorldPos.y = (this.mousePos.y - rect.height / 2) / this.cameraZoom + this.camera.y;
  }

  updateCamera(camera: Vec2, zoom: number) {
    this.camera = camera;
    this.cameraZoom = zoom;
    this.updateWorldPos();
  }

  isKeyDown(key: string): boolean {
    return this.keys.get(key.toLowerCase()) || false;
  }

  isKeyPressed(key: string): boolean {
    const k = key.toLowerCase();
    if (this.keysPressed.get(k)) {
      this.keysPressed.set(k, false);
      return true;
    }
    return false;
  }

  getMovementVector(): Vec2 {
    let x = 0;
    let y = 0;

    if (this.isKeyDown('w') || this.isKeyDown('arrowup')) y -= 1;
    if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) y += 1;
    if (this.isKeyDown('a') || this.isKeyDown('arrowleft')) x -= 1;
    if (this.isKeyDown('d') || this.isKeyDown('arrowright')) x += 1;

    // Virtual joystick for mobile
    if (this.joystickActive) {
      x = this.virtualJoystick.x;
      y = this.virtualJoystick.y;
    }

    // Normalize diagonal movement
    const len = Math.sqrt(x * x + y * y);
    if (len > 1) {
      x /= len;
      y /= len;
    }

    return { x, y };
  }

  getAimAngle(fromX: number, fromY: number): number {
    const dx = this.mouseWorldPos.x - fromX;
    const dy = this.mouseWorldPos.y - fromY;
    return Math.atan2(dy, dx);
  }

  resetPressed() {
    this.keysPressed.clear();
  }
}
