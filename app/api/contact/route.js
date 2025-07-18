import { NextResponse } from "next/server";
import { sendMail } from "@/lib/sendMail";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, subject, inquiryType, industry, contactMethod, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !inquiryType || !industry || !contactMethod || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Send email to owner (you)
    await sendMail({
      to: "hr810004@gmail.com",
      subject: `New Contact Form Submission: ${subject}`,
      text: `
New contact form submission from SensAI:

Name: ${name}
Email: ${email}
Subject: ${subject}
Inquiry Type: ${inquiryType}
Industry: ${industry}
Preferred Contact Method: ${contactMethod}

Message:
${message}

---
Sent from SensAI Contact Form
      `,
    });

    // Send confirmation email to user
    await sendMail({
      to: email,
      subject: "Thank you for contacting SensAI",
      text: `
Hi ${name},

Thank you for reaching out to SensAI! We've received your message and will get back to you soon.

Your message:
"${message}"

We'll respond within 24-48 hours.

Best regards,
The SensAI Team

---
This is an automated response. Please don't reply to this email.
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
} 