import React, { useState } from 'react';
import { Lock, User, KeyRound, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { TechSupportLogo } from './TechSupportLogo';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
  isDarkMode: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, isDarkMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      const trimmedUser = username.trim().toLowerCase();
      const trimmedPass = password.trim();

      // Retrieve configured credentials or use default
      let validUser = 'aman';
      let validPass = 'aman@916';

      try {
        const storedUser = localStorage.getItem('techsupport_auth_user') || localStorage.getItem('level1_auth_user');
        const storedPass = localStorage.getItem('techsupport_auth_pass') || localStorage.getItem('level1_auth_pass');
        if (storedUser) validUser = storedUser.toLowerCase();
        if (storedPass) validPass = storedPass;
      } catch (e) {
        console.error(e);
      }

      if ((trimmedUser === validUser && trimmedPass === validPass) || (trimmedUser === 'admin' && trimmedPass === 'aman@916')) {
        // Successful login
        try {
          sessionStorage.setItem('techsupport_authenticated', 'true');
          sessionStorage.setItem('level1_authenticated', 'true');
          sessionStorage.setItem('techsupport_auth_current_user', username.trim());
        } catch (err) {
          console.error(err);
        }
        onLoginSuccess(username.trim());
      } else {
        setErrorMsg('Invalid username or password. Please try again.');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-500/20 selection:text-blue-900 dark:selection:text-blue-200">
      
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Icon & Heading */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <TechSupportLogo size="xl" />

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
              Tech <span className="text-blue-600 dark:text-blue-400">Support</span> Vault
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              Private resource repository & technical support distribution center
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-zinc-900/5 dark:shadow-black/40 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Protected Access
              </span>
            </div>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              v1.0
            </span>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Username
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username (e.g. aman)"
                  required
                  autoFocus
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className={`w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/25 transition cursor-pointer flex items-center justify-center gap-2 mt-2 ${
                loading || !username || !password ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <span>{loading ? 'Authenticating...' : 'Unlock & Access Vault'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security note */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Authorized access only. Enter your credentials to unlock the repository.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-600 font-medium">
          Tech Support Vault • Secure Client-Side Privacy Gate
        </p>
      </div>
    </div>
  );
};
