import React, { useState } from 'react';
import './Login.css';
import { Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { useAppContext } from '../context/AppContext';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from 'firebase/auth';

export default function Login() {
  const { loginUser } = useAppContext();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/internal-error') {
        setError('Google sign-in is not configured correctly. Use Demo Mode or email/password for now.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This site is not authorized for Google sign-in. Please add the current localhost URL to Firebase auth domains.');
      } else {
        setError(err.message || 'Google sign-in failed.');
      }
    }
  };

  const handleDemoLogin = () => {
    loginUser('Demo User');
  };

  return (
    <div className="login-page animate-fade-in">
      <div className="login-header">
        <div className="shield-icon">
          <ShieldCheck size={48} color="white" />
        </div>
        <h1>{isSignUp ? "Create Account" : "Welcome Back!"}</h1>
        <p>{isSignUp ? "Sign up" : "Sign in"} to continue your health journey</p>
      </div>

      <div className="login-form-container">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleEmailAuth} className="login-form">
          <div className="input-group">
            <label>Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} color="#3498db" />
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} color="#f1c40f" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="eye-btn" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isSignUp && (
            <div className="forgot-password">
              <button type="button">Forgot Password?</button>
            </div>
          )}

          <button type="submit" className="btn-primary">
            {isSignUp ? "Sign Up" : "🔑 Sign In"}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button type="button" className="btn-secondary" onClick={handleGoogleSignIn}>
          🌐 Continue with Google
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <button type="button" className="btn-demo" onClick={handleDemoLogin}>
          🎮 Try Demo Mode
        </button>
      </div>
    </div>
  );
}
