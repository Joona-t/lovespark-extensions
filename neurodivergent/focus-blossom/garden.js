// GardenRenderer — shared Canvas rendering engine
// Central cherry blossom tree with flowers blooming on branches
// Sparky the mascot stands at the base as gardener

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

    // Mascot
    this.mascotImg = new Image();
    this.mascotImg.src = 'mascot.png';
    this.mascotLoaded = false;
    this.mascotImg.onload = () => { this.mascotLoaded = true; };
  }

  get w() { return this.canvas.width / this.dpr; }
  get h() { return this.canvas.height / this.dpr; }

  // --- Public API ---

  render(totalBlockedMs, stage) {
    this.time = performance.now();
    this.goldenShimmer = totalBlockedMs >= 30 * 24 * 60 * 60 * 1000;
    if (!this._treeBuilt) this._generateTree();
    const stageProgress = this._stageProgress(totalBlockedMs, stage);
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

    this._drawSky(desat);
    this._drawGround(desat);
    this._drawTree(desat);
    this._drawTreeFlowers(stage, stageProgress, desat);
    this._drawMascot(desat);

    if (!this.thumbnailMode) {
      this._updateParticles(stage, desat);
      this._drawParticles();
    }

    if (this.goldenShimmer && !this.destroying) {
      this._drawGoldenShimmer();
    }
  }

  // --- Sky & Ground ---

  _drawSky(desat) {
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

    if (!this.thumbnailMode && desat < 0.5) {
      ctx.save();
      ctx.globalAlpha = 0.3 * (1 - desat * 2);
      const t = this.time * 0.00003;
      this._drawCloud(w * 0.15 + Math.sin(t) * 20, groundY * 0.2, 35);
      this._drawCloud(w * 0.78 + Math.cos(t * 0.7) * 15, groundY * 0.3, 28);
      ctx.restore();
    }
  }

  _drawCloud(x, y, size) {
    const ctx = this.ctx;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x - size * 0.35, y + size * 0.05, size * 0.35, 0, Math.PI * 2);
    ctx.arc(x + size * 0.15, y + size * 0.15, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

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

  // --- Mascot ---

  _drawMascot(desat) {
    if (!this.mascotLoaded) return;

    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const groundY = h * 0.65;

    // Sparky stands to the right of the tree, on the ground
    const mascotH = this.thumbnailMode ? h * 0.12 : h * 0.15;
    const mascotW = mascotH;
    const mx = w * 0.68;
    const my = groundY - mascotH * 0.88;

    ctx.save();
    if (desat > 0) ctx.globalAlpha = 1 - desat * 0.6;
    ctx.drawImage(this.mascotImg, mx, my, mascotW, mascotH);
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
