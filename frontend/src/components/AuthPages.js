import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/App";
import { ArrowRight } from "lucide-react";

const LOGO_URL = "/foxhounds-logo.png";

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
    <div className="min-h-screen bg-[#0c0a08] flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-[#0c0a08]/75" />
        <div className="relative z-10 px-16 text-center">
          <img src={LOGO_URL} alt="Foxhounds" className="w-32 h-32 mx-auto mb-8 drop-shadow-2xl" />
          <h1 className="font-serif text-4xl text-[#f5f0e8] mb-2">Foxhounds</h1>
          <p className="text-[#c9a44a] text-sm font-sans font-semibold tracking-[0.15em] uppercase">Wine & Craft Beer Social</p>
          <p className="text-[#b5a99a] text-base font-sans mt-4 max-w-sm mx-auto">Where the best people come to taste, connect, and celebrate great drinks together.</p>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-10">
            <img src={LOGO_URL} alt="Foxhounds" className="w-20 h-20 mb-4 drop-shadow-xl" />
            <span className="font-serif text-2xl text-[#f5f0e8]">Foxhounds</span>
            <span className="text-[#c9a44a] text-xs font-sans font-semibold tracking-[0.12em] uppercase">Wine & Craft Beer Social</span>
          </div>

          <div className="overline mb-3">{mode === "login" ? "Welcome back, friend" : "Join the pack"}</div>
          <h2 className="font-serif text-3xl text-[#f5f0e8] mb-8">
            {mode === "login" ? "Sign In" : "Create Your Account"}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-sans" data-testid="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="auth-form">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Your Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="fh-input" placeholder="What should we call you?" required data-testid="register-name-input" />
              </div>
            )}
            <div>
              <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="fh-input" placeholder="you@example.com" required data-testid="auth-email-input" />
            </div>
            <div>
              <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="fh-input" placeholder="Enter your password" required data-testid="auth-password-input" />
            </div>
            <button type="submit" disabled={loading} className="btn-amber w-full flex items-center justify-center gap-2 mt-8" data-testid="auth-submit-btn">
              {loading ? "One moment..." : mode === "login" ? "Sign In" : "Join the Pack"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#7a7068] font-sans">
            {mode === "login" ? (
              <>New here? <Link to="/register" className="text-[#c9a44a] hover:underline" data-testid="switch-to-register">Join the pack</Link></>
            ) : (
              <>Already a Foxhound? <Link to="/login" className="text-[#c9a44a] hover:underline" data-testid="switch-to-login">Sign in</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
