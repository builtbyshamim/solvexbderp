export const RegisterMailTemplate = (otp: string, expiryMinutes: number = 10): string => {
    const currentYear = new Date().getFullYear();
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification OTP</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 30px;
            text-align: center;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #333333;
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            letter-spacing: 5px;
            margin: 20px 0;
        }
        .note {
            color: #777777;
            font-size: 14px;
            margin-top: 20px;
        }
        .footer {
            background-color: #f4f4f4;
            padding: 15px;
            text-align: center;
            color: #777777;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Email Verification</h2>
        </div>
        <div class="content">
            <p>Dear User,</p>
            <p>Please use the following OTP to verify your email address:</p>
            <div class="otp-code">${otp}</div>
            <p>This code is valid for <strong>${expiryMinutes} minutes</strong>.</p>
            <p>If you did not request this, please ignore this email.</p>
            <div class="note">
                <p>Note: Do not share this OTP with anyone.</p>
            </div>
        </div>
        <div class="footer">
            &copy; ${currentYear} Your Company. All rights reserved.
        </div>
    </div>
</body>
</html>
    `;
};