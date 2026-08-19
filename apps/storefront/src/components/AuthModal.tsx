'use client';

import { useState } from 'react';
import { X, User, Lock, Mail, CheckCircle2, KeyRound } from 'lucide-react';
import { useCartStore } from '../lib/cartStore';
import { useHasMounted } from '../lib/useHasMounted';

const T = '#00B4C8';
const N = '#1A2B4A';

export default function AuthModal() {
  const hasMounted = useHasMounted();
  const authOpen = useCartStore((s) => s.authOpen);
  const setAuthOpen = useCartStore((s) => s.setAuthOpen);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('sarah.jenkins@hospital.org');
  const [password, setPassword] = useState('Hospital123!');
  const [name, setName] = useState('Dr. Sarah Jenkins');
  const [company, setCompany] = useState('St. Jude General Hospital');
  const [userLoggedIn, setUserLoggedIn] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!hasMounted || !authOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setUserLoggedIn({
        name: name || 'Dr. Sarah Jenkins',
        email,
        company: company || 'St. Jude General Hospital',
      });
      setLoading(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between text-white" style={{ backgroundColor: N }}>
          <div className="flex items-center gap-2">
            <User size={18} style={{ color: T }} />
            <h3 className="font-bold text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {userLoggedIn ? 'Customer Portal' : mode === 'login' ? 'Sign In to Account' : 'Register Wholesale Account'}
            </h3>
          </div>
          <button onClick={() => setAuthOpen(false)} className="p-1 text-slate-300 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {userLoggedIn ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#E8F9FB] text-[#00B4C8] flex items-center justify-center mx-auto">
                <User size={28} />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {userLoggedIn.name}
                </h4>
                <p className="text-xs text-slate-500">{userLoggedIn.email}</p>
                <p className="text-xs text-slate-400 mt-0.5">{userLoggedIn.company}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setUserLoggedIn(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:border-slate-300"
                >
                  Sign Out
                </button>
                <button
                  onClick={() => setAuthOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-white shadow-sm"
                  style={{ backgroundColor: T }}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Quick Demo Hint */}
              <div
                onClick={() => {
                  setEmail('sarah.jenkins@hospital.org');
                  setPassword('Hospital123!');
                }}
                className="p-3 rounded-xl bg-[#E8F9FB] border border-[#D4EFF3] text-2xs cursor-pointer hover:border-[#00B4C8] transition-colors"
              >
                <span className="font-bold text-slate-900 block flex items-center gap-1">
                  <KeyRound size={12} style={{ color: T }} /> Demo Customer Account (Click to autofill):
                </span>
                <span className="text-slate-600">sarah.jenkins@hospital.org / Hospital123!</span>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#00B4C8]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#00B4C8]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Password *
                </label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#00B4C8]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white text-xs transition-opacity hover:opacity-90 shadow-sm disabled:opacity-50"
                style={{ backgroundColor: N }}
              >
                {loading ? 'Authenticating…' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-xs text-slate-500 hover:text-[#00B4C8] transition-colors"
                >
                  {mode === 'login'
                    ? "Don't have an account? Register wholesale account"
                    : 'Already registered? Sign in'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
