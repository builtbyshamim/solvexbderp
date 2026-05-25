import { baseEmailTemplate } from "./base-email-template";

export function otpTemplate(otp: string) {
  return baseEmailTemplate(`
    <h3>Password Reset OTP</h3>
    <p>Use this OTP to continue:</p>

    <div style="
      font-size:28px;
      font-weight:bold;
      letter-spacing:6px;
      background:#f1f3f5;
      padding:15px;
      text-align:center;
      border-radius:6px;
      margin:20px 0;
    ">
      ${otp}
    </div>

    <p>This OTP will expire in 5 minutes.</p>
  `);
}
