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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/register-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setTimer(60);
        let successInfo = "Verification code sent to your email!";
        if (data.otp) {
          successInfo += ` (Code: ${data.otp})`;
        }
        setSuccessMsg(successInfo);
      } else {
        setError(data.error || "Unable to register. Please try again");
      }
    } catch {
      setError("Unable to register. Please try again");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSendForgotOtp = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    setError("");
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setTimer(300); // 5 minutes expiry for password reset
        let successInfo = "Verification code sent to your email!";
        if (data.otp) {
          successInfo += ` (Code: ${data.otp})`;
        }
        setSuccessMsg(successInfo);
      } else {
        setError(data.error || "Failed to send reset code");
      }
    } catch {
      setError("Failed to connect to reset service");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (isForgotPassword) {
      if (!otpSent) {
        await handleSendForgotOtp();
        return;
      }

      if (!otp) {
        setError("Please enter the verification code");
        return;
      }

      if (!password || password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/auth/forgot-password/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otp.trim(), password, confirmPassword }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg(data.message || "Password reset successfully!");
          setIsForgotPassword(false);
          setIsLogin(true);
          setOtpSent(false);
          setOtp("");
          setPassword("");
          setConfirmPassword("");
        } else {
          setError(data.error || "Failed to reset password");
        }
      } catch {
        setError("Connection error. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!isLogin && !otpSent) {
      await handleSendRegisterOtp();
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Direct Credentials Login
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
        // Registration verification and auto-login
        if (!otp) {
          setError("Please enter the verification code");
          setLoading(false);
          return;
        }

        const verifyRes = await fetch("/api/auth/register-email/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otp.trim() }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyRes.ok) {
          setError(verifyData.error || "Verification failed");
          setLoading(false);
        } else {
          // Auto login after verification success
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
              setOtpSent(false);
              setOtp("");
              setError(`Verification succeeded, but auto-login failed: ${loginRes.error}. Please sign in manually.`);
              setLoading(false);
            }
          } catch {
            setIsLogin(true);
            setOtpSent(false);
            setOtp("");
            setLoading(false);
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
      <main className="pt-[calc(var(--navbar-height)+1.25rem)] pb-24 bg-[#FAF9F5] min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-cream-dark p-8 m-4">
          
          <div className="flex flex-col items-center mb-6">
            <div className="flex justify-center mb-4">
              <Logo className="w-[130px] h-auto object-contain" />
            </div>
            <h1 className="font-heading font-bold text-2xl text-text-dark">
              {isForgotPassword 
                ? "Reset Password" 
                : isLogin 
                  ? "Welcome Back" 
                  : "Create Account"
              }
            </h1>
            <p className="text-text-muted text-sm font-body mt-1 text-center">
              {isForgotPassword
                ? "Enter your email to receive a password reset code"
                : isLogin 
                  ? "Sign in to access your orders" 
                  : "Join Vivasaya Ulagam for premium organic foods"
              }
            </p>
          </div>

          {!isForgotPassword && (
            <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
              <button 
                type="button"
                onClick={() => { setIsLogin(true); setError(""); setSuccessMsg(""); setOtpSent(false); setOtp(""); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors border-0 cursor-pointer ${isLogin ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black bg-transparent'}`}
              >
                Login
              </button>
              <button 
                type="button"
                onClick={() => { setIsLogin(false); setError(""); setSuccessMsg(""); setOtpSent(false); setOtp(""); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors border-0 cursor-pointer ${!isLogin ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black bg-transparent'}`}
              >
                Register
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
            {isForgotPassword ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-dark">Email Address *</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={otpSent}
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary disabled:bg-gray-50" 
                  />
                </div>

                {otpSent && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-text-dark">Reset OTP Code *</label>
                        {timer > 0 ? (
                          <span className="text-xs text-gray-500">Expires in {timer}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendForgotOtp}
                            className="text-xs text-[#34a121] hover:underline bg-transparent border-0 cursor-pointer"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                      <input 
                        type="text" 
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit code"
                        required
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-center font-bold tracking-widest outline-none focus:border-primary" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-dark">New Password *</label>
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1 flex items-center justify-center"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-dark">Confirm New Password *</label>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full border border-gray-200 rounded-lg pl-3.5 pr-10 py-2.5 text-sm outline-none focus:border-primary" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1 flex items-center justify-center"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <button 
                  type="submit"
                  disabled={loading || isSendingOtp}
                  className="w-full bg-[#34a121] hover:bg-[#28801a] text-white py-3 rounded-lg font-bold tracking-wider text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-0 mt-2 flex items-center justify-center gap-2"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : otpSent ? (
                    loading ? "Resetting Password..." : "Reset Password"
                  ) : (
                    "Send Reset OTP"
                  )}
                </button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setIsLogin(true);
                      setError("");
                      setSuccessMsg("");
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className="text-xs font-semibold text-primary hover:underline bg-transparent border-0 cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            ) : (
              <>
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-dark">Full Name *</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                      disabled={otpSent}
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary disabled:bg-gray-50" 
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
                    disabled={!isLogin && otpSent}
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-primary disabled:bg-gray-50" 
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-text-dark">Password *</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError("");
                          setSuccessMsg("");
                          setOtpSent(false);
                          setOtp("");
                        }}
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
                      disabled={!isLogin && otpSent}
                      className="w-full border border-gray-200 rounded-lg pl-3.5 pr-10 py-2.5 text-sm outline-none focus:border-primary disabled:bg-gray-50" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1 flex items-center justify-center"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-dark">Confirm Password *</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={otpSent}
                        className="w-full border border-gray-200 rounded-lg pl-3.5 pr-10 py-2.5 text-sm outline-none focus:border-primary disabled:bg-gray-50" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1 flex items-center justify-center"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {!isLogin && otpSent && (
                  <div className="space-y-1.5 mt-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-text-dark">Verification Code *</label>
                      {timer > 0 ? (
                        <span className="text-xs font-semibold text-gray-500">
                          OTP expires in {timer}s
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
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-center font-bold tracking-widest outline-none focus:border-primary" 
                    />
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading || isSendingOtp}
                  className={`w-full py-3 rounded-lg font-bold tracking-wider text-sm transition-colors shadow-sm mt-6 disabled:opacity-50 cursor-pointer border-0 flex items-center justify-center gap-2 ${(!isLogin && !otpSent) ? 'bg-[#34a121] hover:bg-[#28801a] text-white' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : isLogin ? (
                    loading ? "Logging in..." : "Login"
                  ) : (
                    otpSent ? (
                      timer > 0 ? (
                        loading ? "Verifying..." : "Verify OTP & Create Account"
                      ) : (
                        "Resend OTP"
                      )
                    ) : (
                      "Send OTP"
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
