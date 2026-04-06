import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Users, MapPin, MessageCircle, Plus, UserPlus } from "lucide-react";

export default function PacksPage() {
  const { user } = useAuth();
  const [packs, setPacks] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    axios.get(`${API}/packs`).then(r => setPacks(r.data)).catch(() => {});
  }, []);

  const filtered = filter === "all" ? packs : packs.filter(p => p.format?.toLowerCase().includes(filter));

  const handleJoin = async (packId) => {
    if (!user) { window.location.href = "/login"; return; }
    try {
      await axios.post(`${API}/packs/${packId}/join`);
      const r = await axios.get(`${API}/packs`);
      setPacks(r.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not join pack");
    }
  };

  return (
    <div className="py-24 px-6" data-testid="packs-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative mb-16 rounded-xl overflow-hidden" data-testid="packs-header">
          <div className="aspect-[3/1] md:aspect-[4/1]"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1770453572726-f51592710ca6?w=1600)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a08] via-[#0c0a08]/50 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 p-8 md:p-12">
            <div className="overline mb-3">Community</div>
            <h1 className="font-serif text-4xl md:text-5xl text-[#f5f0e8]">Foxhound Packs</h1>
            <p className="text-[#b5a99a] font-sans mt-2 max-w-lg">Your crew. Your city. Taste together, hang together.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-10 flex-wrap" data-testid="packs-filters">
          {["all", "in-person", "virtual", "hybrid"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`tab-item ${filter === f ? "active" : ""}`}
              data-testid={`pack-filter-${f}`}>{f === "all" ? "All Packs" : f}</button>
          ))}
        </div>

        {/* Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((pack, i) => (
            <div key={pack.id} className="fh-card p-6" data-testid={`pack-item-${i}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#c9a44a]/10 border border-[#c9a44a]/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#c9a44a]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-[#f5f0e8]">{pack.name}</h3>
                    <p className="text-[#7a7068] text-sm font-sans flex items-center gap-1">
                      <span>{pack.member_count} members</span> · <MapPin className="w-3 h-3" /> {pack.location}
                    </p>
                  </div>
                </div>
                <span className="badge-amber">{pack.format}</span>
              </div>

              {pack.description && (
                <p className="text-[#b5a99a] text-sm font-sans mb-4">{pack.description}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-5">
                {pack.tags?.map(tag => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/5 text-[#b5a99a] border border-white/5 font-sans">{tag}</span>
                ))}
              </div>

              <div className="flex gap-3">
                <button className="btn-amber flex-1 flex items-center justify-center gap-2 text-xs"
                  onClick={() => handleJoin(pack.id)} data-testid={`pack-join-btn-${i}`}>
                  <UserPlus className="w-3.5 h-3.5" /> Join Pack
                </button>
                <button className="btn-outline flex-1 flex items-center justify-center gap-2 text-xs" data-testid={`pack-chat-btn-${i}`}>
                  <MessageCircle className="w-3.5 h-3.5" /> Chat
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#7a7068] font-sans">No packs found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
