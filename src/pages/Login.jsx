import { useState } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Login() {
  const [tab, setTab] = useState("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [loginMsg, setLoginMsg] = useState({ text: "", type: "" });
  const [signupMsg, setSignupMsg] = useState({ text: "", type: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginMsg({ text: "⚠️ Please fill all fields!", type: "error" });
      return;
    }
    setLoginLoading(true);
    setLoginMsg({ text: "⏳ Logging in...", type: "" });
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setLoginMsg({ text: "✅ Welcome back! Loading games...", type: "success" });
      setTimeout(() => { window.location.href = "/"; }, 1000);
    } catch (err) {
      setLoginMsg({
        text: err.code === "auth/invalid-credential"
          ? "⚠️ Wrong email or password!"
          : "⚠️ " + err.message,
        type: "error",
      });
      setLoginLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupName || !signupEmail || !signupPassword) {
      setSignupMsg({ text: "⚠️ Please fill all fields!", type: "error" });
      return;
    }
    if (signupPassword.length < 6) {
      setSignupMsg({ text: "⚠️ Password must be at least 6 characters!", type: "error" });
      return;
    }
    setSignupLoading(true);
    setSignupMsg({ text: "⏳ Creating account...", type: "" });
    try {
      const userCred = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      await updateProfile(userCred.user, { displayName: signupName });
      await setDoc(doc(db, "users", userCred.user.uid), {
        name: signupName,
        email: signupEmail,
        coins: 1000,
        totalGames: 0,
        totalWins: 0,
        joinDate: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isPremium: false,
        dailyBonusClaimed: false,
      });
      setSignupMsg({ text: "🎉 Account created! Welcome to Gamble Wamble!", type: "success" });
      setTimeout(() => { window.location.href = "/"; }, 1500);
    } catch (err) {
      setSignupMsg({
        text: err.code === "auth/email-already-in-use"
          ? "⚠️ Email already registered! Please login."
          : "⚠️ " + err.message,
        type: "error",
      });
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#0a0a0f" }}>

      {/* Background */}
      <div className="fixed inset-0 z-0" style={{
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(255,165,0,0.08) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(255,215,0,0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 60% 80%, rgba(255,100,0,0.05) 0%, transparent 50%)`
      }} />

      {/* Grid */}
      <div className="fixed inset-0 z-0" style={{
        backgroundImage: `
          linear-gradient(rgba(255,215,0,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,215,0,0.03) 1px, transparent 1px)`,
        backgroundSize: "50px 50px"
      }} />

      {/* Container */}
      <div className="relative z-10 w-full max-w-md px-5">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl block mb-2" style={{
            animation: "pulse 2s ease-in-out infinite",
            filter: "drop-shadow(0 0 10px rgba(255,215,0,0.5))"
          }}>🎰</span>
          <h1 className="text-5xl font-black tracking-widest"
            style={{
              fontFamily: "'Bebas Neue', cursive",
              background: "linear-gradient(135deg, #FFD700, #FFA500)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
            Gamble Wamble
          </h1>
          <p className="text-xs tracking-widest mt-1" style={{ color: "#8888aa", letterSpacing: 3 }}>
            PLAY • WIN • ENJOY
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 relative overflow-hidden"
          style={{ background: "#12121a", border: "1px solid #2a2a3a" }}>

          {/* Gold top border */}
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: "linear-gradient(90deg, transparent, #FFD700, #FFA500, transparent)" }} />

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-7"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            {["login", "signup"].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm tracking-wider capitalize transition-all duration-300"
                style={{
                  background: tab === t ? "linear-gradient(135deg, #FFD700, #FFA500)" : "transparent",
                  color: tab === t ? "#000" : "#8888aa",
                }}>
                {t === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* LOGIN FORM */}
          {tab === "login" && (
            <div>
              {/* Email */}
              <div className="mb-4">
                <label className="block text-xs font-semibold tracking-widest uppercase mb-2"
                  style={{ color: "#8888aa" }}>Email</label>
                <input type="email" placeholder="your@email.com"
                  value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid #2a2a3a",
                    color: "#fff",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#FFD700"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#2a2a3a"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Password */}
              <div className="mb-2">
                <label className="block text-xs font-semibold tracking-widest uppercase mb-2"
                  style={{ color: "#8888aa" }}>Password</label>
                <input type="password" placeholder="••••••••"
                  value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid #2a2a3a",
                    color: "#fff",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#FFD700"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#2a2a3a"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Button */}
              <button onClick={handleLogin} disabled={loginLoading}
                className="w-full py-4 rounded-xl font-bold tracking-widest uppercase text-black mt-2 transition-all"
                style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}
                onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 25px rgba(255,165,0,0.4)"; }}
                onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}
              >
                {loginLoading ? "⏳ Logging in..." : "🎮 Enter Gamble Wamble"}
              </button>

              {/* Message */}
              {loginMsg.text && (
                <div className="mt-3 px-4 py-3 rounded-xl text-sm text-center"
                  style={{
                    background: loginMsg.type === "error" ? "rgba(255,50,50,0.1)" : "rgba(50,255,100,0.1)",
                    border: `1px solid ${loginMsg.type === "error" ? "rgba(255,50,50,0.3)" : "rgba(50,255,100,0.3)"}`,
                    color: loginMsg.type === "error" ? "#ff6b6b" : "#6bffaa",
                  }}>
                  {loginMsg.text}
                </div>
              )}
            </div>
          )}

          {/* SIGNUP FORM */}
          {tab === "signup" && (
            <div>
              {/* Bonus Badge */}
              <div className="flex items-center gap-3 rounded-xl p-3 mb-5"
                style={{
                  background: "linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,165,0,0.1))",
                  border: "1px solid rgba(255,215,0,0.2)"
                }}>
                <span className="text-2xl">🎁</span>
                <div>
                  <strong className="block text-sm font-bold" style={{ color: "#FFD700" }}>
                    Welcome Bonus — 1,000 Free Coins!
                  </strong>
                  <small style={{ color: "#8888aa", fontSize: 12 }}>
                    Sign up today and start playing instantly
                  </small>
                </div>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-xs font-semibold tracking-widest uppercase mb-2"
                  style={{ color: "#8888aa" }}>Full Name</label>
                <input type="text" placeholder="Your name"
                  value={signupName} onChange={(e) => setSignupName(e.target.value)}
                  className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3a", color: "#fff" }}
                  onFocus={(e) => { e.target.style.borderColor = "#FFD700"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#2a2a3a"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-xs font-semibold tracking-widest uppercase mb-2"
                  style={{ color: "#8888aa" }}>Email</label>
                <input type="email" placeholder="your@email.com"
                  value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3a", color: "#fff" }}
                  onFocus={(e) => { e.target.style.borderColor = "#FFD700"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#2a2a3a"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Password */}
              <div className="mb-2">
                <label className="block text-xs font-semibold tracking-widest uppercase mb-2"
                  style={{ color: "#8888aa" }}>Password</label>
                <input type="password" placeholder="Min 6 characters"
                  value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3a", color: "#fff" }}
                  onFocus={(e) => { e.target.style.borderColor = "#FFD700"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#2a2a3a"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Button */}
              <button onClick={handleSignup} disabled={signupLoading}
                className="w-full py-4 rounded-xl font-bold tracking-widest uppercase text-black mt-2 transition-all"
                style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}
                onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 25px rgba(255,165,0,0.4)"; }}
                onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}
              >
                {signupLoading ? "⏳ Creating Account..." : "🚀 Create Account"}
              </button>

              {/* Message */}
              {signupMsg.text && (
                <div className="mt-3 px-4 py-3 rounded-xl text-sm text-center"
                  style={{
                    background: signupMsg.type === "error" ? "rgba(255,50,50,0.1)" : "rgba(50,255,100,0.1)",
                    border: `1px solid ${signupMsg.type === "error" ? "rgba(255,50,50,0.3)" : "rgba(50,255,100,0.3)"}`,
                    color: signupMsg.type === "error" ? "#ff6b6b" : "#6bffaa",
                  }}>
                  {signupMsg.text}
                </div>
              )}
            </div>
          )}

          {/* Features */}
          <div className="flex justify-around mt-6 pt-6"
            style={{ borderTop: "1px solid #2a2a3a" }}>
            {[
              { icon: "🎰", label: "25+ Games" },
              { icon: "🪙", label: "Free Coins" },
              { icon: "🏆", label: "Leaderboard" },
              { icon: "🎁", label: "Daily Bonus" },
            ].map((f) => (
              <div key={f.label} className="text-center">
                <span className="text-xl block mb-1">{f.icon}</span>
                <span className="text-xs" style={{ color: "#8888aa" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        @keyframes pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(255,215,0,0.5)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 20px rgba(255,215,0,0.8)); }
        }
      `}</style>
    </div>
  );
}
