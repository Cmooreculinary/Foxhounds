import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import {
  BarChart3, Users, Calendar, Wine, Handshake, Plus, Trash2, X,
  DollarSign, Package, Beer, MapPinned
} from "lucide-react";

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="fh-card p-5" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${accent ? "text-[#c9a44a]" : "text-[#b5a99a]"}`} />
        <span className="text-[0.65rem] font-sans text-[#7a7068] uppercase tracking-wider">{label}</span>
      </div>
      <div className="stat-number text-xl">{value}</div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [events, setEvents] = useState([]);
  const [kits, setKits] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [users, setUsers] = useState([]);

  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "", description: "", venue: "", location: "", date: "", time: "",
    price: 0, format: "In Person", seats_total: 50, image_url: ""
  });

  const [showKitForm, setShowKitForm] = useState(false);
  const [kitForm, setKitForm] = useState({
    name: "", region: "", description: "", price: 0, category: "wine", image_url: ""
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [s, e, k, i, u] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/events`),
        axios.get(`${API}/kits`),
        axios.get(`${API}/admin/partner-inquiries`),
        axios.get(`${API}/admin/users`),
      ]);
      setStats(s.data);
      setEvents(e.data);
      setKits(k.data);
      setInquiries(i.data);
      setUsers(u.data);
    } catch (err) { console.error("Error loading admin data", err); }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/events`, { ...eventForm, price: parseFloat(eventForm.price), seats_total: parseInt(eventForm.seats_total) });
      setShowEventForm(false);
      setEventForm({ title: "", description: "", venue: "", location: "", date: "", time: "", price: 0, format: "In Person", seats_total: 50, image_url: "" });
      loadData();
    } catch { alert("Error creating event"); }
  };

  const deleteEvent = async (id) => {
    try { await axios.delete(`${API}/admin/events/${id}`); loadData(); } catch { alert("Error"); }
  };

  const createKit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/kits`, { ...kitForm, price: parseFloat(kitForm.price) });
      setShowKitForm(false);
      setKitForm({ name: "", region: "", description: "", price: 0, category: "wine", image_url: "" });
      loadData();
    } catch { alert("Error creating kit"); }
  };

  const deleteKit = async (id) => {
    try { await axios.delete(`${API}/admin/kits/${id}`); loadData(); } catch { alert("Error"); }
  };

  const updateInquiryStatus = async (id, status) => {
    try { await axios.put(`${API}/admin/partner-inquiries/${id}/status`, { status }); loadData(); } catch { alert("Error"); }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "events", label: "Events", icon: Calendar },
    { id: "kits", label: "Tasting Kits", icon: Package },
    { id: "inquiries", label: "Partners", icon: Handshake },
    { id: "members", label: "Members", icon: Users },
  ];

  return (
    <div className="py-12 px-6" data-testid="admin-page">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="overline mb-2">Administration</div>
          <h1 className="font-serif text-3xl text-[#f5f0e8]">Foxhounds Admin</h1>
        </div>

        <div className="flex gap-1 mb-8 border-b border-white/5 overflow-x-auto" data-testid="admin-tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-sans uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                activeTab === id ? "border-[#c9a44a] text-[#c9a44a]" : "border-transparent text-[#7a7068] hover:text-[#b5a99a]"
              }`} data-testid={`admin-tab-${id}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="admin-overview">
            <StatCard icon={Users} label="Members" value={stats.users} accent />
            <StatCard icon={Calendar} label="Events" value={stats.events} />
            <StatCard icon={Package} label="Kits" value={stats.kits} />
            <StatCard icon={Users} label="Packs" value={stats.packs} />
            <StatCard icon={MapPinned} label="Check-ins" value={stats.checkins} accent />
            <StatCard icon={Handshake} label="Pending" value={stats.pending_inquiries} />
            <StatCard icon={DollarSign} label="Revenue" value={`$${stats.total_revenue?.toFixed(2) || "0.00"}`} accent />
            <StatCard icon={Package} label="Transactions" value={stats.total_transactions} />
          </div>
        )}

        {activeTab === "events" && (
          <div data-testid="admin-events">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-xl text-[#f5f0e8]">Manage Events</h2>
              <button onClick={() => setShowEventForm(!showEventForm)} className="btn-amber text-xs flex items-center gap-2" data-testid="admin-add-event-btn">
                {showEventForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showEventForm ? "Cancel" : "Add Event"}
              </button>
            </div>
            {showEventForm && (
              <form onSubmit={createEvent} className="fh-card p-6 mb-6 space-y-4" data-testid="admin-event-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input className="fh-input" placeholder="Title" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required data-testid="admin-event-title" />
                  <input className="fh-input" placeholder="Venue" value={eventForm.venue} onChange={e => setEventForm({...eventForm, venue: e.target.value})} required data-testid="admin-event-venue" />
                  <input className="fh-input" placeholder="Location" value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} required data-testid="admin-event-location" />
                  <input className="fh-input" type="date" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} required data-testid="admin-event-date" />
                  <input className="fh-input" placeholder="Time" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} required data-testid="admin-event-time" />
                  <input className="fh-input" type="number" step="0.01" placeholder="Price" value={eventForm.price} onChange={e => setEventForm({...eventForm, price: e.target.value})} required data-testid="admin-event-price" />
                  <select className="fh-select" value={eventForm.format} onChange={e => setEventForm({...eventForm, format: e.target.value})} data-testid="admin-event-format">
                    <option>In Person</option><option>Virtual</option><option>Hybrid</option>
                  </select>
                  <input className="fh-input" type="number" placeholder="Total Seats" value={eventForm.seats_total} onChange={e => setEventForm({...eventForm, seats_total: e.target.value})} data-testid="admin-event-seats" />
                </div>
                <textarea className="fh-textarea" placeholder="Description" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} required data-testid="admin-event-desc" />
                <button type="submit" className="btn-amber" data-testid="admin-event-submit">Create Event</button>
              </form>
            )}
            <div className="space-y-3">
              {events.map((evt, i) => (
                <div key={evt.id} className="fh-card p-4 flex items-center justify-between" data-testid={`admin-event-item-${i}`}>
                  <div>
                    <h3 className="font-serif text-lg text-[#f5f0e8]">{evt.title}</h3>
                    <p className="text-[#7a7068] text-xs font-sans">{evt.venue} · {evt.location} · {evt.date} · ${evt.price}</p>
                  </div>
                  <button onClick={() => deleteEvent(evt.id)} className="text-[#7a7068] hover:text-red-400 transition-colors" data-testid={`admin-delete-event-${i}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "kits" && (
          <div data-testid="admin-kits">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-xl text-[#f5f0e8]">Manage Tasting Kits</h2>
              <button onClick={() => setShowKitForm(!showKitForm)} className="btn-amber text-xs flex items-center gap-2" data-testid="admin-add-kit-btn">
                {showKitForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showKitForm ? "Cancel" : "Add Kit"}
              </button>
            </div>
            {showKitForm && (
              <form onSubmit={createKit} className="fh-card p-6 mb-6 space-y-4" data-testid="admin-kit-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input className="fh-input" placeholder="Name" value={kitForm.name} onChange={e => setKitForm({...kitForm, name: e.target.value})} required data-testid="admin-kit-name" />
                  <input className="fh-input" placeholder="Region" value={kitForm.region} onChange={e => setKitForm({...kitForm, region: e.target.value})} required data-testid="admin-kit-region" />
                  <input className="fh-input" type="number" step="0.01" placeholder="Price" value={kitForm.price} onChange={e => setKitForm({...kitForm, price: e.target.value})} required data-testid="admin-kit-price" />
                  <select className="fh-select" value={kitForm.category} onChange={e => setKitForm({...kitForm, category: e.target.value})} data-testid="admin-kit-category">
                    <option value="wine">Wine</option><option value="craft_beer">Craft Beer</option>
                  </select>
                </div>
                <textarea className="fh-textarea" placeholder="Description" value={kitForm.description} onChange={e => setKitForm({...kitForm, description: e.target.value})} required data-testid="admin-kit-desc" />
                <button type="submit" className="btn-amber" data-testid="admin-kit-submit">Create Kit</button>
              </form>
            )}
            <div className="space-y-3">
              {kits.map((kit, i) => (
                <div key={kit.id} className="fh-card p-4 flex items-center justify-between" data-testid={`admin-kit-item-${i}`}>
                  <div className="flex items-center gap-3">
                    {kit.category === "craft_beer" ? <Beer className="w-4 h-4 text-[#d4883a]" /> : <Wine className="w-4 h-4 text-[#a93a4e]" />}
                    <div>
                      <h3 className="font-serif text-lg text-[#f5f0e8]">{kit.name}</h3>
                      <p className="text-[#7a7068] text-xs font-sans">{kit.region} · ${kit.price} · {kit.category}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteKit(kit.id)} className="text-[#7a7068] hover:text-red-400 transition-colors" data-testid={`admin-delete-kit-${i}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "inquiries" && (
          <div data-testid="admin-inquiries">
            <h2 className="font-serif text-xl text-[#f5f0e8] mb-6">Partner Inquiries</h2>
            <div className="space-y-3">
              {inquiries.map((inq, i) => (
                <div key={inq.id} className="fh-card p-5" data-testid={`admin-inquiry-${i}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-lg text-[#f5f0e8]">{inq.business_name}</h3>
                      <p className="text-[#7a7068] text-xs font-sans">{inq.business_type} · {inq.contact_name} · {inq.email}</p>
                      {inq.description && <p className="text-[#b5a99a] text-sm font-sans mt-2">{inq.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge-${inq.status === "pending" ? "wine" : "amber"} text-xs`}>{inq.status}</span>
                      {inq.status === "pending" && (
                        <button onClick={() => updateInquiryStatus(inq.id, "reviewed")}
                          className="btn-outline text-xs py-1 px-3" data-testid={`inquiry-review-${i}`}>Review</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {inquiries.length === 0 && <p className="text-[#7a7068] font-sans text-center py-8">No partner inquiries yet.</p>}
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div data-testid="admin-members">
            <h2 className="font-serif text-xl text-[#f5f0e8] mb-6">Members ({users.length})</h2>
            <div className="fh-card overflow-hidden rounded-lg">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-white/5 text-left">
                    <th className="px-4 py-3 text-[#7a7068] text-xs uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-[#7a7068] text-xs uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-[#7a7068] text-xs uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-[#7a7068] text-xs uppercase tracking-wider">Membership</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id} className="border-b border-white/5" data-testid={`admin-member-${i}`}>
                      <td className="px-4 py-3 text-[#f5f0e8]">{u.name || "--"}</td>
                      <td className="px-4 py-3 text-[#b5a99a]">{u.email}</td>
                      <td className="px-4 py-3"><span className={`badge-${u.role === "admin" ? "amber" : "wine"}`}>{u.role}</span></td>
                      <td className="px-4 py-3 text-[#b5a99a]">{u.membership || "Free"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
