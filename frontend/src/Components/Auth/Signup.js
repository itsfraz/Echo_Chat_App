import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../UI/Icon';
import echoLogo from '../../assets/echo_logo.png';
import { Helmet } from 'react-helmet-async';

function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters long, contain 1 uppercase, 1 lowercase, 1 number, and 1 special character."
      );
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("name", name);
    formData.append("email", email);
    formData.append("profilePicture", profilePicture);

    try {
      const response = await axios.post(
        `${API_URL}/signup`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.userId);

      setSuccess("Account created successfully!");
      setUsername("");
      setPassword("");
      setName("");
      setEmail("");
      setProfilePicture(null);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4 relative overflow-hidden font-sans">
      <Helmet>
        <title>Sign Up - Echo</title>
        <meta name="description" content="Create an Echo account" />
      </Helmet>
      
      {/* Decorative Animated Background Orbs */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px]"
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px]"
      />

      {/* Main Glassmorphism Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-6 md:p-8 relative z-10 my-8"
      >
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="flex justify-center mb-3"
          >
            <div className="bg-white/10 p-2.5 rounded-2xl border border-white/20 shadow-lg">
              <img src={echoLogo} alt="Echo Logo" className="w-10 h-10 object-contain" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h2>
          <p className="text-purple-200/80 text-sm">Join Echo and connect with friends.</p>
        </div>

        {/* Notifications */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 mb-5 rounded-xl text-sm flex items-center gap-2 overflow-hidden"
            >
              <Icon name="loading" size="sm" className="hidden" />
              <p>{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 p-3 mb-5 rounded-xl text-sm flex items-center gap-2 overflow-hidden"
            >
              <Icon name="check" size="sm" />
              <p>{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-purple-100 pl-1 block">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-300/50 group-focus-within:text-purple-300 transition-colors">
                  <Icon name="user" size="sm" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if(error) setError(''); }}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-purple-300/30 transition-all text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-purple-100 pl-1 block">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-300/50 font-bold transition-colors">
                  @
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); if(error) setError(''); }}
                  className="w-full pl-9 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-purple-300/30 transition-all text-sm"
                  placeholder="johndoe"
                  required
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-purple-100 pl-1 block">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-300/50 group-focus-within:text-purple-300 transition-colors">
                <Icon name="mail" size="sm" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if(error) setError(''); }}
                className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-purple-300/30 transition-all text-sm"
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-purple-100 pl-1 block">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-300/50 group-focus-within:text-purple-300 transition-colors">
                <Icon name="lock" size="sm" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if(error) setError(''); }}
                className="w-full pl-10 pr-12 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-purple-300/30 transition-all text-sm"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-purple-300/50 hover:text-white transition-colors focus:outline-none"
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size="sm" />
              </button>
            </div>
            <p className="text-[10px] text-purple-300/60 pl-1">
              Min 8 chars, 1 uppercase, 1 lowercase, 1 special char.
            </p>
          </div>

          {/* Profile Picture */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-purple-100 pl-1 block">Profile Picture</label>
            <div className="flex items-center space-x-3 bg-black/20 p-2 rounded-xl border border-white/10 focus-within:ring-2 focus-within:ring-purple-500/50">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10">
                {profilePicture ? (
                  <img src={URL.createObjectURL(profilePicture)} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="image" size="sm" className="text-purple-300/50" />
                )}
              </div>
              <input
                type="file"
                onChange={(e) => { setProfilePicture(e.target.files[0]); if(error) setError(''); }}
                className="block w-full text-xs text-purple-200
                  file:mr-4 file:py-1.5 file:px-4
                  file:rounded-full file:border-0
                  file:text-xs file:font-semibold
                  file:bg-purple-600 file:text-white
                  hover:file:bg-purple-500 transition-colors file:cursor-pointer cursor-pointer
                "
                required
                accept="image/*"
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 rounded-xl font-semibold shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Icon name="loading" size="sm" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </motion.button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center border-t border-white/10 pt-5">
          <p className="text-sm text-purple-200/80">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-semibold hover:text-purple-300 transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default SignUp;
