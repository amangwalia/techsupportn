import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  LogIn,
  Shield
} from 'lucide-react';
import { TechSupportLogo } from './TechSupportLogo';
import { authenticateUser } from '../utils/auth';
import { UserRole } from '../types';

interface LoginPageProps {
  onLoginSuccess: (username: string, role: UserRole) => void;
  isDarkMode: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  // Two tabs: 'member' or 'admin'
  const [loginType, setLoginType] = useState<'member' | 'admin'>('member');
  
  // Credentials
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const isAdminRequired = loginType === 'admin';

    try {
      const result = await authenticateUser(loginId, password, isAdminRequired);
      setLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user.username, result.user.role);
      } else {
        setErrorMsg(
          result.error ||
            (isAdminRequired
              ? 'Invalid username or password.'
              : 'Invalid login ID or password. Contact your administrator.')
        );
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(
        isAdminRequired
          ? 'Invalid username or password.'
          : 'Invalid login ID or password. Contact your administrator.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 font-sans selection:bg-cyan-500 selection:text-white transition-colors duration-200 relative overflow-hidden">
      
      {/* Liquid Organic Floating Background Glow Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-blue-600/30 via-indigo-600/25 to-cyan-400/20 blur-3xl"
          style={{ animation: 'liquid-float-1 18s ease-in-out infinite' }}
        />
        <div 
          className="absolute top-1/2 -right-40 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-cyan-500/20 via-sky-600/25 to-teal-400/20 blur-3xl"
          style={{ animation: 'liquid-float-2 22s ease-in-out infinite' }}
        />
        <div 
          className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-purple-600/25 via-blue-600/20 to-cyan-500/20 blur-3xl"
          style={{ animation: 'liquid-float-3 20s ease-in-out infinite' }}
        />
      </div>

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed top-6 z-50 flex items-center gap-2.5 px-4 py-3 liquid-glass text-emerald-300 rounded-2xl shadow-2xl border border-emerald-400/40 text-xs font-semibold animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="w-full max-w-[430px] space-y-6 relative z-10">
        
        {/* Liquid Glass Card */}
        <div className="liquid-glass rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6 border border-white/60 dark:border-white/15">
          
          {/* Header & Logo */}
          <div className="text-center flex flex-col items-center space-y-3">
            <TechSupportLogo size="lg" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {loginType === 'admin' ? 'Admin Portal Sign In' : 'Member Sign In'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tech Support Catalog & Resource Vault
              </p>
            </div>
          </div>

          {/* Liquid Glass Tab Switcher: Member Login vs Admin Login */}
          <div className="grid grid-cols-2 p-1 liquid-glass-chip rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setLoginType('member');
                setErrorMsg('');
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                loginType === 'member'
                  ? 'bg-white/90 dark:bg-slate-800/90 text-blue-600 dark:text-cyan-400 shadow-md font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Member Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType('admin');
                setErrorMsg('');
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                loginType === 'admin'
                  ? 'bg-white/90 dark:bg-slate-800/90 text-indigo-600 dark:text-cyan-400 shadow-md font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/15 border border-rose-400/30 text-rose-600 dark:text-rose-300 text-xs animate-in fade-in leading-relaxed backdrop-blur-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            
            {/* Mode Banner Indicator */}
            {loginType === 'admin' ? (
              <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex items-center gap-2 text-indigo-300 text-xs">
                <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Admin authentication required for catalog upload and user credentials management.</span>
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-400/20 text-slate-400 text-[11px] leading-relaxed">
                Enter your community member ID or registered email to access resources.
              </div>
            )}

            {/* Login ID Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {loginType === 'admin' ? 'Admin Login ID or Email' : 'Login ID or Email'}
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder={loginType === 'admin' ? 'Enter admin username or email' : 'Enter your username or email'}
                  required
                  autoFocus
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-blue-500 dark:focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition placeholder:text-slate-400 backdrop-blur-xs"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {loginType === 'admin' ? 'Admin Password' : 'Password'}
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={loginType === 'admin' ? 'Enter admin password' : 'Enter your password'}
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-white/10 text-slate-900 dark:text-slate-100 text-sm outline-none focus:border-blue-500 dark:focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition placeholder:text-slate-400 backdrop-blur-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Member Notice */}
            {loginType === 'member' && (
              <p className="text-[11px] text-slate-400 pt-0.5">
                Need an account or password reset? Please contact your system administrator.
              </p>
            )}

            {/* Quick Demo Credentials Autofill Helper */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Default login:</span>
              {loginType === 'admin' ? (
                <button
                  type="button"
                  onClick={() => {
                    setLoginId('admin');
                    setPassword('admin123');
                    setErrorMsg('');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold cursor-pointer underline underline-offset-2"
                >
                  Use admin / admin123
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setLoginId('user');
                    setPassword('user123');
                    setErrorMsg('');
                  }}
                  className="text-blue-400 hover:text-blue-300 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold cursor-pointer underline underline-offset-2"
                >
                  Use user / user123
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !loginId || !password}
              className={`w-full py-3 px-4 rounded-full liquid-glass-btn text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2 mt-4 ${
                loading || !loginId || !password ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <span>{loading ? 'Authenticating...' : loginType === 'admin' ? 'Sign In as Administrator' : 'Sign In as Member'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 px-2">
          <span>Tech Support Resource Vault</span>
          <span className="text-[11px]">Secure Internal Directory</span>
        </div>
      </div>
    </div>
  );
};
