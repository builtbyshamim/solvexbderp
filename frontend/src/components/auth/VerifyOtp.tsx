import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  useForgotPasswordMutation,
  useVerifyOtpMutation,
} from "../../redux/api/authApi";

const OTP_TIMER_SECONDS = 180; // 3 minutes

interface VerifyOtpProps {
  active: { email: string };
  setActive: (val: null) => void;
  setNewPasswordData: (val: { email: string; resetToken: string }) => void;
}

interface OtpForm {
  otp: string;
}

const VerifyOtp: React.FC<VerifyOtpProps> = ({
  active,
  setActive,
  setNewPasswordData,
}) => {
  const [timeLeft, setTimeLeft] = useState(OTP_TIMER_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [forgotPassword, { isLoading: resendLoading }] =
    useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OtpForm>();

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    intervalRef.current = setInterval(
      () => setTimeLeft((prev) => prev - 1),
      1000
    );
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timeLeft]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const timerColor =
    timeLeft > 60
      ? "text-primary-500"
      : timeLeft > 30
      ? "text-yellow-400"
      : "text-red-400";

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      const result = await forgotPassword({ email: active.email }).unwrap();
      if (result.success) {
        toast.success("OTP resent to your email.");
        reset();
        setTimeLeft(OTP_TIMER_SECONDS);
      } else {
        toast.error(result.message || "Failed to resend OTP.");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Something went wrong!");
    }
  };

  // Submit OTP
  const onSubmit = async (data: OtpForm) => {
    try {
      const payload = { code: data.otp, email: active.email };
      const result = await verifyOtp(payload).unwrap();

      if (result.success) {
        toast.success("OTP verified successfully!");
        setNewPasswordData({
          email: active.email,
          resetToken: result.data?.resetToken,
        });
        setActive(null);
      } else {
        toast.error(result.message || "OTP verification failed.");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid or expired OTP.");
    }
  };

  return (
    <div className="p-2">
      {/* Email hint */}
      <p className="text-sm text-gray-600 mb-1">OTP sent to:</p>
      <p className="font-semibold text-gray-800 mb-4 break-all">
        {active.email}
      </p>

      {/* Timer */}
      <div className="flex items-center justify-center mb-5">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Time remaining
          </p>
          <span className={`text-3xl font-bold tabular-nums ${timerColor}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* OTP Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm mb-1.5 font-medium text-gray-600">
            Enter OTP Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            {...register("otp", {
              required: "OTP is required",
              minLength: { value: 4, message: "OTP is too short" },
            })}
            placeholder="••••••"
            className="w-full p-3 text-center text-xl tracking-[0.5em] font-bold border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
          {errors.otp && (
            <p className="text-red-500 text-sm mt-1">{errors.otp.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || timeLeft <= 0}
          className="w-full py-3 cursor-pointer disabled:cursor-not-allowed bg-primary-500 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 transition flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify OTP"
          )}
        </button>
      </form>

      {/* Resend OTP */}
      <div className="text-center mt-4">
        {timeLeft <= 0 ? (
          <button
            onClick={handleResendOtp}
            disabled={resendLoading}
            className="text-primary-500 font-medium text-sm hover:underline disabled:opacity-50 cursor-pointer"
          >
            {resendLoading ? "Resending..." : "Resend OTP"}
          </button>
        ) : (
          <p className="text-gray-400 text-sm">
            Didn't receive the OTP? Wait for the timer to expire.
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyOtp;
