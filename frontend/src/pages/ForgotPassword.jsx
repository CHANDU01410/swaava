
import axios from 'axios';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${serverUrl}/api/auth/send-otp`, { email }, { withCredentials: true });
      setErr("");
      setStep(2);
    } catch (error) {
      setErr(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${serverUrl}/api/auth/verify-otp`, { email, otp }, { withCredentials: true });
      setErr("");
      setStep(3);
    } catch (error) {
      setErr(error?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${serverUrl}/api/auth/reset-password`, { email, newPassword }, { withCredentials: true });
      setErr("");
      navigate("/signin");
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#f8f7f6] text-slate-900 min-h-screen flex flex-col" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      {/* Top Navigation Bar */}
      <header className="w-full flex items-center justify-between border-b border-[#f4a462]/10 bg-white/50 backdrop-blur-md px-6 md:px-10 py-4 fixed top-0 z-50">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
          <div className="text-[#f4a462]">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.1288 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z" fill="currentColor"></path>
              <path clipRule="evenodd" d="M10.4485 13.8519C10.4749 13.9271 10.6203 14.246 11.379 14.7361C12.298 15.3298 13.7492 15.9145 15.6717 16.3735C18.0007 16.9296 20.8712 17.2655 24 17.2655C27.1288 17.2655 29.9993 16.9296 32.3283 16.3735C34.2508 15.9145 35.702 15.3298 36.621 14.7361C37.3796 14.246 37.5251 13.9271 37.5515 13.8519C37.5287 13.7876 37.4333 13.5973 37.0635 13.2931C36.5266 12.8516 35.6288 12.3647 34.343 11.9175C31.79 11.0295 28.1333 10.4437 24 10.4437C19.8667 10.4437 16.2099 11.0295 13.657 11.9175C12.3712 12.3647 11.4734 12.8516 10.9365 13.2931C10.5667 13.5973 10.4713 13.7876 10.4485 13.8519ZM37.5563 18.7877C36.3176 19.3925 34.8502 19.8839 33.2571 20.2642C30.5836 20.9025 27.3973 21.2655 24 21.2655C20.6027 21.2655 17.4164 20.9025 14.7429 20.2642C13.1498 19.8839 11.6824 19.3925 10.4436 18.7877V34.1275C10.4515 34.1545 10.5427 34.4867 11.379 35.027C12.298 35.6207 13.7492 36.2054 15.6717 36.6644C18.0007 37.2205 20.8712 37.5564 24 37.5564C27.1288 37.5564 29.9993 37.2205 32.3283 36.6644C34.2508 36.2054 35.702 35.6207 36.621 35.027C37.4573 34.4867 37.5485 34.1546 37.5563 34.1275V18.7877ZM41.5563 13.8546V34.1455C41.5563 36.1078 40.158 37.5042 38.7915 38.3869C37.3498 39.3182 35.4192 40.0389 33.2571 40.5551C30.5836 41.1934 27.3973 41.5564 24 41.5564C20.6027 41.5564 17.4164 41.1934 14.7429 40.5551C12.5808 40.0389 10.6502 39.3182 9.20848 38.3869C7.84205 37.5042 6.44365 36.1078 6.44365 34.1455L6.44365 13.8546C6.44365 12.2684 7.37223 11.0454 8.39581 10.2036C9.43325 9.3505 10.8137 8.67141 12.343 8.13948C15.4203 7.06909 19.5418 6.44366 24 6.44366C28.4582 6.44366 32.5797 7.06909 35.657 8.13948C37.1863 8.67141 38.5667 9.3505 39.6042 10.2036C40.6278 11.0454 41.5563 12.2684 41.5563 13.8546Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-slate-900 text-xl font-bold tracking-tight">Swaava</h2>
        </div>
        <button
          onClick={() => navigate('/signin')}
          className="bg-[#f4a462] hover:bg-[#f4a462]/90 text-[#221810] px-6 py-2 rounded-lg font-bold transition-colors cursor-pointer"
        >
          Login
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 pt-20 pb-10">
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-xl shadow-xl shadow-[#f4a462]/5 border border-[#f4a462]/5">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#f4a462]/10 rounded-full flex items-center justify-center transition-transform hover:scale-110">
              <span className="material-symbols-outlined text-[#f4a462] text-4xl">
                {step === 1 ? 'lock_reset' : step === 2 ? 'mark_email_read' : 'passkey'}
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              {step === 1 ? 'Forgot Password?' : step === 2 ? 'Verify OTP' : 'Update Password'}
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              {step === 1 ? 'Enter your email to receive a password reset link.' :
                step === 2 ? `We've sent an OTP to ${email}` :
                  'Almost there! Set your new password below.'}
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6">
            {step === 1 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#f4a462] transition-colors">mail</span>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#f4a462]/50 focus:border-[#f4a462] transition-all outline-none"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 ml-1">One-Time Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#f4a462] transition-colors">vpn_key</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#f4a462]/50 focus:border-[#f4a462] transition-all outline-none"
                    placeholder="Enter 6-digit OTP"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 ml-1">New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#f4a462] transition-colors">lock</span>
                    </div>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-4 rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#f4a462]/50 focus:border-[#f4a462] transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#f4a462] transition-colors">verified_user</span>
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-4 rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#f4a462]/50 focus:border-[#f4a462] transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            )}

            {err && (
              <div className="flex items-center gap-2 text-red-500 text-xs px-2 py-3 bg-red-50 rounded-lg border border-red-100 italic">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              onClick={step === 1 ? handleSendOtp : step === 2 ? handleVerifyOtp : handleResetPassword}
              className="w-full bg-[#f4a462] hover:bg-[#f4a462]/90 text-[#221810] font-bold py-4 px-6 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-[#f4a462]/20 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  <span>{step === 1 ? 'Send Reset Link' : step === 2 ? 'Verify & Continue' : 'Update Password'}</span>
                  <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-10 text-center">
            <button
              onClick={() => step === 1 ? navigate('/signin') : setStep(step - 1)}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-[#f4a462] font-medium transition-colors group cursor-pointer bg-transparent border-none"
            >
              <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <span>{step === 1 ? 'Back to Login' : 'Go back'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Background Decoration */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-[#f4a462] rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-[#f4a462] rounded-full blur-[120px]"></div>
      </div>

      {/* Footer Copyright */}
      <footer className="w-full py-6 text-center text-sm text-slate-400">
        <p>© 2025 Swaava. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default ForgotPassword;