import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { checkIsAdmin } from "@/lib/admin-auth";
import { getStudentDoubts, updateStudentDoubtAnswer } from "@/lib/data-service";
import { DoubtStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const isAdmin = await checkIsAdmin(user?.id, user?.email);
    
    // In production, strictly require administrator privileges
    if (!isAdmin && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Unauthorized: Administrator access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const subject = searchParams.get("subject") || undefined;
    const search = searchParams.get("search") || undefined;

    const doubts = await getStudentDoubts({
      isAdmin: true,
      status,
      subject,
      search,
    });

    return NextResponse.json({ success: true, doubts });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch student questions", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const isAdmin = await checkIsAdmin(user?.id, user?.email);

    if (!isAdmin && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Unauthorized: Administrator access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, answer, status, answered_by } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing doubt ID" }, { status: 400 });
    }

    const validStatus: DoubtStatus = status || "answered";
    const facultyName =
      answered_by ||
      user?.email ||
      "OdishaRank Academic Expert";

    const updated = await updateStudentDoubtAnswer(id, {
      answer: answer || "",
      answered_by: facultyName,
      status: validStatus,
    });

    if (!updated) {
      return NextResponse.json({ error: "Doubt not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, doubt: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update answer", details: error.message },
      { status: 500 }
    );
  }
}
