import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Wine, Calendar, Users, User, Handshake, Shield, Crown, LogOut, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: Wine },
  { path: "/events", label: "Events", icon: Calendar },
  { path: "/packs", label: "Packs", icon: Users },
  { path: "/partner", label: "Partner", icon: Handshake },
  { path: "/membership", label: "Membership", icon: Crown },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-6 py-4" data-testid="main-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group" data-testid="logo-link">
            <Wine className="w-6 h-6 text-[#d4af37] group-hover:rotate-12 transition-transform duration-500" />
            <div>
              <span className="font-serif text-xl text-[#fdfcf0] tracking-tight">Vine & Barrel</span>
              <span className="ml-2 text-[#71717a] text-xs font-sans">Est. 2026</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8" data-testid="desktop-nav">
            {NAV_ITEMS.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`text-xs font-sans font-medium uppercase tracking-[0.1em] transition-colors duration-300 ${
                  location.pathname === path ? "text-[#d4af37]" : "text-[#a1a1aa] hover:text-[#fdfcf0]"
                }`}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link to="/admin" className="text-xs font-sans font-medium uppercase tracking-[0.1em] text-[#d4af37] hover:text-[#b5952f] transition-colors flex items-center gap-1" data-testid="nav-admin">
                    <Shield className="w-3.5 h-3.5" /> Admin
                  </Link>
                )}
                <Link to="/profile" className="text-xs font-sans font-medium uppercase tracking-[0.1em] text-[#a1a1aa] hover:text-[#fdfcf0] transition-colors flex items-center gap-1" data-testid="nav-profile">
                  <User className="w-3.5 h-3.5" /> {user.name || "Profile"}
                </Link>
                <button onClick={logout} className="text-[#71717a] hover:text-[#fdfcf0] transition-colors" data-testid="logout-btn">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline text-xs py-2 px-4" data-testid="nav-login">Sign In</Link>
                <Link to="/register" className="btn-gold text-xs py-2 px-4" data-testid="nav-register">Join</Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden text-[#a1a1aa]" onClick={() => setMenuOpen(!menuOpen)} data-testid="mobile-menu-toggle">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4 space-y-3" data-testid="mobile-nav">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-2 py-2 text-sm font-sans ${location.pathname === path ? "text-[#d4af37]" : "text-[#a1a1aa]"}`}
                data-testid={`mobile-nav-${label.toLowerCase()}`}>
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-sm font-sans text-[#d4af37]">
                    <Shield className="w-4 h-4" /> Admin
                  </Link>
                )}
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-2 py-2 text-sm font-sans text-[#a1a1aa]">
                  <User className="w-4 h-4" /> Profile
                </Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="flex items-center gap-3 px-2 py-2 text-sm font-sans text-[#71717a]">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-3 px-2 pt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-outline text-xs py-2 px-4">Sign In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-gold text-xs py-2 px-4">Join</Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-16 px-6" data-testid="main-footer">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Wine className="w-5 h-5 text-[#d4af37]" />
                <span className="font-serif text-lg">Vine & Barrel</span>
              </div>
              <p className="text-[#71717a] text-sm font-sans leading-relaxed">
                America's premier tasting platform. Connecting enthusiasts with the world's finest wines and spirits.
              </p>
            </div>
            <div>
              <h4 className="overline mb-4">Explore</h4>
              <div className="space-y-2">
                <Link to="/events" className="block text-sm text-[#a1a1aa] hover:text-[#fdfcf0] transition-colors">Events</Link>
                <Link to="/packs" className="block text-sm text-[#a1a1aa] hover:text-[#fdfcf0] transition-colors">Foxhound Packs</Link>
                <Link to="/membership" className="block text-sm text-[#a1a1aa] hover:text-[#fdfcf0] transition-colors">Membership</Link>
              </div>
            </div>
            <div>
              <h4 className="overline mb-4">Company</h4>
              <div className="space-y-2">
                <Link to="/partner" className="block text-sm text-[#a1a1aa] hover:text-[#fdfcf0] transition-colors">Partner With Us</Link>
                <span className="block text-sm text-[#71717a]">Press</span>
                <span className="block text-sm text-[#71717a]">Careers</span>
              </div>
            </div>
            <div>
              <h4 className="overline mb-4">Legal</h4>
              <div className="space-y-2">
                <span className="block text-sm text-[#71717a]">Privacy Policy</span>
                <span className="block text-sm text-[#71717a]">Terms of Service</span>
                <span className="block text-sm text-[#71717a]">Must be 21+</span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center">
            <p className="text-[#71717a] text-xs font-sans tracking-wide">
              &copy; 2026 Vine & Barrel. All rights reserved. Please drink responsibly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
