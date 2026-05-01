import { useEffect, useRef, useState, useCallback } from "react";

const FISH = [
  { id: "clownfish", emoji: "🐠", name: "Clownfish", size: 28, speed: 1.2, hp: 1, reward: 2, color: "#ff6b35", weight: 20, pts: 5 },
  { id: "fish", emoji: "🐟", name: "Blue Fish", size: 30, speed: 1.4, hp: 1, reward: 3, color: "#4488ff", weight: 18, pts: 8 },
  { id: "puffer", emoji: "🐡", name: "Puffer", size: 32, speed: 0.8, hp: 2, reward: 5, color: "#ffaa00", weight: 15, pts: 12 },
  { id: "crab", emoji: "🦀", name: "Crab", size: 34, speed: 0.6, hp: 2, reward: 8, color: "#ff4444", weight: 12, pts: 15 },
  { id: "shrimp", emoji: "🦐", name: "Shrimp", size: 26, speed: 1.8, hp: 1, reward: 4, color: "#ff8888", weight: 14, pts: 10 },
  { id: "octopus", emoji: "🐙", name: "Octopus", size: 44, speed: 0.9, hp: 4, reward: 20, color: "#aa44ff", weight: 8, pts: 30 },
  { id: "lobster", emoji: "🦞", name: "Lobster", size: 42, speed: 0.7, hp: 3, reward: 15, color: "#ff3333", weight: 8, pts: 25 },
  { id: "squid", emoji: "🦑", name: "Squid", size: 40, speed: 1.5, hp: 3, reward: 18, color: "#8844ff", weight: 7, pts: 28 },
  { id: "dolphin", emoji: "🐬", name: "Dolphin", size: 60, speed: 2.0, hp: 6, reward: 50, color: "#4488ff", weight: 4, pts: 80 },
  { id: "turtle", emoji: "🐢", name: "Turtle", size: 56, speed: 0.5, hp: 8, reward: 60, color: "#44aa44", weight: 3, pts: 100 },
  { id: "shark", emoji: "🦈", name: "Shark", size: 72, speed: 1.8, hp: 10, reward: 100, color: "#4466aa", weight: 2, pts: 150 },
  { id: "whale", emoji: "🐳", name: "Whale", size: 100, speed: 0.8, hp: 25, reward: 300, color: "#2266cc", weight: 1, pts: 500 },
  { id: "mermaid", emoji: "🧜", name: "Mermaid", size: 80, speed: 1.2, hp: 15, reward: 200, color: "#ff88cc", weight: 1, pts: 350 },
  { id: "kraken", emoji: "🐲", name: "Sea Dragon", size: 120, speed: 0.6, hp: 40, reward: 500, color: "#aa00ff", weight: 0.5, pts: 800 },
];

const GUNS = [
  { name: "PISTOL", cost: 1, dmg: 1, color: "#00e5ff", size: 6, spread: 0, spd: 9, emoji: "🔫", label: "1 coin" },
  { name: "LASER", cost: 3, dmg: 3, color: "#ff1744", size: 4, spread: 0, spd: 15, emoji: "⚡", label: "3 coins" },
  { name: "CANNON", cost: 10, dmg: 8, color: "#f5c842", size: 10, spread: 28, spd: 11, emoji: "💥", label: "10 coins" },
  { name: "TSUNAMI", cost: 50, dmg: 20, color: "#00bcd4", size: 15, spread: 75, spd: 7, emoji: "🌊", label: "50 coins" },
];

export default function FishHunter() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef({
    coins: 10000, score: 0, caught: 0, level: 1, mult: 1,
    shots: 0, hits: 0, profit: 0,
    gun: 0, auto: false,
    fishes: [], bullets: [], parts: [], bubbles: [], treasures: [],
    mx: 200, my: 200, frame: 0, lastShot: 0,
  });

  const [ui, setUi] = useState({
    coins: 10000, score: 0, caught: 0, level: 1, mult: 1,
    shots: 0, hits: 0, profit: 0,
  });
  const [gun, setGun] = useState(0);
  const [auto, setAuto] = useState(false);
  const [levelMsg, setLevelMsg] = useState("");
  const [floats, setFloats] = useState([]);
  const autoRef = useRef(false);
  const gunRef = useRef(0);

  const randFish = () => {
    const tot = FISH.reduce((s, f) => s + f.weight, 0);
    let r = Math.random() * tot;
    for (const f of FISH) { r -= f.weight; if (r <= 0) return f; }
    return FISH[0];
  };

  const hitParts = (x, y, color, n, parts) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, sz: 3 + Math.random() * 5, color, life: 1, dec: 0.05 });
    }
  };

  const floatScore = useCallback((x, y, text, color) => {
    const id = Math.random();
    setFloats(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1000);
  }, []);

  const checkLevel = useCallback((s) => {
    const st = stateRef.current;
    if (s >= st.level * 500) {
      st.level++;
      st.mult = 1 + Math.floor(st.level / 3) * 0.5;
      setLevelMsg(`⭐ LEVEL ${st.level}! ×${st.mult} MULT ⭐`);
      setTimeout(() => setLevelMsg(""), 2000);
    }
  }, []);

  const shoot = useCallback((tx, ty) => {
    const st = stateRef.current;
    const g = GUNS[gunRef.current];
    const now = Date.now();
    const cd = [120, 80, 300, 500][gunRef.current];
    if (now - st.lastShot < cd) return;
    if (st.coins < g.cost) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    st.coins -= g.cost;
    st.profit -= g.cost;
    st.shots++;
    st.lastShot = now;
    const ang = Math.atan2(ty - (canvas.height - 25), tx - canvas.width / 2);
    const cnt = g.spread > 0 ? 3 : 1;
    for (let i = 0; i < cnt; i++) {
      const sa = cnt > 1 ? (i - 1) * (g.spread / 180 * Math.PI / 2) : 0;
      const a = ang + sa;
      st.bullets.push({ x: canvas.width / 2, y: canvas.height - 25, vx: Math.cos(a) * g.spd, vy: Math.sin(a) * g.spd, sz: g.size, color: g.color, dmg: g.dmg, life: 1, trail: [] });
    }
    for (let i = 0; i < 8; i++) {
      const pa = ang + (Math.random() - 0.5) * 1.2;
      st.parts.push({ x: canvas.width / 2, y: canvas.height - 25, vx: Math.cos(pa) * (2 + Math.random() * 4), vy: Math.sin(pa) * (2 + Math.random() * 4), sz: 3 + Math.random() * 4, color: g.color, life: 1, dec: 0.08 });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = wrap.clientWidth;
      canvas.height = wrap.clientHeight - 50 - 64;
    };
    resize();
    window.addEventListener("resize", resize);

    let animId;
    const loop = () => {
      update();
      render(ctx, canvas);
      animId = requestAnimationFrame(loop);
    };

    const update = () => {
      const st = stateRef.current;
      st.frame++;
      const sr = Math.max(25, 80 - st.level * 3);
      if (st.frame % sr === 0) {
        const t = randFish();
        const right = Math.random() > 0.5;
        const sm = 1 + (st.level - 1) * 0.07;
        st.fishes.push({
          ...t, x: right ? canvas.width + t.size : -t.size,
          y: 40 + Math.random() * (canvas.height - 130),
          vy: (Math.random() - 0.5) * 0.3, dir: right ? -1 : 1,
          chp: t.hp, maxHp: t.hp, wobble: Math.random() * Math.PI * 2,
          ws: 0.03 + Math.random() * 0.02, uid: Math.random(),
          spd: t.speed * sm, flash: 0, dead: false, dt: 0,
        });
      }
      if (st.frame % 12 === 0) {
        st.bubbles.push({ x: Math.random() * canvas.width, y: canvas.height, r: 2 + Math.random() * 5, spd: 0.3 + Math.random() * 0.5, w: Math.random() * Math.PI * 2, op: 0.2 + Math.random() * 0.3 });
      }

      st.fishes.forEach(f => {
        if (f.dead) { f.dt++; return; }
        f.wobble += f.ws; f.x += f.dir * f.spd;
        f.y += f.vy + Math.sin(f.wobble) * 0.3;
        f.y = Math.max(f.size, Math.min(canvas.height - f.size - 55, f.y));
        if (f.flash > 0) f.flash -= 0.1;
      });
      st.fishes = st.fishes.filter(f => (!f.dead || f.dt < 18) && f.x > -200 && f.x < canvas.width + 200);

      st.bullets.forEach(b => {
        b.trail.unshift({ x: b.x, y: b.y });
        if (b.trail.length > 8) b.trail.pop();
        b.x += b.vx; b.y += b.vy; b.life -= 0.012;
        st.fishes.forEach(f => {
          if (f.dead) return;
          const dx = b.x - f.x, dy = b.y - f.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < f.size * 0.6) {
            f.chp -= b.dmg; f.flash = 1; b.life = 0; st.hits++;
            if (f.chp <= 0) {
              f.dead = true;
              const rw = f.reward * st.mult;
              st.coins += rw; st.score += f.pts * st.level; st.caught++; st.profit += rw;
              hitParts(f.x, f.y, f.color, 15, st.parts);
              for (let i = 0; i < 4; i++) {
                const a = Math.random() * Math.PI * 2;
                st.treasures.push({ x: f.x + Math.cos(a) * 20, y: f.y + Math.sin(a) * 20, emoji: "🪙", life: 1, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5 - 1 });
              }
              floatScore(f.x, f.y, "+" + rw, f.color);
              checkLevel(st.score);
            } else {
              hitParts(f.x, f.y, f.color, 4, st.parts);
            }
          }
        });
      });
      st.bullets = st.bullets.filter(b => b.life > 0 && b.x > -20 && b.x < canvas.width + 20 && b.y > -20 && b.y < canvas.height + 20);

      st.parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= p.dec || 0.04; p.sz *= 0.97; });
      st.parts = st.parts.filter(p => p.life > 0);
      st.bubbles.forEach(b => { b.y -= b.spd; b.w += 0.05; b.x += Math.sin(b.w) * 0.3; });
      st.bubbles = st.bubbles.filter(b => b.y > -20);
      st.treasures.forEach(t => { t.life -= 0.025; t.y -= 0.6; t.x += t.vx; });
      st.treasures = st.treasures.filter(t => t.life > 0);

      if (autoRef.current) {
        let nearest = null, nd = Infinity;
        st.fishes.forEach(f => {
          if (f.dead) return;
          const dx = f.x - canvas.width / 2, dy = f.y - (canvas.height - 25);
          const d = Math.sqrt(dx * dx + dy * dy) / (f.reward * 2);
          if (d < nd) { nd = d; nearest = f; }
        });
        if (nearest) shoot(nearest.x, nearest.y);
      }

      setUi({ coins: st.coins, score: st.score, caught: st.caught, level: st.level, mult: st.mult, shots: st.shots, hits: st.hits, profit: st.profit });
    };

    const render = (ctx, canvas) => {
      const st = stateRef.current;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#001428"); bg.addColorStop(0.4, "#002050"); bg.addColorStop(0.8, "#001535"); bg.addColorStop(1, "#000c18");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < 6; i++) {
        const rx = W * 0.1 + i * W * 0.16 + Math.sin(st.frame * 0.005 + i) * 25;
        const rg = ctx.createLinearGradient(rx - 20, 0, rx + 20, H);
        rg.addColorStop(0, "rgba(0,150,255,0.04)"); rg.addColorStop(1, "rgba(0,100,200,0)");
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.moveTo(rx - 25, 0); ctx.lineTo(rx + 25, 0); ctx.lineTo(rx + 55, H); ctx.lineTo(rx - 55, H); ctx.closePath(); ctx.fill();
      }

      ctx.fillStyle = "#081a0e";
      ctx.beginPath(); ctx.moveTo(0, H - 28);
      for (let x = 0; x < W; x += 18) ctx.lineTo(x, H - 24 + Math.sin(x * 0.05 + st.frame * 0.01) * 4);
      ctx.lineTo(W, H - 28); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

      for (let i = 0; i < 7; i++) {
        const bx = 60 + i * W / 7 + Math.sin(i * 1.5) * 15;
        ctx.strokeStyle = `rgba(0,${80 + i * 10},${15 + i * 5},0.5)`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(bx, H - 26);
        for (let s = 0; s < 5; s++) ctx.lineTo(bx + Math.sin(st.frame * 0.02 + i + s) * 8, H - 26 - s * 11);
        ctx.stroke();
      }

      ["🪸", "🐚", "⭐", "🪨", "🌿"].forEach((c, i) => {
        ctx.globalAlpha = 0.45; ctx.font = "14px serif"; ctx.textAlign = "center";
        ctx.fillText(c, 80 + i * (W / 5), H - 13);
      });
      ctx.globalAlpha = 1;

      st.bubbles.forEach(b => {
        ctx.save(); ctx.globalAlpha = b.op;
        ctx.strokeStyle = "rgba(100,200,255,0.6)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      });

      st.treasures.forEach(t => {
        ctx.save(); ctx.globalAlpha = t.life;
        ctx.font = "13px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(t.emoji, t.x, t.y); ctx.restore();
      });

      st.fishes.forEach(f => {
        if (f.dead && f.dt > 6) return;
        ctx.save(); ctx.translate(f.x, f.y);
        if (f.dir === -1) ctx.scale(-1, 1);
        ctx.globalAlpha = f.dead ? 0.3 : 1;
        if (f.flash > 0) ctx.filter = `brightness(${2 + f.flash * 3})`;
        if (f.reward >= 200) { ctx.shadowColor = f.color; ctx.shadowBlur = 18; }
        ctx.font = `${f.size * 2}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(f.emoji, 0, Math.sin(f.wobble) * 2.5);
        ctx.filter = "none"; ctx.shadowBlur = 0; ctx.restore();

        if (f.maxHp > 1 && !f.dead) {
          const bw = f.size * 1.5, bh = 4, bx = f.x - bw / 2, by = f.y - f.size - 7;
          ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(bx, by, bw, bh);
          const p = f.chp / f.maxHp;
          ctx.fillStyle = p > 0.5 ? "#00e676" : p > 0.25 ? "#f5c842" : "#ff1744";
          ctx.fillRect(bx, by, bw * p, bh);
          if (f.reward >= 50) {
            ctx.fillStyle = f.color; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center";
            ctx.fillText(f.name.toUpperCase(), f.x, by - 5);
          }
        }
        if (f.reward >= 20 && !f.dead) {
          ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
          ctx.fillStyle = "rgba(245,200,66,0.75)";
          ctx.fillText("+" + f.reward, f.x, f.y + f.size + 11);
        }
      });

      st.bullets.forEach(b => {
        b.trail.forEach((pt, i) => {
          ctx.save(); ctx.globalAlpha = (1 - i / b.trail.length) * b.life * 0.35;
          ctx.fillStyle = b.color; ctx.beginPath();
          ctx.arc(pt.x, pt.y, b.sz * (1 - i / b.trail.length) * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        });
        ctx.save(); ctx.globalAlpha = b.life;
        ctx.shadowColor = b.color; ctx.shadowBlur = b.sz * 2.5;
        ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.sz, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      });

      st.parts.forEach(p => {
        ctx.save(); ctx.globalAlpha = p.life;
        ctx.shadowColor = p.color; ctx.shadowBlur = 7;
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      });

      const cx = W / 2, cy = H - 25;
      const ang = Math.atan2(st.my - cy, st.mx - cx);
      ctx.save(); ctx.translate(cx, cy);
      const bg2 = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
      bg2.addColorStop(0, "#2a3a5a"); bg2.addColorStop(1, "#0d1528");
      ctx.fillStyle = bg2; ctx.strokeStyle = "rgba(0,200,255,0.4)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.rotate(ang);
      ctx.fillStyle = "#2a3a5a"; ctx.strokeStyle = "rgba(0,200,255,0.5)"; ctx.lineWidth = 1.5;
      ctx.fillRect(4, -5, 30, 10); ctx.strokeRect(4, -5, 30, 10);
      ctx.shadowColor = GUNS[gunRef.current].color; ctx.shadowBlur = 12;
      ctx.fillStyle = GUNS[gunRef.current].color; ctx.beginPath(); ctx.arc(34, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.restore();

      ctx.save();
      ctx.strokeStyle = "rgba(0,200,255,0.12)"; ctx.lineWidth = 1; ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * 30, cy + Math.sin(ang) * 30); ctx.lineTo(cx + Math.cos(ang) * 70, cy + Math.sin(ang) * 70); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(0,200,255,0.45)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(st.mx, st.my, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(st.mx - 22, st.my); ctx.lineTo(st.mx - 8, st.my); ctx.moveTo(st.mx + 8, st.my); ctx.lineTo(st.mx + 22, st.my);
      ctx.moveTo(st.mx, st.my - 22); ctx.lineTo(st.mx, st.my - 8); ctx.moveTo(st.mx, st.my + 8); ctx.lineTo(st.mx, st.my + 22);
      ctx.stroke(); ctx.restore();

      if (st.mult > 1) {
        ctx.save(); ctx.font = "bold 12px monospace";
        ctx.fillStyle = `rgba(245,200,66,${0.6 + Math.sin(st.frame * 0.05) * 0.3})`;
        ctx.textAlign = "right"; ctx.fillText(`×${st.mult} MULTIPLIER`, W - 10, 20); ctx.restore();
      }
      ctx.save(); ctx.font = "11px monospace"; ctx.fillStyle = "rgba(0,200,255,0.35)"; ctx.textAlign = "left";
      ctx.fillText(`FISH: ${st.fishes.filter(f => !f.dead).length}`, 10, 20); ctx.restore();
    };

    loop();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [shoot, floatScore, checkLevel]);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    stateRef.current.mx = e.clientX - rect.left;
    stateRef.current.my = e.clientY - rect.top;
  };

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    shoot(e.clientX - rect.left, e.clientY - rect.top);
  };

  const selectGun = (i) => {
    gunRef.current = i;
    setGun(i);
  };

  const toggleAuto = () => {
    autoRef.current = !autoRef.current;
    setAuto(autoRef.current);
  };

  const profit = ui.profit;

  return (
    <div ref={wrapRef} className="relative flex flex-col w-full h-screen bg-black font-sans overflow-hidden">
      {/* TOP BAR */}
      <div className="flex-shrink-0 h-[50px] flex items-center justify-between px-3 gap-2 border-b border-cyan-400/20"
        style={{ background: "linear-gradient(180deg,#0a1628,#0d1f3c)", boxShadow: "0 2px 20px rgba(0,150,255,0.15)" }}>
        <div className="text-2xl font-black tracking-widest"
          style={{ fontFamily: "'Bebas Neue',cursive", background: "linear-gradient(135deg,#00e5ff,#00bcd4,#0288d1)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          🐟 FISH HUNTER
        </div>
        <div className="flex gap-1.5">
          {[
            { label: "COINS", val: ui.coins.toLocaleString(), cls: "text-yellow-300" },
            { label: "SCORE", val: ui.score.toLocaleString(), cls: "text-cyan-300" },
            { label: "CAUGHT", val: ui.caught, cls: "text-green-400" },
            { label: "LEVEL", val: ui.level, cls: "text-yellow-300" },
            { label: "MULT", val: `×${ui.mult}`, cls: "text-cyan-300" },
          ].map(({ label, val, cls }) => (
            <div key={label} className="bg-black/40 border border-cyan-400/20 rounded-md px-2.5 py-1 text-center">
              <div className="text-[7px] text-cyan-400/50 tracking-widest">{label}</div>
              <div className={`text-[13px] font-bold font-mono ${cls}`}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CANVAS */}
      <canvas ref={canvasRef} className="flex-1 block cursor-crosshair"
        onMouseMove={handleMouseMove} onClick={handleClick} />

      {/* BOTTOM BAR */}
      <div className="flex-shrink-0 h-[64px] flex items-center gap-2 px-3 border-t border-cyan-400/20"
        style={{ background: "linear-gradient(180deg,#0d1f3c,#0a1628)", boxShadow: "0 -2px 20px rgba(0,150,255,0.15)" }}>
        <div className="flex gap-1.5">
          {GUNS.map((g, i) => (
            <button key={i} onClick={() => selectGun(i)}
              className={`px-2.5 py-1 rounded-lg border-2 text-center transition-all cursor-pointer font-bold tracking-wider text-[11px] ${gun === i ? "border-cyan-400 text-cyan-400 bg-cyan-400/10 shadow-[0_0_10px_rgba(0,200,255,0.3)]" : "border-transparent text-white/40 bg-black/40"}`}>
              <span className="block text-[12px]">{g.emoji} {g.name}</span>
              <span className="text-[9px] text-yellow-400/70">{g.label}</span>
            </button>
          ))}
        </div>

        <div className="w-px h-10 bg-cyan-400/15" />

        <div className="flex flex-1 gap-1.5 items-center">
          {[
            { label: "SHOTS", val: ui.shots },
            { label: "ACCURACY", val: ui.shots > 0 ? Math.round(ui.hits / ui.shots * 100) + "%" : "0%" },
            { label: "PROFIT", val: (profit >= 0 ? "+" : "") + profit.toLocaleString(), color: profit >= 0 ? "#00e676" : "#ff5252" },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex-1 bg-black/50 border border-cyan-400/20 rounded-lg px-2.5 py-1">
              <div className="text-[7px] text-cyan-400/50 tracking-widest">{label}</div>
              <div className="text-[15px] font-bold font-mono text-cyan-300" style={color ? { color } : {}}>{val}</div>
            </div>
          ))}
        </div>

        <div className="w-px h-10 bg-cyan-400/15" />

        <button onClick={toggleAuto}
          className={`px-3 py-1.5 rounded-lg border-2 font-bold tracking-widest text-[12px] transition-all cursor-pointer whitespace-nowrap ${auto ? "border-orange-500 text-orange-400 bg-orange-500/20 shadow-[0_0_12px_rgba(255,100,0,0.3)]" : "border-orange-400/40 text-orange-400/70 bg-orange-500/10"}`}>
          🔥 {auto ? "AUTO: ON" : "AUTO FIRE"}
        </button>
      </div>

      {/* LEVEL BANNER */}
      {levelMsg && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 rounded-xl px-6 py-2 z-50 font-black tracking-widest text-[20px] text-amber-900 border-2 border-yellow-400"
          style={{ fontFamily: "'Bebas Neue',cursive", background: "linear-gradient(135deg,rgba(245,200,66,0.95),rgba(255,150,0,0.95))" }}>
          {levelMsg}
        </div>
      )}

      {/* FLOAT SCORES */}
      {floats.map(f => (
        <div key={f.id} className="absolute pointer-events-none z-50 font-bold text-sm font-mono"
          style={{ left: f.x, top: f.y - 20, color: f.color, textShadow: `0 0 8px ${f.color}`, animation: "floatUp 1s ease-out forwards" }}>
          {f.text}
        </div>
      ))}

      <style>{`@keyframes floatUp{0%{opacity:1;transform:translateY(0);}100%{opacity:0;transform:translateY(-70px);}}`}</style>
    </div>
  );
}
