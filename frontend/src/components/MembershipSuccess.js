import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_payment-ops-5/artifacts/54034mu4_7550b98c-30de-4cea-a42f-38c89afa251b.png";

export default function MembershipSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("checking");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) { setStatus("error"); return; }
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
  }, [sessionId]);

  return (
    <div className="py-24 px-6" data-testid="membership-success-page">
      <div className="max-w-lg mx-auto text-center">
        {status === "checking" && (
          <div className="animate-fade-in">
            <Loader2 className="w-16 h-16 text-[#c9a44a] mx-auto mb-6 animate-spin" />
            <h2 className="font-serif text-3xl text-[#f5f0e8] mb-4">Processing Payment</h2>
            <p className="text-[#b5a99a] font-sans">Verifying your payment... (attempt {attempts + 1}/5)</p>
          </div>
        )}
        {status === "success" && (
          <div className="animate-fade-in">
            <img src={LOGO_URL} alt="Foxhounds" className="w-24 h-24 rounded-full mx-auto mb-6 border-2 border-[#c9a44a]/30" />
            <h2 className="font-serif text-3xl text-[#f5f0e8] mb-4">Welcome to the Pack!</h2>
            <p className="text-[#b5a99a] font-sans mb-8">Your Foxhounds membership is now active. Time to explore, taste, and socialize!</p>
            <Link to="/" className="btn-amber" data-testid="success-home-btn">Explore Now</Link>
          </div>
        )}
        {(status === "error" || status === "timeout" || status === "expired") && (
          <div className="animate-fade-in">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="font-serif text-3xl text-[#f5f0e8] mb-4">
              {status === "expired" ? "Session Expired" : "Something Went Wrong"}
            </h2>
            <p className="text-[#b5a99a] font-sans mb-8">Please try again or contact support.</p>
            <Link to="/membership" className="btn-outline" data-testid="retry-membership-btn">Try Again</Link>
          </div>
        )}
      </div>
    </div>
  );
}
