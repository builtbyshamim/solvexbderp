import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock, FiMail, FiShield } from "react-icons/fi";
import { useAdminLoginMutation } from "../../redux/api/authApi";

interface LoginForm {
  email: string;
  password: string;
}

const MAX_ATTEMPTS = 5;

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const navigate = useNavigate();
  const [adminLogin, { isLoading }] = useAdminLoginMutation();

  const isBlocked = failedAttempts >= MAX_ATTEMPTS;

  const onSubmit = async (data: LoginForm) => {
    if (isBlocked) {
      toast.error("Too many failed attempts. Please refresh the page.");
      return;
    }

    try {
      const result = await adminLogin(data).unwrap();

      if (result?.success) {
        // Verify the logged-in user is an admin
        const role =
          result?.data?.role ||
          result?.data?.user?.role ||
          result?.user?.role;

        if (role && role !== "admin") {
          toast.error("Access denied. Admin accounts only.");
          setFailedAttempts((prev) => prev + 1);
          return;
        }

        toast.success("Welcome back, Admin!");
        navigate("/admin");
      } else {
        setFailedAttempts((prev) => prev + 1);
        toast.error(result?.message || "Login failed. Please try again.");
      }
    } catch (err: any) {
      setFailedAttempts((prev) => prev + 1);
      const msg =
        err?.data?.message || err?.message || "Invalid credentials.";
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-primary-500/20 to-transparent border-r border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <FiShield className="text-white text-xl" />
          </div>
          <span className="text-white text-xl font-bold tracking-wide">
            StockAdmin
          </span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Secure Admin
            <br />
            <span className="text-primary-500">Control Panel</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm">
            Manage your stock and trading platform with complete oversight.
            Restricted to authorized administrators only.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "Role-based access control",
              "Secure session management",
              "Real-time market oversight",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-gray-400 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} StockAdmin. All rights reserved.
        </p>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <FiShield className="text-white text-xl" />
            </div>
            <span className="text-white text-xl font-bold">StockAdmin</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">
                Admin Sign In
              </h2>
              <p className="text-gray-400 text-sm">
                Access restricted to admin accounts only
              </p>
            </div>

            {/* Failed attempts warning */}
            {failedAttempts > 0 && !isBlocked && (
              <div className="mb-5 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  {MAX_ATTEMPTS - failedAttempts} attempt
                  {MAX_ATTEMPTS - failedAttempts !== 1 ? "s" : ""} remaining
                  before lockout.
                </p>
              </div>
            )}

            {isBlocked && (
              <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm font-medium">
                  Account temporarily locked. Please refresh and try again or
                  contact support.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm mb-2 font-medium text-gray-300">
                  Admin Email (Gmail)
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                  <input
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address",
                      },
                    })}
                    disabled={isBlocked}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition disabled:opacity-40 disabled:cursor-not-allowed"
                    placeholder="admin@gmail.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm mb-2 font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    disabled={isBlocked}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition disabled:opacity-40 disabled:cursor-not-allowed"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}

                <div className="flex justify-end mt-2">
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm text-primary-500 hover:text-primary-400 hover:underline transition"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || isBlocked}
                className="w-full py-3 mt-2 bg-primary-500 hover:bg-primary-500/90 text-white font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <FiShield className="text-base" />
                    Sign In as Admin
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-gray-600 text-xs mt-6">
              Unauthorized access is prohibited and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
