import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./pages/Login";
import FishHunter from "./Components/FishHunter";
import Plinko from "./Components/Plinko";
import FortuneWheel from "./Components/FortuneWheel";
import FruityPartySlots from "./Components/FruityPartySlots";
import FiveTreasures from "./Components/FiveTreasures";
import Aviators from "./Components/Aviators";
import Game1 from "./Components/Game1";
import Game2 from "./Components/Game2";
import Game3 from "./Components/Game3";
import Game4 from "./Components/Game4";
import Game5 from "./Components/Game5";
import Game6 from "./Components/Game6";
import Game7 from "./Components/Game7";
import Game8 from "./Components/Game8";
import Game9 from "./Components/Game9";
import Game10 from "./Components/Game10";

export default function App() {
  const [game, setGame] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Firebase Auth State Check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ⏳ Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎰</div>
          <p className="text-yellow-400 font-bold tracking-widest text-lg animate-pulse">
            LOADING...
          </p>
        </div>
      </div>
    );
  }

  // 🔐 Not Logged In — Show Login Page
  if (!user) {
    return <Login />;
  }

  // 🎮 Game Screens
  if (game === "aviators")  return <GameWrapper setGame={setGame}><Aviators /></GameWrapper>;
  if (game === "treasures") return <GameWrapper setGame={setGame}><FiveTreasures /></GameWrapper>;
  if (game === "slots")     return <GameWrapper setGame={setGame}><FruityPartySlots /></GameWrapper>;
  if (game === "fish")      return <GameWrapper setGame={setGame}><FishHunter /></GameWrapper>;
  if (game === "plinko")    return <GameWrapper setGame={setGame}><Plinko /></GameWrapper>;
  if (game === "wheel")     return <GameWrapper setGame={setGame}><FortuneWheel /></GameWrapper>;
  if (game === "g1")  return <GameWrapper setGame={setGame}><Game1 /></GameWrapper>;
  if (game === "g2")  return <GameWrapper setGame={setGame}><Game2 /></GameWrapper>;
  if (game === "g3")  return <GameWrapper setGame={setGame}><Game3 /></GameWrapper>;
  if (game === "g4")  return <GameWrapper setGame={setGame}><Game4 /></GameWrapper>;
  if (game === "g5")  return <GameWrapper setGame={setGame}><Game5 /></GameWrapper>;
  if (game === "g6")  return <GameWrapper setGame={setGame}><Game6 /></GameWrapper>;
  if (game === "g7")  return <GameWrapper setGame={setGame}><Game7 /></GameWrapper>;
  if (game === "g8")  return <GameWrapper setGame={setGame}><Game8 /></GameWrapper>;
  if (game === "g9")  return <GameWrapper setGame={setGame}><Game9 /></GameWrapper>;
  if (game === "g10") return <GameWrapper setGame={setGame}><Game10 /></GameWrapper>;

  // 🎮 Main Arcade Menu
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 p-6">
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-widest text-yellow-400"
          style={{ fontFamily: "'Bebas Neue', cursive" }}>
          🎮 GAMBLE WAMBLE
        </h1>
        <p className="text-gray-400 text-sm mt-1 tracking-widest">
          Welcome, {user.displayName || user.email}!
        </p>
      </div>

      {/* Game Grid */}
      <div className="flex flex-wrap gap-6 justify-center max-w-5xl">
        <MenuBtn icon="✈️" title="AVIATOR"      onClick={() => setGame("aviators")}  color="purple" />
        <MenuBtn icon="🐟" title="FISH HUNTER"  onClick={() => setGame("fish")}      color="cyan"   />
        <MenuBtn icon="🎯" title="PLINKO"        onClick={() => setGame("plinko")}    color="yellow" />
        <MenuBtn icon="🎡" title="WHEEL"         onClick={() => setGame("wheel")}     color="yellow" />
        <MenuBtn icon="🍓" title="SLOTS"         onClick={() => setGame("slots")}     color="yellow" />
        <MenuBtn icon="🎰" title="5 TREASURES"   onClick={() => setGame("treasures")} color="purple" />
        <MenuBtn icon="🎮" title="GAME 1"        onClick={() => setGame("g1")}        color="cyan"   />
        <MenuBtn icon="🎮" title="GAME 2"        onClick={() => setGame("g2")}        color="cyan"   />
        <MenuBtn icon="🎮" title="GAME 3"        onClick={() => setGame("g3")}        color="cyan"   />
        <MenuBtn icon="🎮" title="GAME 4"        onClick={() => setGame("g4")}        color="cyan"   />
        <MenuBtn icon="🎮" title="GAME 5"        onClick={() => setGame("g5")}        color="cyan"   />
        <MenuBtn icon="🎮" title="GAME 6"        onClick={() => setGame("g6")}        color="cyan"   />
        <MenuBtn icon="🎮" title="GAME 7"        onClick={() => setGame("g7")}        color="cyan"   />
        <MenuBtn icon="🎮" title="GAME 8"        onClick={() => setGame("g8")}        color="cyan"   />
        <MenuBtn icon="🎮" title="GAME 9"        onClick={() => setGame("g9")}        color="cyan"   />
        <MenuBtn icon="🎮" title="GAME 10"       onClick={() => setGame("g10")}       color="cyan"   />
      </div>

      {/* Logout Button */}
      <button
        onClick={() => auth.signOut()}
        className="mt-4 px-6 py-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold tracking-widest text-sm transition-all"
      >
        🚪 LOGOUT
      </button>
    </div>
  );
}

// 🔁 Game Wrapper — Back button
function GameWrapper({ children, setGame }) {
  return (
    <div>
      <button
        onClick={() => setGame(null)}
        className="fixed top-3 left-3 z-50 bg-black/60 text-yellow-400 border border-yellow-400/40 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-yellow-400/10 transition-all"
      >
        ← Back
      </button>
      {children}
    </div>
  );
}

// 🎯 Menu Button
function MenuBtn({ icon, title, onClick, color }) {
  const colors = {
    cyan:   "border-cyan-400/40   bg-cyan-400/10   hover:bg-cyan-400/20   text-cyan-400",
    yellow: "border-yellow-400/40 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400",
    purple: "border-purple-400/40 bg-purple-400/10 hover:bg-purple-400/20 text-purple-400",
  };

  return (
    <button
      onClick={onClick}
      className={`w-56 h-40 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${colors[color]}`}
    >
      <span className="text-5xl">{icon}</span>
      <span className="text-xl font-black tracking-widest">{title}</span>
    </button>
  );
}