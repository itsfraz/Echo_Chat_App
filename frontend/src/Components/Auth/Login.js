import React, { useState } from 'react';
import { login } from '../../Services/authService';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../../config';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../UI/Icon';
import echoLogo from '../../assets/echo_logo.png';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(''); // Clear error on typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await login(formData);
      if (!response.data.token || !response.data.userId) {
        setError('Invalid response from the server. Please try again.');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);

      setSuccess('Login successful!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4 relative overflow-hidden font-sans">
      <Helmet>
        <title>Login - Echo</title>
        <meta name="description" content="Login to Echo Chat App" />
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
        className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 relative z-10"
      >
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="flex justify-center mb-4"
          >
            <div className="bg-white/10 p-3 rounded-2xl border border-white/20 shadow-lg">
              <img src={echoLogo} alt="Echo Logo" className="w-12 h-12 object-contain" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-purple-200/80 text-sm">Sign in to continue to Echo.</p>
        </div>

        {/* Notifications */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 mb-6 rounded-xl text-sm flex items-center gap-2 overflow-hidden"
            >
              <Icon name="loading" size="sm" className="hidden" /> {/* Placeholder if icon needed later */}
              <p>{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 p-3 mb-6 rounded-xl text-sm flex items-center gap-2 overflow-hidden"
            >
              <Icon name="check" size="sm" />
              <p>{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-purple-100 pl-1 block">Username</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-300/50 group-focus-within:text-purple-300 transition-colors">
                <Icon name="user" size="sm" />
              </div>
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-purple-300/30 transition-all text-sm"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center pl-1 pr-1">
              <label className="text-sm font-medium text-purple-100 block">Password</label>
              <Link to="/forgot-password" className="text-xs text-purple-300 hover:text-white transition-colors">Forgot Password?</Link>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-300/50 group-focus-within:text-purple-300 transition-colors">
                <Icon name="lock" size="sm" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-purple-300/30 transition-all text-sm"
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
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3.5 rounded-xl font-semibold shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Icon name="loading" size="sm" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Log In</span>
            )}
          </motion.button>
        </form>

        {/* Signup Link */}
        <div className="mt-8 text-center border-t border-white/10 pt-6">
          <p className="text-sm text-purple-200/80">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white font-semibold hover:text-purple-300 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;