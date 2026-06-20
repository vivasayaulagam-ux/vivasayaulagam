"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Logo from "@/components/ui/Logo";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("otp"); // Default to OTP for modern passwordless entry
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(0);
  const [callbackUrl, setCallbackUrl] = useState("/");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cb = params.get("callbackUrl") || params.get("redirect") || "/";
      setCallbackUrl(cb);
    }
  }, []);

  useEffect(() => {
    if (!otpSent || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, otpSent]);

  const handleSendOtp = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    setError("");
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setSuccessMsg("Verification code sent to your email!");
      } else {
        setError(data.error || "Failed to send verification code");
      }
    } catch {
      setError("Failed to connect to verification service");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSendRegisterOtp = async () => {
    if (!name || !name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!email) {
      setError("Please enter a valid email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-register-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setTimer(60);
        setSuccessMsg("OTP sent successfully. Please verify within 1 minute");
      } else {
        setError(data.error || "Unable to send OTP. Please try again");
      }
    } catch {
      setError("Unable to send OTP. Please try again");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!isLogin && (!otpSent || timer === 0)) {
      await handleSendRegisterOtp();
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        if (authMethod === "password") {
          // Standard Credentials password flow
          const res = await signIn("credentials", {
            redirect: false,
            email,
            password,
          });

          if (res?.error) {
            setError(res.error);
            setLoading(false);
          } else {
            router.push(callbackUrl);
            router.refresh();
          }
        } else {
          // OTP flow verify & login
          if (!otp) {
            setError("Please enter the verification code");
            setLoading(false);
            return;
          }
          const res = await signIn("otp", {
            redirect: false,
            email,
            otp: otp.trim(),
          });

          if (res?.error) {
            setError(res.error);
            setLoading(false);
          } else {
            router.push(callbackUrl);
            router.refresh();
          }
        }
      } else {
        // Register flow verify OTP & create account
        if (!otp) {
          setError("Please enter the verification code");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, otp: otp.trim() }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Registration failed");
          setLoading(false);
        } else {
          setSuccessMsg("Account created successfully!");
          // Auto login after register
          try {
            const loginRes = await signIn("credentials", {
              redirect: false,
              email,
              password,
            });

            if (!loginRes?.error) {
              router.push(callbackUrl);
              router.refresh();
            } else {
              setIsLogin(true);
              setAuthMethod("password");
              setError(""); // Clear error since registration succeeded
            }
          } catch {
            setIsLogin(true);
            setAuthMethod("password");
          }
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };



  return (
    <>
      <Navbar />
      <main className="pt-[calc(var(--navbar-height)+1.25rem)] pb-24 bg-cream min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-cream-dark p-8 m-4">
          
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-0.5 mb-3">
              <Logo className="h-12" textClassName="text-xl" />
            </div>
            <h1 className="font-heading font-bold text-2xl text-text-dark">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-text-muted text-sm font-body mt-1 text-center">
              {isLogin 
                ? "Sign in to access your orders" 
                : "Join Vivasaya Ulagam for premium organic foods"
              }
            </p>
          </div>

          {/* Toggle Login/Register */}
          <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => { setIsLogin(true); setError(""); setSuccessMsg(""); setOtpSent(false); setOtp(""); }}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors border-0 cursor-pointer ${isLogin ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black bg-transparent'}`}
            >
              Login
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(""); setSuccessMsg(""); setOtpSent(false); setOtp(""); }}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors border-0 cursor-pointer ${!isLogin ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black bg-transparent'}`}
            >
              Register
            </button>
          </div>

          {isLogin && (
            <div className="flex justify-center gap-4 mb-6 border-b border-gray-100 pb-4">
              <button
                type="button"
                onClick={() => { setAuthMethod("otp"); setError(""); setSuccessMsg(""); }}
                className={`text-xs font-bold pb-2 border-b-2 transition-colors cursor-pointer bg-transparent border-0 ${authMethod === "otp" ? "border-[#34a121] text-[#34a121]" : "border-transparent text-gray-500"}`}
              >
                OTP Verification Code
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod("password"); setError(""); setSuccessMsg(""); }}
                className={`text-xs font-bold pb-2 border-b-2 transition-colors cursor-pointer bg-transparent border-0 ${authMethod === "password" ? "border-[#34a121] text-[#34a121]" : "border-transparent text-gray-500"}`}
              >
                Password Login
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md font-body">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md font-body">
              {successMsg}
            </div>
          )}

          <form className="space-y-4 font-body" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-dark">Full Name *</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary" 
                />
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-dark">Email Address *</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary" 
              />
            </div>

            {isLogin && authMethod === "otp" ? (
              <div className="space-y-3">
                {otpSent && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-dark">Verification Code *</label>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-center font-bold tracking-widest outline-none focus:border-primary" 
                    />
                  </div>
                )}
                
                {!otpSent ? (
                  <button 
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="w-full bg-[#34a121] hover:bg-[#28801a] text-white py-3 rounded-lg font-bold tracking-wider text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-0 mt-2 flex items-center justify-center gap-2"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-black text-white py-3 rounded-lg font-bold tracking-wider text-sm hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-0"
                    >
                      {loading ? "VERIFYING..." : "VERIFY & LOGIN"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || loading}
                      className="text-xs font-semibold text-[#34a121] hover:underline bg-transparent border-0 cursor-pointer mt-1 flex items-center justify-center gap-1 mx-auto"
                    >
                      {isSendingOtp && <Loader2 className="h-3 w-3 animate-spin" />}
                      <span>{isSendingOtp ? "Sending..." : "Resend Code"}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-text-dark">Password *</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setError("Password reset is not available yet. Please use OTP login or contact support.")}
                        className="text-xs font-semibold text-primary hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-lg pl-3.5 pr-10 py-2.5 text-sm outline-none focus:border-primary" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1 focus:outline-none flex items-center justify-center"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {!isLogin && otpSent && (
                  <div className="space-y-1.5 mt-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-text-dark">Verification Code *</label>
                      {timer > 0 ? (
                        <span className="text-xs font-semibold text-gray-500">
                          OTP expires in 00:${timer < 10 ? '0' : ''}${timer}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-red-600">
                          OTP expired. Please request a new OTP
                        </span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      required
                      disabled={timer === 0}
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-center font-bold tracking-widest outline-none focus:border-primary disabled:bg-gray-50 disabled:cursor-not-allowed" 
                    />
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading || isSendingOtp}
                  className={`w-full py-3 rounded-lg font-bold tracking-wider text-sm transition-colors shadow-sm mt-6 disabled:opacity-50 cursor-pointer border-0 ${(!isLogin && !otpSent) ? 'bg-[#34a121] hover:bg-[#28801a] text-white' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  {isLogin ? (
                    loading ? "Logging in..." : "Login"
                  ) : (
                    otpSent ? (
                      timer > 0 ? (
                        loading ? "Verifying..." : "Verify OTP & Create Account"
                      ) : (
                        isSendingOtp ? "Resending OTP..." : "Resend OTP"
                      )
                    ) : (
                      isSendingOtp ? "Sending OTP..." : "Send OTP"
                    )
                  )}
                </button>
              </>
            )}
          </form>



        </div>
      </main>
      <Footer />
    </>
  );
}
