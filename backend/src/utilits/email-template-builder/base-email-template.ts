export function baseEmailTemplate(content: string) {
  return `
  <div style="font-family: Arial, sans-serif; background:#f5f6fa; padding:40px;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:8px;padding:30px;">
      
      <h2 style="color:#111;">Next Ecommerce</h2>

      ${content}

      <p style="margin-top:30px;font-size:12px;color:#888;">
        If you did not request this, please ignore this email.
      </p>

    </div>
  </div>
  `;
}
