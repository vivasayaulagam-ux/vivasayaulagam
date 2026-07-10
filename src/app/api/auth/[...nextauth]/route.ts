import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const authHandler = async (req: NextRequest, ctx: any) => {
  const host = req.headers.get("host") || "localhost:3001";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  process.env.NEXTAUTH_URL = `${protocol}://${host}`;

  // Await ctx.params for Next.js 15+ compatibility (next-auth v4 expects synchronous params)
  const params = await ctx.params;

  return NextAuth(authOptions)(req, { ...ctx, params });
};

export async function GET(req: NextRequest, ctx: any) {
  return authHandler(req, ctx);
}

export async function POST(req: NextRequest, ctx: any) {
  return authHandler(req, ctx);
}
