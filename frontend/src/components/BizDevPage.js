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
    } catch {
      alert("Error submitting inquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-24 px-6" data-testid="partner-success">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="w-16 h-16 text-[#c9a44a] mx-auto mb-6" />
          <h2 className="font-serif text-3xl text-[#f5f0e8] mb-4">Inquiry Submitted</h2>
          <p className="text-[#b5a99a] font-sans text-lg">Thank you for your interest. We respond within 48 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-24 px-6" data-testid="bizdev-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="relative mb-16 rounded-xl overflow-hidden" data-testid="bizdev-header">
          <div className="aspect-[3/1]"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1770453572726-f51592710ca6?w=1200)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a08] via-[#0c0a08]/60 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 p-8 md:p-12">
            <Handshake className="w-8 h-8 text-[#c9a44a] mb-3" />
            <h1 className="font-serif text-4xl text-[#f5f0e8]">Partner With Foxhounds</h1>
            <p className="text-[#b5a99a] font-sans mt-2">Wineries, craft breweries, and venues — let's create something amazing together.</p>
          </div>
        </div>

        {/* Form */}
        <div className="fh-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="partner-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Business Name</label>
                <input type="text" value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})}
                  className="fh-input" placeholder="Your business name" required data-testid="partner-business-name" />
              </div>
              <div>
                <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Business Type</label>
                <select value={form.business_type} onChange={e => setForm({...form, business_type: e.target.value})}
                  className="fh-select" required data-testid="partner-business-type">
                  <option value="">Select your category</option>
                  <option>Winery / Vineyard</option>
                  <option>Craft Brewery / Brewpub</option>
                  <option>Wine Bar / Taproom</option>
                  <option>Restaurant / Venue</option>
                  <option>Merchandise / Accessories</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Contact Name</label>
                <input type="text" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})}
                  className="fh-input" placeholder="Your full name" required data-testid="partner-contact-name" />
              </div>
              <div>
                <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="fh-input" placeholder="you@business.com" required data-testid="partner-email" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="fh-input" placeholder="+1 (555) 000-0000" data-testid="partner-phone" />
              </div>
              <div>
                <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Website</label>
                <input type="url" value={form.website} onChange={e => setForm({...form, website: e.target.value})}
                  className="fh-input" placeholder="https://yourbusiness.com" data-testid="partner-website" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans text-[#b5a99a] mb-2 uppercase tracking-wider">Tell Us About Your Business</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="fh-textarea" placeholder="Describe your products, story, and what makes your brand special..." data-testid="partner-description" />
            </div>

            <div>
              <label className="block text-xs font-sans text-[#b5a99a] mb-3 uppercase tracking-wider">Partnership Interest</label>
              <div className="flex flex-wrap gap-3" data-testid="partner-interests">
                {interestOptions.map(interest => (
                  <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 text-xs font-sans border rounded-md transition-all duration-300 ${
                      form.interests.includes(interest)
                        ? "border-[#c9a44a] bg-[#c9a44a]/10 text-[#c9a44a]"
                        : "border-white/10 text-[#b5a99a] hover:border-white/20"
                    }`} data-testid={`interest-${interest.replace(/\s+/g, "-").toLowerCase()}`}>
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-amber flex items-center gap-2" data-testid="partner-submit-btn">
              <Send className="w-4 h-4" /> {loading ? "Submitting..." : "Submit Partnership Inquiry"}
            </button>

            <p className="text-[#7a7068] text-xs font-sans text-center mt-4">We respond within 48 hours</p>
          </form>
        </div>
      </div>
    </div>
  );
}
