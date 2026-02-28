// GardenRenderer — shared Canvas rendering engine
// Central cherry blossom tree with flowers blooming on branches
// Sparky the mascot walks around and waters the garden

// ============================================================
// Tunable constants — adjust these to tweak the look
// ============================================================

// Cloud stamps (Part A)
const CLOUD_STAMP_VARIANTS = 4;   // number of unique cloud shapes
const CLOUD_PUFFS_MIN = 24;       // min puff circles per stamp
const CLOUD_PUFFS_MAX = 38;       // max puff circles per stamp
const CLOUD_STAMP_W = 200;        // offscreen stamp width (px)
const CLOUD_STAMP_H = 120;        // offscreen stamp height (px)
const CLOUD_BLUR_PX = 6;          // gaussian blur radius on stamps
const CLOUD_WIND_SHEAR = 0.07;    // horizontal skew intensity

// Sparky mascot (Part B)
const MASCOT_HOP_AMP = 5;         // hop bounce height (px)
const MASCOT_HOP_FREQ = 0.008;    // hop cycle speed
const MASCOT_SQUASH = 0.10;       // squash/stretch intensity (0-1)
const MASCOT_SHADOW_ALPHA = 0.18; // ground shadow opacity
const MASCOT_WALK_SPEED = 0.00025;// walk speed (fraction of width/ms)
const MASCOT_MAX_DROPS = 20;      // max concurrent water drops
const MASCOT_MAX_SPLASHES = 12;   // max concurrent ground splashes

class GardenRenderer {
  constructor(canvas, flowerTypeIndex, thumbnailMode = false) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.flowerType = FLOWER_TYPES[flowerTypeIndex % FLOWER_TYPES.length];
    this.thumbnailMode = thumbnailMode;
    this.particles = [];
    this.animFrame = null;
    this.destroying = false;
    this.destroyProgress = 0;
    this.time = 0;
    this.goldenShimmer = false;
    this.dpr = window.devicePixelRatio || 1;

    // Tree
    this.branches = [];
    this.bloomSpots = [];
    this._treeBuilt = false;
    this._lastRenderedStage = -1;

    // Mascot
    this.mascotImg = new Image();
    this.mascotImg.src = 'mascot.png';
    this.mascotLoaded = false;
    this.mascotImg.onload = () => { this.mascotLoaded = true; };

    // Mascot animation state machine
    this.mascotState = "idle";
    this.mascotX = 0.68;
    this.mascotTargetX = 0.68;
    this.mascotTimer = 3000 + Math.random() * 3000;
    this.mascotWaterDrops = [];
    this.mascotSplashes = [];
    this.mascotFacing = 1;
    this._lastTime = 0;

    // Dynamic clouds — stamp cache + slot data
    this.clouds = [];
    this._cloudStamps = [];
    this._generateClouds(flowerTypeIndex);
    this._buildCloudStamps(flowerTypeIndex);
  }

  // --- Cloud stamp generation (offscreen, runs once) ---

  _generateClouds(flowerTypeIndex) {
    let seed = (flowerTypeIndex + 1) * 7919;
    const sr = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed & 0x7fffffff) / 2147483647;
    };
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        xBase: sr(),
        yBase: 0.08 + sr() * 0.28,
        size: 28 + sr() * 30,
        speed: 0.000012 + sr() * 0.000018,
        vertSpeed: 0.0005 + sr() * 0.0008,
        vertAmp: 3 + sr() * 5,
        phase: sr() * Math.PI * 2,
        opacity: 0.7 + sr() * 0.3,
        stampIndex: Math.floor(sr() * CLOUD_STAMP_VARIANTS),
      });
    }
  }

  _buildCloudStamps(flowerTypeIndex) {
    let seed = (flowerTypeIndex + 1) * 6271;
    const sr = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed & 0x7fffffff) / 2147483647;
    };

    for (let v = 0; v < CLOUD_STAMP_VARIANTS; v++) {
      // Draw puffs onto a temp canvas, then blur-copy to final stamp
      const tmp = document.createElement('canvas');
      tmp.width = CLOUD_STAMP_W;
      tmp.height = CLOUD_STAMP_H;
      const tctx = tmp.getContext('2d');

      const puffCount = CLOUD_PUFFS_MIN + Math.floor(sr() * (CLOUD_PUFFS_MAX - CLOUD_PUFFS_MIN));
      const cx = CLOUD_STAMP_W / 2;
      const cy = CLOUD_STAMP_H / 2;

      for (let p = 0; p < puffCount; p++) {
        const angle = sr() * Math.PI * 2;
        const distRaw = sr();
        // Quadratic falloff clusters puffs toward center
        const dist = distRaw * distRaw * 0.85;

        const px = cx + Math.cos(angle) * dist * (CLOUD_STAMP_W * 0.42);
        // Slight bottom bias for natural cloud shape
        const py = cy + Math.sin(angle) * dist * (CLOUD_STAMP_H * 0.32) + (sr() - 0.35) * 8;
        // Larger puffs toward center
        const puffR = (16 + sr() * 26) * (1 - dist * 0.35);
        const alpha = 0.13 + sr() * 0.14;

        tctx.globalAlpha = alpha;
        tctx.fillStyle = '#FFFFFF';
        tctx.beginPath();
        tctx.arc(px, py, puffR, 0, Math.PI * 2);
        tctx.fill();
      }

      // Blur-copy: temp → final stamp for soft edges
      const oc = document.createElement('canvas');
      oc.width = CLOUD_STAMP_W;
      oc.height = CLOUD_STAMP_H;
      const octx = oc.getContext('2d');
      try {
        octx.filter = `blur(${CLOUD_BLUR_PX}px)`;
        octx.drawImage(tmp, 0, 0);
        octx.filter = 'none';
      } catch (_) {
        // Fallback: no blur (still looks decent from overlapping puffs)
        octx.drawImage(tmp, 0, 0);
      }

      this._cloudStamps.push(oc);
    }
  }

  get w() { return this.canvas.width / this.dpr; }
  get h() { return this.canvas.height / this.dpr; }

  // --- Public API ---

  render(totalBlockedMs, stage) {
    this.time = performance.now();
    this.goldenShimmer = totalBlockedMs >= 30 * 24 * 60 * 60 * 1000;
    if (!this._treeBuilt) this._generateTree();
    const stageProgress = this._stageProgress(totalBlockedMs, stage);
    // Stage-up celebration burst
    if (!this.thumbnailMode && stage > this._lastRenderedStage && this._lastRenderedStage >= 0) {
      this._spawnCelebration();
    }
    this._lastRenderedStage = stage;

    this._draw(stage, stageProgress, totalBlockedMs);

    if (!this.thumbnailMode && !this.destroying) {
      this.animFrame = requestAnimationFrame(() => this.render(totalBlockedMs, stage));
    }
  }

  renderStatic(totalBlockedMs, stage) {
    this.time = performance.now();
    this.goldenShimmer = totalBlockedMs >= 30 * 24 * 60 * 60 * 1000;
    if (!this._treeBuilt) this._generateTree();
    const stageProgress = this._stageProgress(totalBlockedMs, stage);
    this._draw(stage, stageProgress, totalBlockedMs);
  }

  startDestruction(onComplete) {
    this.destroying = true;
    this.destroyProgress = 0;
    const duration = 3000;
    const startTime = performance.now();

    const animate = (now) => {
      this.destroyProgress = Math.min(1, (now - startTime) / duration);
      this.time = now;
      this._draw(this._lastStage, this._lastStageProgress, this._lastTotalMs);

      if (this.destroyProgress < 1) {
        this.animFrame = requestAnimationFrame(animate);
      } else {
        onComplete && onComplete();
      }
    };
    this.animFrame = requestAnimationFrame(animate);
  }

  stop() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  destroy() {
    this.stop();
    this._cloudStamps = [];
  }

  // --- Tree generation ---

  _generateTree() {
    this._treeBuilt = true;
    const w = this.w;
    const h = this.h;
    const groundY = h * 0.65;
    const cx = w * 0.5;
    const scale = groundY / 260;

    this.branches = [];
    this.bloomSpots = [];

    let seed = 54321;
    const sr = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed & 0x7fffffff) / 2147483647;
    };

    const trunkH = groundY * 0.52;
    const trunkTopY = groundY - trunkH;

    // Trunk — slight natural lean
    this.branches.push({
      x1: cx, y1: groundY,
      cpx: cx + 3 * scale, cpy: groundY - trunkH * 0.5,
      x2: cx + 1 * scale, y2: trunkTopY,
      width: 8 * scale, depth: 0
    });

    // Build canopy from trunk top
    this._buildBranch(
      cx + 1 * scale, trunkTopY,
      -Math.PI / 2, trunkH * 0.5, 5.5 * scale,
      0, 3, sr, scale
    );
  }

  _buildBranch(x, y, angle, length, width, depth, maxDepth, sr, scale) {
    if (depth >= maxDepth) {
      // Branch tip — bloom spot
      this.bloomSpots.push({ x, y, size: 0.5 + sr() * 0.6, tip: true });
      return;
    }

    const numBranches = depth === 0 ? 3 : 2;
    const spread = depth === 0 ? 0.75 : 0.5 + sr() * 0.2;

    for (let i = 0; i < numBranches; i++) {
      const t = numBranches === 1 ? 0 : (i / (numBranches - 1)) * 2 - 1;
      const branchAngle = angle + t * spread + (sr() - 0.5) * 0.2;
      const branchLen = length * (0.55 + sr() * 0.25);
      const endX = x + Math.cos(branchAngle) * branchLen;
      const endY = y + Math.sin(branchAngle) * branchLen;

      // Curve control point — offset perpendicular to branch direction
      const perpAngle = branchAngle + Math.PI / 2;
      const curveAmount = (sr() - 0.5) * branchLen * 0.3;
      const midX = (x + endX) / 2 + Math.cos(perpAngle) * curveAmount;
      const midY = (y + endY) / 2 + Math.sin(perpAngle) * curveAmount;

      this.branches.push({
        x1: x, y1: y,
        cpx: midX, cpy: midY,
        x2: endX, y2: endY,
        width: width * (depth === 0 ? 0.7 : 0.55),
        depth: depth + 1
      });

      // Bloom spots along branches at depth >= 1
      if (depth >= 1) {
        const spot1X = x + (endX - x) * 0.35 + (sr() - 0.5) * 10 * scale;
        const spot1Y = y + (endY - y) * 0.35 + (sr() - 0.5) * 10 * scale;
        this.bloomSpots.push({ x: spot1X, y: spot1Y, size: 0.3 + sr() * 0.4, tip: false });
      }

      // Bloom spot at midpoint of every branch
      const spotX = midX + (sr() - 0.5) * 6 * scale;
      const spotY = midY + (sr() - 0.5) * 6 * scale;
      this.bloomSpots.push({ x: spotX, y: spotY, size: 0.35 + sr() * 0.5, tip: false });

      this._buildBranch(endX, endY, branchAngle, branchLen, width * 0.6, depth + 1, maxDepth, sr, scale);
    }
  }

  // --- Core draw ---

  _stageProgress(totalBlockedMs, stage) {
    const nextStage = GROWTH_STAGES[stage + 1];
    if (!nextStage) return 1.0;
    const range = nextStage.minMs - GROWTH_STAGES[stage].minMs;
    return Math.min(1.0, (totalBlockedMs - GROWTH_STAGES[stage].minMs) / range);
  }

  _draw(stage, stageProgress, totalBlockedMs) {
    this._lastStage = stage;
    this._lastStageProgress = stageProgress;
    this._lastTotalMs = totalBlockedMs;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    const desat = this.destroying ? this.destroyProgress : 0;

    this._drawSky(desat, stage);
    this._drawGround(desat);
    this._drawTree(desat);
    this._drawTreeFlowers(stage, stageProgress, desat);
    this._updateMascot(stage);
    this._drawMascot(desat);

    if (!this.thumbnailMode) {
      this._updateParticles(stage, desat);
      this._drawParticles();
    }

    if (this.goldenShimmer && !this.destroying) {
      this._drawGoldenShimmer();
    }
  }

  // --- Sky & Clouds ---

  _drawSky(desat, stage) {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const groundY = h * 0.65;

    const grad = ctx.createLinearGradient(0, 0, 0, groundY);
    if (desat > 0) {
      grad.addColorStop(0, this._desaturate("#FDCFE1", desat));
      grad.addColorStop(1, this._desaturate("#E8A0C0", desat));
    } else {
      grad.addColorStop(0, "#FDCFE1");
      grad.addColorStop(0.5, "#F3B8D4");
      grad.addColorStop(1, "#E8A0C0");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, groundY);

    // Soft stamp-based clouds — count increases with garden stage
    if (desat < 0.5 && this._cloudStamps.length > 0) {
      const visibleClouds = this.thumbnailMode
        ? Math.min(this.clouds.length, Math.max(1, stage))
        : Math.min(this.clouds.length, stage + 1);
      const baseAlpha = Math.min(1, (0.35 + stage * 0.08) * (1 - desat * 2));
      const t = this.time;

      for (let i = 0; i < visibleClouds; i++) {
        const c = this.clouds[i];
        const stamp = this._cloudStamps[c.stampIndex % this._cloudStamps.length];

        const xRaw = this.thumbnailMode
          ? c.xBase * w
          : ((c.xBase + t * c.speed) % 1.2 - 0.1) * w;
        const yRaw = this.thumbnailMode
          ? c.yBase * groundY
          : c.yBase * groundY + Math.sin(t * c.vertSpeed + c.phase) * c.vertAmp;

        const drawW = c.size * 3.2;
        const drawH = c.size * 1.9;

        ctx.save();
        ctx.globalAlpha = baseAlpha * c.opacity;
        ctx.translate(xRaw, yRaw);

        // Wind shear — top of cloud drifts ahead (slow sine wobble)
        if (!this.thumbnailMode) {
          const shear = CLOUD_WIND_SHEAR * Math.sin(t * 0.0002 + c.phase);
          ctx.transform(1, 0, -shear, 1, 0, 0);
        }

        ctx.drawImage(stamp, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }
    }
  }

  // --- Ground ---

  _drawGround(desat) {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const groundY = h * 0.65;

    const grad = ctx.createLinearGradient(0, groundY, 0, h);
    if (desat > 0) {
      grad.addColorStop(0, this._desaturate("#7CB342", desat));
      grad.addColorStop(0.4, this._desaturate("#558B2F", desat));
      grad.addColorStop(1, this._desaturate("#33691E", desat));
    } else {
      grad.addColorStop(0, "#7CB342");
      grad.addColorStop(0.4, "#558B2F");
      grad.addColorStop(1, "#33691E");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, groundY, w, h - groundY);

    // Grass tufts
    if (!this.thumbnailMode) {
      ctx.save();
      ctx.globalAlpha = 0.3 * (1 - desat);
      ctx.strokeStyle = "#8BC34A";
      ctx.lineWidth = 1.5;
      let seed = 42;
      const sr = () => { seed = (seed * 16807) % 2147483647; return (seed & 0x7fffffff) / 2147483647; };
      for (let i = 0; i < 30; i++) {
        const gx = sr() * w;
        const gy = groundY + sr() * 15;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx - 3, gy - 8 - sr() * 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gx + 2, gy);
        ctx.lineTo(gx + 5, gy - 7 - sr() * 5);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Ground cracks during destruction
    if (desat > 0.4) {
      ctx.save();
      ctx.globalAlpha = (desat - 0.4) * 1.6;
      ctx.strokeStyle = "#3E2723";
      ctx.lineWidth = 2;
      const cx = w * 0.5;
      const cy = groundY + (h - groundY) * 0.3;
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + 0.3;
        const len = 20 + i * 12;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len * 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // --- Tree ---

  _drawTree(desat) {
    const ctx = this.ctx;
    const droop = this.destroying ? this.destroyProgress * 0.3 : 0;

    for (const b of this.branches) {
      ctx.save();
      const baseColor = b.depth === 0 ? "#5D4037" : b.depth === 1 ? "#6D4C41" : "#795548";
      ctx.strokeStyle = this._desaturate(baseColor, desat);
      ctx.lineWidth = b.width;
      ctx.lineCap = "round";

      const droopY = droop * (b.depth + 1) * 8;

      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.quadraticCurveTo(b.cpx, b.cpy + droopY * 0.5, b.x2, b.y2 + droopY);
      ctx.stroke();
      ctx.restore();
    }
  }

  // --- Flowers on branches ---

  _drawTreeFlowers(stage, progress, desat) {
    const total = this.bloomSpots.length;
    // Fraction of spots that have flowers: 0 at stage 0 start, 1.0 at stage 4
    const fraction = Math.min(1, (stage + progress) / 4.5);
    const visibleCount = Math.max(0, Math.floor(total * fraction));

    if (visibleCount === 0) return;

    const ft = this.flowerType;
    const sway = this.thumbnailMode ? 0 : Math.sin(this.time * 0.0008) * 1.5;
    const droop = this.destroying ? this.destroyProgress * 0.3 : 0;

    for (let i = 0; i < visibleCount; i++) {
      const spot = this.bloomSpots[i];
      const bx = spot.x + sway;
      const by = spot.y + droop * 12;
      const sz = spot.size;

      if (stage <= 1) {
        // Small green buds
        const budSize = (2 + progress * 3) * sz;
        this._drawBud(bx, by, budSize, "#A5D6A7", desat);
      } else if (stage === 2) {
        // Colored buds showing petal color
        const budSize = (3.5 + progress * 3) * sz;
        this._drawBud(bx, by, budSize, ft.petalColor, desat);
      } else {
        // Open flowers
        const petalSize = (5 + progress * 4 + (stage === 4 ? 3 : 0)) * sz;
        this._drawPetals(bx, by, petalSize, ft, desat);

        // Detaching petals during destruction
        if (this.destroying && this.destroyProgress > 0.15 && !this.thumbnailMode && Math.random() < 0.08) {
          this.particles.push({
            x: bx + (Math.random() - 0.5) * petalSize,
            y: by,
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * 0.4 + 0.2,
            size: petalSize * 0.35,
            color: ft.petalColor,
            life: 1,
            decay: 0.005 + Math.random() * 0.004,
            type: "petal"
          });
        }
      }
    }
  }

  // --- Mascot animation ---

  _updateMascot(stage) {
    if (this.thumbnailMode || this.destroying) return;

    // Delta time
    const dt = this._lastTime > 0 ? Math.min(this.time - this._lastTime, 50) : 16;
    this._lastTime = this.time;

    this.mascotTimer -= dt;

    if (this.mascotTimer <= 0) {
      if (this.mascotState === "idle") {
        this.mascotTargetX = 0.2 + Math.random() * 0.65;
        this.mascotFacing = this.mascotTargetX > this.mascotX ? 1 : -1;
        this.mascotState = "walking";
      } else if (this.mascotState === "walking") {
        this.mascotState = "watering";
        this.mascotTimer = 2000 + Math.random() * 1500;
      } else if (this.mascotState === "watering") {
        this.mascotState = "idle";
        this.mascotTimer = 4000 + Math.random() * 4000;
      }
    }

    // Walking movement
    if (this.mascotState === "walking") {
      const dx = this.mascotTargetX - this.mascotX;
      if (Math.abs(dx) < MASCOT_WALK_SPEED * dt) {
        this.mascotX = this.mascotTargetX;
        this.mascotTimer = 0; // trigger transition to watering
      } else {
        this.mascotX += Math.sign(dx) * MASCOT_WALK_SPEED * dt;
      }
    }

    // Spawn water drops from watering can spout tip (capped)
    if (this.mascotState === "watering" && this.mascotWaterDrops.length < MASCOT_MAX_DROPS && Math.random() < 0.25) {
      const groundY = this.h * 0.65;
      const mascotH = this.h * 0.15;
      // Spout tip: offset from mascot center toward facing side
      const centerX = this.mascotX * this.w + mascotH / 2;
      const spoutX = centerX + this.mascotFacing * mascotH * 0.55;
      const spoutY = groundY - mascotH * 0.48;
      this.mascotWaterDrops.push({
        x: spoutX + (Math.random() - 0.5) * 4,
        y: spoutY,
        vy: 0.5 + Math.random() * 0.8,
        life: 1,
      });
    }

    // Update water drops — spawn splashes on ground hit
    const groundY = this.h * 0.65;
    for (let i = this.mascotWaterDrops.length - 1; i >= 0; i--) {
      const d = this.mascotWaterDrops[i];
      d.y += d.vy;
      d.vy += 0.08;
      d.life -= 0.018;
      if (d.life <= 0 || d.y >= groundY) {
        // Ground splash on impact
        if (d.y >= groundY && this.mascotSplashes.length < MASCOT_MAX_SPLASHES) {
          this.mascotSplashes.push({
            x: d.x,
            y: groundY,
            life: 1,
            size: 1.5 + Math.random() * 1.5,
          });
        }
        this.mascotWaterDrops.splice(i, 1);
      }
    }

    // Update ground splashes — expanding ripple rings
    for (let i = this.mascotSplashes.length - 1; i >= 0; i--) {
      const s = this.mascotSplashes[i];
      s.life -= 0.04;
      s.size += 0.35;
      if (s.life <= 0) this.mascotSplashes.splice(i, 1);
    }
  }

  _drawMascot(desat) {
    if (!this.mascotLoaded) return;

    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const groundY = h * 0.65;

    const mascotH = this.thumbnailMode ? h * 0.12 : h * 0.15;
    const mascotW = mascotH;
    const mx = this.thumbnailMode ? w * 0.68 : this.mascotX * w;
    const my = groundY - mascotH * 0.88;

    // Hop phase and squash/stretch (walking only)
    let bobY = 0;
    let scaleX = 1;
    let scaleY = 1;
    let hopHeight = 0; // 0=ground, 1=peak — used for shadow

    if (!this.thumbnailMode) {
      if (this.mascotState === "idle") {
        bobY = Math.sin(this.time * 0.002) * 1.5;
      } else if (this.mascotState === "walking") {
        const hopSin = Math.sin(this.time * MASCOT_HOP_FREQ);
        hopHeight = Math.abs(hopSin);
        bobY = -hopHeight * MASCOT_HOP_AMP;
        // Squash at ground (hopHeight~0), stretch at peak (hopHeight~1)
        scaleY = 1 + (hopHeight * 2 - 1) * MASCOT_SQUASH;
        scaleX = 1 + (1 - scaleY) * 0.6; // approximate volume preservation
      } else if (this.mascotState === "watering") {
        bobY = Math.sin(this.time * 0.003) * 1;
      }
    }

    // --- Shadow ellipse ---
    if (!this.thumbnailMode) {
      const shadowW = mascotW * (0.65 + (1 - hopHeight) * 0.2);
      const shadowH = mascotW * 0.12;
      const shadowAlpha = MASCOT_SHADOW_ALPHA * (1 - hopHeight * 0.5) * (1 - desat * 0.6);
      ctx.save();
      ctx.globalAlpha = shadowAlpha;
      ctx.fillStyle = 'rgba(30, 15, 10, 1)';
      ctx.beginPath();
      ctx.ellipse(mx + mascotW / 2, groundY - 1, shadowW / 2, shadowH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // --- Draw mascot sprite ---
    ctx.save();
    if (desat > 0) ctx.globalAlpha = 1 - desat * 0.6;

    // Flip horizontally when facing left
    if (!this.thumbnailMode && this.mascotFacing === -1) {
      ctx.translate(mx + mascotW / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(mx + mascotW / 2), 0);
    }

    // Lean forward during watering
    if (!this.thumbnailMode && this.mascotState === "watering") {
      const pivotX = mx + mascotW / 2;
      const pivotY = my + mascotH;
      ctx.translate(pivotX, pivotY);
      ctx.rotate(-0.12);
      ctx.translate(-pivotX, -pivotY);
    }

    // Squash/stretch transform (pivot at feet)
    if (!this.thumbnailMode && (scaleX !== 1 || scaleY !== 1)) {
      const pivotX = mx + mascotW / 2;
      const pivotY = my + mascotH;
      ctx.translate(pivotX, pivotY);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-pivotX, -pivotY);
    }

    ctx.drawImage(this.mascotImg, mx, my + bobY, mascotW, mascotH);

    // Watering can — drawn inside transform context so it follows flip/lean/squash
    if (!this.thumbnailMode) {
      this._drawWateringCan(ctx, mx, my, mascotW, mascotH, bobY);
    }

    ctx.restore();

    // --- Water drops (teardrop shapes) ---
    if (!this.thumbnailMode && this.mascotWaterDrops.length > 0) {
      ctx.save();
      for (const d of this.mascotWaterDrops) {
        ctx.globalAlpha = d.life * 0.7;
        ctx.fillStyle = "#87CEEB";
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - 3);
        ctx.quadraticCurveTo(d.x + 2.5, d.y, d.x, d.y + 3);
        ctx.quadraticCurveTo(d.x - 2.5, d.y, d.x, d.y - 3);
        ctx.fill();
      }
      ctx.restore();
    }

    // --- Ground splash ripples ---
    if (!this.thumbnailMode && this.mascotSplashes.length > 0) {
      ctx.save();
      for (const s of this.mascotSplashes) {
        ctx.globalAlpha = s.life * 0.4;
        ctx.strokeStyle = "#87CEEB";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.size, s.size * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // --- Watering Can ---

  _drawWateringCan(ctx, mx, my, mascotW, mascotH, bobY) {
    const canW = mascotH * 0.18;
    const canH = mascotH * 0.24;

    // Position: right side of mascot at hand height
    const baseX = mx + mascotW * 0.72;
    const baseY = my + bobY + mascotH * 0.46;

    ctx.save();

    // Extra tilt during watering (pouring angle)
    if (this.mascotState === "watering") {
      const px = baseX + canW * 0.5;
      const py = baseY + canH;
      ctx.translate(px, py);
      ctx.rotate(-0.4);
      ctx.translate(-px, -py);
    }

    // Can body (rounded rect)
    const r = canW * 0.18;
    ctx.fillStyle = "#FFB7C5";
    ctx.beginPath();
    ctx.moveTo(baseX + r, baseY);
    ctx.lineTo(baseX + canW - r, baseY);
    ctx.arcTo(baseX + canW, baseY, baseX + canW, baseY + r, r);
    ctx.lineTo(baseX + canW, baseY + canH - r);
    ctx.arcTo(baseX + canW, baseY + canH, baseX + canW - r, baseY + canH, r);
    ctx.lineTo(baseX + r, baseY + canH);
    ctx.arcTo(baseX, baseY + canH, baseX, baseY + canH - r, r);
    ctx.lineTo(baseX, baseY + r);
    ctx.arcTo(baseX, baseY, baseX + r, baseY, r);
    ctx.closePath();
    ctx.fill();

    // Bottom edge accent
    ctx.fillStyle = "#E8A0C0";
    ctx.beginPath();
    ctx.moveTo(baseX + r, baseY + canH * 0.82);
    ctx.lineTo(baseX + canW - r, baseY + canH * 0.82);
    ctx.lineTo(baseX + canW - r, baseY + canH);
    ctx.arcTo(baseX + canW, baseY + canH, baseX + canW - r, baseY + canH, r);
    ctx.lineTo(baseX + r, baseY + canH);
    ctx.arcTo(baseX, baseY + canH, baseX, baseY + canH - r, r);
    ctx.closePath();
    ctx.fill();

    // Kawaii shine highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.ellipse(baseX + canW * 0.32, baseY + canH * 0.28, canW * 0.1, canH * 0.14, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Spout (tapered line from top-right)
    ctx.strokeStyle = "#F0A0B8";
    ctx.lineWidth = canW * 0.14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(baseX + canW * 0.8, baseY + canH * 0.12);
    ctx.lineTo(baseX + canW * 1.35, baseY - canH * 0.25);
    ctx.stroke();

    // Spout nozzle tip
    ctx.fillStyle = "#E090A8";
    ctx.beginPath();
    ctx.arc(baseX + canW * 1.35, baseY - canH * 0.25, canW * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // Handle (arc on back side)
    ctx.strokeStyle = "#E090A8";
    ctx.lineWidth = canW * 0.1;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(baseX + canW * 0.05, baseY + canH * 0.4, canH * 0.2, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();

    ctx.restore();
  }

  // --- Flower parts ---

  _drawBud(x, y, size, color, desat) {
    const ctx = this.ctx;
    ctx.fillStyle = this._desaturate(color, desat);
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.6, size, 0, 0, Math.PI * 2);
    ctx.fill();

    // Green sepals
    ctx.fillStyle = this._desaturate("#4CAF50", desat);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.5, y + size * 0.3);
    ctx.quadraticCurveTo(x, y + size * 0.8, x + size * 0.5, y + size * 0.3);
    ctx.quadraticCurveTo(x, y + size * 0.5, x - size * 0.5, y + size * 0.3);
    ctx.fill();
  }

  _drawPetals(x, y, size, ft, desat) {
    const ctx = this.ctx;
    const count = ft.petalCount;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(angle) * size * 0.6;
      const py = y + Math.sin(angle) * size * 0.6;

      ctx.fillStyle = this._desaturate(i % 2 === 0 ? ft.petalColor : ft.petalColorLight, desat);
      ctx.beginPath();

      if (ft.petalShape === "round") {
        ctx.arc(px, py, size * 0.45, 0, Math.PI * 2);
      } else if (ft.petalShape === "pointed") {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle + Math.PI / 2);
        ctx.moveTo(0, -size * 0.55);
        ctx.quadraticCurveTo(size * 0.35, 0, 0, size * 0.3);
        ctx.quadraticCurveTo(-size * 0.35, 0, 0, -size * 0.55);
        ctx.restore();
      } else {
        // Heart
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle + Math.PI / 2);
        const hs = size * 0.3;
        ctx.moveTo(0, hs);
        ctx.bezierCurveTo(-hs, 0, -hs, -hs * 0.8, 0, -hs * 0.3);
        ctx.bezierCurveTo(hs, -hs * 0.8, hs, 0, 0, hs);
        ctx.restore();
      }
      ctx.fill();
    }

    // Center
    ctx.beginPath();
    ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = this._desaturate(ft.centerColor, desat);
    ctx.fill();
  }

  // --- Celebration burst ---

  _spawnCelebration() {
    const cx = this.w * 0.5;
    const cy = this.h * 0.35;
    const colors = ["#FFB7C5", "#FFD700", "#FF69B4", "#FFFFFF", "#C084FC"];

    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: 0.008 + Math.random() * 0.006,
        type: i % 3 === 0 ? "sparkle" : "petal"
      });
    }
  }

  // --- Particles ---

  _updateParticles(stage, desat) {
    // Floating petals in bloom+ stages
    if (stage >= 3 && !this.destroying && this.particles.length < 15) {
      if (Math.random() < 0.03) {
        this.particles.push({
          x: this.w * 0.2 + Math.random() * this.w * 0.6,
          y: this.h * 0.1 + Math.random() * this.h * 0.2,
          vx: (Math.random() - 0.5) * 0.8,
          vy: 0.3 + Math.random() * 0.5,
          size: 3 + Math.random() * 4,
          color: this.flowerType.petalColor,
          life: 1,
          decay: 0.002 + Math.random() * 0.002,
          type: "float"
        });
      }
    }

    // Sparkles for garden stage
    if (stage >= 4 && !this.destroying && this.particles.length < 25) {
      if (Math.random() < 0.05) {
        this.particles.push({
          x: this.w * 0.15 + Math.random() * this.w * 0.7,
          y: Math.random() * this.h * 0.55,
          vx: 0, vy: 0,
          size: 2 + Math.random() * 2,
          color: "#FFFFFF",
          life: 1,
          decay: 0.015 + Math.random() * 0.01,
          type: "sparkle"
        });
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.type === "petal") p.vy += 0.02;
      if (p.life <= 0 || p.y > this.h) {
        this.particles.splice(i, 1);
      }
    }
  }

  _drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life;

      if (p.type === "sparkle") {
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        const s = p.size * (0.5 + Math.sin(this.time * 0.005 + p.x) * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.25, -s * 0.25);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * 0.25, s * 0.25);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.25, s * 0.25);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * 0.25, -s * 0.25);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * 0.7, p.size, p.x * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  _drawGoldenShimmer() {
    const ctx = this.ctx;
    ctx.save();
    const t = this.time * 0.001;
    ctx.globalAlpha = 0.08 + Math.sin(t) * 0.04;
    const grad = ctx.createLinearGradient(0, 0, this.w, this.h);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.3 + Math.sin(t * 0.5) * 0.2, "rgba(255, 215, 0, 0.4)");
    grad.addColorStop(0.7 + Math.cos(t * 0.3) * 0.1, "transparent");
    grad.addColorStop(1, "rgba(255, 215, 0, 0.2)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.restore();
  }

  _desaturate(hex, amount) {
    if (amount <= 0) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
    const nr = Math.round(r + (gray - r) * amount);
    const ng = Math.round(g + (gray - g) * amount);
    const nb = Math.round(b + (gray - b) * amount);
    return `rgb(${nr},${ng},${nb})`;
  }
}
