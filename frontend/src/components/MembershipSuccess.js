import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

export default function MembershipSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("checking");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) { setStatus("error"); return; }
    pollStatus();
  }, [sessionId]);

  const pollStatus = async () => {
    const maxAttempts = 5;
    const poll = async (attempt) => {
      if (attempt >= maxAttempts) { setStatus("timeout"); return; }
      try {
        const { data } = await axios.get(`${API}/membership/status/${sessionId}`);
        if (data.payment_status === "paid") { setStatus("success"); return; }
        if (data.status === "expired") { setStatus("expired"); return; }
        setAttempts(attempt + 1);
        setTimeout(() => poll(attempt + 1), 2000);
      } catch {
        setStatus("error");
      }
    };
    poll(0);
  };

  return (
    <div className="py-24 px-6" data-testid="membership-success-page">
      <div className="max-w-lg mx-auto text-center">
        {status === "checking" && (
          <div className="animate-fade-in">
            <Loader2 className="w-16 h-16 text-[#d4af37] mx-auto mb-6 animate-spin" />
            <h2 className="font-serif text-3xl text-[#fdfcf0] mb-4">Processing Payment</h2>
            <p className="text-[#a1a1aa] font-sans">Verifying your payment... (attempt {attempts + 1}/5)</p>
          </div>
        )}
        {status === "success" && (
          <div className="animate-fade-in">
            <CheckCircle className="w-16 h-16 text-[#d4af37] mx-auto mb-6" />
            <h2 className="font-serif text-3xl text-[#fdfcf0] mb-4">Welcome to the Club!</h2>
            <p className="text-[#a1a1aa] font-sans mb-8">Your membership is now active. Explore exclusive content and events.</p>
            <Link to="/" className="btn-gold" data-testid="success-home-btn">Explore Now</Link>
          </div>
        )}
        {(status === "error" || status === "timeout" || status === "expired") && (
          <div className="animate-fade-in">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="font-serif text-3xl text-[#fdfcf0] mb-4">
              {status === "expired" ? "Session Expired" : "Something Went Wrong"}
            </h2>
            <p className="text-[#a1a1aa] font-sans mb-8">Please try again or contact support.</p>
            <Link to="/membership" className="btn-outline" data-testid="retry-membership-btn">Try Again</Link>
          </div>
        )}
      </div>
    </div>
  );
}
