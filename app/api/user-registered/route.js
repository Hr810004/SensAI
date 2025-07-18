import { NextResponse } from "next/server";
import { sendMail } from "@/lib/sendMail";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));
    
    const userEmail = body.data?.email_addresses?.[0]?.email_address;
    const userName = body.data?.first_name || "User";
    
    console.log("Extracted user email:", userEmail);
    console.log("Extracted user name:", userName);

    if (!userEmail) {
      console.error("No user email found in webhook data");
      return NextResponse.json({ error: "No user email found" }, { status: 400 });
    }

    // Send welcome email to user
    console.log("Sending welcome email to:", userEmail);
    await sendMail({
      to: userEmail,
      subject: "Welcome to SensAI!",
      text: `Hi ${userName},\n\nThanks for registering at SensAI!`,
    });
    console.log("Welcome email sent successfully");

    // Send notification to owner
    console.log("Sending notification to owner");
    await sendMail({
      to: "hr810004@gmail.com",
      subject: "New User Registered",
      text: `User ${userName} (${userEmail}) just registered.`,
    });
    console.log("Owner notification sent successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 