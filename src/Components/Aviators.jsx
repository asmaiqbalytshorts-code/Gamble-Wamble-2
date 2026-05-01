import { useState, useEffect, useRef, useCallback } from 'react'

const genCrash = () => {
  const r = Math.random()
  if (r < 0.28) return +(1.00 + Math.random() * 0.49).toFixed(2)
  if (r < 0.52) return +(1.50 + Math.random() * 0.99).toFixed(2)
  if (r < 0.72) return +(2.50 + Math.random() * 2.5).toFixed(2)
  if (r < 0.86) return +(5.00 + Math.random() * 5).toFixed(2)
  if (r < 0.94) return +(10 + Math.random() * 10).toFixed(2)
  return +(20 + Math.random() * 30).toFixed(2)
}

const getPillClass = (v) => {
  if (v < 1.5) return 'bg-red-500/20 text-red-400 border border-red-500/40'
  if (v < 5)   return 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
  return 'bg-green-500/20 text-green-400 border border-green-500/40'
}

function BetPanel({ id, phase, playerState, onAction, coins }) {
  const [bet, setBet] = useState(id === 1 ? 50 : 100)
  const ps = playerState

  const handleAction = () => onAction(id, bet)

  const getButtonContent = () => {
    if (phase === 'countdown') {
      if (ps.on) return { label: 'Cancel', sub: `${ps.amt} queued`, cls: 'bg-red-600 hover:bg-red-500 text-white' }
      return { label: 'BET', sub: null, cls: 'bg-gradient-to-br from-violet-600 to-violet-800 hover:brightness-110 text-white' }
    }
    if (phase === 'flying') {
      if (ps.on && !ps.out) {
        return { label: 'CASH OUT', sub: null, cls: 'bg-gradient-to-br from-amber-400 to-amber-600 text-black hover:brightness-110' }
      }
      if (ps.out) return { label: 'Cashed Out ✓', sub: null, cls: 'bg-gray-700 text-gray-400 cursor-not-allowed', disabled: true }
      return { label: 'Waiting...', sub: null, cls: 'bg-gray-700 text-gray-400 cursor-not-allowed', disabled: true }
    }
    return { label: 'BET', sub: null, cls: 'bg-gradient-to-br from-violet-600 to-violet-800 text-white' }
  }

  const btn = getButtonContent()
  return (
    <div className="bg-[#17102a] rounded-xl border border-[#2e1d4a] p-3">
      {/* Tabs */}
      <div className="flex bg-[#0f0a1a] rounded-lg p-1 mb-3">
        <div className="flex-1 text-center py-1 text-xs font-bold text-white bg-[#2e1d4a] rounded-md">Bet</div>
        <div className="flex-1 text-center py-1 text-xs font-bold text-white/30 rounded-md">Auto</div>
      </div>

      {/* Bet Amount */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setBet(b => Math.max(10, b - 10))}
          className="w-8 h-8 bg-[#0f0a1a] border border-[#3a2450] text-white rounded-lg text-lg flex items-center justify-center hover:bg-[#2e1d4a] transition-colors"
        >−</button>
        <input
          type="number"
          value={bet}
          onChange={e => setBet(Math.max(10, +e.target.value))}
          className="flex-1 bg-[#0f0a1a] border border-[#3a2450] rounded-lg text-white text-center text-sm font-bold py-1.5 outline-none"
        />
        <button
          onClick={() => setBet(b => b + 10)}
          className="w-8 h-8 bg-[#0f0a1a] border border-[#3a2450] text-white rounded-lg text-lg flex items-center justify-center hover:bg-[#2e1d4a] transition-colors"
        >+</button>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-1 mb-3">
        {[10, 50, 100, 250].map(v => (
          <button key={v} onClick={() => setBet(v)}
            className="flex-1 bg-[#0f0a1a] border border-[#3a2450] text-white/50 rounded py-1 text-[11px] font-semibold hover:border-violet-500 hover:text-purple-300 transition-colors">
            {v}
          </button>
        ))}
      </div>

      {/* Action Button */}
      <button
        onClick={handleAction}
        disabled={btn.disabled}
        className={`w-full py-3 rounded-xl text-sm font-black tracking-wide transition-all active:scale-95 ${btn.cls}`}
      >
        {btn.label}
        {btn.sub && <span className="block text-[11px] font-semibold opacity-70 mt-0.5">{btn.sub}</span>}
      </button>
    </div>
  )
}

export default function Aviator() {
  const svgRef = useRef(null)
  const timerRef = useRef(null)
  const multRef = useRef(1.00)
  const crashRef = useRef(1.00)
  const phaseRef = useRef('countdown')

  const [phase, setPhase] = useState('countdown')
  const [mult, setMult] = useState(1.00)
  const [countdown, setCountdown] = useState(5)
  const [coins, setCoins] = useState(1000)
  const [history, setHistory] = useState([])
  const [players, setPlayers] = useState({
    1: { on: false, out: false, amt: 0 },
    2: { on: false, out: false, amt: 0 },
  })
  const [toast, setToast] = useState(null)
  const [crashed, setCrashed] = useState(false)
  const [crashAt, setCrashAt] = useState(null)

  const showToast = useCallback((msg, type) => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2600)
  }, [])

  const drawCurve = useCallback((progress) => {
    const svg = svgRef.current
    if (!svg) return
    const W = 800, H = 380, steps = 60
    const pts = []
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * progress
      const x = 55 + t * (W - 80)
      const y = H - 15 - Math.pow(t, 0.6) * (H - 60)
      pts.push({ x, y })
    }
    const fill = svg.querySelector('#cfill')
    const stroke = svg.querySelector('#cstroke')
    const plane = svg.querySelector('#pg')
    const planeEmoji = svg.querySelector('#pe')

    if (pts.length < 2) {
      fill?.setAttribute('d', '')
      stroke?.setAttribute('d', '')
      return
    }

    let d = `M ${pts[0].x} ${pts[0].y}`
    pts.slice(1).forEach(p => d += ` L ${p.x} ${p.y}`)
    stroke?.setAttribute('d', d)
    fill?.setAttribute('d', `${d} L ${pts[pts.length - 1].x} ${H} L 55 ${H} Z`)

    const last = pts[pts.length - 1]
    const prev = pts[Math.max(0, pts.length - 3)]
    const ang = Math.atan2(-(last.y - prev.y), last.x - prev.x) * 180 / Math.PI
    plane?.setAttribute('transform', `translate(${last.x},${last.y}) rotate(${-ang})`)
    if (planeEmoji) planeEmoji.textContent = '✈'
  }, [])

  const resetCurve = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.querySelector('#cfill')?.setAttribute('d', '')
    svg.querySelector('#cstroke')?.setAttribute('d', '')
    svg.querySelector('#pg')?.setAttribute('transform', 'translate(55,345)')
    const pe = svg.querySelector('#pe')
    if (pe) pe.textContent = '✈'
  }, [])

  const startCountdown = useCallback(() => {
    clearInterval(timerRef.current)
    phaseRef.current = 'countdown'
    multRef.current = 1.00
    crashRef.current = genCrash()
    setPhase('countdown')
    setMult(1.00)
    setCrashed(false)
    setCrashAt(null)
    setCountdown(5)
    setPlayers({ 1: { on: false, out: false, amt: 0 }, 2: { on: false, out: false, amt: 0 } })
    resetCurve()

    let cd = 5
    timerRef.current = setInterval(() => {
      cd--
      setCountdown(cd)
      if (cd <= 0) {
        clearInterval(timerRef.current)
        startFly()
      }
    }, 1000)
  }, [resetCurve])

  const startFly = useCallback(() => {
    clearInterval(timerRef.current)
    phaseRef.current = 'flying'
    setPhase('flying')
    multRef.current = 1.00

    timerRef.current = setInterval(() => {
      multRef.current = parseFloat((multRef.current + multRef.current * 0.04).toFixed(2))
      const cur = multRef.current
      setMult(cur)
      const prog = Math.min((cur - 1) / 49, 1)
      drawCurve(prog)

      if (cur >= crashRef.current) {
        clearInterval(timerRef.current)
        doCrash(cur)
      }
    }, 100)
  }, [drawCurve])

  const doCrash = useCallback((crashVal) => {
    const cv = crashVal || crashRef.current
    phaseRef.current = 'crashed'
    setPhase('crashed')
    setCrashed(true)
    setCrashAt(cv)
    setHistory(prev => [cv, ...prev].slice(0, 20))

    const svg = svgRef.current
    const pe = svg?.querySelector('#pe')
    if (pe) pe.textContent = '💥'

    setPlayers(prev => {
      Object.entries(prev).forEach(([p, s]) => {
        if (s.on && !s.out) showToast(`Lost ${s.amt} coins!`, 'lose')
      })
      return prev
    })

    setTimeout(startCountdown, 4000)
  }, [showToast, startCountdown])

  useEffect(() => {
    startCountdown()
    return () => clearInterval(timerRef.current)
  }, [])

  const handleAction = useCallback((id, bet) => {
    if (phaseRef.current === 'countdown') {
      setPlayers(prev => {
        const s = prev[id]
        if (s.on) {
          setCoins(c => c + s.amt)
          showToast('Bet cancelled', 'info')
          return { ...prev, [id]: { on: false, out: false, amt: 0 } }
        } else {
          if (bet < 10) { showToast('Min 10 coins', 'lose'); return prev }
          if (bet > coins) { showToast('Not enough coins!', 'lose'); return prev }
          setCoins(c => c - bet)
          showToast(`Bet placed: ${bet} coins`, 'info')
          return { ...prev, [id]: { on: true, out: false, amt: bet } }
        }
      })
    } else if (phaseRef.current === 'flying') {
      setPlayers(prev => {
        const s = prev[id]
        if (s.on && !s.out) {
          const won = Math.floor(s.amt * multRef.current)
          setCoins(c => c + won)
          showToast(`Cashed out ${won.toLocaleString()} at ${multRef.current.toFixed(2)}x!`, 'win')
          return { ...prev, [id]: { ...s, out: true } }
        }
        return prev
      })
    }
  }, [coins, showToast])

  const multColor = crashed ? 'text-red-400' : mult >= 5 ? 'text-green-400' : mult >= 2 ? 'text-purple-300' : 'text-white'

  return (
    <div className="min-h-screen bg-[#1a1025] flex flex-col overflow-hidden" style={{ fontFamily: 'Segoe UI, sans-serif' }}>

      {/* TOAST */}
      {toast && (
        <div className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl text-sm font-bold border
          ${toast.type === 'win' ? 'bg-green-950 border-green-600 text-green-400' :
            toast.type === 'lose' ? 'bg-red-950 border-red-700 text-red-400' :
            'bg-violet-950 border-violet-600 text-purple-300'}`}>
          {toast.msg}
        </div>
      )}

      {/* HISTORY BAR */}
      <div className="bg-[#0f0a1a] border-b border-[#2a1a3a] px-3 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
        <span className="text-white/30 text-lg">···</span>
        {history.map((v, i) => (
          <span key={i} className={`px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${getPillClass(v)}`}>
            {v.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* MODE BAR */}
      <div className="bg-[#12091e] border-b border-[#2a1a3a] text-center py-1 text-[11px] font-black text-purple-400 tracking-[3px] flex-shrink-0">
        FUN MODE
      </div>

      {/* GAME AREA */}
      <div className="flex-1 relative min-h-0"
        style={{ background: 'radial-gradient(ellipse at 50% 105%, #4a0f8a 0%, #230845 40%, #0d0618 100%)' }}>

        <svg ref={svgRef} viewBox="0 0 800 380" preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full scale-12">
          <defs>
            <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <linearGradient id="fg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(180,50,255,0.25)" />
              <stop offset="100%" stopColor="rgba(180,50,255,0)" />
            </linearGradient>
          </defs>
          {[95, 190, 285].map(y => (
            <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}
          {[200, 400, 600].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="380" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}
          <path id="cfill" d="" fill="url(#fg)" />
          <path id="cstroke" d="" fill="none" stroke="url(#cg)" strokeWidth="3.5" strokeLinecap="round" />
          <g id="pg" transform="translate(55,345)">
            <text id="pe" fontSize="28" textAnchor="middle" dominantBaseline="middle" fill="white">✈</text>
          </g>
        </svg>

        {/* MULTIPLIER */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] text-center pointer-events-none z-10">
          {phase === 'countdown' ? (
            <div className="text-5xl font-black text-white/60">{countdown}s</div>
          ) : (
            <div className={`text-7xl font-black leading-none tracking-tight ${multColor}`}
              style={{ textShadow: crashed ? '0 0 30px rgba(239,68,68,0.6)' : '0 0 30px rgba(147,51,234,0.5)' }}>
              {mult.toFixed(2)}x
            </div>
          )}
          {crashed && (
            <div className="mt-2">
              <div className="text-2xl font-black text-red-400">FLEW AWAY!</div>
              <div className="text-sm text-white/50">Crashed at {crashAt?.toFixed(2)}x</div>
            </div>
          )}
        </div>

        {/* COINS */}
        <div className="absolute top-2.5 right-3 bg-black/50 border border-yellow-500/30 rounded-full px-3 py-1 text-sm font-bold text-yellow-400 z-20">
          🪙 {coins.toLocaleString()}
        </div>
      </div>

      {/* BET PANELS */}
      <div className="bg-[#0f0a1a] border-t border-[#2a1a3a] p-3 grid grid-cols-2 gap-3 flex-shrink-0">
        {[1, 2].map(id => (
          <BetPanel
            key={id}
            id={id}
            phase={phase}
            playerState={players[id]}
            onAction={handleAction}
            coins={coins}
          />
        ))}
      </div>
    </div>
  )
}