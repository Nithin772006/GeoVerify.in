import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail, RefreshCcw, Sparkles } from 'lucide-react';
import { Background3D } from '../../components/ui/Background3D';
import { GlassPanel } from '../../components/ui/GlassPanel';
import heroImage from '../../assets/hero.png';
import { supabase } from '../../services/supabase';

export default function Login() {
  const location = useLocation();
  const locationState = location.state as
    | {
        from?: { pathname?: string };
        pendingConfirmationEmail?: string;
        confirmationMessage?: string;
      }
    | null;

  const [email, setEmail] = useState(locationState?.pendingConfirmationEmail ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState(
    locationState?.pendingConfirmationEmail ?? '',
  );
  const [confirmationMessage, setConfirmationMessage] = useState(
    locationState?.confirmationMessage ?? '',
  );
  const navigate = useNavigate();
  const redirectTo = locationState?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (locationState?.pendingConfirmationEmail) {
      setEmail(locationState.pendingConfirmationEmail);
    }

    if (locationState?.confirmationMessage) {
      setConfirmationMessage(locationState.confirmationMessage);
    }
  }, [locationState]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: roleData } = await supabase.rpc('get_my_role');
      const userRole = roleData === 'admin' ? 'admin' : 'employee';

      toast.success('Welcome back!');

      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (redirectTo.startsWith('/admin')) {
        navigate('/attendance');
      } else {
        navigate(redirectTo === '/dashboard' ? '/attendance' : redirectTo);
      }
    } catch (error: any) {
      const message = error?.message || 'Failed to login';

      if (message.toLowerCase().includes('email not confirmed')) {
        setPendingConfirmationEmail(email);
        setConfirmationMessage('This account exists, but the email address is not confirmed yet.');
        toast.error('Email not confirmed. Please open the confirmation email first.');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const targetEmail = pendingConfirmationEmail || email;
    if (!targetEmail) {
      toast.error('Enter your email first so we know where to resend the confirmation link.');
      return;
    }

    setResending(true);

    try {
      const emailRedirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: { emailRedirectTo },
      });

      if (error) throw error;

      setPendingConfirmationEmail(targetEmail);
      setConfirmationMessage('A fresh confirmation email has been sent. Check your inbox and spam folder.');
      toast.success('Confirmation email resent.');
    } catch (error: any) {
      toast.error(error?.message || 'Could not resend confirmation email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="h-full w-full object-cover opacity-20 blur-[2px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,8,16,0.92),rgba(7,16,29,0.82),rgba(4,9,16,0.96))]" />
      </div>
      <Background3D variant="auth" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,212,255,0.1),transparent_26%),radial-gradient(circle_at_bottom,rgba(0,184,150,0.08),transparent_26%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg"
        >
          <GlassPanel
            glow="blue"
            className="border-white/12 bg-white/[0.08] text-white shadow-[0_32px_120px_rgba(0,0,0,0.42)]"
            contentClassName="p-7 sm:p-9"
          >
            <div className="mb-8">
              <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/44">
                <Sparkles className="h-4 w-4 text-cyan-200" />
                GeoVerify.in
              </div>
              <h1 className="text-4xl font-semibold text-white">Sign in</h1>
              <div className="mt-2 text-sm text-white/46">Secure access</div>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/62">Email</label>
                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34 transition-colors group-focus-within:text-cyan-300" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input pl-11"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/62">Password</label>
                <div className="group relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34 transition-colors group-focus-within:text-cyan-300" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input pl-11"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01, boxShadow: '0 0 30px rgba(0,212,255,0.18)' }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="glass-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                  />
                ) : (
                  <>
                    Sign in <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-8 space-y-5">
              {pendingConfirmationEmail ? (
                <div className="rounded-2xl border border-amber-300/18 bg-amber-300/10 p-4">
                  <div className="text-sm font-semibold text-white">Email confirmation required</div>
                  <p className="mt-1 text-sm text-white/56">
                    {confirmationMessage || 'Please confirm your email before signing in.'}
                  </p>
                  <p className="mt-2 text-xs text-amber-100/78">{pendingConfirmationEmail}</p>
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/22 bg-amber-300/12 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/18 disabled:opacity-60"
                  >
                    <RefreshCcw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
                    {resending ? 'Resending...' : 'Resend confirmation'}
                  </button>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm">
                <span className="text-white/52">Need a new account?</span>
                <Link to="/register" className="font-semibold text-cyan-200 transition hover:text-cyan-100">
                  Register
                </Link>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}
