import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "@/App";
import { User, MapPin, Wine, BookOpen, Award, Plus, Trash2, X } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [journal, setJournal] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    spirit_name: "", vintage: "", region: "",
    body: "Medium", tannins: "Moderate", finish: "Medium", notes: ""
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
      setForm({ spirit_name: "", vintage: "", region: "", body: "Medium", tannins: "Moderate", finish: "Medium", notes: "" });
    } catch (err) {
      alert("Error saving entry");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/journal/${id}`);
      setJournal(journal.filter(j => j.id !== id));
    } catch (err) {
      alert("Error deleting entry");
    }
  };

  if (!user) return null;

  return (
    <div className="py-24 px-6" data-testid="profile-page">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="vb-card p-8 mb-8" data-testid="profile-header">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border-2 border-[#d4af37]/30 flex items-center justify-center">
              <User className="w-8 h-8 text-[#d4af37]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-serif text-3xl text-[#fdfcf0]">{user.name || user.email}</h1>
                {user.membership && <span className="badge-gold"><Award className="w-3 h-3 inline mr-1" />Member</span>}
              </div>
              <p className="text-[#71717a] text-sm font-sans flex items-center gap-1">
                {user.location && <><MapPin className="w-3.5 h-3.5" /> {user.location} · </>}
                {user.email}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-white/10">
            <div className="text-center">
              <div className="stat-number">{user.tastings_count || 0}</div>
              <div className="text-[#71717a] text-xs font-sans uppercase tracking-wider mt-1">Tastings</div>
            </div>
            <div className="text-center">
              <div className="stat-number">{user.connections_count || 0}</div>
              <div className="text-[#71717a] text-xs font-sans uppercase tracking-wider mt-1">Connections</div>
            </div>
            <div className="text-center">
              <div className="stat-number">{user.packs_count || 0}</div>
              <div className="text-[#71717a] text-xs font-sans uppercase tracking-wider mt-1">Packs</div>
            </div>
          </div>
        </div>

        {/* Journal Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="overline mb-1">Personal</div>
            <h2 className="font-serif text-2xl text-[#fdfcf0]">Tasting Journal</h2>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-gold flex items-center gap-2 text-xs" data-testid="new-journal-btn">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "New Entry"}
          </button>
        </div>

        {/* Journal Form */}
        {showForm && (
          <div className="vb-card p-6 mb-8 animate-fade-in" data-testid="journal-form">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Spirit or Wine Name</label>
                  <input type="text" value={form.spirit_name} onChange={e => setForm({...form, spirit_name: e.target.value})}
                    className="vb-input" placeholder="e.g. Macallan 18" required data-testid="journal-spirit-input" />
                </div>
                <div>
                  <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Vintage</label>
                  <input type="text" value={form.vintage} onChange={e => setForm({...form, vintage: e.target.value})}
                    className="vb-input" placeholder="e.g. 2015" data-testid="journal-vintage-input" />
                </div>
                <div>
                  <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Region</label>
                  <input type="text" value={form.region} onChange={e => setForm({...form, region: e.target.value})}
                    className="vb-input" placeholder="e.g. Speyside, Scotland" data-testid="journal-region-input" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Body</label>
                  <select value={form.body} onChange={e => setForm({...form, body: e.target.value})} className="vb-select" data-testid="journal-body-select">
                    <option>Light</option><option>Medium-Light</option><option>Medium</option><option>Medium-Full</option><option>Full</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Tannins</label>
                  <select value={form.tannins} onChange={e => setForm({...form, tannins: e.target.value})} className="vb-select" data-testid="journal-tannins-select">
                    <option>Low</option><option>Moderate</option><option>High</option><option>Very High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Finish</label>
                  <select value={form.finish} onChange={e => setForm({...form, finish: e.target.value})} className="vb-select" data-testid="journal-finish-select">
                    <option>Short</option><option>Medium</option><option>Lingering</option><option>Very Long</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Personal Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="vb-textarea" placeholder="Your tasting notes..." data-testid="journal-notes-input" />
              </div>
              <button type="submit" className="btn-gold flex items-center gap-2" data-testid="journal-save-btn">
                <BookOpen className="w-4 h-4" /> Save to Journal
              </button>
            </form>
          </div>
        )}

        {/* Journal Entries */}
        <div className="space-y-4">
          {journal.map((entry, i) => (
            <div key={entry.id} className="vb-card p-6" data-testid={`journal-entry-${i}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-xl text-[#fdfcf0]">{entry.spirit_name}</h3>
                  <p className="text-[#71717a] text-sm font-sans mt-1">
                    {entry.vintage && `${entry.vintage} · `}{entry.region || ""}
                  </p>
                </div>
                <button onClick={() => handleDelete(entry.id)} className="text-[#71717a] hover:text-red-400 transition-colors" data-testid={`journal-delete-${i}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-4 mt-4">
                <span className="text-xs text-[#a1a1aa] font-sans">Body: <span className="text-[#d4af37]">{entry.body}</span></span>
                <span className="text-xs text-[#a1a1aa] font-sans">Tannins: <span className="text-[#d4af37]">{entry.tannins}</span></span>
                <span className="text-xs text-[#a1a1aa] font-sans">Finish: <span className="text-[#d4af37]">{entry.finish}</span></span>
              </div>
              {entry.notes && <p className="text-[#a1a1aa] text-sm font-sans mt-3 italic">"{entry.notes}"</p>}
              <p className="text-[#71717a] text-xs font-sans mt-3">{new Date(entry.created_at).toLocaleDateString()}</p>
            </div>
          ))}
          {journal.length === 0 && !showForm && (
            <div className="text-center py-16 vb-card">
              <Wine className="w-10 h-10 text-[#d4af37] mx-auto mb-4" />
              <p className="text-[#71717a] font-sans mb-4">Your journal is empty. Start recording your tasting experiences!</p>
              <button onClick={() => setShowForm(true)} className="btn-gold text-xs" data-testid="journal-start-btn">Add First Entry</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
