import { useState, useEffect, useRef, useCallback } from 'react'

const MULTIPLIERS = {
  low: {
    8:  [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  },
  med: {
    8:  [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
  },
  hi: {
    8:  [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  }
}

const getMultColor = (m) => {
  if (m >= 100) return { bg: 'bg-red-900', border: 'border-red-500', text: 'text-red-400' }
  if (m >= 10)  return { bg: 'bg-yellow-900', border: 'border-yellow-500', text: 'text-yellow-400' }
  if (m >= 3)   return { bg: 'bg-green-900', border: 'border-green-500', text: 'text-green-400' }
  if (m >= 1)   return { bg: 'bg-blue-900', border: 'border-blue-500', text: 'text-blue-400' }
  return { bg: 'bg-gray-800', border: 'border-gray-600', text: 'text-gray-500' }
}

export default function Plinko() {
  const canvasRef = useRef(null)
  const [balance, setBalance] = useState(10000)
  const [bet, setBet] = useState(50)
  const [risk, setRisk] = useState('low')
  const [rows, setRows] = useState(12)
  const [autoMode, setAutoMode] = useState(false)
  const [drops, setDrops] = useState(0)
  const [wins, setWins] = useState(0)
  const [netProfit, setNetProfit] = useState(0)
  const [lastMult, setLastMult] = useState(null)
  const [lastWin, setLastWin] = useState(null)
  const [history, setHistory] = useState([])
  const [activeBalls, setActiveBalls] = useState(0)
  const [showWin, setShowWin] = useState(false)
  const [winAmount, setWinAmount] = useState(0)

  const stateRef = useRef({ balance: 10000, bet: 50, risk: 'low', rows: 12 })
  const ballsRef = useRef([])
  const pegsRef = useRef([])
  const bucketsRef = useRef([])
  const frameRef = useRef(0)
  const animRef = useRef(null)
  const autoRef = useRef(false)
  const autoTimerRef = useRef(null)

  useEffect(() => {
    stateRef.current = { balance, bet, risk, rows }
  }, [balance, bet, risk, rows])

  useEffect(() => {
    autoRef.current = autoMode
  }, [autoMode])

  const setupBoard = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = canvas.width
    const H = canvas.height
    const PT = 36, PB = 52, PS = 18
    const usH = H - PT - PB
    const cs = W / (rows + 3)

    pegsRef.current = []
    bucketsRef.current = []

    for (let r = 0; r < rows; r++) {
      const n = r + 3
      const ry = PT + (usH / (rows - 1)) * r
      const rw = (n - 1) * cs
      const sx = (W - rw) / 2
      for (let c = 0; c < n; c++) {
        pegsRef.current.push({ x: sx + c * cs, y: ry, r: 5.5, lit: 0, lc: '#00d4ff' })
      }
    }

    const mults = MULTIPLIERS[risk][rows]
    const bw = W / mults.length
    mults.forEach((m, i) => {
      bucketsRef.current.push({
        x: i * bw, y: H - PB, w: bw, h: PB - 4,
        mult: m, fl: 0, flc: '#f5c842'
      })
    })
  }, [risk, rows])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    canvas.width = parent.clientWidth
    canvas.height = Math.min(window.innerHeight - 280, 500)
    setupBoard()
  }, [setupBoard])

  const dropBall = useCallback((ax) => {
    const { balance: bal, bet: b, risk: r, rows: rw } = stateRef.current
    if (bal < b) return

    setBalance(prev => {
      stateRef.current.balance = prev - b
      return prev - b
    })
    setNetProfit(prev => prev - b)

    const colors = ['#f5c842', '#00d4ff', '#ff1744', '#00e676', '#ff4081', '#7c4dff', '#ff9100']
    const canvas = canvasRef.current
    const x = ax || canvas.width / 2 + (Math.random() - 0.5) * 8

    ballsRef.current.push({
      x: Math.max(18 + 10, Math.min(canvas.width - 18 - 10, x)),
      y: 24,
      vx: (Math.random() - 0.5) * 0.4,
      vy: 0.6,
      r: 9,
      color: colors[Math.floor(Math.random() * colors.length)],
      active: true,
      settled: false,
      trail: [],
    })
    setActiveBalls(prev => prev + 1)
  }, [])

  const handleCanvasClick = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    dropBall(e.clientX - rect.left)
  }, [dropBall])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const PT = 36, PB = 52, PS = 18
    const g = 0.3, fr = 0.997

    function update() {
      frameRef.current++
      const W = canvas.width, H = canvas.height
      const by = H - PB

      ballsRef.current.forEach(b => {
        if (!b.active) return
        b.trail = b.trail || []
        b.trail.unshift({ x: b.x, y: b.y })
        if (b.trail.length > 12) b.trail.pop()

        b.vy += g
        b.vx *= fr
        b.x += b.vx
        b.y += b.vy

        if (b.x - b.r < PS) { b.x = PS + b.r; b.vx = Math.abs(b.vx) * 0.55 }
        if (b.x + b.r > W - PS) { b.x = W - PS - b.r; b.vx = -Math.abs(b.vx) * 0.55 }

        for (const peg of pegsRef.current) {
          const dx = b.x - peg.x, dy = b.y - peg.y
          const d = Math.sqrt(dx * dx + dy * dy)
          const md = b.r + peg.r + 0.5
          if (d < md && d > 0.1) {
            const nx = dx / d, ny = dy / d
            const dot = b.vx * nx + b.vy * ny
            b.vx = (b.vx - 2 * dot * nx) * 0.7 + (Math.random() - 0.5) * 0.7
            b.vy = (b.vy - 2 * dot * ny) * 0.7
            b.x = peg.x + nx * (md + 0.1)
            b.y = peg.y + ny * (md + 0.1)
            peg.lit = 1; peg.lc = b.color
          }
        }

        if (b.y + b.r >= by && !b.settled) {
          b.settled = true
          b.vy = 0; b.vx = 0
          b.y = by - b.r

          const mults = MULTIPLIERS[stateRef.current.risk][stateRef.current.rows]
          const bw = W / mults.length
          const idx = Math.max(0, Math.min(mults.length - 1, Math.floor(b.x / bw)))
          const mult = mults[idx]
          const wa = Math.round(stateRef.current.bet * mult)

          bucketsRef.current[idx].fl = 1.8
          bucketsRef.current[idx].flc = b.color

          setBalance(prev => {
            stateRef.current.balance = prev + wa
            return prev + wa
          })
          setNetProfit(prev => prev + wa)
          setDrops(prev => prev + 1)
          if (wa > stateRef.current.bet) setWins(prev => prev + 1)
          setLastMult(mult)
          setLastWin(wa)
          setActiveBalls(prev => Math.max(0, prev - 1))
          setHistory(prev => [{
            mult, win: wa, profit: wa - stateRef.current.bet,
            color: b.color
          }, ...prev].slice(0, 25))

          if (mult >= 10) {
            setWinAmount(wa)
            setShowWin(true)
            setTimeout(() => setShowWin(false), 2000)
          }

          setTimeout(() => { b.active = false }, 500)
        }
      })

      ballsRef.current = ballsRef.current.filter(b => b.active || !b.settled)
      for (const p of pegsRef.current) if (p.lit > 0) p.lit = Math.max(0, p.lit - 0.065)
      for (const bk of bucketsRef.current) if (bk.fl > 0) bk.fl = Math.max(0, bk.fl - 0.04)
    }

    function render() {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // BG
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#0b0c14')
      bg.addColorStop(1, '#08090f')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.015)'
      ctx.lineWidth = 1
      for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

      // Buckets
      bucketsRef.current.forEach(bk => {
        const fl = bk.fl > 0
        ctx.save()
        const col = getBucketColor(bk.mult)
        ctx.fillStyle = fl ? lighten(col.bg, fl * 50) : col.bg
        ctx.strokeStyle = fl ? bk.flc : col.border
        ctx.lineWidth = fl ? 2.5 : 1
        if (fl) { ctx.shadowColor = bk.flc; ctx.shadowBlur = fl * 18 }
        roundRect(ctx, bk.x + 2, bk.y + 2, bk.w - 4, bk.h - 4, 5)
        ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0
        ctx.fillStyle = fl ? bk.flc : col.text
        ctx.font = `bold ${bk.mult >= 10 ? 9 : 11}px monospace`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(bk.mult + '×', bk.x + bk.w / 2, bk.y + bk.h / 2)
        ctx.restore()
      })

      // Pegs
      pegsRef.current.forEach(p => {
        const lit = p.lit > 0
        ctx.save()
        ctx.beginPath()
        ctx.arc(p.x, p.y, lit ? p.r * 1.35 : p.r, 0, Math.PI * 2)
        const gr = ctx.createRadialGradient(p.x - 1, p.y - 1, 0, p.x, p.y, p.r * 1.35)
        if (lit) {
          gr.addColorStop(0, '#fff')
          gr.addColorStop(0.4, p.lc || '#00d4ff')
          gr.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.shadowColor = p.lc || '#00d4ff'
          ctx.shadowBlur = 16 * p.lit
        } else {
          gr.addColorStop(0, '#44455a')
          gr.addColorStop(0.6, '#28293a')
          gr.addColorStop(1, '#16172a')
        }
        ctx.fillStyle = gr; ctx.fill(); ctx.shadowBlur = 0; ctx.restore()
      })

      // Balls
      ballsRef.current.forEach(b => {
        if (!b.active && !b.settled) return
        if (b.trail && b.trail.length > 1) {
          ctx.save()
          b.trail.forEach((pt, i) => {
            ctx.globalAlpha = (1 - i / b.trail.length) * 0.22
            ctx.beginPath()
            ctx.arc(pt.x, pt.y, b.r * (1 - i / b.trail.length) * 0.75, 0, Math.PI * 2)
            ctx.fillStyle = b.color; ctx.fill()
          })
          ctx.restore()
        }
        ctx.save()
        const gr = ctx.createRadialGradient(b.x - 3, b.y - 3, 0, b.x, b.y, b.r)
        gr.addColorStop(0, '#fff')
        gr.addColorStop(0.35, b.color)
        gr.addColorStop(1, '#000')
        ctx.shadowColor = b.color; ctx.shadowBlur = 22
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = gr; ctx.fill(); ctx.shadowBlur = 0; ctx.restore()
      })
    }

    function loop() {
      update(); render()
      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  useEffect(() => {
    if (autoMode) {
      autoTimerRef.current = setInterval(() => {
        if (autoRef.current && stateRef.current.balance >= stateRef.current.bet) {
          dropBall()
        } else if (stateRef.current.balance < stateRef.current.bet) {
          setAutoMode(false)
        }
      }, 500)
    } else {
      clearInterval(autoTimerRef.current)
    }
    return () => clearInterval(autoTimerRef.current)
  }, [autoMode, dropBall])

  function getBucketColor(m) {
    if (m >= 100) return { bg: 'rgba(100,0,0,0.55)', border: '#ff1744', text: '#ff6680' }
    if (m >= 10)  return { bg: 'rgba(80,50,0,0.55)', border: '#f5c842', text: '#f5c842' }
    if (m >= 3)   return { bg: 'rgba(0,70,35,0.55)', border: '#00e676', text: '#00e676' }
    if (m >= 1)   return { bg: 'rgba(0,45,70,0.5)', border: '#00d4ff', text: '#00d4ff' }
    return { bg: 'rgba(25,25,35,0.55)', border: '#2a2b35', text: '#5a5c6e' }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  function lighten(cs, amt) {
    try {
      const m = cs.match(/rgba?\((\d+),(\d+),(\d+)/)
      if (m) return `rgba(${Math.min(255, +m[1] + amt)},${Math.min(255, +m[2] + amt)},${Math.min(255, +m[3] + amt)},0.7)`
    } catch (e) {}
    return cs
  }

  const mults = MULTIPLIERS[risk][rows]

  return (
    <div className="min-h-screen bg-[#080910] text-white flex flex-col" style={{ fontFamily: 'Rajdhani, sans-serif' }}>

      {/* WIN FLASH */}
      {showWin && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center animate-bounce">
            <div className="text-8xl font-black text-yellow-400" style={{ textShadow: '0 0 40px #f5c842' }}>
              {lastMult}×
            </div>
            <div className="text-4xl font-bold text-white mt-2">+{winAmount}</div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0f1020]">
        <div className="text-2xl font-black tracking-widest" style={{
          background: 'linear-gradient(135deg, #f5c842, #00d4ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          🎳 PLINKO
        </div>
        <div className="flex gap-3">
          {[
            { lb: 'BALANCE', vl: balance.toLocaleString(), gold: true },
            { lb: 'PROFIT', vl: (netProfit >= 0 ? '+' : '') + netProfit, gold: false },
            { lb: 'DROPS', vl: drops, gold: false },
          ].map((s, i) => (
            <div key={i} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-center">
              <div className="text-[9px] text-cyan-500/60 tracking-widest">{s.lb}</div>
              <div className={`text-lg font-bold font-mono ${s.gold ? 'text-yellow-400' : netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {s.vl}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 gap-3 p-3 overflow-hidden">

        {/* LEFT */}
        <div className="w-48 flex flex-col gap-3 flex-shrink-0">

          {/* Risk */}
          <div className="bg-[#0f1320] border border-white/10 rounded-xl p-3">
            <div className="text-[9px] text-gray-500 tracking-widest mb-2">RISK LEVEL</div>
            {[
              { id: 'low', label: 'LOW', color: 'text-green-400 border-green-500/30', active: 'border-green-400 bg-green-400/15' },
              { id: 'med', label: 'MEDIUM', color: 'text-yellow-400 border-yellow-500/30', active: 'border-yellow-400 bg-yellow-400/15' },
              { id: 'hi',  label: 'HIGH', color: 'text-red-400 border-red-500/30', active: 'border-red-400 bg-red-400/15' },
            ].map(r => (
              <button key={r.id}
                onClick={() => setRisk(r.id)}
                className={`w-full py-2 px-3 rounded-lg border-2 mb-1 text-sm font-bold tracking-wide transition-all ${r.color} ${risk === r.id ? r.active : 'bg-transparent'}`}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Rows */}
          <div className="bg-[#0f1320] border border-white/10 rounded-xl p-3">
            <div className="text-[9px] text-gray-500 tracking-widest mb-2">ROWS</div>
            <div className="grid grid-cols-2 gap-1">
              {[8, 12, 16].map(r => (
                <button key={r}
                  onClick={() => setRows(r)}
                  className={`py-2 rounded-lg border text-sm font-bold transition-all ${rows === r ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10' : 'border-white/10 text-gray-500'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Bet */}
          <div className="bg-[#0f1320] border border-white/10 rounded-xl p-3">
            <div className="text-[9px] text-gray-500 tracking-widest mb-2">BET</div>
            <div className="text-2xl font-bold text-yellow-400 font-mono text-center mb-2">{bet}</div>
            <div className="flex gap-1 mb-2">
              <button onClick={() => setBet(b => Math.max(1, Math.floor(b / 2)))} className="flex-1 py-1 rounded-lg bg-[#1c1d26] text-gray-300 text-xs font-bold">½</button>
              <button onClick={() => setBet(b => Math.min(balance, b * 2))} className="flex-1 py-1 rounded-lg bg-[#1c1d26] text-gray-300 text-xs font-bold">2×</button>
              <button onClick={() => setBet(balance)} className="flex-1 py-1 rounded-lg bg-[#1c1d26] text-gray-300 text-xs font-bold">MAX</button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[10, 50, 100, 250, 500, 1000].map(v => (
                <button key={v} onClick={() => setBet(v)}
                  className="py-1 rounded-md bg-[#1c1d26] text-gray-400 text-xs hover:text-cyan-400 hover:border-cyan-400 border border-white/10 transition-all">
                  {v >= 1000 ? '1K' : v}
                </button>
              ))}
            </div>
          </div>

          {/* Drop */}
          <button onClick={() => dropBall()}
            className="w-full py-4 rounded-xl font-black text-xl tracking-widest text-black transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #f5c842, #e8a020)', boxShadow: '0 0 20px rgba(245,200,66,0.3)' }}>
            DROP
          </button>

          <div className="flex gap-2">
            <button onClick={() => setAutoMode(a => !a)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${autoMode ? 'border-green-400 text-green-400 bg-green-400/10' : 'border-white/10 text-gray-500'}`}>
              {autoMode ? 'STOP' : 'AUTO'}
            </button>
            <button onClick={() => { dropBall(); setTimeout(dropBall, 200); setTimeout(dropBall, 400); setTimeout(dropBall, 600); setTimeout(dropBall, 800) }}
              className="flex-1 py-2 rounded-xl text-sm font-bold border-2 border-white/10 text-gray-500">
              ×5
            </button>
          </div>
        </div>

        {/* CANVAS */}
        <div className="flex-1 flex flex-col gap-2">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="rounded-xl border border-white/10 cursor-crosshair w-full"
            style={{ boxShadow: '0 0 40px rgba(0,0,0,0.7)' }}
          />

          {/* Multiplier Strip */}
          <div className="flex gap-1">
            {mults.map((m, i) => {
              const col = getMultColor(m)
              return (
                <div key={i} className={`flex-1 py-1 rounded text-center text-[10px] font-bold font-mono border ${col.bg} ${col.border} ${col.text}`}>
                  {m}×
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-44 flex flex-col gap-3 flex-shrink-0">

          {/* Stats */}
          <div className="bg-[#0f1320] border border-white/10 rounded-xl p-3">
            <div className="text-[9px] text-gray-500 tracking-widest mb-2">STATS</div>
            {[
              { lb: 'ACTIVE BALLS', vl: activeBalls, c: 'text-cyan-400' },
              { lb: 'WIN RATE', vl: drops > 0 ? Math.round(wins / drops * 100) + '%' : '0%', c: 'text-green-400' },
              { lb: 'LAST MULT', vl: lastMult ? lastMult + '×' : '—', c: 'text-yellow-400' },
              { lb: 'LAST WIN', vl: lastWin ? '+' + lastWin : '—', c: 'text-green-400' },
            ].map((s, i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-[9px] text-gray-500 tracking-wide">{s.lb}</span>
                <span className={`text-sm font-bold font-mono ${s.c}`}>{s.vl}</span>
              </div>
            ))}
          </div>

          {/* History */}
          <div className="bg-[#0f1320] border border-white/10 rounded-xl p-3 flex-1 overflow-hidden">
            <div className="text-[9px] text-gray-500 tracking-widest mb-2">HISTORY</div>
            <div className="flex flex-col gap-1 overflow-y-auto max-h-64">
              {history.map((h, i) => (
                <div key={i} className={`flex justify-between items-center px-2 py-1 rounded text-xs font-mono border ${h.profit > 0 ? 'bg-green-900/20 border-green-500/20 text-green-400' : 'bg-red-900/10 border-red-500/10 text-red-400'}`}>
                  <span style={{ color: h.color }}>{h.mult}×</span>
                  <span>{h.profit >= 0 ? '+' : ''}{h.profit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}