import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET || "";
const googleAuthConfigured =
  googleClientId.trim().length > 0 &&
  googleClientSecret.trim().length > 0 &&
  !/dummy|placeholder|your_/i.test(googleClientId) &&
  !/dummy|placeholder|your_/i.test(googleClientSecret);

const authProviders: NextAuthOptions["providers"] = [
  // Standard Credentials Provider (Email & Password)
  CredentialsProvider({
    id: "credentials",
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Please provide email and password");
      }

      await dbConnect();
      
      const normalizedEmail = credentials.email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail }).select("+password +passwordHash");

      if (!user) {
        throw new Error("No account found with this email");
      }

      const hash = user.passwordHash || user.password;
      if (!hash) {
        throw new Error("Invalid login method. Try Google login.");
      }

      const isVerified = user.isEmailVerified !== undefined ? user.isEmailVerified : user.emailVerified;
      if (isVerified === false) {
        throw new Error("Please verify your email before login");
      }

      const isPasswordMatch = await bcrypt.compare(credentials.password, hash);

      if (!isPasswordMatch) {
        throw new Error("Incorrect password");
      }

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      };
    }
  }),

  // Custom Email OTP Credentials Provider
  CredentialsProvider({
    id: "otp",
    name: "OTP",
    credentials: {
      email: { label: "Email", type: "email" },
      otp: { label: "OTP", type: "text" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.otp) {
        throw new Error("Please provide email and OTP code");
      }

      await dbConnect();

      // 1. Find OTP document
      const otpRecord = await Otp.findOne({ email: credentials.email.toLowerCase() });
      if (!otpRecord) {
        throw new Error("Verification code has expired or is invalid");
      }

      // 2. Check code
      if (otpRecord.otp !== credentials.otp.trim()) {
        throw new Error("Invalid verification code");
      }

      // 3. Delete OTP record as it is consumed
      await Otp.deleteOne({ _id: otpRecord._id });

      // 4. Find or create user
      let user = await User.findOne({ email: credentials.email.toLowerCase() });
      if (!user) {
        const defaultName = credentials.email.split("@")[0] || "User";
        const isPhoneEmail = credentials.email.toLowerCase().endsWith("@vivasayaulagam.com") && /^\d+$/.test(defaultName);
        user = await User.create({
          name: isPhoneEmail ? `User ${defaultName}` : defaultName,
          email: credentials.email.toLowerCase(),
          role: "user",
          emailVerified: true,
          phone: isPhoneEmail ? defaultName : "",
        });
      } else if (user.emailVerified === false) {
        user.emailVerified = true;
        await user.save();
      }

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      };
    }
  }),
];

if (googleAuthConfigured) {
  authProviders.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers: authProviders,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await dbConnect();
        try {
          const email = user.email?.toLowerCase();
          if (!email) return false;

          let dbUser = await User.findOne({ email });
          if (!dbUser) {
            dbUser = await User.create({
              name: user.name || "Google User",
              email: email,
              role: "user"
            });
          }
          // Attach DB id and role to the next-auth user object so JWT callback can capture it
          user.id = dbUser._id.toString();
          (user as { role?: string }).role = dbUser.role;
        } catch (err) {
          console.error("Google sign in DB integration error:", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: unknown; role?: unknown }).id = token.id;
        (session.user as { id?: unknown; role?: unknown }).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
