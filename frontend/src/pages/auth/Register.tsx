import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail, Sparkles, User } from 'lucide-react';
import { Background3D } from '../../components/ui/Background3D';
import { GlassPanel } from '../../components/ui/GlassPanel';
import heroImage from '../../assets/hero.png';
import { supabase } from '../../services/supabase';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="h-full w-full object-cover opacity-20 blur-[2px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,8,16,0.94),rgba(7,16,29,0.84),rgba(4,9,16,0.96))]" />
      </div>
      <Background3D variant="auth" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-xl"
        >
          <GlassPanel
            glow="emerald"
            className="border-white/12 bg-white/[0.08] text-white shadow-[0_32px_120px_rgba(0,0,0,0.42)]"
            contentClassName="p-7 sm:p-9"
          >
            <div className="mb-8">
              <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/44">
                <Sparkles className="h-4 w-4 text-emerald-200" />
                GeoVerify.in
              </div>
              <h1 className="text-4xl font-semibold text-white">Create account</h1>
              <div className="mt-2 text-sm text-white/46">Employee access</div>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/62">Full name</label>
                <div className="group relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34 transition-colors group-focus-within:text-emerald-300" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input pl-11"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/62">Work email</label>
                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34 transition-colors group-focus-within:text-emerald-300" />
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

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/62">Password</label>
                  <div className="group relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34 transition-colors group-focus-within:text-emerald-300" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input pl-11"
                      placeholder="Min 6 characters"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/62">Confirm</label>
                  <div className="group relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34 transition-colors group-focus-within:text-emerald-300" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="glass-input pl-11"
                      placeholder="Repeat password"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/54">
                Public registration creates an employee account only.
              </div>

              <motion.button
                whileHover={{ scale: 1.01, boxShadow: '0 0 30px rgba(0,184,150,0.18)' }}
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
                    Create account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-8 text-center text-sm text-white/52">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-cyan-200 transition hover:text-cyan-100">
                Sign in
              </Link>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}
