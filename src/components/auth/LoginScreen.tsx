import React from 'react';
import { motion } from 'motion/react';
import { Coins, User as UserIcon } from 'lucide-react';

interface LoginScreenProps {
  handleGuestSignIn: () => void;
  handleGoogleSignIn: () => void;
  showCustomLoginConfig: boolean;
  setShowCustomLoginConfig: (val: boolean) => void;
  customLoginClientId: string;
  setCustomLoginClientId: (val: string) => void;
  handleCustomOauthLogin: () => void;
  loginManualToken: string;
  setLoginManualToken: (val: string) => void;
  handleApplyLoginManualToken: () => void;
}

export default function LoginScreen({
  handleGuestSignIn,
  handleGoogleSignIn,
  showCustomLoginConfig,
  setShowCustomLoginConfig,
  customLoginClientId,
  setCustomLoginClientId,
  handleCustomOauthLogin,
  loginManualToken,
  setLoginManualToken,
  handleApplyLoginManualToken
}: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-2 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white max-w-md w-full p-4 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center space-y-3"
      >
        <div className="p-2 bg-slate-900 text-white rounded-2xl">
          <Coins size={44} className="animate-pulse" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 font-display">
            InvestMant Ledger
          </h1>
          <p className="text-xs text-slate-400 font-medium px-2 leading-relaxed">
            India's premium offline-safe PWA investment tracker. Manage stock holdings, live NAV SIP triggers, FD compound maturities, goals, SMS parse deconstructs and Section 80C targets.
          </p>
        </div>

        <div className="w-full pt-2 border-t border-slate-100 space-y-1">
          <div className="bg-emerald-50/70 border border-emerald-200/50 rounded-2xl p-1 text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-1">💡 Blocker-free Access:</span>
            <p className="text-[10px] text-emerald-950 font-normal leading-relaxed">
              Google might show an "unverified app" screen on new accounts. Click <b>Continue as Guest</b> to login instantly with 100% features, and sync via custom keys later!
            </p>
          </div>

          <button
            onClick={handleGuestSignIn}
            style={{ contentVisibility: 'auto' }}
            className="w-full flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-805 text-white font-bold py-1.5 px-3 rounded-2xl transition-all shadow-md hover:shadow-lg hover:scale-[1.01] cursor-pointer"
          >
            <UserIcon size={18} className="text-emerald-400" />
            Continue as Guest (Instant Secure Login)
          </button>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-1 bg-white hover:bg-slate-50 text-slate-800 font-bold py-1 px-3 rounded-2xl transition-all border border-slate-200 cursor-pointer text-xs"
          >
            <svg className="w-4 h-4 fill-current shrink-0 text-slate-600" viewBox="0 0 24 24">
              <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.61 4.5 1.8l2.4-2.4C17.3 1.8 14.9 1 12.24 1c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.37 0 9.6-3.815 9.6-9.715 0-.585-.05-1.17-.15-1.74l-9.45.04z" />
            </svg>
            Standard Google Sign In
          </button>
        </div>

        {/* Advanced Credentials Bypass Panel inside Login screen */}
        <div className="w-full pt-1">
          <button
            type="button"
            onClick={() => setShowCustomLoginConfig(!showCustomLoginConfig)}
            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider flex items-center gap-1 mx-auto cursor-pointer"
          >
            ⚙️ Advanced Bypass Settings (Custom Client ID / Token)
          </button>

          {showCustomLoginConfig && (
            <div className="mt-2 p-2 bg-slate-50 border border-slate-205 rounded-2xl text-left space-y-1.5 text-slate-700 animate-fadeIn">
              <p className="text-[10px] text-slate-500 leading-normal font-medium">
                Add custom developer credentials or paste a temporary access token from Google OAuth playground to completely bypass Error 403.
              </p>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase tracking-widest text-[8px]">Google Client ID</label>
                <input
                  type="text"
                  value={customLoginClientId}
                  onChange={(e) => setCustomLoginClientId(e.target.value)}
                  placeholder="Custom Client ID"
                  className="w-full bg-white border border-slate-200 rounded-xl p-1 px-1 text-[9px] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase tracking-widest text-[8px]">Option A: Authenticate with Custom Client</label>
                <button
                  type="button"
                  onClick={handleCustomOauthLogin}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold p-1 px-1 rounded-xl cursor-pointer text-[9px] text-center"
                >
                  🔐 Login & Authorize Google Sync Scopes
                </button>
              </div>

              <div className="pt-1 border-t border-slate-200/50 space-y-1.5">
                <label className="block font-bold text-slate-500 uppercase tracking-widest text-[8px]">Option B: Access Token paste bypass</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Paste token (e.g. ya29...)"
                    value={loginManualToken}
                    onChange={(e) => setLoginManualToken(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl p-1 px-1 text-[9px] font-mono leading-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyLoginManualToken}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-1 rounded-xl text-[9px] font-sans"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-[9px] text-slate-400">
          Secure cloud synched ledger under full Google Firestore attribute control.
        </p>
      </motion.div>
    </div>
  );
}
