import { NextResponse } from "next/server";
import { getResumeById, updateResume, deleteResume } from "@/actions/resume";

export async function GET(req, { params }) {
  try {
    const resume = await getResumeById(params.id);
    return NextResponse.json(resume);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const data = await req.json();
    const resume = await updateResume(params.id, data);
    return NextResponse.json(resume);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await deleteResume(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 