import { NextResponse } from "next/server";
import { createResume, listResumes } from "@/actions/resume";

export async function GET(req) {
  try {
    const resumes = await listResumes();
    return NextResponse.json(resumes);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const resume = await createResume(data);
    return NextResponse.json(resume);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 