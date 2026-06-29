import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Lock, Phone, Shield, User, ArrowLeft, CheckCircle2 } from 'lucide-react';
import {
  useMobileSendOtpMutation,
  useMobileVerifyOtpMutation,
  useMobileRegisterMutation,
} from '../../redux/api/authApi';
import { setCredentials } from '../../redux/features/authSlice';

type Step = 1 | 2 | 3;

interface MobileForm {
  mobile: string;
}
interface OtpForm {
  code: string;
}
interface RegisterForm {
  name: string;
  password: string;
}

const BrandLogo = () => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-[#ff6d29] flex items-center justify-center">
      <span className="text-white font-black text-sm">SX</span>
    </div>
    <span className="text-white text-xl font-bold">SolvexBD ERP</span>
  </div>
);

const StepIndicator = ({ step }: { step: Step }) => (
  <div className="flex items-center gap-2 mb-7">
    {([1, 2, 3] as Step[]).map((s) => (
      <div key={s} className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            s < step
              ? 'bg-[#ff6d29] text-white'
              : s === step
                ? 'bg-[#ff6d29]/20 border-2 border-[#ff6d29] text-[#ff6d29]'
                : 'bg-white/5 border border-white/20 text-gray-500'
          }`}
        >
          {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
        </div>
        {s < 3 && <div className={`w-8 h-px ${s < step ? 'bg-[#ff6d29]' : 'bg-white/10'}`} />}
      </div>
    ))}
    <span className="text-gray-500 text-xs ml-2">
      {step === 1 ? 'Enter mobile' : step === 2 ? 'Verify OTP' : 'Create account'}
    </span>
  </div>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState<Step>(1);
  const [mobile, setMobile] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [sendOtp, { isLoading: isSending }] = useMobileSendOtpMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useMobileVerifyOtpMutation();
  const [register, { isLoading: isRegistering }] = useMobileRegisterMutation();

  const mobileForm = useForm<MobileForm>();
  const otpForm = useForm<OtpForm>();
  const registerForm = useForm<RegisterForm>();

  const handleSendOtp = async (data: MobileForm) => {
    try {
      await sendOtp({ mobile: data.mobile }).unwrap();
      setMobile(data.mobile);
      toast.success('OTP sent!');
      setStep(2);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (data: OtpForm) => {
    try {
      const result = await verifyOtp({ mobile, code: data.code }).unwrap();
      console.log(result, 'result');

      if (!result.isNewUser) {
        if (result.user) dispatch(setCredentials(result.user));
        toast.success(`Welcome back, ${result.user?.name || 'there'}!`);
        navigate('/admin');
      } else {
        setTempToken(result.tempToken);
        setStep(3);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Invalid OTP');
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    try {
      const result = await register({
        tempToken,
        name: data.name,
        password: data.password,
      }).unwrap();
      if (result.user) dispatch(setCredentials(result.user));
      toast.success(`Welcome, ${result.user?.name || data.name}!`);
      navigate('/select-plan', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 border-r border-white/5">
        <BrandLogo />
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your
            <br />
            <span className="text-[#ff6d29]">business smarter</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Complete ERP solution — Inventory, POS, Accounting, HRM, and Reports in one platform.
            Built for Bangladeshi businesses.
          </p>
          <div className="mt-10 space-y-3">
            {[
              'Inventory & POS Management',
              'Double-entry Accounting',
              'HRM & Payroll',
              'Sales & Purchase Reports',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#ff6d29]/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#ff6d29]" />
                </div>
                <span className="text-gray-400 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-600 text-xs">
          &copy; {new Date().getFullYear()} SolvexBD ERP. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <BrandLogo />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <StepIndicator step={step} />

            {/* Step 1 — Mobile number */}
            {step === 1 && (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-bold text-white mb-1">Sign In / Sign Up</h2>
                  <p className="text-gray-400 text-sm">Enter your mobile number to continue</p>
                </div>
                <form onSubmit={mobileForm.handleSubmit(handleSendOtp)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="tel"
                        {...mobileForm.register('mobile', {
                          required: 'Mobile number is required',
                          pattern: {
                            value: /^01[3-9]\d{8}$/,
                            message: 'Enter a valid BD mobile number',
                          },
                        })}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#ff6d29] focus:ring-1 focus:ring-[#ff6d29] outline-none transition"
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                    {mobileForm.formState.errors.mobile && (
                      <p className="text-red-400 text-xs mt-1.5">
                        {mobileForm.formState.errors.mobile.message}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-3 bg-[#ff6d29] hover:bg-[#e65a1f] text-white font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Send OTP
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Step 2 — OTP */}
            {step === 2 && (
              <>
                <div className="mb-7">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <h2 className="text-2xl font-bold text-white mb-1">Verify OTP</h2>
                  <p className="text-gray-400 text-sm">
                    Code sent to <span className="text-white font-medium">{mobile}</span>
                  </p>
                </div>

                <div className="mb-5 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-xs font-medium">
                    Development mode — Use OTP:{' '}
                    <span className="font-mono font-bold text-blue-200">123456</span>
                  </p>
                </div>

                <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">OTP Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      {...otpForm.register('code', {
                        required: 'OTP is required',
                        minLength: { value: 6, message: 'OTP must be 6 digits' },
                        maxLength: { value: 6, message: 'OTP must be 6 digits' },
                        pattern: { value: /^\d{6}$/, message: 'OTP must be 6 digits' },
                      })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-center text-2xl font-mono tracking-[0.5em] focus:border-[#ff6d29] focus:ring-1 focus:ring-[#ff6d29] outline-none transition"
                      placeholder="------"
                    />
                    {otpForm.formState.errors.code && (
                      <p className="text-red-400 text-xs mt-1.5">
                        {otpForm.formState.errors.code.message}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-3 bg-[#ff6d29] hover:bg-[#e65a1f] text-white font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Verify OTP
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendOtp({ mobile })}
                    disabled={isSending}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition disabled:opacity-40"
                  >
                    {isSending ? 'Resending...' : 'Resend OTP'}
                  </button>
                </form>
              </>
            )}

            {/* Step 3 — Register */}
            {step === 3 && (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
                  <p className="text-gray-400 text-sm">Almost there! Set up your profile.</p>
                </div>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        {...registerForm.register('name', {
                          required: 'Name is required',
                          minLength: { value: 2, message: 'Minimum 2 characters' },
                        })}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#ff6d29] focus:ring-1 focus:ring-[#ff6d29] outline-none transition"
                        placeholder="Your full name"
                      />
                    </div>
                    {registerForm.formState.errors.name && (
                      <p className="text-red-400 text-xs mt-1.5">
                        {registerForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...registerForm.register('password', {
                          required: 'Password is required',
                          minLength: { value: 6, message: 'Minimum 6 characters' },
                        })}
                        className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#ff6d29] focus:ring-1 focus:ring-[#ff6d29] outline-none transition"
                        placeholder="Create a password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-red-400 text-xs mt-1.5">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full py-3 bg-[#ff6d29] hover:bg-[#e65a1f] text-white font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRegistering ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Create Account & Sign In
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            <p className="text-center text-gray-600 text-xs mt-6">
              {step === 1
                ? 'New users will be registered automatically.'
                : 'Secure mobile OTP authentication.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
