import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "@/App";
import { User, MapPin, BookOpen, Award, Plus, Trash2, X, Star, Beer, Wine, Heart, MapPinned } from "lucide-react";

function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)}
          className={`${i <= value ? "text-[#c9a44a]" : "text-[#7a7068]"} hover:text-[#c9a44a] transition-colors`}>
          <Star className="w-5 h-5 fill-current" />
        </button>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [journal, setJournal] = useState([]);
  const [activeTab, setActiveTab] = useState("journal");
  const [showForm, setShowForm] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [form, setForm] = useState({
    spirit_name: "", vintage: "", region: "",
    body: "Medium", tannins: "Moderate", finish: "Medium", notes: "",
    rating: 0, category: "wine"
  });
  const [checkinForm, setCheckinForm] = useState({
    venue_name: "", drink_name: "", category: "wine", rating: 0, note: ""
  });

  useEffect(() => {
    axios.get(`${API}/journal`).then(r => setJournal(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/journal`, form);
      setJournal([data, ...journal]);
      setShowForm(false);
      setForm({ spirit_name: "", vintage: "", region: "", body: "Medium", tannins: "Moderate", finish: "Medium", notes: "", rating: 0, category: "wine" });
    } catch { alert("Error saving entry"); }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/checkins`, checkinForm);
      setShowCheckinForm(false);
      setCheckinForm({ venue_name: "", drink_name: "", category: "wine", rating: 0, note: "" });
      alert("Check-in posted to the social feed!");
    } catch { alert("Error posting check-in"); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/journal/${id}`);
      setJournal(journal.filter(j => j.id !== id));
    } catch { alert("Error deleting entry"); }
  };

  if (!user) return null;

  return (
    <div className="py-24 px-6" data-testid="profile-page">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="fh-card p-8 mb-8" data-testid="profile-header">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#c9a44a]/15 border-2 border-[#c9a44a]/30 flex items-center justify-center text-2xl font-bold text-[#c9a44a] font-serif">
              {(user.name || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-serif text-3xl text-[#f5f0e8]">{user.name || user.email}</h1>
                {user.membership && <span className="badge-amber"><Award className="w-3 h-3" />Member</span>}
              </div>
              <p className="text-[#7a7068] text-sm font-sans flex items-center gap-1">
                {user.location && <><MapPin className="w-3.5 h-3.5" /> {user.location} · </>}
                {user.email}
              </p>
              {(user.favorite_wine || user.favorite_beer) && (
                <div className="flex gap-3 mt-2">
                  {user.favorite_wine && <span className="badge-wine"><Wine className="w-3 h-3" /> {user.favorite_wine}</span>}
                  {user.favorite_beer && <span className="badge-beer"><Beer className="w-3 h-3" /> {user.favorite_beer}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-white/5">
            <div className="text-center">
              <div className="stat-number">{user.checkins_count || 0}</div>
              <div className="text-[#7a7068] text-xs font-sans uppercase tracking-wider mt-1">Check-ins</div>
            </div>
            <div className="text-center">
              <div className="stat-number">{user.friends_count || 0}</div>
              <div className="text-[#7a7068] text-xs font-sans uppercase tracking-wider mt-1">Friends</div>
            </div>
            <div className="text-center">
              <div className="stat-number">{user.packs_count || 0}</div>
              <div className="text-[#7a7068] text-xs font-sans uppercase tracking-wider mt-1">Packs</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/5">
          <button onClick={() => setActiveTab("journal")} className={`tab-item ${activeTab === "journal" ? "active" : ""}`} data-testid="profile-tab-journal">
            <BookOpen className="w-4 h-4 inline mr-1" /> Journal
          </button>
          <button onClick={() => setActiveTab("checkin")} className={`tab-item ${activeTab === "checkin" ? "active" : ""}`} data-testid="profile-tab-checkin">
            <MapPinned className="w-4 h-4 inline mr-1" /> Check In
          </button>
        </div>

        {/* Check In Tab */}
        {activeTab === "checkin" && (
          <div className="fh-card p-6 mb-8 animate-fade-in" data-testid="checkin-form-section">
            <h3 className="font-serif text-xl text-[#f5f0e8] mb-4">Post a Check-In</h3>
            <p className="text-[#b5a99a] text-sm font-sans mb-6">Share what you're drinking with the Foxhounds community!</p>
            <form onSubmit={handleCheckin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Where are you?</label>
                  <input type="text" value={checkinForm.venue_name} onChange={e => setCheckinForm({...checkinForm, venue_name: e.target.value})}
                    className="fh-input" placeholder="Bar, brewery, your couch..." required data-testid="checkin-venue-input" />
                </div>
                <div>
                  <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">What are you drinking?</label>
                  <input type="text" value={checkinForm.drink_name} onChange={e => setCheckinForm({...checkinForm, drink_name: e.target.value})}
                    className="fh-input" placeholder="Name of the wine or beer" required data-testid="checkin-drink-input" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Category</label>
                  <select value={checkinForm.category} onChange={e => setCheckinForm({...checkinForm, category: e.target.value})} className="fh-select" data-testid="checkin-category">
                    <option value="wine">Wine</option>
                    <option value="craft_beer">Craft Beer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Rating</label>
                  <StarInput value={checkinForm.rating} onChange={(v) => setCheckinForm({...checkinForm, rating: v})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Quick Note</label>
                <input type="text" value={checkinForm.note} onChange={e => setCheckinForm({...checkinForm, note: e.target.value})}
                  className="fh-input" placeholder="How is it? Share with the pack..." data-testid="checkin-note-input" />
              </div>
              <button type="submit" className="btn-amber flex items-center gap-2" data-testid="checkin-submit-btn">
                <MapPinned className="w-4 h-4" /> Post Check-In
              </button>
            </form>
          </div>
        )}

        {/* Journal Tab */}
        {activeTab === "journal" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl text-[#f5f0e8]">Tasting Journal</h3>
              <button onClick={() => setShowForm(!showForm)} className="btn-amber flex items-center gap-2 text-xs" data-testid="new-journal-btn">
                {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showForm ? "Cancel" : "New Entry"}
              </button>
            </div>

            {showForm && (
              <div className="fh-card p-6 mb-8 animate-fade-in" data-testid="journal-form">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Wine or Beer Name</label>
                      <input type="text" value={form.spirit_name} onChange={e => setForm({...form, spirit_name: e.target.value})}
                        className="fh-input" placeholder="e.g. Stone IPA" required data-testid="journal-spirit-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Vintage / Batch</label>
                      <input type="text" value={form.vintage} onChange={e => setForm({...form, vintage: e.target.value})}
                        className="fh-input" placeholder="e.g. 2023" data-testid="journal-vintage-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Region / Brewery</label>
                      <input type="text" value={form.region} onChange={e => setForm({...form, region: e.target.value})}
                        className="fh-input" placeholder="e.g. San Diego, CA" data-testid="journal-region-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Category</label>
                      <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="fh-select" data-testid="journal-category-select">
                        <option value="wine">Wine</option>
                        <option value="craft_beer">Craft Beer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Body</label>
                      <select value={form.body} onChange={e => setForm({...form, body: e.target.value})} className="fh-select" data-testid="journal-body-select">
                        <option>Light</option><option>Medium-Light</option><option>Medium</option><option>Medium-Full</option><option>Full</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Tannins / Hops</label>
                      <select value={form.tannins} onChange={e => setForm({...form, tannins: e.target.value})} className="fh-select" data-testid="journal-tannins-select">
                        <option>Low</option><option>Moderate</option><option>High</option><option>Very High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Finish</label>
                      <select value={form.finish} onChange={e => setForm({...form, finish: e.target.value})} className="fh-select" data-testid="journal-finish-select">
                        <option>Short</option><option>Medium</option><option>Lingering</option><option>Very Long</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Rating</label>
                    <StarInput value={form.rating} onChange={(v) => setForm({...form, rating: v})} />
                  </div>
                  <div>
                    <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                      className="fh-textarea" placeholder="Your tasting notes..." data-testid="journal-notes-input" />
                  </div>
                  <button type="submit" className="btn-amber flex items-center gap-2" data-testid="journal-save-btn">
                    <BookOpen className="w-4 h-4" /> Save to Journal
                  </button>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {journal.map((entry, i) => (
                <div key={entry.id} className="fh-card p-6" data-testid={`journal-entry-${i}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif text-xl text-[#f5f0e8]">{entry.spirit_name}</h3>
                        <span className={`badge-${entry.category === "craft_beer" ? "beer" : "wine"}`}>
                          {entry.category === "craft_beer" ? "Beer" : "Wine"}
                        </span>
                      </div>
                      <p className="text-[#7a7068] text-sm font-sans">
                        {entry.vintage && `${entry.vintage} · `}{entry.region || ""}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(entry.id)} className="text-[#7a7068] hover:text-red-400 transition-colors" data-testid={`journal-delete-${i}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {entry.rating > 0 && (
                    <div className="flex gap-0.5 mt-2">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= entry.rating ? "text-[#c9a44a] fill-current" : "text-[#7a7068]"}`} />)}
                    </div>
                  )}
                  <div className="flex gap-4 mt-3">
                    <span className="text-xs text-[#b5a99a] font-sans">Body: <span className="text-[#c9a44a]">{entry.body}</span></span>
                    <span className="text-xs text-[#b5a99a] font-sans">Hops/Tannins: <span className="text-[#c9a44a]">{entry.tannins}</span></span>
                    <span className="text-xs text-[#b5a99a] font-sans">Finish: <span className="text-[#c9a44a]">{entry.finish}</span></span>
                  </div>
                  {entry.notes && <p className="text-[#b5a99a] text-sm font-sans mt-3 italic">"{entry.notes}"</p>}
                  <p className="text-[#7a7068] text-xs font-sans mt-3">{new Date(entry.created_at).toLocaleDateString()}</p>
                </div>
              ))}
              {journal.length === 0 && !showForm && (
                <div className="text-center py-16 fh-card">
                  <BookOpen className="w-10 h-10 text-[#c9a44a] mx-auto mb-4" />
                  <p className="text-[#7a7068] font-sans mb-4">Your journal is empty. Start recording your tastings!</p>
                  <button onClick={() => setShowForm(true)} className="btn-amber text-xs" data-testid="journal-start-btn">Add First Entry</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
