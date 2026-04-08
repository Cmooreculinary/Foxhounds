import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { ArrowRight, Calendar, Users, MapPin, Clock, Star, Heart, MessageCircle, Beer, Wine, Sparkles, Radio, Scan } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_payment-ops-5/artifacts/54034mu4_7550b98c-30de-4cea-a42f-38c89afa251b.png";

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? "star-filled fill-current" : "star-empty"}`} />
      ))}
    </div>
  );
}

function TimeAgo({ date }) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 3600) return <span>{Math.floor(diff / 60)}m ago</span>;
  if (diff < 86400) return <span>{Math.floor(diff / 3600)}h ago</span>;
  return <span>{Math.floor(diff / 86400)}d ago</span>;
}

function AvatarBubble({ name, className = "" }) {
  const colors = ["bg-[#7b2332]", "bg-[#c9a44a]/30", "bg-[#d4883a]/30", "bg-[#2d5a3d]", "bg-[#4a3a6a]"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`avatar-circle ${colors[idx]} text-[#f5f0e8] ${className}`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [kits, setKits] = useState([]);
  const [events, setEvents] = useState([]);
  const [packs, setPacks] = useState([]);
  const [checkins, setCheckins] = useState([]);

  useEffect(() => {
    axios.get(`${API}/kits`).then(r => setKits(r.data)).catch(() => {});
    axios.get(`${API}/events`).then(r => setEvents(r.data.slice(0, 3))).catch(() => {});
    axios.get(`${API}/packs`).then(r => setPacks(r.data.slice(0, 3))).catch(() => {});
    axios.get(`${API}/checkins`).then(r => setCheckins(r.data)).catch(() => {});
  }, []);

  const handleLike = async (checkinId) => {
    if (!user) return;
    try {
      await axios.post(`${API}/checkins/${checkinId}/like`);
      const r = await axios.get(`${API}/checkins`);
      setCheckins(r.data);
    } catch {}
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center" data-testid="hero-section">
        <div className="absolute inset-0"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1920)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a08]/90 via-[#0c0a08]/70 to-[#0c0a08]/50" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 animate-fade-in">
              <div className="overline mb-6 animate-fade-in animate-delay-1">Wine & Craft Beer Social</div>
              <h1 className="font-serif text-5xl md:text-7xl text-[#f5f0e8] leading-[1.1] mb-6 animate-fade-in animate-delay-2">
                Where excellent wine and great craft beers meet the <em className="text-warm-gradient">best people</em>
              </h1>
              <p className="text-[#b5a99a] text-lg md:text-xl font-sans mb-10 max-w-xl leading-relaxed animate-fade-in animate-delay-3">
                Join the Foxhounds — a social community of wine lovers and craft beer enthusiasts. Taste together, learn together, celebrate together.
              </p>
              <div className="flex flex-wrap gap-4 animate-fade-in animate-delay-4">
                <Link to="/events" className="btn-amber flex items-center gap-2" data-testid="hero-events-btn">
                  <Calendar className="w-4 h-4" /> Upcoming Events
                </Link>
                <Link to="/register" className="btn-outline flex items-center gap-2" data-testid="hero-join-btn">
                  Join the Pack <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:block animate-fade-in animate-delay-3">
              <img src={LOGO_URL} alt="Foxhounds" className="w-72 h-72 rounded-full shadow-2xl border-4 border-[#c9a44a]/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Social Feed */}
      <section className="py-20 px-6" data-testid="social-feed-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="overline mb-2">What's Happening</div>
              <h2 className="font-serif text-3xl text-[#f5f0e8]">The Social Feed</h2>
            </div>
            {user && (
              <Link to="/profile" className="text-[#c9a44a] text-sm font-sans hover:underline flex items-center gap-1" data-testid="feed-checkin-link">
                Check In <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checkins.slice(0, 6).map((checkin, i) => (
              <div key={checkin.id} className={`checkin-card animate-fade-in animate-delay-${Math.min(i + 1, 5)}`} data-testid={`checkin-card-${i}`}>
                <div className="flex items-start gap-3 mb-3">
                  <AvatarBubble name={checkin.user_name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-[#f5f0e8] text-sm">{checkin.user_name}</span>
                      <span className="text-[#7a7068] text-xs font-sans"><TimeAgo date={checkin.created_at} /></span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#7a7068]" />
                      <span className="text-[#7a7068] text-xs font-sans">{checkin.venue_name}</span>
                    </div>
                  </div>
                  <span className={`badge-${checkin.category === "craft_beer" ? "beer" : "wine"}`}>
                    {checkin.category === "craft_beer" ? <Beer className="w-3 h-3" /> : <Wine className="w-3 h-3" />}
                    {checkin.category === "craft_beer" ? "Beer" : "Wine"}
                  </span>
                </div>
                <h4 className="font-serif text-lg text-[#f5f0e8] mb-1">{checkin.drink_name}</h4>
                {checkin.rating && <div className="mb-2"><StarRating rating={checkin.rating} /></div>}
                {checkin.note && <p className="text-[#b5a99a] text-sm font-sans mb-3">"{checkin.note}"</p>}
                <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                  <button onClick={() => handleLike(checkin.id)}
                    className="flex items-center gap-1.5 text-xs font-sans text-[#7a7068] hover:text-[#c9a44a] transition-colors"
                    data-testid={`checkin-like-${i}`}>
                    <Heart className={`w-3.5 h-3.5 ${checkin.likes_count > 0 ? "text-[#c9a44a] fill-current" : ""}`} />
                    {checkin.likes_count || 0}
                  </button>
                  <span className="flex items-center gap-1.5 text-xs font-sans text-[#7a7068]">
                    <MessageCircle className="w-3.5 h-3.5" /> Cheers!
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tasting Kits */}
      <section className="py-20 px-6 bg-[#161210]" data-testid="kits-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="overline mb-2">Curated Collections</div>
              <h2 className="font-serif text-3xl text-[#f5f0e8]">Tasting Kits</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kits.map((kit, i) => (
              <div key={kit.id} className={`fh-card animate-fade-in animate-delay-${Math.min(i + 1, 5)}`} data-testid={`kit-card-${i}`}>
                <div className="img-zoom-container aspect-[4/3]">
                  <img src={kit.image_url} alt={kit.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif text-xl font-semibold text-[#c9a44a]">${kit.price}</span>
                    <span className={`badge-${kit.category === "craft_beer" ? "beer" : "wine"}`}>
                      {kit.category === "craft_beer" ? "Craft Beer" : "Wine"}
                    </span>
                  </div>
                  <div className="text-[#7a7068] text-xs font-sans uppercase tracking-wider mb-1">{kit.region}</div>
                  <h3 className="font-serif text-lg text-[#f5f0e8] mb-2">{kit.name}</h3>
                  <p className="text-[#b5a99a] text-sm font-sans line-clamp-2 mb-4">{kit.description}</p>
                  <button className="btn-outline w-full text-xs" data-testid={`kit-order-${i}`}>Order Info</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20 px-6" data-testid="events-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="overline mb-2">What's Next</div>
              <h2 className="font-serif text-3xl text-[#f5f0e8]">Upcoming Events</h2>
            </div>
            <Link to="/events" className="hidden md:flex items-center gap-2 text-[#c9a44a] text-sm font-sans hover:underline" data-testid="view-all-events-link">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.map((event, i) => (
              <div key={event.id} className="fh-card" data-testid={`event-card-${i}`}>
                <div className="img-zoom-container aspect-[16/10]">
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`badge-${event.format === 'Virtual' ? 'beer' : 'amber'}`}>{event.format}</span>
                    <span className="text-[#c9a44a] font-sans font-semibold text-sm">${event.price}</span>
                  </div>
                  <h3 className="font-serif text-xl text-[#f5f0e8] mb-1">{event.title}</h3>
                  <p className="text-[#b5a99a] text-sm font-sans mb-3">{event.venue} · {event.location}</p>
                  <div className="flex items-center gap-4 text-xs text-[#7a7068] font-sans mb-4">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {event.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#c9a44a] font-sans font-medium">{event.seats_remaining} spots left</span>
                    <button className="btn-amber text-xs py-2 px-4" data-testid={`event-reserve-${i}`}>RSVP</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Foxhound Packs */}
      <section className="py-20 px-6 bg-[#161210]" data-testid="packs-preview-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="overline mb-2">Community</div>
              <h2 className="font-serif text-3xl text-[#f5f0e8]">Foxhound Packs</h2>
              <p className="text-[#b5a99a] font-sans mt-2 max-w-lg">Your crew. Your city. Taste together, hang together.</p>
            </div>
            <Link to="/packs" className="hidden md:flex items-center gap-2 text-[#c9a44a] text-sm font-sans hover:underline" data-testid="view-all-packs-link">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packs.map((pack, i) => (
              <div key={pack.id} className="fh-card p-6" data-testid={`pack-card-${i}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#c9a44a]/10 border border-[#c9a44a]/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#c9a44a]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-[#f5f0e8]">{pack.name}</h3>
                    <p className="text-[#7a7068] text-xs font-sans">{pack.member_count} members · {pack.location}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {pack.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/5 text-[#b5a99a] border border-white/5 font-sans">{tag}</span>
                  ))}
                </div>
                <Link to="/packs" className="btn-outline w-full text-center text-xs block" data-testid={`pack-join-${i}`}>View Pack</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-20 px-6" data-testid="coming-soon-section">
        <div className="max-w-7xl mx-auto text-center">
          <div className="overline mb-2">Coming Soon</div>
          <h2 className="font-serif text-3xl text-[#f5f0e8] mb-10">New Experiences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="fh-card p-8 text-center opacity-60" data-testid="coming-soon-live">
              <Radio className="w-10 h-10 text-[#c9a44a] mx-auto mb-4" />
              <h3 className="font-serif text-xl text-[#f5f0e8] mb-2">Live Tasting Room</h3>
              <p className="text-[#7a7068] text-sm font-sans mb-4">Watch live, chat with friends, and taste along in real-time.</p>
              <span className="badge-amber">Coming Soon</span>
            </div>
            <div className="fh-card p-8 text-center opacity-60" data-testid="coming-soon-scanner">
              <Scan className="w-10 h-10 text-[#c9a44a] mx-auto mb-4" />
              <h3 className="font-serif text-xl text-[#f5f0e8] mb-2">Label Scanner</h3>
              <p className="text-[#7a7068] text-sm font-sans mb-4">Scan any wine or beer label to learn more and save it.</p>
              <span className="badge-amber">Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[#161210]" data-testid="cta-section">
        <div className="max-w-3xl mx-auto text-center">
          <img src={LOGO_URL} alt="Foxhounds" className="w-24 h-24 rounded-full mx-auto mb-8 border-2 border-[#c9a44a]/20" />
          <h2 className="font-serif text-4xl md:text-5xl text-[#f5f0e8] mb-6">
            Ready to join the <em className="text-warm-gradient">pack</em>?
          </h2>
          <p className="text-[#b5a99a] font-sans text-lg mb-10 max-w-lg mx-auto">
            Your next favorite wine or craft beer is waiting. So are the people you'll drink it with.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/membership" className="btn-amber flex items-center gap-2" data-testid="cta-membership-btn">
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
