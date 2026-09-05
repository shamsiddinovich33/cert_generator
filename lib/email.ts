import nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendMailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || 'CertGen <noreply@certgen.uz>';

    if (host && user && pass) {
      const cleanPass = pass.replace(/\s+/g, '');
      const isGmail = host.toLowerCase().includes('gmail');
      const transporter = nodemailer.createTransport(
        isGmail
          ? {
              service: 'gmail',
              auth: { user, pass: cleanPass },
            }
          : {
              host,
              port,
              secure: port === 465,
              auth: { user, pass: cleanPass },
            }
      );

      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      console.log(`[EMAIL SENT] To: ${to}, Subject: ${subject}`);
      return { success: true };
    }

    // SMTP credentials not set
    console.log(`\n==================================================`);
    console.log(`📧 [EMAIL LOG - .env da SMTP sozlanmagan]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Kod: ${text}`);
    console.log(`==================================================\n`);

    return {
      success: false,
      error: "Haqiqiy emailga xat borishi uchun .env faylida SMTP (masalan, Gmail) sozlanishi kerak.",
    };
  } catch (error: any) {
    console.error('[EMAIL ERROR]', error);
    return { success: false, error: error.message || 'Pochta serveriga ulanishda xatolik yuz berdi' };
  }
}

export async function sendPasswordResetEmail(email: string, code: string) {
  const subject = 'Parolni tiklash kodi — CertGen';
  const text = `Salom!\n\nSizning CertGen platformasidagi parolni tiklash kodingiz: ${code}\n\nUshbu kod 15 daqiqa davomida amal qiladi. Agar siz parolni tiklashni so'ramagan bo'lsangiz, ushbu xabarga e'tibor bermang.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366f1; font-size: 24px; margin: 0;">CertGen</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Sertifikatlar platformasi</p>
      </div>
      <div style="background: #1e293b; padding: 24px; border-radius: 12px; text-align: center;">
        <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 16px;">Parolni qayta o'rnatish uchun quyidagi tasdiqlash kodini kiriting:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #38bdf8; background: #0f172a; padding: 12px 24px; border-radius: 8px; display: inline-block; margin-bottom: 16px; font-family: monospace;">
          ${code}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">Ushbu kod <strong>15 daqiqa</strong> davomida amal qiladi.</p>
      </div>
      <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 24px;">
        Agar siz parolni tiklashni so'ramagan bo'lsangiz, ushbu xabarni shunchaki e'tiborsiz qoldiring.
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject, html, text });
}
