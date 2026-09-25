import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';
import axios from 'axios';
import { serverUrl } from '../App';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';

export default function AuthPage({ initialTab = 'login' }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState(initialTab);

  // Sign In fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErr, setLoginErr] = useState('');

  // Sign Up fields
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [role, setRole] = useState('Customer');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupErr, setSignupErr] = useState('');

  // Google Role Modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState(null);
  const [googleRoleLoading, setGoogleRoleLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoginErr('');
    if (!loginEmail || !loginPassword) {
      return setLoginErr('Please provide both email and password.');
    }
    setLoginLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signin`,
        { email: loginEmail, password: loginPassword },
        { withCredentials: true }
      );
      dispatch(setUserData(result.data));
      navigate('/');
    } catch (error) {
      setLoginErr(error?.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignupErr('');
    if (!fullName || !signupEmail || !signupPassword) {
      return setSignupErr('Please fill in all required fields.');
    }
    setSignupLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        { fullName, email: signupEmail, password: signupPassword, role },
        { withCredentials: true }
      );
      dispatch(setUserData(result.data));
      navigate('/');
    } catch (error) {
      setSignupErr(error?.response?.data?.message || 'Registration failed.');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoginErr('');
    setSignupErr('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { data } = await axios.post(
        `${serverUrl}/api/auth/google-auth`,
        { fullName: result.user.displayName, email: result.user.email },
        { withCredentials: true }
      );
      if (data.isNewUser) {
        setGoogleUserData(data);
        setShowRoleModal(true);
      } else {
        dispatch(setUserData(data));
        navigate('/');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setLoginErr(error?.response?.data?.message || error?.message || 'Google authentication failed.');
    }
  };

  const handleConfirmGoogleRole = async (chosenRole) => {
    setGoogleRoleLoading(true);
    try {
      const res = await axios.post(
        `${serverUrl}/api/auth/set-role`,
        { userId: googleUserData._id, role: chosenRole },
        { withCredentials: true }
      );
      dispatch(setUserData({ ...googleUserData, role: chosenRole }));
      setShowRoleModal(false);
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setGoogleRoleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 cursor-pointer group mb-2"
        >
          <img src="/swaava-logo.svg" alt="Swaava" className="w-9 h-9 rounded-xl shadow-xs" />
          <span className="text-3xl font-black tracking-tight text-stone-900">
            Swaava<span className="text-[#D9532F]">.</span>
          </span>
        </div>
        <p className="text-xs text-stone-500 font-medium">
          Authentic Regional Food Marketplace
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden p-6 sm:p-8">
        {/* Tab Toggle */}
        <div className="flex bg-stone-100 p-1 rounded-2xl mb-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-stone-950 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-white text-stone-950 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Tab 1: SIGN IN */}
        {activeTab === 'login' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            {loginErr && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {loginErr}
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-[11px] font-semibold text-[#D9532F] hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                >
                  <span className="material-symbols-outlined text-base">
                    {showLoginPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loginLoading ? (
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              ) : (
                <span>Sign In to Swaava</span>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: SIGN UP */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            {signupErr && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {signupErr}
              </div>
            )}

            {/* Role Selector */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1.5">
                Join Swaava as
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('Customer')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    role === 'Customer'
                      ? 'border-[#D9532F] bg-[#FDF2ED] text-[#D9532F] font-bold'
                      : 'border-stone-200 bg-stone-50 text-stone-600'
                  }`}
                >
                  <span className="text-xs">Food Lover (Diner)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('HomeCook')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    role === 'HomeCook'
                      ? 'border-[#D9532F] bg-[#FDF2ED] text-[#D9532F] font-bold'
                      : 'border-stone-200 bg-stone-50 text-stone-600'
                  }`}
                >
                  <span className="text-xs">Home Chef (Host)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Chef or Diner Full Name"
                className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F] transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F] transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                >
                  <span className="material-symbols-outlined text-base">
                    {showSignupPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={signupLoading}
              className="w-full py-3.5 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {signupLoading ? (
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              ) : (
                <span>Register as {role === 'HomeCook' ? 'Home Chef' : 'Diner'}</span>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-stone-400 font-medium">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          className="w-full py-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>

      {/* Google New User Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-stone-900">Select Your Role</h3>
            <p className="text-xs text-stone-500">
              Welcome to Swaava! How would you like to use the marketplace?
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleConfirmGoogleRole('Customer')}
                disabled={googleRoleLoading}
                className="p-4 rounded-2xl border-2 border-stone-200 hover:border-[#D9532F] text-center font-bold text-xs hover:bg-[#FDF2ED] transition-all cursor-pointer"
              >
                Food Lover (Diner)
              </button>
              <button
                onClick={() => handleConfirmGoogleRole('HomeCook')}
                disabled={googleRoleLoading}
                className="p-4 rounded-2xl border-2 border-stone-200 hover:border-[#D9532F] text-center font-bold text-xs hover:bg-[#FDF2ED] transition-all cursor-pointer"
              >
                Home Chef (Cook)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}