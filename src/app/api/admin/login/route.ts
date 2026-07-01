import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "vivasaya@2024";
const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "admin_secret_key_vivasaya"
);

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (
      username?.trim() !== ADMIN_USERNAME ||
      password !== ADMIN_PASSWORD
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Create a signed JWT valid for 24 hours
    const token = await new SignJWT({ role: "admin", username })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(SECRET);

    // Determine if connection is HTTPS (either directly or via reverse proxy)
    const isHttps = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";

    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return res;
}
