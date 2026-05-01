import { useEffect, useRef, useState, useCallback } from "react";

const REELS = 5;
const ROWS = 3;
const SYMBOL_SIZE = 110;

const SYMS = [
  { id: "wild",    char: "🌟", label: "WILD",  color: "#FFD700", bg: "#2a1a00", weight: 1, pay: [0,0,50,200,1000] },
  { id: "treasure",char: "🏺", label: "URN",   color: "#FFD700", bg: "#2a1500", weight: 2, pay: [0,0,30,150,600]  },
  { id: "cat",     char: "🐱", label: "CAT",   color: "#ffcc88", bg: "#1a0a00", weight: 2, pay: [0,0,25,120,500]  },
  { id: "coin",    char: "🪙", label: "COIN",  color: "#FFD700", bg: "#1a1000", weight: 3, pay: [0,0,20,100,400]  },
  { id: "A",       char: "A",  label: "A",     color: "#ff4444", bg: "#200010", weight: 4, pay: [0,0,15,75,300]   },
  { id: "K",       char: "K",  label: "K",     color: "#aa44ff", bg: "#15001a", weight: 4, pay: [0,0,12,60,250]   },
  { id: "Q",       char: "Q",  label: "Q",     color: "#4488ff", bg: "#001020", weight: 5, pay: [0,0,10,50,200]   },
  { id: "J",       char: "J",  label: "J",     color: "#44ccff", bg: "#001018", weight: 5, pay: [0,0,8,40,150]    },
  { id: "10",      char: "10", label: "10",    color: "#44ff88", bg: "#001208", weight: 6, pay: [0,0,6,30,100]    },
  { id: "9",       char: "9",  label: "9",     color: "#88ff44", bg: "#081200", weight: 6, pay: [0,0,5,25,80]     },
  { id: "scatter", char: "☀️", label: "BONUS", color: "#FFD700", bg: "#1a1000", weight: 2, pay: [0,0,5,20,100]   },
];

function randSym() {
  const total = SYMS.reduce((s, sym) => s + sym.weight, 0);
  let r = Math.random() * total;
  for (const sym of SYMS) { r -= sym.weight; if (r <= 0) return sym; }
  return SYMS[SYMS.length - 1];
}

function lighten(hex, amt) {
  try {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, (num >> 16) + amt);
    const g = Math.min(255, ((num >> 8) & 0xff) + amt);
    const b = Math.min(255, (num & 0xff) + amt);
    return `rgb(${r},${g},${b})`;
  } catch { return hex; }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSymbol(ctx, sym, x, y, w, h, spinning) {
  const pad = 6;
  const rx = x + pad, ry = y + pad, rw = w - pad * 2, rh = h - pad * 2;
  ctx.save();
  roundRect(ctx, rx, ry, rw, rh, 8);
  const bgGrad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  bgGrad.addColorStop(0, lighten(sym.bg, 20));
  bgGrad.addColorStop(1, sym.bg);
  ctx.fillStyle = bgGrad;
  ctx.fill();
  ctx.strokeStyle = spinning ? "rgba(200,150,0,0.2)" : `${sym.color}44`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  if (spinning) return;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cx = x + w / 2, cy = y + h / 2;
  const isCard = ["A","K","Q","J","10","9"].includes(sym.id);

  if (isCard) {
    ctx.font = `bold ${Math.floor(h * 0.45)}px Cinzel, serif`;
    ctx.fillStyle = sym.color;
    ctx.shadowColor = sym.color;
    ctx.shadowBlur = 12;
    ctx.fillText(sym.char, cx, cy - 8);
    ctx.shadowBlur = 0;
    ctx.font = `bold 10px Cinzel, serif`;
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(sym.label, cx, y + h - 14);
  } else {
    ctx.font = `${Math.floor(h * 0.48)}px serif`;
    ctx.shadowColor = sym.color;
    ctx.shadowBlur = 15;
    ctx.fillText(sym.char, cx, cy - 6);
    ctx.shadowBlur = 0;
    ctx.font = `bold 10px Cinzel, serif`;
    ctx.fillStyle = sym.color;
    ctx.fillText(sym.label, cx, y + h - 12);
  }
  ctx.restore();
}

export default function FiveTreasures() {
  const canvasRef = useRef(null);
  const winCanvasRef = useRef(null);
  const wrapRef = useRef(null);

  const stateRef = useRef({
    grid: [],
    spinningCols: [false,false,false,false,false],
    spinFrames: [0,0,0,0,0],
    tempSymbols: [],
    winLineData: [],
    animFrame: null,
    winFlashTimer: null,
    isSpinning: false,
  });

  const [balance, setBalance] = useState(9994.88);
  const [bet, setBet] = useState(1);
  const [lines, setLines] = useState(9);
  const [freeSpins, setFreeSpins] = useState(0);
  const [autoMode, setAutoMode] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [winMsg, setWinMsg] = useState("✦ FORTUNE FAVORS THE BRAVE ✦");
  const [winMsgBig, setWinMsgBig] = useState(false);
  const [megaShow, setMegaShow] = useState(false);
  const [megaTitle, setMegaTitle] = useState("");
  const [megaAmount, setMegaAmount] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [coinRains, setCoinRains] = useState([]);
  const [grand, setGrand] = useState(4000);
  const [major, setMajor] = useState(400);
  const [winGlow, setWinGlow] = useState(false);

  const balanceRef = useRef(9994.88);
  const betRef = useRef(1);
  const linesRef = useRef(9);
  const freeSpinsRef = useRef(0);
  const autoModeRef = useRef(false);
  const autoTimerRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const winCanvas = winCanvasRef.current;
    if (!canvas || !winCanvas) return;
    const ctx = canvas.getContext("2d");
    const st = stateRef.current;
    const w = canvas.width, h = canvas.height;
    const colW = w / REELS;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0d0005";
    ctx.fillRect(0, 0, w, h);

    for (let r = 0; r < REELS; r++) {
      const x = r * colW;
      const isSpinning = st.spinningCols[r];
      const offset = isSpinning ? (st.spinFrames[r] % SYMBOL_SIZE) : 0;

      const grad = ctx.createLinearGradient(x, 0, x + colW, 0);
      grad.addColorStop(0, "rgba(255,200,0,0.03)");
      grad.addColorStop(0.5, "rgba(255,200,0,0.06)");
      grad.addColorStop(1, "rgba(255,200,0,0.03)");
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, colW, h);

      if (r > 0) {
        ctx.strokeStyle = "rgba(139,94,0,0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      const symsToShow = isSpinning ? st.tempSymbols[r] : st.grid[r];
      if (!symsToShow) continue;

      for (let row = -1; row < ROWS + 1; row++) {
        const symIdx = ((row + symsToShow.length) % symsToShow.length);
        const sym = symsToShow[symIdx] || SYMS[0];
        const y = row * SYMBOL_SIZE + offset - SYMBOL_SIZE;
        if (y > h + SYMBOL_SIZE || y < -SYMBOL_SIZE * 2) continue;
        drawSymbol(ctx, sym, x, y, colW, SYMBOL_SIZE, isSpinning);
      }

      if (isSpinning) {
        const blurGrad = ctx.createLinearGradient(x, 0, x, h);
        blurGrad.addColorStop(0, "rgba(13,0,5,0.7)");
        blurGrad.addColorStop(0.15, "rgba(13,0,5,0)");
        blurGrad.addColorStop(0.85, "rgba(13,0,5,0)");
        blurGrad.addColorStop(1, "rgba(13,0,5,0.7)");
        ctx.fillStyle = blurGrad;
        ctx.fillRect(x, 0, colW, h);

        ctx.strokeStyle = "rgba(255,200,50,0.08)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const ly = (st.spinFrames[r] * 3 + i * 22) % h;
          ctx.beginPath();
          ctx.moveTo(x + colW * 0.3, ly);
          ctx.lineTo(x + colW * 0.7, ly);
          ctx.stroke();
        }
      }
    }

    ctx.strokeStyle = "rgba(139,94,0,0.25)";
    ctx.lineWidth = 1;
    for (let row = 1; row < ROWS; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * SYMBOL_SIZE);
      ctx.lineTo(w, row * SYMBOL_SIZE);
      ctx.stroke();
    }

    const topGrad = ctx.createLinearGradient(0, 0, 0, 40);
    topGrad.addColorStop(0, "rgba(13,0,5,0.95)");
    topGrad.addColorStop(1, "rgba(13,0,5,0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, 40);

    const botGrad = ctx.createLinearGradient(0, h - 40, 0, h);
    botGrad.addColorStop(0, "rgba(13,0,5,0)");
    botGrad.addColorStop(1, "rgba(13,0,5,0.95)");
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, h - 40, w, 40);
  }, []);

  const drawWinLines = useCallback((wls) => {
    const winCanvas = winCanvasRef.current;
    if (!winCanvas) return;
    const wctx = winCanvas.getContext("2d");
    wctx.clearRect(0, 0, winCanvas.width, winCanvas.height);
    if (!wls || wls.length === 0) return;

    const colW = winCanvas.width / REELS;
    const flash = Math.sin(Date.now() / 200) > 0;

    wls.forEach(wl => {
      if (wl.scatter || !flash) return;
      const row = wl.row;
      const y = row * SYMBOL_SIZE + SYMBOL_SIZE / 2;

      for (let r = 0; r < wl.match; r++) {
        const x = r * colW;
        wctx.save();
        wctx.strokeStyle = wl.symbol.color + "cc";
        wctx.lineWidth = 3;
        roundRect(wctx, x + 4, row * SYMBOL_SIZE + 4, colW - 8, SYMBOL_SIZE - 8, 8);
        wctx.stroke();
        wctx.fillStyle = wl.symbol.color + "22";
        wctx.fill();
        wctx.restore();
      }

      wctx.save();
      wctx.strokeStyle = wl.symbol.color;
      wctx.lineWidth = 2;
      wctx.setLineDash([8, 4]);
      wctx.globalAlpha = 0.8;
      wctx.beginPath();
      wctx.moveTo(0, y);
      wctx.lineTo(wl.match * colW, y);
      wctx.stroke();
      wctx.restore();
    });
  }, []);

  const checkWins = useCallback((grid, bet, lines) => {
    let total = 0;
    const wls = [];
    let newFreeSpins = 0;

    for (let row = 0; row < Math.min(lines, ROWS); row++) {
      const rowSyms = grid.map(reel => reel[row]);
      let match = 1;
      const first = rowSyms[0];
      for (let i = 1; i < REELS; i++) {
        if (rowSyms[i].id === first.id || rowSyms[i].id === "wild" || first.id === "wild") match++;
        else break;
      }
      if (match >= 3) {
        const payout = first.pay[match - 1] * bet * 0.1;
        if (payout > 0) { total += payout; wls.push({ row, match, symbol: first, payout }); }
      }
    }

    const scCount = grid.flat().filter(s => s.id === "scatter").length;
    if (scCount >= 3) {
      const sp = scCount * bet * 0.5;
      total += sp;
      wls.push({ scatter: true, count: scCount, payout: sp });
      newFreeSpins = scCount * 3;
    }

    return { total: parseFloat(total.toFixed(2)), wls, newFreeSpins };
  }, []);

  const spawnCoins = () => {
    const coins = Array.from({ length: 12 }, (_, i) => ({
      id: Math.random(), left: Math.random() * 90, top: Math.random() * 30 + 20, delay: i * 0.08,
    }));
    setCoinRains(coins);
    setTimeout(() => setCoinRains([]), 2000);
  };

  const triggerSpin = useCallback(async () => {
    const st = stateRef.current;
    if (st.isSpinning) return;
    const totalBet = betRef.current * linesRef.current * 0.2;

    if (freeSpinsRef.current === 0 && balanceRef.current < totalBet) {
      setWinMsg("❌ INSUFFICIENT BALANCE!");
      setWinMsgBig(false);
      return;
    }

    st.isSpinning = true;
    setSpinning(true);
    setWinMsg("✦ THE DRAGON AWAKENS... ✦");
    setWinMsgBig(false);
    setWinAmount(0);
    setWinGlow(false);
    clearInterval(st.winFlashTimer);

    const winCanvas = winCanvasRef.current;
    if (winCanvas) winCanvas.getContext("2d").clearRect(0, 0, winCanvas.width, winCanvas.height);

    if (freeSpinsRef.current > 0) {
      freeSpinsRef.current--;
      setFreeSpins(freeSpinsRef.current);
    } else {
      balanceRef.current = parseFloat((balanceRef.current - totalBet).toFixed(2));
      setBalance(balanceRef.current);
    }

    st.tempSymbols = Array.from({ length: REELS }, () =>
      Array.from({ length: ROWS + 4 }, () => randSym())
    );
    st.spinningCols = [true, true, true, true, true];
    st.spinFrames = [0, 0, 0, 0, 0];
    st.winLineData = [];

    let lastTime = performance.now();
    function animate(now) {
      const dt = now - lastTime;
      lastTime = now;
      for (let r = 0; r < REELS; r++) {
        if (st.spinningCols[r]) {
          st.spinFrames[r] += dt * 0.5;
          if (st.spinFrames[r] > SYMBOL_SIZE) {
            st.spinFrames[r] -= SYMBOL_SIZE;
            st.tempSymbols[r].unshift(randSym());
            if (st.tempSymbols[r].length > ROWS + 4) st.tempSymbols[r].pop();
          }
        }
      }
      draw();
      drawWinLines(st.winLineData);
      if (st.spinningCols.some(s => s)) st.animFrame = requestAnimationFrame(animate);
    }
    st.animFrame = requestAnimationFrame(animate);

    const newGrid = Array.from({ length: REELS }, () =>
      Array.from({ length: ROWS }, () => randSym())
    );

    for (let r = 0; r < REELS; r++) {
      await new Promise(res => setTimeout(res, 400 + r * 250));
      st.spinningCols[r] = false;
      st.grid[r] = newGrid[r];
    }

    cancelAnimationFrame(st.animFrame);
    draw();

    const { total, wls, newFreeSpins } = checkWins(newGrid, betRef.current, linesRef.current);
    st.winLineData = wls;

    if (newFreeSpins > 0) {
      freeSpinsRef.current += newFreeSpins;
      setFreeSpins(freeSpinsRef.current);
    }

    if (total > 0) {
      balanceRef.current = parseFloat((balanceRef.current + total).toFixed(2));
      setBalance(balanceRef.current);
      setWinAmount(total);
      setWinGlow(true);

      const tbAmt = betRef.current * linesRef.current * 0.2;
      if (total >= tbAmt * 50) {
        setWinMsg("🏆 LEGENDARY WIN!!!");
        setWinMsgBig(true);
        setMegaTitle("LEGENDARY WIN!");
        setMegaAmount(total);
        setMegaShow(true);
      } else if (total >= tbAmt * 20) {
        setWinMsg("🔥 MEGA WIN!!!");
        setWinMsgBig(true);
        setMegaTitle("MEGA WIN!");
        setMegaAmount(total);
        setMegaShow(true);
      } else if (total >= tbAmt * 10) {
        setWinMsg("🌟 BIG WIN!");
        setWinMsgBig(true);
      } else if (total >= tbAmt * 3) {
        setWinMsg("✅ GREAT WIN!");
        setWinMsgBig(true);
      } else {
        setWinMsg(`WIN: £${total.toFixed(2)}`);
        setWinMsgBig(true);
      }

      st.winFlashTimer = setInterval(() => drawWinLines(st.winLineData), 100);
      spawnCoins();
    } else {
      setWinMsg("✦ THE DRAGON RESTS... ✦");
      setWinMsgBig(false);
    }

    st.isSpinning = false;
    setSpinning(false);

    if (autoModeRef.current && freeSpinsRef.current === 0) {
      autoTimerRef.current = setTimeout(triggerSpin, 1200);
    } else if (freeSpinsRef.current > 0) {
      setTimeout(triggerSpin, 800);
    }
  }, [draw, drawWinLines, checkWins]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const winCanvas = winCanvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !winCanvas || !wrap) return;
    const w = wrap.clientWidth;
    canvas.width = w;
    canvas.height = ROWS * SYMBOL_SIZE;
    winCanvas.width = w;
    winCanvas.height = ROWS * SYMBOL_SIZE;
    draw();
  }, [draw]);

  useEffect(() => {
    const st = stateRef.current;
    st.grid = Array.from({ length: REELS }, () =>
      Array.from({ length: ROWS }, () => randSym())
    );
    resize();
    window.addEventListener("resize", resize);

    const jackpotTimer = setInterval(() => {
      setGrand(g => parseFloat((g + Math.random() * 0.5).toFixed(2)));
      setMajor(m => parseFloat((m + Math.random() * 0.05).toFixed(2)));
    }, 100);

    return () => {
      window.removeEventListener("resize", resize);
      clearInterval(jackpotTimer);
      clearInterval(st.winFlashTimer);
      clearTimeout(autoTimerRef.current);
      cancelAnimationFrame(st.animFrame);
    };
  }, [resize]);

  const changeBet = (d) => {
    const nb = Math.max(1, Math.min(100, betRef.current + d));
    betRef.current = nb;
    setBet(nb);
  };

  const changeLines = (d) => {
    const nl = Math.max(1, Math.min(9, linesRef.current + d));
    linesRef.current = nl;
    setLines(nl);
  };

  const maxBet = () => {
    betRef.current = 100;
    linesRef.current = 9;
    setBet(100);
    setLines(9);
  };

  const toggleAuto = () => {
    const next = !autoModeRef.current;
    autoModeRef.current = next;
    setAutoMode(next);
    if (!next) clearTimeout(autoTimerRef.current);
  };

  const totalBet = (bet * lines * 0.2).toFixed(2);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative py-4"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #4a0066 0%, #2d0044 40%, #1a0030 100%)", fontFamily: "'Cinzel', serif" }}>

      {/* BG Pattern */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,200,0,0.03) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

      {/* Dragons */}
      <div className="fixed left-0 top-0 bottom-0 w-28 flex items-center justify-center text-8xl pointer-events-none opacity-15" style={{ transform: "scaleX(-1)" }}>🐉</div>
      <div className="fixed right-0 top-0 bottom-0 w-28 flex items-center justify-center text-8xl pointer-events-none opacity-15">🐉</div>

      {/* Coin rain */}
      {coinRains.map(c => (
        <div key={c.id} className="fixed pointer-events-none z-50 text-2xl"
          style={{ left: `${c.left}%`, top: `${c.top}%`, animationDelay: `${c.delay}s`, animation: "coinFall 1.5s ease-in forwards" }}>🪙</div>
      ))}

      <div className="w-full max-w-4xl px-2 relative z-10">

        {/* Jackpot Row */}
        <div className="flex gap-2 mb-2">
          <div className="flex-1 rounded-lg px-3 py-1.5 text-center border-2" style={{ background: "linear-gradient(135deg,#4a0000,#8b0000)", borderColor: "#ff4444", boxShadow: "0 0 15px rgba(255,50,50,0.4)" }}>
            <div className="text-[10px] font-bold tracking-widest text-red-300">GRAND</div>
            <div className="text-xl font-black text-red-400" style={{ textShadow: "0 0 15px #ff0000" }}>£{grand.toFixed(2)}</div>
          </div>

          <div className="flex-[2] text-center flex flex-col items-center justify-center">
            <div className="text-3xl font-black tracking-widest"
              style={{ background: "linear-gradient(180deg,#FFD700,#ff8800,#FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 2px 8px rgba(255,180,0,0.6))" }}>
              5 Treasures
            </div>
            <div className="text-[11px] tracking-widest" style={{ color: "rgba(255,200,100,0.6)" }}>✦ FORTUNE AWAITS ✦</div>
          </div>

          <div className="flex-1 rounded-lg px-3 py-1.5 text-center border-2" style={{ background: "linear-gradient(135deg,#4a3000,#8b6000)", borderColor: "#ffaa00", boxShadow: "0 0 15px rgba(255,170,0,0.4)" }}>
            <div className="text-[10px] font-bold tracking-widest text-yellow-300">MAJOR</div>
            <div className="text-xl font-black text-yellow-400" style={{ textShadow: "0 0 15px #ff8800" }}>£{major.toFixed(2)}</div>
          </div>
        </div>

        {/* Machine Frame */}
        <div className="rounded-2xl p-3 border-4 relative"
          style={{ background: "linear-gradient(180deg,#3d0055,#5a0077,#3d0055)", borderColor: "#8B5E00", boxShadow: "0 0 0 2px #4a0066, 0 0 40px rgba(139,94,0,0.5), inset 0 0 60px rgba(0,0,0,0.5)" }}>

          <div className="flex items-center gap-2 relative">
            {/* REEL WAYS */}
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 30 }}>
              <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", background: "linear-gradient(180deg,#8b0000,#cc0000)", border: "2px solid #ff4444", borderRadius: 6, padding: "8px 4px", fontSize: 10, fontWeight: 900, color: "#fff", letterSpacing: 3, whiteSpace: "nowrap" }}>
                REEL WAYS
              </div>
            </div>

            {/* Canvas area */}
            <div className="flex-1 relative rounded-lg overflow-hidden border-4"
              ref={wrapRef}
              style={{ background: "#1a0010", borderColor: "#8B5E00", boxShadow: "inset 0 0 40px rgba(0,0,0,0.95), 0 0 20px rgba(139,94,0,0.4)" }}>
              <canvas ref={canvasRef} style={{ display: "block", width: "100%" }} />
              <canvas ref={winCanvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5, width: "100%", height: "100%" }} />
            </div>

            {/* Right panel */}
            <div className="flex-shrink-0 w-24 flex flex-col gap-2 items-center">
              {freeSpins > 0 && (
                <div className="rounded-xl px-3 py-1 text-center border-4 w-full" style={{ background: "linear-gradient(135deg,#006600,#00aa44)", borderColor: "#00ff66", animation: "winValPulse 0.8s ease-in-out infinite" }}>
                  <div className="text-[9px] text-green-100 tracking-widest">FREE</div>
                  <div className="text-2xl font-black text-white">{freeSpins}</div>
                  <div className="text-[9px] text-green-100 tracking-widest">SPINS</div>
                </div>
              )}
              <div className="rounded-lg px-2 py-1 text-center border-2 w-full" style={{ background: "linear-gradient(135deg,#003344,#006688)", borderColor: "#00aacc", boxShadow: "0 0 15px rgba(0,170,200,0.4)" }}>
                <div className="text-[9px] font-bold tracking-widest text-cyan-300">MINOR</div>
                <div className="text-sm font-black text-cyan-400">£64.00</div>
              </div>
              <div className="rounded-lg px-2 py-1 text-center border-2 w-full" style={{ background: "linear-gradient(135deg,#1a3300,#336600)", borderColor: "#66cc00", boxShadow: "0 0 15px rgba(100,200,0,0.4)" }}>
                <div className="text-[9px] font-bold tracking-widest text-lime-300">MINI</div>
                <div className="text-sm font-black text-lime-400">£32.00</div>
              </div>
              <button onClick={triggerSpin} disabled={spinning}
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-4 border-yellow-400 mt-2 cursor-pointer transition-all hover:scale-110"
                style={{ background: "radial-gradient(circle at 35% 35%, #FFD700, #884400)", boxShadow: "0 0 20px rgba(255,180,0,0.6)" }}>
                🪙
              </button>
            </div>
          </div>

          {/* Win message */}
          <div className="text-center h-8 flex items-center justify-center my-1.5">
            <div className="font-bold tracking-widest transition-all"
              style={{ fontSize: winMsgBig ? 22 : 14, color: winMsgBig ? "#FFD700" : "rgba(255,180,50,0.7)", textShadow: winMsgBig ? "0 0 20px #FFD700, 0 0 40px #ff8800" : "none", animation: winMsgBig ? "winTextAnim 0.5s ease-in-out infinite" : "none" }}>
              {winMsg}
            </div>
          </div>

          {/* Info bar */}
          <div className="flex gap-2 mb-2">
            {[
              { label: "Balance", val: `£${balance.toFixed(2)}` },
              { label: "Stake", val: `£${totalBet}` },
              { label: "Win", val: `£${winAmount.toFixed(2)}`, glow: winGlow },
            ].map(({ label, val, glow }) => (
              <div key={label} className="flex-1 rounded-lg px-3 py-2 text-center border-2" style={{ background: "linear-gradient(180deg,#2a1800,#3d2200)", borderColor: "#8B5E00", boxShadow: glow ? "0 0 15px rgba(255,215,0,0.5)" : "none" }}>
                <div className="text-[9px] tracking-widest mb-0.5" style={{ color: "rgba(255,200,100,0.6)" }}>{label}</div>
                <div className="text-xl font-black text-yellow-400" style={{ textShadow: "0 0 10px rgba(255,215,0,0.5)", animation: glow && label === "Win" ? "winValPulse 0.5s ease-in-out infinite" : "none" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 border-2" style={{ background: "linear-gradient(180deg,#2a1500,#3d2000)", borderColor: "#8B5E00" }}>
            {/* Lines */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-[8px] tracking-widest" style={{ color: "rgba(255,200,100,0.6)" }}>LINES</div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => changeLines(-1)} className="w-8 h-8 rounded-full flex items-center justify-center text-yellow-400 text-lg font-black border-2 transition-all active:scale-90"
                  style={{ background: "radial-gradient(circle,#662200,#220000)", borderColor: "rgba(255,180,0,0.5)" }}>−</button>
                <div className="text-xl font-black text-yellow-400 min-w-[32px] text-center">{lines}</div>
                <button onClick={() => changeLines(1)} className="w-8 h-8 rounded-full flex items-center justify-center text-yellow-400 text-lg font-black border-2 transition-all active:scale-90"
                  style={{ background: "radial-gradient(circle,#662200,#220000)", borderColor: "rgba(255,180,0,0.5)" }}>+</button>
              </div>
            </div>

            <div className="w-px h-11 mx-1" style={{ background: "rgba(255,180,0,0.15)" }} />

            {/* Bet */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-[8px] tracking-widest" style={{ color: "rgba(255,200,100,0.6)" }}>STAKE</div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => changeBet(-1)} className="w-8 h-8 rounded-full flex items-center justify-center text-yellow-400 text-lg font-black border-2 transition-all active:scale-90"
                  style={{ background: "radial-gradient(circle,#662200,#220000)", borderColor: "rgba(255,180,0,0.5)" }}>−</button>
                <div className="text-xl font-black text-yellow-400 min-w-[32px] text-center">{bet}</div>
                <button onClick={() => changeBet(1)} className="w-8 h-8 rounded-full flex items-center justify-center text-yellow-400 text-lg font-black border-2 transition-all active:scale-90"
                  style={{ background: "radial-gradient(circle,#662200,#220000)", borderColor: "rgba(255,180,0,0.5)" }}>+</button>
              </div>
            </div>

            <div className="w-px h-11 mx-1" style={{ background: "rgba(255,180,0,0.15)" }} />

            <div className="flex flex-1 gap-2">
              {[{ label: "Total Bet", val: `£${totalBet}` }, { label: "Win", val: `£${winAmount.toFixed(2)}` }].map(({ label, val }) => (
                <div key={label} className="flex-1 rounded-lg px-2 py-1.5 text-center border-2" style={{ background: "linear-gradient(180deg,#2a1800,#3d2200)", borderColor: "#8B5E00" }}>
                  <div className="text-[9px] tracking-widest" style={{ color: "rgba(255,200,100,0.6)" }}>{label}</div>
                  <div className="text-lg font-black text-yellow-400">{val}</div>
                </div>
              ))}
            </div>

            <div className="w-px h-11 mx-1" style={{ background: "rgba(255,180,0,0.15)" }} />

            <button onClick={maxBet} className="px-3 py-1.5 rounded-lg text-yellow-400 text-xs font-black tracking-wider border-2 border-yellow-400 cursor-pointer hover:opacity-80"
              style={{ background: "linear-gradient(180deg,#664400,#332200)" }}>MAX<br />BET</button>

            <button onClick={toggleAuto}
              className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider border-2 cursor-pointer transition-all ${autoMode ? "text-yellow-400 border-yellow-400" : "text-gray-500 border-gray-600"}`}
              style={{ background: autoMode ? "linear-gradient(180deg,#664400,#332200)" : "linear-gradient(180deg,#222,#111)" }}>
              AUTO<br />{autoMode ? "ON" : "OFF"}
            </button>

            <button onClick={triggerSpin} disabled={spinning}
              className="min-w-[90px] h-14 rounded-xl font-black tracking-widest text-black text-lg border-4 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Cinzel', serif", borderColor: spinning ? "#555" : "#FFD700", background: spinning ? "linear-gradient(180deg,#444,#222)" : "linear-gradient(180deg,#cc8800,#885500,#cc8800)", color: spinning ? "#888" : "#000", boxShadow: spinning ? "none" : "0 0 20px rgba(255,180,0,0.5)" }}>
              SPIN
            </button>
          </div>
        </div>
      </div>

      {/* Mega Win Overlay */}
      {megaShow && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)", animation: "megaFadeIn 0.4s ease-out" }}>
          <div className="text-6xl mb-2">🎊</div>
          <div className="font-black tracking-widest text-5xl" style={{ color: "#FFD700", textShadow: "0 0 30px #FFD700, 0 0 60px #ff8800", animation: "winTextAnim 0.4s ease-in-out infinite" }}>{megaTitle}</div>
          <div className="text-3xl text-white mt-2 font-black">+£{megaAmount.toFixed(2)}</div>
          <button onClick={() => setMegaShow(false)}
            className="mt-5 px-10 py-3 rounded-xl border-4 font-black text-base tracking-widest text-black cursor-pointer hover:scale-105 transition-all"
            style={{ borderColor: "#FFD700", background: "linear-gradient(180deg,#cc8800,#885500)", fontFamily: "'Cinzel', serif" }}>
            COLLECT!
          </button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');
        @keyframes coinFall { 0%{opacity:1;transform:translateY(0) rotate(0deg)} 100%{opacity:0;transform:translateY(300px) rotate(360deg)} }
        @keyframes megaFadeIn { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
        @keyframes winTextAnim { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes winValPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
      `}</style>
    </div>
  );
}
