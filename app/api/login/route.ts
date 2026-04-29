import { NextResponse } from "next/server";

// Temporary user
const USER = {
  email: "test@gmail.com",
  password: "1234",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🛑 Check if body exists
    if (!body) {
      return NextResponse.json(
        { message: "No data received" },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // 🛑 Validate fields
    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing email or password" },
        { status: 400 }
      );
    }

    // ✅ Check credentials
    if (email === USER.email && password === USER.password) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  } catch (err) {
    console.error("API ERROR:", err); // 👈 IMPORTANT
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}