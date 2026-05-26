import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import { useAdminLoginMutation } from '../../redux/api/authApi';

interface LoginForm {
  email: string;
  password: string;
}

const MAX_ATTEMPTS = 5;

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const navigate = useNavigate();
  const [adminLogin, { isLoading }] = useAdminLoginMutation();

  const isBlocked = failedAttempts >= MAX_ATTEMPTS;

  const onSubmit = async (data: LoginForm) => {
    if (isBlocked) { toast.error('Too many failed attempts. Please refresh.'); return; }
    try {
      const result = await adminLogin(data).unwrap();
      if (result?.success) {
        const role = result?.data?.role || result?.data?.user?.role || result?.user?.role;
        if (role && role !== 'admin') {
          toast.error('Access denied. Admin accounts only.');
          setFailedAttempts((p) => p + 1);
          return;
        }
        toast.success('Welcome back!');
        navigate('/admin');
      } else {
        setFailedAttempts((p) => p + 1);
        toast.error(result?.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      setFailedAttempts((p) => p + 1);
      toast.error(err?.data?.message || err?.message || 'Invalid credentials.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 border-r border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ff6d29] flex items-center justify-center">
            <span className="text-white font-black text-sm">BC</span>
          </div>
          <span className="text-white text-xl font-bold">BizCore ERP</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your<br />
            <span className="text-[#ff6d29]">business smarter</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Complete ERP solution — Inventory, POS, Accounting, HRM, and Reports in one platform. Built for Bangladeshi businesses.
          </p>

          <div className="mt-10 space-y-3">
            {['Inventory & POS Management', 'Double-entry Accounting', 'HRM & Payroll', 'Sales & Purchase Reports'].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#ff6d29]/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#ff6d29]" />
                </div>
                <span className="text-gray-400 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-xs">&copy; {new Date().getFullYear()} BizCore ERP. All rights reserved.</p>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#ff6d29] flex items-center justify-center">
              <span className="text-white font-black text-sm">BC</span>
            </div>
            <span className="text-white text-xl font-bold">BizCore ERP</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white mb-1">Sign In</h2>
              <p className="text-gray-400 text-sm">Admin access only</p>
            </div>

            {failedAttempts > 0 && !isBlocked && (
              <div className="mb-5 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  {MAX_ATTEMPTS - failedAttempts} attempt{MAX_ATTEMPTS - failedAttempts !== 1 ? 's' : ''} remaining before lockout.
                </p>
              </div>
            )}

            {isBlocked && (
              <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm font-medium">Account temporarily locked. Please refresh and try again.</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                    })}
                    disabled={isBlocked}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#ff6d29] focus:ring-1 focus:ring-[#ff6d29] outline-none transition disabled:opacity-40"
                    placeholder="admin@bizcore.com"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                    disabled={isBlocked}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#ff6d29] focus:ring-1 focus:ring-[#ff6d29] outline-none transition disabled:opacity-40"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
                <div className="flex justify-end mt-2">
                  <Link to="/auth/forgot-password" className="text-xs text-[#ff6d29] hover:text-[#ff8d57] transition">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isBlocked}
                className="w-full py-3 mt-1 bg-[#ff6d29] hover:bg-[#e65a1f] text-white font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-gray-600 text-xs mt-6">Unauthorized access is prohibited and monitored.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
