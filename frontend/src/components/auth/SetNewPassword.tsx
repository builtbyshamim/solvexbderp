import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { useSetNewPasswordMutation } from "../../redux/api/authApi";

interface SetNewPasswordProps {
  email: string;
  resetToken: string;
  onClose: () => void;
}

interface PasswordForm {
  new_password: string;
  new_password_confirmation: string;
}

function getStrength(password: string): {
  level: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: score, label: "Weak", color: "bg-red-500" };
  if (score === 2)
    return { level: score, label: "Fair", color: "bg-yellow-400" };
  if (score === 3)
    return { level: score, label: "Good", color: "bg-blue-500" };
  return { level: score, label: "Strong", color: "bg-green-500" };
}

const SetNewPassword: React.FC<SetNewPasswordProps> = ({
  email,
  resetToken,
  onClose,
}) => {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const [setNewPassword, { isLoading }] = useSetNewPasswordMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordForm>();

  const passwordValue = watch("new_password", "");
  const strength = getStrength(passwordValue);

  const onSubmit = async (data: PasswordForm) => {
    try {
      const payload = {
        resetToken: String(resetToken),
        newPassword: data.new_password,
      };
      const result = await setNewPassword(payload).unwrap();

      if (result.success) {
        toast.success("Password updated successfully!");
        onClose();
        navigate("/login");
      } else {
        toast.error(result.message || "Failed to update password.");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div className="p-2">
      <p className="text-sm text-gray-500 mb-5">
        Setting new password for{" "}
        <span className="font-semibold text-gray-700">{email}</span>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password */}
        <div>
          <label className="block text-sm mb-1.5 font-medium text-gray-600">
            New Password
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type={showNew ? "text" : "password"}
              {...register("new_password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Minimum 6 characters required",
                },
              })}
              placeholder="Enter new password"
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-1 transition ${
                errors.new_password
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              }`}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              onClick={() => setShowNew(!showNew)}
              tabIndex={-1}
            >
              {showNew ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.new_password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.new_password.message}
            </p>
          )}

          {/* Password strength meter */}
          {passwordValue && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i <= strength.level ? strength.color : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Strength:{" "}
                <span
                  className={`font-semibold ${
                    strength.level <= 1
                      ? "text-red-500"
                      : strength.level === 2
                      ? "text-yellow-500"
                      : strength.level === 3
                      ? "text-blue-500"
                      : "text-green-500"
                  }`}
                >
                  {strength.label}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm mb-1.5 font-medium text-gray-600">
            Confirm Password
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type={showConfirm ? "text" : "password"}
              {...register("new_password_confirmation", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === passwordValue || "Passwords do not match",
              })}
              placeholder="Confirm new password"
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-1 transition ${
                errors.new_password_confirmation
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              }`}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
            >
              {showConfirm ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.new_password_confirmation && (
            <p className="text-red-500 text-sm mt-1">
              {errors.new_password_confirmation.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 mt-2 cursor-pointer disabled:cursor-not-allowed bg-primary-500 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 transition flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            "Set New Password"
          )}
        </button>
      </form>
    </div>
  );
};

export default SetNewPassword;
