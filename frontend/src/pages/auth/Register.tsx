import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail, Sparkles, User, Users, Waves } from 'lucide-react';
import { Background3D } from '../../components/ui/Background3D';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { supabase } from '../../services/supabase';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const milestones = [
    {
      title: 'Create your account',
      text: 'Set up a personal employee login with your name and work email.',
      icon: User,
    },
    {
      title: 'Confirm your identity',
      text: 'If email verification is enabled, we will send a sign-in confirmation link.',
      icon: Mail,
    },
    {
      title: 'Enter the workspace',
      text: 'After sign-in you can track attendance, submit leave, and view your dashboard.',
      icon: Waves,
    },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const emailRedirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo,
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Registration failed');

      if (data.session) {
        toast.success('Account created! Welcome to GeoVerify.');
        navigate('/dashboard');
      } else {
        toast.success('Account created. Check your email to confirm your sign-in.');
        navigate('/login', {
          state: {
            pendingConfirmationEmail: email,
            confirmationMessage: 'Your account was created, but you need to confirm your email before signing in.',
          },
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-y-auto">
      <Background3D variant="auth" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.88),rgba(8,15,32,0.62),rgba(15,23,42,0.88))]" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8 text-white"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-white/65">
            <Users className="h-4 w-4 text-emerald-300" />
            Employee Onboarding
          </div>

          <div className="max-w-2xl space-y-5">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Launch a new employee workspace account.
            </h1>
            <p className="max-w-xl text-base leading-7 text-white/68 sm:text-lg">
              Register once, confirm your sign-in if required, and step straight into the new animated GeoVerify dashboard.
            </p>
          </div>

          <div className="space-y-4">
            {milestones.map((item, index) => (
              <GlassPanel
                key={item.title}
                delay={0.12 + index * 0.08}
                glow={index === 1 ? 'emerald' : 'blue'}
                className="border-white/10 bg-white/6 text-white"
                contentClassName="flex items-start gap-4 p-5"
              >
                <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
                  <item.icon className="h-6 w-6 text-cyan-200" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-white/62">{item.text}</p>
                </div>
              </GlassPanel>
            ))}
          </div>

          <div className="rounded-[26px] border border-amber-300/18 bg-amber-300/10 p-5 text-sm text-amber-100/88">
            <div className="font-semibold">Admin access is invite-only.</div>
            <p className="mt-2 leading-6 text-amber-100/70">
              This public registration page creates employee accounts only. Existing admins can create admin users from inside the workspace.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <GlassPanel
            glow="emerald"
            className="mx-auto w-full max-w-xl border-white/12 bg-white/10 text-white shadow-[0_30px_90px_rgba(16,185,129,0.18)]"
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
                  className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-2.5"
                >
                  <Sparkles className="h-6 w-6 text-emerald-300" />
                </motion.div>
                <h1 className="bg-gradient-to-r from-cyan-200 via-sky-300 to-emerald-300 bg-clip-text text-3xl font-bold text-transparent">
                  GeoVerify.in
                </h1>
              </div>
              <h2 className="text-3xl font-semibold text-white">Create your account</h2>
              <p className="mt-2 text-sm text-white/60">
                Set up an employee account and step into your attendance dashboard.
              </p>
            </motion.div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/72">Full Name</label>
                <div className="group relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-emerald-300" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input bg-white/8 pl-11 text-white placeholder:text-white/28 dark:bg-white/8"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/72">Work Email</label>
                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-emerald-300" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input bg-white/8 pl-11 text-white placeholder:text-white/28 dark:bg-white/8"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">Password</label>
                  <div className="group relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-emerald-300" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input bg-white/8 pl-11 text-white placeholder:text-white/28 dark:bg-white/8"
                      placeholder="Min 6 characters"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">Confirm Password</label>
                  <div className="group relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-emerald-300" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="glass-input bg-white/8 pl-11 text-white placeholder:text-white/28 dark:bg-white/8"
                      placeholder="Repeat password"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-white/62">
                Public registration creates an <span className="font-semibold text-white">employee</span> account. If you need admin access, ask an existing admin to invite you from the Employees panel.
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(16,185,129,0.28)' }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="glass-button-primary w-full disabled:opacity-50"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                  />
                ) : (
                  <>
                    Create Account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-white/50">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-cyan-300 transition hover:text-cyan-200">
                  Sign in
                </Link>
              </p>
            </motion.div>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}
