/**
 * Background canvas decoration that renders a slow ambient scene
 * (pond, capybaras, cherry petals, plants) behind every page. Marked
 * `"use client"` because the entire animation runs on a 2D canvas
 * driven by `requestAnimationFrame` and reacts to mouse/touch input.
 * Disabled by passing `enabled={false}`.
 */
"use client";

import { useEffect, useRef } from "react";

/** Individual capybara sprite state. */
type Capy = {
  x: number;
  y: number;
  homeX: number;
  vx: number;
  vy: number;
  facing: number;
  state: "idle" | "flee" | "curious" | "peek" | "hide";
  stateT: number;
  scale: number;
  bob: number;
  delay: number;
  seed: number;
  blink: number;
};

type Decor = {
  kind: string;
  x: number;
  y: number;
  size: number;
  tone: number;
  sway: number;
  petals?: number;
};

type Petal = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  vr: number;
  size: number;
  sway: number;
  opacity: number;
  hue: number;
};

type Pond = { x: number; y: number; rx: number; ry: number };

type State = {
  capys: Capy[];
  decor: Decor[];
  petals: Petal[];
  pond: Pond | null;
  mouse: { x: number; y: number; active: boolean };
  t: number;
  raf: number;
  w: number;
  h: number;
  dpr: number;
};

/**
 * Mount a full-viewport canvas that runs the ambient scene. Cleans up
 * the animation frame and DOM listeners on unmount.
 *
 * @param props.enabled - When false, returns null so the canvas is
 *   never inserted (used by reduced-motion contexts).
 */
export function AmbientWorld({ enabled = true }: { enabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<State>({
    capys: [],
    decor: [],
    petals: [],
    pond: null,
    mouse: { x: -9999, y: -9999, active: false },
    t: 0,
    raf: 0,
    w: 0,
    h: 0,
    dpr: 1,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const S = stateRef.current;

    const isMobile = () => window.innerWidth < 820;

    const makePetal = (initial: boolean): Petal => ({
      x: Math.random() * S.w,
      y: initial ? Math.random() * S.h : -20,
      vx: -0.3 - Math.random() * 0.5,
      vy: 0.4 + Math.random() * 0.6,
      r: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.04,
      size: 6 + Math.random() * 5,
      sway: Math.random() * Math.PI * 2,
      opacity: 0.55 + Math.random() * 0.3,
      hue: Math.random() > 0.5 ? 0 : 1,
    });

    const seed = () => {
      S.pond = {
        x: S.w - (isMobile() ? 100 : 200),
        y: S.h - 70,
        rx: isMobile() ? 80 : 140,
        ry: isMobile() ? 24 : 36,
      };
      const n = isMobile() ? 1 : 2;
      S.capys = Array.from({ length: n }, (_, i) => ({
        x: 120 + i * 320 + Math.random() * 80,
        y: S.h - 80 - Math.random() * 40,
        homeX: 0,
        vx: 0,
        vy: 0,
        facing: 1,
        state: "idle" as const,
        stateT: 0,
        scale: isMobile() ? 0.85 : 1,
        bob: Math.random() * Math.PI * 2,
        delay: i * 800,
        seed: Math.random() * 1000,
        blink: 0,
      }));
      const decorCount = isMobile() ? 6 : 12;
      S.decor = Array.from({ length: decorCount }, () => {
        const kinds = ["rock", "rock", "grass", "grass", "plant", "mushroom", "bamboo"];
        return {
          kind: kinds[Math.floor(Math.random() * kinds.length)],
          x: 60 + Math.random() * (S.w - 120),
          y: S.h - 30 - Math.random() * 70,
          size: 10 + Math.random() * 18,
          tone: Math.random(),
          sway: Math.random() * Math.PI * 2,
        };
      });
      const flowerCount = isMobile() ? 8 : 16;
      for (let i = 0; i < flowerCount; i++) {
        S.decor.push({
          kind: "flower",
          x: 80 + Math.random() * (S.w - 160),
          y: S.h - 22 - Math.random() * 60,
          size: 4 + Math.random() * 3,
          tone: Math.random(),
          sway: Math.random() * Math.PI * 2,
          petals: 4 + Math.floor(Math.random() * 3),
        });
      }
      if (S.pond) {
        S.decor.push({ kind: "lilypad", x: S.pond.x - 30, y: S.pond.y - 4, size: 14, tone: Math.random(), sway: 0 });
        S.decor.push({ kind: "lilypad", x: S.pond.x + 40, y: S.pond.y + 6, size: 11, tone: Math.random(), sway: 0 });
        S.decor.push({ kind: "lilypad", x: S.pond.x - 80, y: S.pond.y + 8, size: 9, tone: Math.random(), sway: 0 });
      }
      S.capys.forEach((c, i) => {
        const rocks = S.decor.filter((d) => d.kind === "rock");
        const decor = rocks[i % rocks.length];
        if (decor) c.homeX = decor.x;
        else c.homeX = c.x;
      });
      const petalCount = isMobile() ? 14 : 22;
      S.petals = Array.from({ length: petalCount }, () => makePetal(true));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      S.dpr = dpr;
      S.w = window.innerWidth;
      S.h = window.innerHeight;
      canvas.width = S.w * dpr;
      canvas.height = S.h * dpr;
      canvas.style.width = S.w + "px";
      canvas.style.height = S.h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const onMouse = (e: { clientX: number; clientY: number }) => {
      S.mouse.x = e.clientX;
      S.mouse.y = e.clientY;
      S.mouse.active = true;
    };
    const onLeave = () => {
      S.mouse.active = false;
    };
    const dist = (ax: number, ay: number, bx: number, by: number) =>
      Math.hypot(ax - bx, ay - by);

    const cssVar = (name: string, fb = "#1A1815") =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb;
    const inkVar = () => cssVar("--ink", "#1A1815");
    const ink2 = () => cssVar("--ink-2", "#3A352E");
    const ink3 = () => cssVar("--ink-3", "#6B6357");
    const ink4 = () => cssVar("--ink-4", "#9B9385");
    const tealVar = () => cssVar("--teal", "#7BB8B0");

    const drawPond = () => {
      if (!S.pond) return;
      const p = S.pond;
      const teal = tealVar();
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = teal;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx + 8, p.ry + 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.32;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = teal;
      ctx.lineWidth = 1;
      const ripPhase = (S.t * 0.001) % 1;
      for (let i = 0; i < 2; i++) {
        const rp = (ripPhase + i * 0.5) % 1;
        ctx.globalAlpha = 0.4 * (1 - rp);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.rx * (0.4 + rp * 0.6), p.ry * (0.4 + rp * 0.6), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) {
        const yOff = -p.ry * 0.3 + i * (p.ry * 0.3);
        ctx.beginPath();
        for (let x = -p.rx + 8; x < p.rx - 8; x += 4) {
          const wy = Math.sin(x * 0.08 + S.t * 0.003 + i) * 1.2;
          if (x === -p.rx + 8) ctx.moveTo(p.x + x, p.y + yOff + wy);
          else ctx.lineTo(p.x + x, p.y + yOff + wy);
        }
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawDecor = (d: Decor) => {
      const teal = tealVar();
      ctx.save();
      ctx.translate(d.x, d.y);
      if (d.kind === "rock") {
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = ink4();
        ctx.beginPath();
        ctx.ellipse(0, 0, d.size, d.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = ink3();
        ctx.beginPath();
        ctx.ellipse(-d.size * 0.3, -d.size * 0.2, d.size * 0.4, d.size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.kind === "grass") {
        const sway = Math.sin(S.t * 0.0015 + d.sway) * 1.5;
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = teal;
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 2, 0);
          ctx.quadraticCurveTo(i * 2 + sway * 0.5, -d.size * 0.4, i * 2 + sway, -d.size * (0.7 + Math.random() * 0.05));
          ctx.stroke();
        }
      } else if (d.kind === "plant") {
        const sway = Math.sin(S.t * 0.001 + d.sway) * 2;
        ctx.translate(sway, 0);
        ctx.fillStyle = teal;
        ctx.globalAlpha = 0.5;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.ellipse(i * 3, -d.size * 0.4 + Math.abs(i), 2, d.size * 0.6 - Math.abs(i) * 2, i * 0.15, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (d.kind === "mushroom") {
        ctx.fillStyle = ink3();
        ctx.globalAlpha = 0.7;
        ctx.fillRect(-2, -d.size * 0.3, 4, d.size * 0.5);
        ctx.fillStyle = "#a8624f";
        ctx.beginPath();
        ctx.ellipse(0, -d.size * 0.4, d.size * 0.4, d.size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.kind === "bamboo") {
        const sway = Math.sin(S.t * 0.0008 + d.sway) * 1;
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = teal;
        for (let seg = 0; seg < 4; seg++) {
          ctx.fillRect(-1.2 + sway * (seg * 0.3), -seg * 8 - 4, 2.5, 7);
        }
        ctx.beginPath();
        ctx.ellipse(2 + sway, -32, 6, 2, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-2 + sway, -28, 5, 2, -0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.kind === "flower") {
        const sway = Math.sin(S.t * 0.0014 + d.sway) * 1.4;
        const isYellow = d.tone < 0.5;
        const petalColor = isYellow ? "#F3D27A" : "#E89A8E";
        const petalLight = isYellow ? "#FCE9B0" : "#F4C4B7";
        const center = isYellow ? "#C98C3D" : "#A45A52";
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = tealVar();
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sway * 0.4, -d.size * 1.2, sway, -d.size * 2.4);
        ctx.stroke();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = tealVar();
        ctx.beginPath();
        ctx.ellipse(sway * 0.3 - 1.5, -d.size * 1.4, 2.2, 1, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.translate(sway, -d.size * 2.4);
        const n = d.petals ?? 5;
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2;
          ctx.save();
          ctx.rotate(ang);
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = petalColor;
          ctx.beginPath();
          ctx.ellipse(0, -d.size * 0.6, d.size * 0.45, d.size * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = petalLight;
          ctx.beginPath();
          ctx.ellipse(0, -d.size * 0.7, d.size * 0.25, d.size * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = center;
        ctx.beginPath();
        ctx.arc(0, 0, d.size * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-d.size * 0.1, -d.size * 0.1, d.size * 0.12, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.kind === "lilypad") {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = teal;
        ctx.beginPath();
        ctx.ellipse(0, 0, d.size, d.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = inkVar();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, d.size, -0.3, 0.3);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawCapy = (c: Capy) => {
      const cx = c.x;
      const cy = c.y;
      const f = c.facing;
      ctx.save();
      ctx.translate(cx, cy);
      const idleBob = Math.sin(S.t * 0.003 + c.bob) * (c.state === "flee" ? 0 : 1);
      const fleeStretch = c.state === "flee" ? 1.1 : 1;
      ctx.scale(f * fleeStretch, 1 / fleeStretch);
      ctx.translate(0, idleBob);

      const reveal = c.state === "hide" ? 0.25 : c.state === "peek" ? 0.55 : 1;
      const ink = inkVar();

      ctx.globalAlpha = 0.18;
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(0, 6 * c.scale, 26 * c.scale, 4 * c.scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      const body = ink3();
      const bodyDark = ink2();
      const fur = ink4();

      const drawRound = (x: number, y: number, w: number, h: number, r: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
      };

      if (reveal < 1) {
        ctx.beginPath();
        ctx.rect(-40 * c.scale, -40 * c.scale, 80 * c.scale, 80 * c.scale * reveal);
        ctx.clip();
      }

      drawRound(-22 * c.scale, -10 * c.scale, 44 * c.scale, 22 * c.scale, 11 * c.scale, body);
      ctx.globalAlpha = 0.35;
      drawRound(-18 * c.scale, -4 * c.scale, 36 * c.scale, 14 * c.scale, 8 * c.scale, fur);
      ctx.globalAlpha = 1;
      drawRound(10 * c.scale, -18 * c.scale, 22 * c.scale, 20 * c.scale, 10 * c.scale, body);
      ctx.globalAlpha = 0.25;
      drawRound(20 * c.scale, -8 * c.scale, 8 * c.scale, 5 * c.scale, 3 * c.scale, "#d97757");
      ctx.globalAlpha = 1;
      drawRound(13 * c.scale, -22 * c.scale, 6 * c.scale, 6 * c.scale, 2 * c.scale, body);
      drawRound(14 * c.scale, -21 * c.scale, 4 * c.scale, 3 * c.scale, 1.5 * c.scale, bodyDark);
      const blinkOpen = c.blink > 0 ? 0.2 : 1;
      ctx.fillStyle = ink;
      ctx.fillRect(
        Math.round(22 * c.scale),
        Math.round(-12 * c.scale),
        Math.round(3 * c.scale),
        Math.round(3 * c.scale * blinkOpen),
      );
      if (blinkOpen > 0.5) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(Math.round(23 * c.scale), Math.round(-12 * c.scale), Math.round(c.scale), Math.round(c.scale));
      }
      ctx.fillStyle = ink;
      ctx.fillRect(Math.round(30 * c.scale), Math.round(-8 * c.scale), Math.round(2.5 * c.scale), Math.round(2 * c.scale));
      const stride =
        c.state === "flee"
          ? Math.sin(S.t * 0.05) * 4
          : c.state === "curious"
            ? Math.sin(S.t * 0.02) * 1.5
            : 0;
      drawRound(-18 * c.scale, 8 * c.scale, 6 * c.scale, 6 * c.scale + stride, 2, body);
      drawRound(10 * c.scale, 8 * c.scale, 6 * c.scale, 6 * c.scale - stride, 2, body);

      ctx.restore();

      if (c.state === "curious" && reveal === 1) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = inkVar();
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.fillText("?", cx + 18 * f, cy - 26 * c.scale);
        ctx.globalAlpha = 1;
      }
    };

    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = p.opacity;
      const grad = ctx.createLinearGradient(0, -p.size, 0, p.size);
      const c1 = p.hue === 0 ? "#fce0e6" : "#fdeef0";
      const c2 = p.hue === 0 ? "#f6b9c4" : "#f3d4d8";
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.7, -p.size * 0.6, p.size * 0.5, p.size * 0.3, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.5, p.size * 0.3, -p.size * 0.7, -p.size * 0.6, 0, -p.size);
      ctx.fill();
      ctx.globalAlpha = p.opacity * 0.35;
      ctx.fillStyle = "#c98497";
      ctx.beginPath();
      ctx.moveTo(0, p.size * 0.6);
      ctx.lineTo(p.size * 0.15, p.size);
      ctx.lineTo(-p.size * 0.15, p.size);
      ctx.fill();
      ctx.restore();
    };

    const update = (dt: number) => {
      S.t += dt;

      S.petals.forEach((p) => {
        p.x += p.vx + Math.sin(S.t * 0.0008 + p.sway) * 0.4;
        p.y += p.vy;
        p.r += p.vr;
        if (p.y > S.h + 30 || p.x < -30) {
          Object.assign(p, makePetal(false));
        }
      });

      S.capys.forEach((c) => {
        if (Math.random() < 0.005) c.blink = 6;
        if (c.blink > 0) c.blink -= 1;

        const dm = dist(c.x, c.y, S.mouse.x, S.mouse.y);
        const close = 180;
        const veryClose = 90;

        if (S.mouse.active && dm < veryClose) {
          c.state = "flee";
          c.stateT = 0;
          const dx = c.x - S.mouse.x;
          const targetVx = Math.sign(dx) * 4;
          c.vx += (targetVx - c.vx) * 0.2;
          c.facing = c.vx < 0 ? -1 : 1;
        } else if (S.mouse.active && dm < close) {
          c.state = "curious";
          c.facing = S.mouse.x > c.x ? 1 : -1;
          c.vx *= 0.85;
        } else {
          c.stateT += dt;
          if (c.state === "flee" && c.stateT < 1500) {
            c.vx *= 0.96;
          } else {
            const dh = c.homeX - c.x;
            if (Math.abs(dh) > 4) {
              c.vx += Math.sign(dh) * 0.05;
              c.vx *= 0.92;
              c.facing = c.vx < 0 ? -1 : 1;
              c.state = "idle";
            } else {
              c.vx *= 0.85;
              const cycle = (S.t / 12000 + c.seed) % 1;
              if (cycle < 0.06) c.state = "peek";
              else c.state = "idle";
            }
          }
        }
        c.x += c.vx;
        if (c.x < 40) {
          c.x = 40;
          c.vx = Math.abs(c.vx);
        }
        if (c.x > S.w - 40) {
          c.x = S.w - 40;
          c.vx = -Math.abs(c.vx);
        }
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, S.w, S.h);
      drawPond();
      S.decor.forEach(drawDecor);
      S.capys.forEach(drawCapy);
      S.petals.forEach(drawPetal);
    };

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(now - last, 60);
      last = now;
      update(dt);
      draw();
      S.raf = requestAnimationFrame(loop);
    };

    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) onMouse({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch);
    window.addEventListener("mouseleave", onLeave);
    S.raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(S.raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  if (!enabled) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.95 }}
      aria-hidden="true"
    />
  );
}
