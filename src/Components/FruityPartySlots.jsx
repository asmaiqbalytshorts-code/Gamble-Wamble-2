import React, { useEffect, useRef, useState } from "react";

/* ===============================
   SYMBOLS (extended like original)
=================================*/
const SYMBOLS = [
  { id: "wild", icon: "💎", color: "#00eaff" },
  { id: "cherry", icon: "🍒", color: "#ff0044" },
  { id: "lemon", icon: "🍋", color: "#ffd000" },
  { id: "watermelon", icon: "🍉", color: "#00ff88" },
  { id: "bell", icon: "🔔", color: "#ff8800" },
  { id: "seven", icon: "7️⃣", color: "#ffffff" },
  { id: "star", icon: "⭐", color: "#ffcc00" },
];

/* ===============================
   PAYLINES (9 lines like original UI)
=================================*/
const PAYLINES = [
  [0, 0, 0],
  [1, 1, 1],
  [2, 2, 2],
  [0, 1, 2],
  [2, 1, 0],
  [0, 1, 0],
  [2, 1, 2],
  [1, 0, 1],
  [1, 2, 1],
];

/* ===============================
   MAIN COMPONENT
=================================*/
export default function FruityPartySlots() {
  const canvasRef = useRef(null);
  const starsRef = useRef(null);

  const [coins, setCoins] = useState(10000);
  const [bet, setBet] = useState(1);
  const [lines, setLines] = useState(3);
  const [spinning, setSpinning] = useState(false);

  const [win, setWin] = useState(0);
  const [activePaylines, setActivePaylines] = useState([]);

  const [showWin, setShowWin] = useState(false);
  const [showMega, setShowMega] = useState(false);

  const reels = useRef([0, 0, 0]);

  /* ===============================
     INIT STARS BACKGROUND
  =================================*/
  useEffect(() => {
    const canvas = starsRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      stars.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };

    draw();
  }, []);

  /* ===============================
     DRAW SLOT CANVAS
  =================================*/
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const reelWidth = w / 3;

    reels.current.forEach((r, i) => {
      const x = i * reelWidth;

      // reel background
      ctx.fillStyle = "#0a0005";
      ctx.fillRect(x, 0, reelWidth - 5, h);

      ctx.strokeStyle = "#8B5E00";
      ctx.strokeRect(x, 0, reelWidth - 5, h);

      for (let j = 0; j < 3; j++) {
        const symbol =
          SYMBOLS[(r + j) % SYMBOLS.length];

        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
          symbol.icon,
          x + reelWidth / 2,
          60 + j * 90
        );
      }
    });
  };

  useEffect(() => {
    draw();
  }, []);

  /* ===============================
     COIN RAIN EFFECT
  =================================*/
  const coinRain = () => {
    for (let i = 0; i < 25; i++) {
      const el = document.createElement("div");
      el.innerHTML = "🪙";
      el.className =
        "fixed text-2xl animate-bounce pointer-events-none";
      el.style.left = Math.random() * window.innerWidth + "px";
      el.style.top = "-20px";
      document.body.appendChild(el);

      setTimeout(() => el.remove(), 1200);
    }
  };

  /* ===============================
     SPIN LOGIC
  =================================*/
  const spin = () => {
    if (spinning) return;
    if (coins < bet * lines) return;

    setSpinning(true);
    setCoins((c) => c - bet * lines);
    setWin(0);
    setShowWin(false);
    setActivePaylines([]);

    let ticks = 25;

    const interval = setInterval(() => {
      reels.current = reels.current.map(
        () =>
          Math.floor(
            Math.random() * SYMBOLS.length
          )
      );
      draw();

      ticks--;
      if (ticks <= 0) {
        clearInterval(interval);
        finishSpin();
      }
    }, 80);
  };

  /* ===============================
     WIN CALCULATION (simplified)
  =================================*/
  const finishSpin = () => {
    setSpinning(false);

    const winChance = Math.random();

    let winAmount = 0;
    let active = [];

    if (winChance > 0.7) {
      winAmount = bet * lines * 10;
      active = [0, 1, 2];
    }

    if (winChance > 0.9) {
      winAmount = bet * lines * 50;
      setShowMega(true);
    }

    if (winAmount > 0) {
      setCoins((c) => c + winAmount);
      setWin(winAmount);
      setShowWin(true);
      setActivePaylines(active);
      coinRain();
    }
  };

  /* ===============================
     UI ACTIONS
  =================================*/
  const maxBet = () => {
    setBet(10);
    setLines(9);
  };

  const leverSpin = () => spin();

  /* ===============================
     RENDER
  =================================*/
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-red-900 to-black flex items-center justify-center relative overflow-hidden">

      {/* STARS */}
      <canvas
        ref={starsRef}
        className="fixed inset-0 z-0"
      />

      <div className="w-full max-w-6xl z-10">

        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-2">

          <button className="w-12 h-12 bg-yellow-700 text-white rounded">
            ←
          </button>

          <div className="bg-yellow-900 px-6 py-2 rounded flex items-center gap-2">
            <span>💰</span>
            <span className="text-yellow-300 text-2xl font-bold">
              {coins}
            </span>
          </div>

          <div className="flex gap-2">
            <button className="bg-blue-600 px-4 py-2 rounded">
              PAYOUT
            </button>
            <button className="bg-yellow-700 w-10 h-10 rounded">
              🔊
            </button>
            <button className="bg-yellow-700 w-10 h-10 rounded">
              🎵
            </button>
          </div>
        </div>

        {/* MACHINE */}
        <div className="bg-red-800 border-4 border-yellow-700 rounded-xl p-4">

          {/* TITLE */}
          <div className="text-center text-4xl font-bold text-yellow-400">
            SLOT MACHINE
          </div>

          {/* GAME AREA */}
          <div className="flex justify-center mt-3">

            {/* PAYLINE LEFT */}
            <div className="flex flex-col justify-around text-white mr-2">
              {PAYLINES.map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                    activePaylines.includes(i)
                      ? "bg-yellow-400 text-black"
                      : "bg-gray-700"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* REELS */}
            <canvas
              ref={canvasRef}
              width={600}
              height={300}
              className="bg-black border-4 border-yellow-700 rounded"
            />

            {/* LEVER */}
            <div className="ml-4 flex flex-col items-center">
              <div className="h-40 w-4 bg-gray-600 rounded relative">
                <div
                  onClick={leverSpin}
                  className="w-8 h-8 bg-red-600 rounded-full absolute top-4 -right-2 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* WIN */}
          {showWin && (
            <div className="text-center text-yellow-300 text-3xl mt-2 animate-pulse">
              WIN +{win}
            </div>
          )}

          {/* CONTROLS */}
          <div className="flex justify-between mt-4 bg-yellow-900 p-3 rounded">

            {/* BET */}
            <div className="flex gap-2 items-center">
              <button onClick={() => setBet(Math.max(1, bet - 1))}>
                -
              </button>
              <span>{bet}</span>
              <button onClick={() => setBet(bet + 1)}>
                +
              </button>
            </div>

            {/* LINES */}
            <div className="flex gap-2 items-center">
              <button onClick={() => setLines(Math.max(1, lines - 1))}>
                -
              </button>
              <span>{lines}</span>
              <button onClick={() => setLines(lines + 1)}>
                +
              </button>
            </div>

            {/* MAX */}
            <button onClick={maxBet} className="bg-orange-600 px-4">
              MAX
            </button>

            {/* SPIN */}
            <button
              onClick={spin}
              disabled={spinning}
              className="bg-blue-600 px-6 py-2 text-white font-bold rounded"
            >
              SPIN
            </button>
          </div>
        </div>
      </div>

      {/* MEGA WIN */}
      {showMega && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center text-yellow-400 text-5xl">
          🎊 MEGA WIN 🎊
          <button
            onClick={() => setShowMega(false)}
            className="mt-6 bg-yellow-600 px-6 py-2"
          >
            COLLECT
          </button>
        </div>
      )}
    </div>
  );
}
