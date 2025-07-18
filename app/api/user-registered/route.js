import { NextResponse } from "next/server";
import { sendMail } from "@/lib/sendMail";

export async function POST(req) {
  const body = await req.json();
  const userEmail = body.data?.email_addresses?.[0]?.email_address;
  const userName = body.data?.first_name || "User";

  // Send welcome email to user
  await sendMail({
    to: userEmail,
    subject: "Welcome to SensAI!",
    text: `Hi ${userName},\n\nThanks for registering at SensAI!`,
  });

  // Send notification to owner
  await sendMail({
    to: "hr810004@gmail.com",
    subject: "New User Registered",
    text: `User ${userName} (${userEmail}) just registered.`,
  });

  return NextResponse.json({ success: true });
} 