import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/App";
import { Calendar, Users, User, Handshake, Shield, Crown, LogOut, Menu, X, Newspaper } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_payment-ops-5/artifacts/54034mu4_7550b98c-30de-4cea-a42f-38c89afa251b.png";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: Newspaper },
  { path: "/events", label: "Events", icon: Calendar },
  { path: "/packs", label: "Packs", icon: Users },
  { path: "/partner", label: "Partner", icon: Handshake },
  { path: "/membership", label: "Join", icon: Crown },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#0c0a08]">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-6 py-3" data-testid="main-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group" data-testid="logo-link">
            <img src={LOGO_URL} alt="Foxhounds" className="w-11 h-11 rounded-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="hidden sm:block">
              <span className="font-serif text-lg text-[#f5f0e8] tracking-tight leading-none">Foxhounds</span>
              <span className="block text-[0.6rem] text-[#c9a44a] font-sans font-semibold tracking-[0.15em] uppercase">Wine & Craft Beer Social</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7" data-testid="desktop-nav">
            {NAV_ITEMS.map(({ path, label }) => (
              <Link key={path} to={path}
                className={`text-xs font-sans font-medium uppercase tracking-[0.08em] transition-colors duration-300 ${
                  location.pathname === path ? "text-[#c9a44a]" : "text-[#b5a99a] hover:text-[#f5f0e8]"
                }`} data-testid={`nav-${label.toLowerCase()}`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link to="/admin" className="text-xs font-sans font-medium uppercase tracking-[0.08em] text-[#c9a44a] hover:text-[#d4883a] transition-colors flex items-center gap-1" data-testid="nav-admin">
                    <Shield className="w-3.5 h-3.5" /> Admin
                  </Link>
                )}
                <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161210] border border-[rgba(201,164,74,0.15)] hover:border-[#c9a44a] transition-all" data-testid="nav-profile">
                  <div className="w-6 h-6 rounded-full bg-[#c9a44a]/20 flex items-center justify-center text-[0.6rem] font-bold text-[#c9a44a]">
                    {(user.name || "U")[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-sans text-[#f5f0e8]">{user.name || "Profile"}</span>
                </Link>
                <button onClick={logout} className="text-[#7a7068] hover:text-[#f5f0e8] transition-colors" data-testid="logout-btn">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline text-xs py-2 px-5" data-testid="nav-login">Sign In</Link>
                <Link to="/register" className="btn-amber text-xs py-2 px-5" data-testid="nav-register">Join the Pack</Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden text-[#b5a99a]" onClick={() => setMenuOpen(!menuOpen)} data-testid="mobile-menu-toggle">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/5 pt-4 space-y-3" data-testid="mobile-nav">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-2 py-2 text-sm font-sans rounded-lg ${
                  location.pathname === path ? "text-[#c9a44a] bg-[#c9a44a]/5" : "text-[#b5a99a]"
                }`} data-testid={`mobile-nav-${label.toLowerCase()}`}>
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-sm font-sans text-[#c9a44a]">
                    <Shield className="w-4 h-4" /> Admin
                  </Link>
                )}
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-sm font-sans text-[#b5a99a]">
                  <User className="w-4 h-4" /> Profile
                </Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="flex items-center gap-3 px-2 py-2 text-sm font-sans text-[#7a7068]">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-3 px-2 pt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-outline text-xs py-2 px-4">Sign In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-amber text-xs py-2 px-4">Join the Pack</Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main><Outlet /></main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6 bg-[#0c0a08]" data-testid="main-footer">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={LOGO_URL} alt="Foxhounds" className="w-10 h-10 rounded-full" />
                <div>
                  <span className="font-serif text-lg text-[#f5f0e8]">Foxhounds</span>
                  <span className="block text-[0.6rem] text-[#c9a44a] font-sans font-semibold tracking-[0.12em] uppercase">Wine & Craft Beer Social</span>
                </div>
              </div>
              <p className="text-[#7a7068] text-sm font-sans leading-relaxed">
                Where wine lovers and craft beer enthusiasts come together. Taste, socialize, repeat.
              </p>
            </div>
            <div>
              <h4 className="overline mb-4">Explore</h4>
              <div className="space-y-2">
                <Link to="/events" className="block text-sm text-[#b5a99a] hover:text-[#f5f0e8] transition-colors">Events</Link>
                <Link to="/packs" className="block text-sm text-[#b5a99a] hover:text-[#f5f0e8] transition-colors">Foxhound Packs</Link>
                <Link to="/membership" className="block text-sm text-[#b5a99a] hover:text-[#f5f0e8] transition-colors">Membership</Link>
              </div>
            </div>
            <div>
              <h4 className="overline mb-4">Company</h4>
              <div className="space-y-2">
                <Link to="/partner" className="block text-sm text-[#b5a99a] hover:text-[#f5f0e8] transition-colors">Partner With Us</Link>
                <span className="block text-sm text-[#7a7068]">Press</span>
                <span className="block text-sm text-[#7a7068]">Careers</span>
              </div>
            </div>
            <div>
              <h4 className="overline mb-4">Legal</h4>
              <div className="space-y-2">
                <span className="block text-sm text-[#7a7068]">Privacy Policy</span>
                <span className="block text-sm text-[#7a7068]">Terms of Service</span>
                <span className="block text-sm text-[#7a7068]">Must be 21+</span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 mt-12 pt-8 text-center">
            <p className="text-[#7a7068] text-xs font-sans tracking-wide">
              &copy; 2026 Foxhounds Wine & Craft Beer Social. All rights reserved. Please drink responsibly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
