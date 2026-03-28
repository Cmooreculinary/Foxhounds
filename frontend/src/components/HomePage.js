import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Wine, ArrowRight, Calendar, Users, MapPin, Clock, Sparkles, Scan, Radio } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [kits, setKits] = useState([]);
  const [events, setEvents] = useState([]);
  const [packs, setPacks] = useState([]);

  useEffect(() => {
    axios.get(`${API}/kits`).then(r => setKits(r.data)).catch(() => {});
    axios.get(`${API}/events`).then(r => setEvents(r.data.slice(0, 3))).catch(() => {});
    axios.get(`${API}/packs`).then(r => setPacks(r.data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center" data-testid="hero-section">
        <div className="absolute inset-0"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1647101734210-ff5d79813069?w=1920)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl animate-fade-in">
            <div className="overline mb-6 animate-fade-in animate-delay-1">America's Premier Tasting Platform</div>
            <h1 className="font-serif text-5xl md:text-7xl text-[#fdfcf0] leading-[1.1] mb-6 animate-fade-in animate-delay-2">
              Enthusiasts uniting to celebrate life's <em className="text-[#d4af37]">finest spirits</em>
            </h1>
            <p className="text-[#a1a1aa] text-lg md:text-xl font-sans mb-10 max-w-xl leading-relaxed animate-fade-in animate-delay-3">
              Discover the world's most exclusive wines and spirits — live, virtual, and shipped to your door.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in animate-delay-4">
              <Link to="/events" className="btn-gold flex items-center gap-2" data-testid="hero-explore-btn">
                <Wine className="w-4 h-4" /> Explore Events
              </Link>
              <Link to="/membership" className="btn-outline flex items-center gap-2" data-testid="hero-membership-btn">
                Become a Member <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tasting Kits */}
      <section className="py-24 px-6" data-testid="kits-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="overline mb-3">Curated Collections</div>
              <h2 className="font-serif text-4xl text-[#fdfcf0]">Featured Tasting Kits</h2>
            </div>
            <Link to="/events" className="hidden md:flex items-center gap-2 text-[#d4af37] text-sm font-sans hover:underline" data-testid="view-all-kits">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kits.map((kit, i) => (
              <div key={kit.id} className={`vb-card animate-fade-in animate-delay-${i + 1}`} data-testid={`kit-card-${i}`}>
                <div className="img-zoom-container aspect-[4/3]">
                  <img src={kit.image_url} alt={kit.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#d4af37] font-serif text-xl font-semibold">${kit.price}</span>
                    <span className="badge-gold">{kit.category}</span>
                  </div>
                  <div className="text-[#71717a] text-xs font-sans uppercase tracking-wider mb-1">{kit.region}</div>
                  <h3 className="font-serif text-lg text-[#fdfcf0] mb-2">{kit.name}</h3>
                  <p className="text-[#a1a1aa] text-sm font-sans line-clamp-2 mb-4">{kit.description}</p>
                  <button className="btn-outline w-full text-xs" data-testid={`kit-order-${i}`}>Order Info</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-24 px-6 bg-[#141414]" data-testid="events-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="overline mb-3">What's Next</div>
              <h2 className="font-serif text-4xl text-[#fdfcf0]">Upcoming Events</h2>
            </div>
            <Link to="/events" className="hidden md:flex items-center gap-2 text-[#d4af37] text-sm font-sans hover:underline" data-testid="view-all-events-link">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.map((event, i) => (
              <div key={event.id} className="vb-card" data-testid={`event-card-${i}`}>
                <div className="img-zoom-container aspect-[16/10]">
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`badge-${event.format === 'Virtual' ? 'wine' : 'gold'}`}>{event.format}</span>
                    <span className="text-[#71717a] text-xs font-sans">${event.price}/kit</span>
                  </div>
                  <h3 className="font-serif text-xl text-[#fdfcf0] mb-1">{event.title}</h3>
                  <p className="text-[#a1a1aa] text-sm font-sans mb-3">{event.venue} · {event.location}</p>
                  <div className="flex items-center gap-4 text-xs text-[#71717a] font-sans mb-4">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {event.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {event.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#d4af37] font-sans">{event.seats_remaining} seats left</span>
                    <button className="btn-gold text-xs py-2 px-4" data-testid={`event-reserve-${i}`}>Reserve</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Foxhound Packs Preview */}
      <section className="py-24 px-6" data-testid="packs-preview-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="overline mb-3">Community</div>
              <h2 className="font-serif text-4xl text-[#fdfcf0]">Foxhound Packs</h2>
              <p className="text-[#a1a1aa] font-sans mt-3 max-w-lg">Join a pack — groups of enthusiasts who taste, learn, and meet together.</p>
            </div>
            <Link to="/packs" className="hidden md:flex items-center gap-2 text-[#d4af37] text-sm font-sans hover:underline" data-testid="view-all-packs-link">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packs.map((pack, i) => (
              <div key={pack.id} className="vb-card p-6" data-testid={`pack-card-${i}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-xl">
                    <Users className="w-5 h-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-[#fdfcf0]">{pack.name}</h3>
                    <p className="text-[#71717a] text-xs font-sans">{pack.member_count} members · {pack.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="badge-gold">{pack.format}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {pack.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/5 text-[#a1a1aa] border border-white/10 font-sans">{tag}</span>
                  ))}
                </div>
                <Link to="/packs" className="btn-outline w-full text-center text-xs block" data-testid={`pack-join-${i}`}>View Pack</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-24 px-6 bg-[#141414]" data-testid="coming-soon-section">
        <div className="max-w-7xl mx-auto">
          <div className="overline mb-3 text-center">Coming Soon</div>
          <h2 className="font-serif text-4xl text-[#fdfcf0] text-center mb-12">New Experiences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="vb-card p-8 text-center opacity-70" data-testid="coming-soon-live">
              <Radio className="w-10 h-10 text-[#d4af37] mx-auto mb-4" />
              <h3 className="font-serif text-xl text-[#fdfcf0] mb-2">Live Tasting Room</h3>
              <p className="text-[#71717a] text-sm font-sans mb-4">Watch live, chat with hosts, and taste along in real-time.</p>
              <span className="badge-gold">Coming Soon</span>
            </div>
            <div className="vb-card p-8 text-center opacity-70" data-testid="coming-soon-scanner">
              <Scan className="w-10 h-10 text-[#d4af37] mx-auto mb-4" />
              <h3 className="font-serif text-xl text-[#fdfcf0] mb-2">Bottle Scanner</h3>
              <p className="text-[#71717a] text-sm font-sans mb-4">Scan any label to identify the bottle, read notes, and save to your journal.</p>
              <span className="badge-gold">Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6" data-testid="cta-section">
        <div className="max-w-3xl mx-auto text-center">
          <div className="overline mb-3">Ready to begin?</div>
          <h2 className="font-serif text-4xl md:text-5xl text-[#fdfcf0] mb-6">
            Join the <em className="text-[#d4af37]">Vine & Barrel</em> community
          </h2>
          <p className="text-[#a1a1aa] font-sans text-lg mb-10 max-w-lg mx-auto">
            Get access to exclusive tastings, connect with enthusiasts, and discover your next favorite pour.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/membership" className="btn-gold flex items-center gap-2" data-testid="cta-membership-btn">
              <Sparkles className="w-4 h-4" /> View Memberships
            </Link>
            <Link to="/register" className="btn-outline flex items-center gap-2" data-testid="cta-register-btn">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
