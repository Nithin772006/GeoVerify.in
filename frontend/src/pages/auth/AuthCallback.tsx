import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Background3D } from '../../components/ui/Background3D';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Parse the hash fragment
    const hash = location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const type = params.get('type');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      setStatus('error');
      setErrorMessage(errorDescription || 'Authentication failed.');
      setTimeout(() => navigate('/login'), 4000);
      return;
    }

    if (accessToken && (type === 'signup' || type === 'recovery' || type === 'magiclink')) {
      // Email confirmed successfully!
      setStatus('success');
      // Supabase's onAuthStateChange will automatically pick up the session.
      // We just need to wait a moment and redirect.
      setTimeout(() => {
        navigate('/attendance');
      }, 3000);
    } else {
      // No auth params, just redirect to home
      navigate('/attendance', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <Background3D variant="auth" />
      <div className="absolute inset-0 bg-slate-950/72 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.32)] backdrop-blur-2xl">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            {status === 'loading' && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                  <Loader2 className="h-10 w-10 animate-spin" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Verifying...</h2>
                  <p className="mt-2 text-slate-300">Please wait while we verify your request.</p>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Email Confirmed!</h2>
                  <p className="mt-2 text-slate-300">Your account has been successfully verified.</p>
                  <p className="mt-4 text-sm text-cyan-400 animate-pulse">Redirecting to dashboard...</p>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                  <XCircle className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Verification Failed</h2>
                  <p className="mt-2 text-slate-300">{errorMessage}</p>
                  <p className="mt-4 text-sm text-slate-400">Redirecting to login...</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
