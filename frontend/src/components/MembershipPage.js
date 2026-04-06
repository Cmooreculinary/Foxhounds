import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Crown, Check, ArrowRight, Sparkles, Beer, Wine, Users } from "lucide-react";

const PLAN_FEATURES = {
  social_monthly: [
    "Access to all public events",
    "Join up to 2 Foxhound Packs",
    "Tasting journal & check-ins",
    "Monthly social newsletter",
  ],
  packleader_monthly: [
    "Everything in Social Sipper",
    "Priority event RSVPs",
    "Unlimited Foxhound Packs",
    "Exclusive kit discounts (wine + beer)",
    "Members-only virtual socials",
    "Pack Leader badge on profile",
  ],
  foxhound_annual: [
    "Everything in Pack Leader",
    "VIP event access + reserved seating",
    "Complimentary annual tasting kit",
    "Personal tasting concierge",
    "Early access to new releases",
    "Partner networking events",
    "Exclusive Foxhound merch",
  ],
};

const PLAN_ICONS = {
  social_monthly: Wine,
  packleader_monthly: Users,
  foxhound_annual: Crown,
};

export default function MembershipPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    axios.get(`${API}/membership/plans`).then(r => setPlans(r.data)).catch(() => {});
  }, []);

  const handleCheckout = async (planId) => {
    if (!user) { window.location.href = "/login"; return; }
    setLoading(planId);
    try {
      const { data } = await axios.post(`${API}/membership/checkout`, {
        plan_id: planId,
        origin_url: window.location.origin,
      });
      window.location.href = data.url;
    } catch (err) {
      alert(err.response?.data?.detail || "Error creating checkout");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="py-24 px-6" data-testid="membership-page">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="overline mb-3">Membership</div>
          <h1 className="font-serif text-4xl md:text-5xl text-[#f5f0e8] mb-4">
            Join the <em className="text-warm-gradient">Pack</em>
          </h1>
          <p className="text-[#b5a99a] font-sans text-lg max-w-xl mx-auto">
            More events. More access. More friends. Pick the level that matches your vibe.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const features = PLAN_FEATURES[plan.id] || [];
            const isPopular = plan.id === "packleader_monthly";
            const isActive = user?.membership === plan.id;
            const PlanIcon = PLAN_ICONS[plan.id] || Crown;

            return (
              <div key={plan.id}
                className={`fh-card p-8 flex flex-col relative ${isPopular ? "border-[#c9a44a]/40 ring-1 ring-[#c9a44a]/15" : ""}`}
                data-testid={`plan-card-${plan.id}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge-amber flex items-center gap-1"><Sparkles className="w-3 h-3" /> Most Popular</span>
                  </div>
                )}
                <div className="mb-6">
                  <PlanIcon className="w-8 h-8 text-[#c9a44a] mb-3" />
                  <h3 className="font-serif text-xl text-[#f5f0e8] mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-4xl text-[#c9a44a] font-bold">${plan.price}</span>
                    <span className="text-[#7a7068] text-sm font-sans">/{plan.interval}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm font-sans text-[#b5a99a]">
                      <Check className="w-4 h-4 text-[#c9a44a] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isActive ? (
                  <div className="btn-outline w-full text-center cursor-default" data-testid={`plan-active-${plan.id}`}>
                    Current Plan
                  </div>
                ) : (
                  <button onClick={() => handleCheckout(plan.id)} disabled={loading === plan.id}
                    className={`${isPopular ? "btn-amber" : "btn-outline"} w-full flex items-center justify-center gap-2`}
                    data-testid={`plan-checkout-${plan.id}`}>
                    {loading === plan.id ? "Redirecting..." : "Get Started"}
                    {loading !== plan.id && <ArrowRight className="w-4 h-4" />}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-20 text-center">
          <p className="text-[#7a7068] text-sm font-sans">
            All memberships include a 7-day free trial. Cancel anytime. Must be 21+.
          </p>
        </div>
      </div>
    </div>
  );
}
