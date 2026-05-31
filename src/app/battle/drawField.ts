// Canvas renderer for the defense field. Pure draw from engine state.
import type { BattleEngine } from '@/game/battle/engine';

const ENEMY_STYLE: Record<string, { fill: string; edge: string; glow: string }> = {
  NORMAL: { fill: '#2bff88', edge: 'rgba(43,255,136,.7)', glow: 'rgba(43,255,136,.5)' },
  RUSH: { fill: '#ff2a6d', edge: 'rgba(255,42,109,.8)', glow: 'rgba(255,42,109,.5)' },
  HEAVY: { fill: '#ffd400', edge: 'rgba(255,212,0,.8)', glow: 'rgba(255,212,0,.5)' },
};

function resolveColor(ctx: CanvasRenderingContext2D, v: string): string {
  if (v.startsWith('var(')) {
    const name = v.slice(4, -1).trim();
    const c = getComputedStyle(ctx.canvas).getPropertyValue(name).trim();
    return c || '#00eaff';
  }
  return v;
}

export function drawField(ctx: CanvasRenderingContext2D, engine: BattleEngine, w: number, h: number, reducedFx: boolean): void {
  ctx.clearRect(0, 0, w, h);

  const lanes = 3;
  const laneW = w / lanes;
  const coreH = 26;
  const fieldH = h - coreH;

  // lane backdrops + separators
  for (let l = 0; l < lanes; l++) {
    const x = l * laneW;
    const grad = ctx.createLinearGradient(0, 0, 0, fieldH);
    grad.addColorStop(0, 'rgba(255,42,109,0.05)');
    grad.addColorStop(0.4, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, laneW, fieldH);
    if (l > 0) {
      ctx.strokeStyle = 'rgba(40,48,68,0.6)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, fieldH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  const posToY = (pos: number) => pos * fieldH;

  // deployed units
  for (const u of engine.units) {
    const cx = u.lane * laneW + laneW / 2;
    const cy = posToY(u.pos);
    const col = resolveColor(ctx, u.color);
    if (!reducedFx) {
      ctx.shadowColor = col;
      ctx.shadowBlur = 12;
    }
    ctx.fillStyle = col;
    roundRect(ctx, cx - 15, cy - 18, 30, 36, 9);
    ctx.fill();
    ctx.shadowBlur = 0;
    // inner core dot
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 6, 0, Math.PI * 2);
    ctx.fill();
    // hp bar
    drawHp(ctx, cx - 16, cy + 20, 32, u.hp / u.maxHp, col);
  }

  // enemies
  for (const e of engine.enemies) {
    const cx = e.lane * laneW + laneW / 2;
    const cy = posToY(e.pos);
    const s = ENEMY_STYLE[e.kind];
    const size = e.kind === 'HEAVY' ? 17 : 12;
    if (!reducedFx) {
      ctx.shadowColor = s.glow;
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = s.fill;
    roundRect(ctx, cx - size, cy - size, size * 2, size * 2, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = s.edge;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - size + 4, cy - size + 4, size * 2 - 8, size * 2 - 8);
    drawHp(ctx, cx - size, cy - size - 6, size * 2, e.hp / e.maxHp, s.fill);
  }

  // particles
  for (const p of engine.particles) {
    const alpha = Math.max(0, p.ttl / p.maxTtl);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = resolveColor(ctx, p.color);
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * fieldH, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // fx
  for (const f of engine.fx) {
    const cx = f.lane * laneW + laneW / 2;
    const cy = posToY(f.pos);
    const alpha = f.ttl / f.maxTtl;
    const col = resolveColor(ctx, f.color);
    ctx.globalAlpha = Math.max(0, alpha);
    if (f.text) {
      ctx.fillStyle = col;
      ctx.font = 'bold 12px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, cx, cy - (1 - alpha) * 18);
    } else {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      const r = (1 - alpha) * 16 + 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // core
  const cyan = resolveColor(ctx, 'var(--cyan)');
  ctx.fillStyle = '#08121c';
  roundRect(ctx, w / 2 - 34, h - coreH, 68, coreH - 2, 6);
  ctx.fill();
  ctx.strokeStyle = cyan;
  ctx.lineWidth = 1;
  if (!reducedFx) {
    ctx.shadowColor = cyan;
    ctx.shadowBlur = 14;
  }
  roundRect(ctx, w / 2 - 34, h - coreH, 68, coreH - 2, 6);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = cyan;
  ctx.font = '8px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DATA CORE', w / 2, h - coreH / 2 + 1);

  // overclock tint
  if (engine.overclockActive > 0 && !reducedFx) {
    ctx.fillStyle = 'rgba(0,234,255,0.05)';
    ctx.fillRect(0, 0, w, h);
  }
}

function drawHp(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, ratio: number, color: string) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, width, 3);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * Math.max(0, Math.min(1, ratio)), 3);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
