import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Wine, ArrowRight } from "lucide-react";

function formatError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).filter(Boolean).join(" ");
  if (detail?.msg) return detail.msg;
  return String(detail);
}

export default function AuthPages({ mode }) {
  const { user, login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1647101734210-ff5d79813069?w=1200)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 px-16 text-center">
          <Wine className="w-12 h-12 text-[#d4af37] mx-auto mb-6" />
          <h1 className="font-serif text-5xl text-[#fdfcf0] mb-4">Vine & Barrel</h1>
          <p className="text-[#a1a1aa] text-lg font-sans">America's Premier Tasting Platform</p>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-12 justify-center">
            <Wine className="w-6 h-6 text-[#d4af37]" />
            <span className="font-serif text-2xl text-[#fdfcf0]">Vine & Barrel</span>
          </div>

          <div className="overline mb-3">{mode === "login" ? "Welcome back" : "Join the club"}</div>
          <h2 className="font-serif text-3xl text-[#fdfcf0] mb-8">
            {mode === "login" ? "Sign In" : "Create Account"}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-sans" data-testid="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="auth-form">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="vb-input" placeholder="Your full name" required data-testid="register-name-input" />
              </div>
            )}
            <div>
              <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="vb-input" placeholder="you@example.com" required data-testid="auth-email-input" />
            </div>
            <div>
              <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="vb-input" placeholder="Enter your password" required data-testid="auth-password-input" />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2 mt-8" data-testid="auth-submit-btn">
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#71717a] font-sans">
            {mode === "login" ? (
              <>Don't have an account? <Link to="/register" className="text-[#d4af37] hover:underline" data-testid="switch-to-register">Join now</Link></>
            ) : (
              <>Already a member? <Link to="/login" className="text-[#d4af37] hover:underline" data-testid="switch-to-login">Sign in</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
