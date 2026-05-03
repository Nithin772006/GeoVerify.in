import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Lock,
  Mail,
  Radar,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Background3D } from '../../components/ui/Background3D';
import { GlassPanel } from '../../components/ui/GlassPanel';
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
  const redirectTo =
    locationState?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (locationState?.pendingConfirmationEmail) {
      setEmail(locationState.pendingConfirmationEmail);
    }

    if (locationState?.confirmationMessage) {
      setConfirmationMessage(locationState.confirmationMessage);
    }
  }, [locationState]);

  const featureCards = [
    {
      title: 'Geo-verified check-ins',
      text: 'Combine live camera proof with location rules for trusted attendance.',
      icon: Radar,
    },
    {
      title: 'Fast command deck',
      text: 'Track people, leave flow, and daily status from one animated workspace.',
      icon: ShieldCheck,
    },
  ];

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
        // Non-admin tried to access admin area — send to employee area
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
      <Background3D variant="auth" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.88),rgba(8,15,32,0.62),rgba(15,23,42,0.88))]" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8 text-white"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-white/65">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Secure Workforce Access
          </div>

          <div className="max-w-2xl space-y-5">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Attendance intelligence with a more cinematic control room.
            </h1>
            <p className="max-w-xl text-base leading-7 text-white/68 sm:text-lg">
              Sign in to manage check-ins, review team movement, and keep every day synchronized with a lively 3D workspace.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {featureCards.map((item, index) => (
              <GlassPanel
                key={item.title}
                delay={0.12 + index * 0.08}
                glow={index === 0 ? 'blue' : 'emerald'}
                className="border-white/10 bg-white/6 text-white"
                contentClassName="p-5"
              >
                <item.icon className="h-8 w-8 text-cyan-300" />
                <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/62">{item.text}</p>
              </GlassPanel>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/55">
            <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
              Motion-rich dashboards
            </div>
            <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
              Role-aware routing
            </div>
            <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
              Live geofence workflow
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <GlassPanel
            glow="blue"
            className="mx-auto w-full max-w-xl border-white/12 bg-white/10 text-white shadow-[0_30px_90px_rgba(14,165,233,0.18)]"
            contentClassName="p-7 sm:p-9"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="mb-4 inline-flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-2.5"
                >
                  <Sparkles className="h-6 w-6 text-cyan-300" />
                </motion.div>
                <h1 className="bg-gradient-to-r from-cyan-200 via-sky-300 to-emerald-300 bg-clip-text text-3xl font-bold text-transparent">
                  GeoVerify.in
                </h1>
              </div>
              <h2 className="text-3xl font-semibold text-white">Sign in</h2>
              <p className="mt-2 text-sm text-white/60">
                Enter your details to open the attendance workspace.
              </p>
            </motion.div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="mb-2 block text-sm font-medium text-white/72">Email</label>
                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-cyan-300" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input bg-white/8 pl-11 text-white placeholder:text-white/28 dark:bg-white/8"
                    placeholder="name@company.com"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="mb-2 block text-sm font-medium text-white/72">Password</label>
                <div className="group relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-cyan-300" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input bg-white/8 pl-11 text-white placeholder:text-white/28 dark:bg-white/8"
                    placeholder="Enter your password"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(34,211,238,0.28)' }}
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
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 space-y-5"
            >
              {pendingConfirmationEmail && (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <div className="text-sm font-semibold text-white">Email confirmation required</div>
                  <p className="mt-1 text-sm text-white/60">
                    {confirmationMessage || 'Please confirm your email before signing in.'}
                  </p>
                  <p className="mt-2 text-xs text-amber-100/80">{pendingConfirmationEmail}</p>
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/12 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/18 disabled:opacity-60"
                  >
                    <RefreshCcw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
                    {resending ? 'Resending...' : 'Resend confirmation email'}
                  </button>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <div className="text-sm font-semibold text-white">Need a new account?</div>
                <p className="mt-1 text-sm text-white/58">
                  Use the registration page to create an employee workspace account in a few steps.
                </p>
                <Link
                  to="/register"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/16"
                >
                  Create your account <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="text-center text-sm text-white/50">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-medium text-cyan-300 transition hover:text-cyan-200">
                  Register here
                </Link>
              </p>
            </motion.div>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}
