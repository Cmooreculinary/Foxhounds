import React, { useState } from "react";
import axios from "axios";
import { API } from "@/App";
import { Handshake, Send, CheckCircle } from "lucide-react";

export default function BizDevPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: "", business_type: "", contact_name: "",
    email: "", phone: "", website: "", description: "",
    interests: [],
  });

  const interestOptions = ["Tasting Events", "Kit Inclusion", "Merch Store", "Sponsorship"];

  const toggleInterest = (interest) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/partner-inquiry`, form);
      setSubmitted(true);
    } catch (err) {
      alert("Error submitting inquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-24 px-6" data-testid="partner-success">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="w-16 h-16 text-[#d4af37] mx-auto mb-6" />
          <h2 className="font-serif text-3xl text-[#fdfcf0] mb-4">Inquiry Submitted</h2>
          <p className="text-[#a1a1aa] font-sans text-lg">Thank you for your interest. We respond within 48 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-24 px-6" data-testid="bizdev-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="relative mb-16 rounded overflow-hidden" data-testid="bizdev-header">
          <div className="aspect-[3/1]"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1771154767182-d91ed5106636?w=1200)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/60 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 p-8 md:p-12">
            <Handshake className="w-8 h-8 text-[#d4af37] mb-3" />
            <h1 className="font-serif text-4xl text-[#fdfcf0]">Partner With Us</h1>
            <p className="text-[#a1a1aa] font-sans mt-2">Vintners, distillers, and merchandise producers — tell us about your brand.</p>
          </div>
        </div>

        {/* Form */}
        <div className="vb-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="partner-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Business Name</label>
                <input type="text" value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})}
                  className="vb-input" placeholder="Your business name" required data-testid="partner-business-name" />
              </div>
              <div>
                <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Business Type</label>
                <select value={form.business_type} onChange={e => setForm({...form, business_type: e.target.value})}
                  className="vb-select" required data-testid="partner-business-type">
                  <option value="">Select your category</option>
                  <option>Vintner / Winery</option>
                  <option>Distiller / Spirits Producer</option>
                  <option>Craft Brewery</option>
                  <option>Merchandise / Accessories</option>
                  <option>Venue / Restaurant</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Contact Name</label>
                <input type="text" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})}
                  className="vb-input" placeholder="Your full name" required data-testid="partner-contact-name" />
              </div>
              <div>
                <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="vb-input" placeholder="you@business.com" required data-testid="partner-email" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="vb-input" placeholder="+1 (555) 000-0000" data-testid="partner-phone" />
              </div>
              <div>
                <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Website</label>
                <input type="url" value={form.website} onChange={e => setForm({...form, website: e.target.value})}
                  className="vb-input" placeholder="https://yourbusiness.com" data-testid="partner-website" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans text-[#a1a1aa] mb-2 uppercase tracking-wider">Tell Us About Your Business</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="vb-textarea" placeholder="Describe your products, story, and what makes your brand unique..." data-testid="partner-description" />
            </div>

            <div>
              <label className="block text-xs font-sans text-[#a1a1aa] mb-3 uppercase tracking-wider">Partnership Interest</label>
              <div className="flex flex-wrap gap-3" data-testid="partner-interests">
                {interestOptions.map(interest => (
                  <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 text-xs font-sans border transition-all duration-300 ${
                      form.interests.includes(interest)
                        ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]"
                        : "border-white/10 text-[#a1a1aa] hover:border-white/30"
                    }`} data-testid={`interest-${interest.replace(/\s+/g, "-").toLowerCase()}`}>
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-gold flex items-center gap-2" data-testid="partner-submit-btn">
              <Send className="w-4 h-4" /> {loading ? "Submitting..." : "Submit Partnership Inquiry"}
            </button>

            <p className="text-[#71717a] text-xs font-sans text-center mt-4">We respond within 48 hours</p>
          </form>
        </div>
      </div>
    </div>
  );
}
