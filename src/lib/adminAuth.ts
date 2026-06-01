import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "admin_secret_key_vivasaya"
);

export async function verifyAdminToken(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return false;

    const { payload } = await jwtVerify(token, SECRET);
    return payload?.role === "admin";
  } catch {
    return false;
  }
}
