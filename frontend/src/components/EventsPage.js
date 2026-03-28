import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Calendar, Clock, MapPin, Users, Filter } from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    axios.get(`${API}/events`).then(r => setEvents(r.data)).catch(() => {});
  }, []);

  const filtered = filter === "all" ? events : events.filter(e => e.format.toLowerCase().includes(filter));

  return (
    <div className="py-24 px-6" data-testid="events-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative mb-16 rounded overflow-hidden" data-testid="events-header">
          <div className="aspect-[3/1] md:aspect-[4/1]"
            style={{ backgroundImage: 'url(https://images.pexels.com/photos/8775199/pexels-photo-8775199.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/50 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 p-8 md:p-12">
            <div className="overline mb-3">Events & Tastings</div>
            <h1 className="font-serif text-4xl md:text-5xl text-[#fdfcf0]">Upcoming Experiences</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-10 flex-wrap" data-testid="events-filters">
          <Filter className="w-4 h-4 text-[#71717a]" />
          {["all", "in person", "virtual", "hybrid"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`tab-item ${filter === f ? "active" : ""}`}
              data-testid={`filter-${f.replace(" ", "-")}`}>{f}</button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((event, i) => (
            <div key={event.id} className="vb-card flex flex-col md:flex-row overflow-hidden" data-testid={`event-item-${i}`}>
              <div className="img-zoom-container w-full md:w-64 flex-shrink-0">
                <img src={event.image_url} alt={event.title} className="w-full h-48 md:h-full object-cover" loading="lazy" />
              </div>
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`badge-${event.format === 'Virtual' ? 'wine' : 'gold'}`}>{event.format}</span>
                    <span className="text-[#d4af37] font-serif text-lg font-semibold">${event.price}</span>
                  </div>
                  <h3 className="font-serif text-2xl text-[#fdfcf0] mb-2">{event.title}</h3>
                  <p className="text-[#a1a1aa] text-sm font-sans mb-4 line-clamp-2">{event.description}</p>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-[#71717a] font-sans">
                      <MapPin className="w-3.5 h-3.5" /> {event.venue} · {event.location}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#71717a] font-sans">
                      <Calendar className="w-3.5 h-3.5" /> {event.date}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#71717a] font-sans">
                      <Clock className="w-3.5 h-3.5" /> {event.time}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-sans">
                    <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span className="text-[#d4af37]">{event.seats_remaining} seats left</span>
                    <span className="text-[#71717a]">of {event.seats_total}</span>
                  </div>
                  <button className="btn-gold text-xs py-2 px-6" data-testid={`event-reserve-btn-${i}`}>Reserve Seat</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#71717a] font-sans">No events found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
