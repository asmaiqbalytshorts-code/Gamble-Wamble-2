import { useEffect, useRef, useState, useCallback } from "react";

const SEGMENTS_RAW = [
  { label: "JACKPOT", coins: 50000, color: "#FFD700", bg: "#8B0000", emoji: "🏆", prob: 0.01 },
  { label: "2000", coins: 2000, color: "#fff", bg: "#cc4400", emoji: "💰", prob: 0.03 },
  { label: "LOSE", coins: 0, color: "#888", bg: "#1a1a1a", emoji: "💔", prob: 0.20 },
  { label: "500", coins: 500, color: "#fff", bg: "#0044aa", emoji: "🎯", prob: 0.08 },
  { label: "5000", coins: 5000, color: "#FFD700", bg: "#006600", emoji: "💎", prob: 0.02 },
  { label: "100", coins: 100, color: "#fff", bg: "#660066", emoji: "🌟", prob: 0.15 },
  { label: "LOSE", coins: 0, color: "#888", bg: "#1a1a1a", emoji: "💔", prob: 0.20 },
  { label: "1000", coins: 1000, color: "#fff", bg: "#aa0000", emoji: "🎰", prob: 0.05 },
  { label: "50", coins: 50, color: "#fff", bg: "#005566", emoji: "🍀", prob: 0.18 },
  { label: "10000", coins: 10000, color: "#FFD700", bg: "#884400", emoji: "👑", prob: 0.015 },
  { label: "200", coins: 200, color: "#fff", bg: "#003388", emoji: "🎁", prob: 0.12 },
  { label: "LOSE", coins: 0, color: "#888", bg: "#1a1a1a", emoji: "💔", prob: 0.20 },
];


export default function FortuneWheel() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    rotation: 0,
    spinVelocity: 0,
    spinning: false,
    targetSegment: 0,
    animId: null,
    highlightedSeg: -1,
  });

  const [coins, setCoins] = useState(10000);
  const [bet, setBet] = useState(50);
  const [totalSpins, setTotalSpins] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [biggestWin, setBiggestWin] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [lastWin, setLastWin] = useState("-");
  const [resultText, setResultText] = useState("PRESS SPIN TO WIN!");
  const [resultBig, setResultBig] = useState(false);
  const [highlightedSeg, setHighlightedSeg] = useState(-1);
  const [megaShow, setMegaShow] = useState(false);
  const [megaData, setMegaData] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [coinRains, setCoinRains] = useState([]);

  const coinsRef = useRef(10000);
  const betRef = useRef(50);
  const totalWinsRef = useRef(0);
  const totalSpinsRef = useRef(0);
  const biggestWinRef = useRef(0);
  const netProfitRef = useRef(0);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const CX = canvas.width / 2;
    const CY = canvas.height / 2;
    const R = CX - 10;
    const st = stateRef.current;
    const segAngle = (2 * Math.PI) / SEGMENTS.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Outer ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R + 8, 0, Math.PI * 2);
    const outerGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    outerGrad.addColorStop(0, "#FFD700");
    outerGrad.addColorStop(0.25, "#cc8800");
    outerGrad.addColorStop(0.5, "#FFD700");
    outerGrad.addColorStop(0.75, "#cc8800");
    outerGrad.addColorStop(1, "#FFD700");
    ctx.strokeStyle = outerGrad;
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.restore();

    // Segments
    SEGMENTS.forEach((seg, i) => {
      const startAngle = st.rotation + i * segAngle - Math.PI / 2;
      const endAngle = startAngle + segAngle;
      const isHighlight = i === st.highlightedSeg;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.arc(CX, CY, R, startAngle, endAngle);
      ctx.closePath();

      const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
      grad.addColorStop(0, lightenColor(seg.bg, isHighlight ? 60 : 20));
      grad.addColorStop(1, seg.bg);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = isHighlight ? "#FFD700" : "rgba(255,200,0,0.25)";
      ctx.lineWidth = isHighlight ? 3 : 1.5;
      ctx.stroke();

      if (isHighlight) {
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // Text
      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      ctx.font = `${seg.label === "JACKPOT" ? 22 : 18}px serif`;
      ctx.fillText(seg.emoji, R - 8, 0);

      ctx.font = `bold ${seg.label.length > 5 ? 11 : 14}px Oswald, sans-serif`;
      ctx.fillStyle = seg.color;
      if (isHighlight) { ctx.shadowColor = "#FFD700"; ctx.shadowBlur = 8; }
      ctx.fillText(seg.label, R - 36, 0);
      ctx.shadowBlur = 0;
      ctx.restore();

      // Dot decorations
      const dotAngle = startAngle + segAngle / 2;
      const dotR = R - 8;
      ctx.save();
      ctx.beginPath();
      ctx.arc(CX + Math.cos(dotAngle) * dotR, CY + Math.sin(dotAngle) * dotR, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fill();
      ctx.restore();
    });

    // Center circle
    ctx.save();
    const cg = ctx.createRadialGradient(CX - 10, CY - 10, 5, CX, CY, 38);
    cg.addColorStop(0, "#FFD700");
    cg.addColorStop(0.5, "#cc7700");
    cg.addColorStop(1, "#885500");
    ctx.beginPath();
    ctx.arc(CX, CY, 38, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.shadowColor = "rgba(255,200,0,0.6)";
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.restore();
  }, []);

  const spinWheel = useCallback(() => {
    const st = stateRef.current;
    if (st.spinning) return;
    if (coinsRef.current < betRef.current) {
      setResultText("NOT ENOUGH COINS!");
      return;
    }

    coinsRef.current -= betRef.current;
    netProfitRef.current -= betRef.current;
    setCoins(coinsRef.current);
    setNetProfit(netProfitRef.current);

    const target = pickSegment();
    st.targetSegment = target;
    st.spinning = true;
    setSpinning(true);
    setResultText("SPINNING...");
    setResultBig(false);
    st.highlightedSeg = -1;
    setHighlightedSeg(-1);

    const segAngle = (2 * Math.PI) / SEGMENTS.length;
    const targetAngle = -(target * segAngle) + Math.PI / 2 - segAngle / 2;
    const fullSpins = (5 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
    const finalAngle = targetAngle + fullSpins;
    const duration = 4000 + Math.random() * 2000;
    const startTime = performance.now();
    const startRotation = st.rotation;

    const easeOut = (t) => 1 - Math.pow(1 - t, 4);

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      st.rotation = startRotation + finalAngle * easeOut(progress);
      drawWheel();

      if (progress < 1) {
        st.animId = requestAnimationFrame(animate);
      } else {
        st.rotation = startRotation + finalAngle;
        st.spinning = false;
        setSpinning(false);
        st.highlightedSeg = target;
        setHighlightedSeg(target);
        drawWheel();
        onSpinEnd(target);
      }
    };
    st.animId = requestAnimationFrame(animate);
  }, [drawWheel]);

  const onSpinEnd = useCallback((segIdx) => {
    const seg = SEGMENTS[segIdx];
    totalSpinsRef.current++;
    setTotalSpins(totalSpinsRef.current);

    if (seg.coins > 0) {
      const won = seg.coins;
      coinsRef.current += won;
      netProfitRef.current += won;
      totalWinsRef.current++;
      setCoins(coinsRef.current);
      setNetProfit(netProfitRef.current);
      setTotalWins(totalWinsRef.current);
      setLastWin("+" + won.toLocaleString());

      if (won > biggestWinRef.current) {
        biggestWinRef.current = won;
        setBiggestWin(won);
      }

      if (won >= 5000) {
        setMegaData(seg);
        setMegaShow(true);
        spawnCoins();
      } else {
        setResultText(`${seg.emoji} +${won.toLocaleString()} COINS!`);
        setResultBig(true);
        setTimeout(() => setResultBig(false), 2000);
      }
    } else {
      setResultText("💔 BETTER LUCK NEXT TIME!");
      setResultBig(false);
    }
  }, []);

  const spawnCoins = () => {
    const newCoins = Array.from({ length: 20 }, (_, i) => ({
      id: Math.random(),
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      top: Math.random() * 30,
    }));
    setCoinRains(newCoins);
    setTimeout(() => setCoinRains([]), 2000);
  };

  const changeBet = (delta) => {
    const newBet = Math.max(10, Math.min(1000, betRef.current + delta));
    betRef.current = newBet;
    setBet(newBet);
  };

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);
const totalProb = SEGMENTS_RAW.reduce((s, seg) => s + seg.prob, 0);
const SEGMENTS = SEGMENTS_RAW.map(seg => ({ ...seg, prob: seg.prob / totalProb }));

function lightenColor(hex, amt) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amt);
  const g = Math.min(255, ((num >> 8) & 0xff) + amt);
  const b = Math.min(255, (num & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

function pickSegment() {
  let r = Math.random();
  for (let i = 0; i < SEGMENTS.length; i++) {
    r -= SEGMENTS[i].prob;
    if (r <= 0) return i;
  }
  return SEGMENTS.length - 1;
}

  const uniqueSegments = SEGMENTS.filter((s, i, arr) => arr.findIndex(x => x.label === s.label) === i);
  const winRate = totalSpins > 0 ? Math.round((totalWins / totalSpins) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1a0040 0%, #0d0020 60%, #050010 100%)", fontFamily: "'Oswald', sans-serif" }}>

      {/* Light rays */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,200,0,0.015) 10deg, transparent 20deg, rgba(255,200,0,0.015) 30deg, transparent 40deg, rgba(255,200,0,0.015) 50deg, transparent 60deg, rgba(255,200,0,0.02) 70deg, transparent 80deg, rgba(255,200,0,0.015) 90deg, transparent 360deg)", animation: "rayRotate 20s linear infinite" }} />

      {/* Coin rain */}
      {coinRains.map(c => (
        <div key={c.id} className="fixed pointer-events-none z-50 text-2xl"
          style={{ left: `${c.left}%`, top: `${c.top}%`, animationDelay: `${c.delay}s`, animation: "coinRain 1.4s ease-in forwards" }}>
          🪙
        </div>
      ))}

      <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center">

        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-6xl font-black tracking-widest"
            style={{ fontFamily: "'Bebas Neue', cursive", background: "linear-gradient(180deg, #FFD700, #ff8800, #FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 20px rgba(255,180,0,0.6))" }}>
            🎡 FORTUNE WHEEL
          </div>
          <div className="text-xs tracking-widest mt-1" style={{ color: "rgba(255,200,100,0.5)" }}>✦ SPIN YOUR DESTINY ✦</div>
        </div>

        {/* Coin bar */}
        <div className="flex items-center gap-3 rounded-full px-6 py-2 mb-4 border-2"
          style={{ background: "linear-gradient(180deg, #1a0e00, #2d1800)", borderColor: "#8B5E00" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg border-2"
            style={{ background: "radial-gradient(circle at 35% 35%, #FFD700, #aa6600)", borderColor: "#FFD700", boxShadow: "0 0 12px rgba(255,215,0,0.5)" }}>💰</div>
          <div>
            <div className="text-[10px] tracking-widest" style={{ color: "rgba(255,200,100,0.6)" }}>YOUR COINS</div>
            <div className="text-2xl font-bold text-yellow-400">{coins.toLocaleString()}</div>
          </div>
          <div className="w-px h-10 mx-2" style={{ background: "rgba(255,200,0,0.2)" }} />
          <div>
            <div className="text-[10px] tracking-widest" style={{ color: "rgba(255,200,100,0.6)" }}>TODAY'S WINS</div>
            <div className="text-xl font-bold text-yellow-400">{totalWins}</div>
          </div>
          <div className="w-px h-10 mx-2" style={{ background: "rgba(255,200,0,0.2)" }} />
          <div>
            <div className="text-[10px] tracking-widest" style={{ color: "rgba(255,200,100,0.6)" }}>TOTAL SPINS</div>
            <div className="text-xl font-bold text-yellow-400">{totalSpins}</div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex items-center gap-6 w-full">

          {/* Wheel section */}
          <div className="flex-1 flex flex-col items-center relative">
            <div className="absolute w-[440px] h-[440px] rounded-full pointer-events-none"
              style={{ border: "3px solid transparent", boxShadow: "0 0 40px rgba(255,180,0,0.3), 0 0 80px rgba(255,100,0,0.15)" }} />

            <div className="relative w-[420px] h-[420px]">
              {/* Pointer */}
              <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                <div style={{ width: 0, height: 0, borderLeft: "18px solid transparent", borderRight: "18px solid transparent", borderTop: "46px solid #FFD700", filter: "drop-shadow(0 0 10px rgba(255,215,0,0.8))", animation: "pointerBounce 1s ease-in-out infinite" }} />
                <div className="w-6 h-6 rounded-full -mt-1 border-[3px] border-white"
                  style={{ background: "radial-gradient(circle at 35% 35%, #FFD700, #cc8800)", boxShadow: "0 0 12px rgba(255,215,0,0.7)" }} />
              </div>

              <canvas ref={canvasRef} width={420} height={420}
                style={{ display: "block", filter: "drop-shadow(0 0 20px rgba(255,150,0,0.4))" }} />

              {/* Center SPIN button */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <button onClick={spinWheel} disabled={spinning}
                  className="w-20 h-20 rounded-full flex flex-col items-center justify-center text-black font-black text-lg border-[5px] border-white transition-all"
                  style={{ fontFamily: "'Bebas Neue', cursive", background: spinning ? "radial-gradient(circle, #555, #333)" : "radial-gradient(circle at 35% 40%, #FFD700, #cc7700, #885500)", borderColor: spinning ? "#666" : "#fff", boxShadow: spinning ? "none" : "0 0 20px rgba(255,200,0,0.6), 0 0 40px rgba(255,150,0,0.3)", cursor: spinning ? "not-allowed" : "pointer" }}>
                  SPIN
                </button>
              </div>
            </div>

            {/* Result */}
            <div className="mt-3 text-center min-h-[50px] flex items-center justify-center">
              <div className={`font-black tracking-widest transition-all`}
                style={{ fontFamily: "'Bebas Neue', cursive", fontSize: resultBig ? "30px" : "20px", color: resultBig ? "#FFD700" : "rgba(255,180,50,0.7)", textShadow: resultBig ? "0 0 20px #FFD700, 0 0 40px #ff8800" : "none" }}>
                {resultText}
              </div>
            </div>

            {/* Spin button */}
            <button onClick={spinWheel} disabled={spinning}
              className="mt-2 px-14 py-3 rounded-xl font-black tracking-widest text-black text-2xl border-4 transition-all"
              style={{ fontFamily: "'Bebas Neue', cursive", borderColor: "#FFD700", background: spinning ? "#555" : "linear-gradient(180deg, #cc8800, #885500, #cc8800)", boxShadow: "0 0 25px rgba(255,200,0,0.5)", cursor: spinning ? "not-allowed" : "pointer" }}>
              🎡 SPIN THE WHEEL!
            </button>
          </div>

          {/* Right panel */}
          <div className="w-60 flex flex-col gap-2.5">
            <div className="font-black text-xl tracking-widest text-yellow-400 text-center border-b pb-1.5"
              style={{ fontFamily: "'Bebas Neue', cursive", borderColor: "rgba(255,200,0,0.2)" }}>
              PRIZE TABLE
            </div>

            {/* Prize list */}
            <div className="flex flex-col gap-1.5">
              {uniqueSegments.map((seg) => (
                <div key={seg.label}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all ${highlightedSeg !== -1 && SEGMENTS[highlightedSeg]?.label === seg.label ? "scale-105" : ""}`}
                  style={{
                    borderColor: highlightedSeg !== -1 && SEGMENTS[highlightedSeg]?.label === seg.label ? "#FFD700" : "rgba(255,255,255,0.08)",
                    background: highlightedSeg !== -1 && SEGMENTS[highlightedSeg]?.label === seg.label ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.03)",
                    boxShadow: highlightedSeg !== -1 && SEGMENTS[highlightedSeg]?.label === seg.label ? "0 0 15px rgba(255,215,0,0.3)" : "none",
                  }}>
                  <div className="w-5 h-5 rounded-full flex-shrink-0 border-2" style={{ background: seg.bg, borderColor: seg.color }} />
                  <div className="flex-1 text-[13px] text-gray-300 tracking-wide">{seg.emoji} {seg.label}</div>
                  <div className="text-[15px] font-bold text-yellow-400">{seg.coins > 0 ? "+" + seg.coins.toLocaleString() : "LUCK"}</div>
                </div>
              ))}
            </div>

            {/* Bet control */}
            <div className="rounded-xl p-3 border-2" style={{ background: "linear-gradient(180deg, #1a0e00, #2d1800)", borderColor: "#8B5E00" }}>
              <div className="text-[9px] tracking-widest text-center mb-2" style={{ color: "rgba(255,200,100,0.6)" }}>BET PER SPIN</div>
              <div className="flex items-center justify-center gap-2.5">
                <button onClick={() => changeBet(-10)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xl font-black border-2 transition-all active:scale-90"
                  style={{ background: "radial-gradient(circle, #cc0000, #660000)", borderColor: "#ff4444" }}>−</button>
                <div className="text-2xl font-bold text-yellow-400 min-w-[60px] text-center">{bet}</div>
                <button onClick={() => changeBet(10)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xl font-black border-2 transition-all active:scale-90"
                  style={{ background: "radial-gradient(circle, #cc0000, #660000)", borderColor: "#ff4444" }}>+</button>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-xl p-3 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,200,0,0.15)" }}>
              <div className="font-black text-base tracking-widest text-yellow-400 text-center mb-2" style={{ fontFamily: "'Bebas Neue', cursive" }}>STATISTICS</div>
              {[
                { label: "BIGGEST WIN", val: biggestWin.toLocaleString() },
                { label: "LAST WIN", val: lastWin },
                { label: "WIN RATE", val: winRate + "%" },
                { label: "NET PROFIT", val: (netProfit >= 0 ? "+" : "") + netProfit.toLocaleString(), color: netProfit >= 0 ? "#00e676" : "#ff5252" },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex justify-between items-center py-1 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <span className="text-[10px] tracking-widest" style={{ color: "rgba(255,200,100,0.5)" }}>{label}</span>
                  <span className="text-sm font-bold" style={{ color: color || "#FFD700" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mega Win Overlay */}
      {megaShow && megaData && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)", animation: "megaIn 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-[5px] border-white mb-4"
            style={{ background: megaData.bg, boxShadow: `0 0 40px ${megaData.color}`, animation: "resultPulse 0.5s ease-in-out infinite" }}>
            {megaData.emoji}
          </div>
          <div className="font-black tracking-widest text-6xl"
            style={{ fontFamily: "'Bebas Neue', cursive", background: "linear-gradient(180deg, #FFD700, #ff8800, #FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {megaData.label === "JACKPOT" ? "JACKPOT!" : "BIG WIN!"}
          </div>
          <div className="text-3xl text-white tracking-widest my-2">{megaData.label}</div>
          <div className="text-4xl font-black text-yellow-400">+{megaData.coins.toLocaleString()} COINS</div>
          <button onClick={() => setMegaShow(false)}
            className="mt-6 px-14 py-3 rounded-xl border-4 font-black text-2xl tracking-widest text-black transition-all hover:scale-105"
            style={{ fontFamily: "'Bebas Neue', cursive", borderColor: "#FFD700", background: "linear-gradient(180deg, #cc8800, #885500, #cc8800)", boxShadow: "0 0 20px rgba(255,180,0,0.5)" }}>
            🎉 COLLECT!
          </button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;600;700&display=swap');
        @keyframes rayRotate { to { transform: rotate(360deg); } }
        @keyframes pointerBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(4px)} }
        @keyframes coinRain { 0%{opacity:1;transform:translateY(0) rotate(0deg) scale(1.2)} 100%{opacity:0;transform:translateY(350px) rotate(720deg) scale(0.4)} }
        @keyframes megaIn { from{opacity:0;transform:scale(0.3)} to{opacity:1;transform:scale(1)} }
        @keyframes resultPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
      `}</style>
    </div>
  );
}
