import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useAdminLoginMutation } from '../../redux/api/authApi';
import { accessTokenKey, refreshTokenKey } from '../../contents/token';

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const [login, { isLoading }] = useAdminLoginMutation();
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login(form).unwrap();

      // Validate that this is actually a super_admin account
      const role = res?.data?.role;
      if (role !== 'super_admin') {
        setError('Access denied. This login is for Super Admins only.');
        return;
      }

      // Store tokens
      Cookies.set(accessTokenKey, res?.accessToken, { path: '/' });
      Cookies.set(refreshTokenKey, res?.refreshToken, { path: '/' });

      toast.success('Welcome, Super Admin!');
      navigate('/super-admin/dashboard');
    } catch (err: any) {
      setError(err?.data?.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1623] via-[#141e2e] to-[#0f1623] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-[#ff6d29] flex items-center justify-center shadow-lg mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Super Admin</h1>
          <p className="text-slate-400 text-sm mt-1">SolvexBD Platform Control Panel</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-bold text-[#26272F] mb-1">Sign In</h2>
          <p className="text-sm text-gray-400 mb-6">
            Restricted access — authorised personnel only
          </p>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg mb-5 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                  placeholder="superadmin@solvexbd.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/30 focus:border-[#ff6d29] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/30 focus:border-[#ff6d29] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#ff6d29] hover:bg-orange-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 min-h-[44px]"
            >
              {isLoading ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {isLoading ? 'Signing in...' : 'Sign In to Super Admin'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Regular user?{' '}
            <Link to="/login" className="text-[#ff6d29] hover:underline">
              Go to tenant login
            </Link>
          </p>
        </div>

        {/* Dev hint */}
        <div className="mt-4 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-400 text-center">
          Default credentials after seeding:
          <br />
          <span className="text-white font-mono">superadmin@solvexbd.com</span>
          {' / '}
          <span className="text-white font-mono">SuperAdmin@123</span>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
