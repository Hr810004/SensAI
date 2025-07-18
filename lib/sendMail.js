import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail({ to, subject, text }) {
  try {
    console.log(`Attempting to send email to: ${to}`);
    console.log(`Subject: ${subject}`);
    
    const result = await resend.emails.send({
      from: 'SensAI <noreply@sens-ai-harsh810.live>',
      to,
      subject,
      text,
    });
    
    console.log(`Email sent successfully to ${to}:`, result);
    return result;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
} 