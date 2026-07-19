import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Login from './Components/Auth/Login';
import Signup from './Components/Auth/Signup';
import ForgotPassword from './Components/Auth/ForgotPassword';
import ResetPassword from './Components/Auth/ResetPassword';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './Components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { fetchUserProfile } from './features/auth/authSlice';

// Lazy load components for performance
const Dashboard = lazy(() => import('./Components/Dashboard/Dashboard'));
const EditProfile = lazy(() => import('./Components/Dashboard/EditProfile'));
const ChangePassword = lazy(() => import('./Components/Dashboard/ChangePassword'));
const Chat = lazy(() => import('./Components/Dashboard/Chat'));

// PrivateRoute component to protect the Dashboard route
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// Loading Fallback Component with animation
const Loading = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex items-center justify-center h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      className="w-12 h-12 border-4 border-primary-600/20 border-t-primary-600 rounded-full"
    />
  </motion.div>
);

// AuthCheck wrapper validates token on startup
const AuthCheck = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (token && userId) {
        try {
          // Unwrap the thunk to catch errors if the token is invalid
          await dispatch(fetchUserProfile(userId)).unwrap();
        } catch (error) {
          console.error("Session validation failed", error);
        }
      }
      setChecking(false);
    };
    initAuth();
  }, [dispatch]);

  if (checking) return <Loading />;
  return children;
};

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

// Animated Routes wrapper
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="w-full"
      >
        <Suspense fallback={<Loading />}>
          <Routes location={location}>
            <Route
            path="/"
            element={<Navigate to="/login" />}
          />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/edit-profile"
            element={
              <PrivateRoute>
                <EditProfile />
              </PrivateRoute>
            }
          />

          <Route
            path="/change-password"
            element={
              <PrivateRoute>
                <ChangePassword />
              </PrivateRoute>
            }
          />

          <Route
            path="/chat/:conversationId"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <SocketProvider>
          <Router>
            <Toaster
              position="top-right"
              reverseOrder={false}
              toastOptions={{
                className: '',
                style: {
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#1f2937',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(229, 231, 235, 0.8)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: 'white',
                  },
                  duration: 3000,
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: 'white',
                  },
                  duration: 4000,
                },
              }}
            />
            <ErrorBoundary>
              <AuthCheck>
                <AnimatedRoutes />
              </AuthCheck>
            </ErrorBoundary>
          </Router>
        </SocketProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;