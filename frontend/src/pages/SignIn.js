import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
//import './SignIn.css';
//const googleLogo = require("../assets/googleLogo.webp")

function SignIn() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignIn) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, {
          displayName: formData.username
        });
      }
      navigate('/calendar'); // Redirect to calendar page after successful auth
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/calendar');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{isSignIn ? 'Sign In' : 'Sign Up'}</h1>
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="auth-input"
            required
            autoComplete="email"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="auth-input"
            required
            autoComplete="current-password"
          />
          {!isSignIn && (
            <>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                className="auth-input"
                required
                maxLength="10"
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="auth-input"
                required
                autoComplete="new-password"
              />
            </>
          )}
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Loading...' : (isSignIn ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        <button 
          onClick={handleGoogleSignIn} 
          className="google-auth-button"
          disabled={loading}
        >
          <img 
            alt="Google logo" 
            className="google-icon" 
          />
          Continue with Google
        </button>
        <p className="auth-switch">
          {isSignIn ? "Don't have an account? " : "Already have an account? "}
          <button
            className="switch-button"
            onClick={() => setIsSignIn(!isSignIn)}
            disabled={loading}
          >
            {isSignIn ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default SignIn;