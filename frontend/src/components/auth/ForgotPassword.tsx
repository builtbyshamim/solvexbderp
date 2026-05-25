import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiMail, FiShield } from "react-icons/fi";
import { useForgotPasswordMutation } from "../../redux/api/authApi";
import CommonModal from "../ui/modal/CommonModal";
import VerifyOtp from "./VerifyOtp";
import SetNewPassword from "./SetNewPassword";

interface ForgotForm {
  email: string;
}

const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>();

  const [activeVerifyOtpModal, setActiveVerifyOtpModal] = useState<{
    email: string;
  } | null>(null);
  const [newPasswordData, setNewPasswordData] = useState<{
    email: string;
    resetToken: string;
  } | null>(null);

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const onSubmit = async (data: ForgotForm) => {
    try {
      const result = await forgotPassword(data).unwrap();
      if (result.success) {
        toast.success("OTP sent to your email address.");
        setActiveVerifyOtpModal({ email: data.email });
      } else {
        toast.error(result.message || "Request failed. Please try again.");
      }
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Something went wrong!"
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <FiShield className="text-white text-xl" />
          </div>
          <span className="text-white text-xl font-bold">StockAdmin</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">
              Reset Password
            </h2>
            <p className="text-gray-400 text-sm">
              Enter your admin email to receive a one-time password.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm mb-2 font-medium text-gray-300">
                Admin Email
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
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition"
                  placeholder="admin@gmail.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-500/90 text-white font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>

          <div className="mt-6 flex justify-center">
            <Link
              to="/login"
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition"
            >
              <FiArrowLeft />
              Back to Login
            </Link>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <CommonModal
        isOpen={!!activeVerifyOtpModal}
        onClose={() => setActiveVerifyOtpModal(null)}
        title="Verify OTP"
      >
        {activeVerifyOtpModal && (
          <VerifyOtp
            active={activeVerifyOtpModal}
            setActive={setActiveVerifyOtpModal}
            setNewPasswordData={setNewPasswordData}
          />
        )}
      </CommonModal>

      {/* Set New Password Modal */}
      <CommonModal
        isOpen={!!newPasswordData}
        onClose={() => setNewPasswordData(null)}
        title="Set New Password"
      >
        {newPasswordData && (
          <SetNewPassword
            email={newPasswordData.email}
            resetToken={newPasswordData.resetToken}
            onClose={() => setNewPasswordData(null)}
          />
        )}
      </CommonModal>
    </div>
  );
};

export default ForgotPassword;
