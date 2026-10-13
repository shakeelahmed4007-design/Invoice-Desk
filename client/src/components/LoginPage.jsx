import { useState } from 'react';
import {
  Layers3,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Alex Morgan',
    email: 'alex@company.com',
    phone: '+1 (555) 234-5678',
    password: 'password123',
    agreeTerms: true,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in required fields.');
      return;
    }
    if (isSignUp && !formData.name) {
      setError('Please enter your name.');
      return;
    }
    if (isSignUp && !formData.agreeTerms) {
      setError('Please accept Terms & Privacy Policy.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      onLogin({
        name: isSignUp ? formData.name : (formData.email.split('@')[0] || 'Finance User'),
        email: formData.email,
        phone: formData.phone,
        role: 'Finance Lead',
        avatarInitial: (isSignUp ? formData.name : formData.email)[0].toUpperCase(),
      });
      setSubmitting(false);
    }, 300);
  }

  function handleDemoLogin() {
    onLogin({
      name: 'Alex Morgan',
      email: 'alex@invoicedesk.io',
      phone: '+1 (555) 019-2834',
      role: 'Finance Lead',
      avatarInitial: 'A',
    });
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center p-3 sm:p-5 relative bg-[#eef3ee] select-none">
      {/* Background Ambient Decorative Shapes */}
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-teal-200/35 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />

      {/* Main Split Card Container (Compact Fit within 1 Screen) */}
      <div className="relative z-10 w-full max-w-4xl max-h-[95vh] rounded-2xl sm:rounded-3xl bg-white shadow-2xl shadow-emerald-950/10 border border-emerald-100/90 overflow-hidden grid lg:grid-cols-12">
        
        {/* Left Side: Brand & Visual Banner */}
        <div className="relative lg:col-span-5 bg-gradient-to-br from-[#f2f7f2] via-[#e8f1e9] to-[#dbeef0] p-6 sm:p-7 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-emerald-100/70">
          {/* Organic Background Blobs */}
          <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full bg-emerald-500/15 blur-xl pointer-events-none" />
          <div className="absolute top-1/3 -left-10 h-32 w-32 rounded-full bg-teal-400/20 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-emerald-600/10 blur-xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 shadow-md shadow-emerald-600/30 text-white">
              <Layers3 size={18} />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                Invoice<span className="text-emerald-600">Desk</span>
              </span>
              <span className="ml-1.5 rounded-full bg-emerald-600/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-600/20">
                PRO
              </span>
            </div>
          </div>

          {/* Center Promo Copy */}
          <div className="relative z-10 my-4 sm:my-6 lg:my-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 border border-emerald-600/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 mb-2.5">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>Enterprise Grade Security</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug">
              Get Started <br />
              With Your <span className="text-emerald-600">Account</span>
            </h1>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-xs">
              Take the first step towards streamlined invoice workflows and smarter finance decisions.
            </p>

            {/* Quick Demo Pill */}
            <div className="mt-4 pt-4 border-t border-emerald-900/10">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="group flex w-full items-center gap-2 rounded-xl bg-white/95 hover:bg-white border border-emerald-200/80 px-3.5 py-2 text-xs font-semibold text-emerald-900 shadow-sm transition-all hover:shadow-md"
              >
                <Zap size={14} className="text-amber-500 group-hover:scale-110 transition-transform" />
                <span>1-Click Quick Demo Login</span>
                <ArrowRight size={13} className="ml-auto text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Bottom Switcher Link */}
          <div className="relative z-10 pt-2 text-[11px] text-slate-500">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(''); }}
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Log In →
                </button>
              </p>
            ) : (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(''); }}
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Create Account →
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Form Area */}
        <div className="lg:col-span-7 p-5 sm:p-7 lg:p-8 flex flex-col justify-center">
          {/* Form Header */}
          <div className="flex items-start justify-between gap-3 mb-3.5">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                {isSignUp ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {isSignUp
                  ? 'Fill in your details to get started with your workspace.'
                  : 'Enter your credentials to access your invoice desk.'}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              {isSignUp ? 'Step 1 of 1' : 'Secure Login'}
            </span>
          </div>

          {error && (
            <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs font-medium text-rose-700 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {isSignUp && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-emerald-600">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User size={15} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email Address <span className="text-emerald-600">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="Enter your Email Address"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Phone size={15} />
                  </span>
                  <input
                    type="tel"
                    placeholder="Enter your Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Password <span className="text-emerald-600">*</span>
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset link sent to your registered email.')}
                    className="text-[10px] font-semibold text-emerald-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={15} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Checkbox */}
            {isSignUp ? (
              <label className="flex items-center gap-2 pt-0.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => handleChange('agreeTerms', e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-600 leading-none">
                  I agree to the{' '}
                  <span className="font-semibold text-emerald-700 underline">Terms &amp; Condition</span>{' '}
                  and{' '}
                  <span className="font-semibold text-emerald-700 underline">Privacy Policy</span>
                </span>
              </label>
            ) : (
              <label className="flex items-center gap-2 pt-0.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-600 leading-none">Keep me signed in on this device</span>
              </label>
            )}

            {/* Main Action Button */}
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-2.5 sm:py-3 px-5 shadow-lg shadow-emerald-600/25 transition-all transform active:scale-[0.99] disabled:opacity-60 text-xs sm:text-sm"
              >
                <span>{submitting ? 'Authenticating…' : isSignUp ? 'Create Account' : 'Sign In to Workspace'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>

          {/* Social Sign-in Divider */}
          <div className="relative my-3 sm:my-3.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] text-slate-400 uppercase tracking-wider">
              <span className="bg-white px-2.5">or continue with</span>
            </div>
          </div>

          {/* Social SSO Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 px-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 shadow-sm"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 px-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 shadow-sm"
            >
              <svg className="h-3.5 w-3.5 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 px-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 shadow-sm"
            >
              <svg className="h-3.5 w-3.5 fill-slate-900" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.42c.67-.82 1.13-1.96 1-3.11-1 .04-2.18.66-2.88 1.48-.61.71-1.15 1.87-1.01 2.99 1.12.09 2.22-.55 2.89-1.36" />
              </svg>
              <span>Apple</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
