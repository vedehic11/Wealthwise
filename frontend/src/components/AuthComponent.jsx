
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { Mail, Lock, User, BarChart2, Eye, EyeOff, AlertCircle } from 'lucide-react';

const AuthComponent = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', remember: false });
  const isSignIn = pathname.includes('sign-in');

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const endpoint = isSignIn ? '/login' : '/register';
      const res = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        // Clear any previous user's cached portfolio so data doesn't bleed across accounts
        // No longer storing portfolio in localStorage

        // Save the current user
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('currentUserEmail', data.user?.email || '');
        // Notify consumers to reload from the new user context immediately
        try {
          window.dispatchEvent(new Event('user-data-updated'));
        } catch (_) {}
        navigate('/portfolio');
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    if (!isSignIn) {
      navigate('/sign-in');
      return;
    }
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const demoCreds = { email: 'vedehi@gmail.com', password: '12345678' };
      setForm({ ...form, ...demoCreds });
      const res = await fetch(`http://127.0.0.1:5000/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoCreds)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('currentUserEmail', data.user?.email || '');
        try {
          window.dispatchEvent(new Event('user-data-updated'));
        } catch (_) {}
        navigate('/portfolio');
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header (match Navbar logo exactly) */}
        <div className="flex items-center justify-center mb-2">
          <Link to="/" className="flex items-center">
            <BarChart2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">WealthWise</span>
          </Link>
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
          {isSignIn ? 'Welcome back. Sign in to access your portfolio.' : 'Create your account to get personalized insights.'}
        </p>
        {authError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-200">
                <strong className="font-semibold">Authentication Error:</strong> {authError}
              </div>
            </div>
            <button 
              onClick={() => setAuthError(null)}
              type="button"
              className="mt-2 text-sm text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Dismiss
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isSignIn ? 'Sign in to your account' : 'Create your account'}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {isSignIn ? 'Use your email and password to continue.' : 'It takes less than a minute.'}
            </p>
          </div>
          {!isSignIn && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" name="first_name" value={form.first_name} onChange={handleChange} required className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" name="last_name" value={form.last_name} onChange={handleChange} required className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>
            </>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>
          <div className="mb-2">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="mb-6 flex items-center justify-between">
            <label className="inline-flex items-center text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <span className="ml-2">Remember me</span>
            </label>
            <Link to="#" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Forgot password?</Link>
          </div>
          <button type="submit" disabled={isSubmitting} className={`w-full inline-flex items-center justify-center font-semibold py-2.5 px-4 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed`}>
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : null}
            {isSignIn ? 'Sign In' : 'Create Account'}
          </button>

          {isSignIn && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center font-medium py-2.5 px-4 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Quickly sign in with demo data"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in with Demo'}
              </button>
              <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">Uses demo account data for instant preview</p>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {isSignIn ? (
              <>Don't have an account? <Link to="/sign-up" className="text-indigo-600 dark:text-indigo-400 hover:underline">Sign up</Link></>
            ) : (
              <>Already have an account? <Link to="/sign-in" className="text-indigo-600 dark:text-indigo-400 hover:underline">Sign in</Link></>
            )}
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthComponent;
