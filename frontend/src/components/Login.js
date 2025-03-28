import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const { signInWithGoogle, user, updateMajor, error, setError } = useAuth();
  const [major, setMajor] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any previous errors when component mounts
    setError(null);
    // Redirect if user is already logged in and has major set
    if (user && user.major) {
      navigate('/');
    }
  }, [user, navigate, setError]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      // Don't navigate here - let the useEffect handle navigation
      // after checking for major
    } catch (error) {
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleMajorSubmit = async (e) => {
    e.preventDefault();
    if (!major.trim()) {
      setError('Please enter your major');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await updateMajor(major.trim());
      navigate('/');
    } catch (error) {
      setError(error.message || 'Failed to update major');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {error && (
        <div className="error-message" onClick={() => setError(null)}>
          {error}
          <span className="dismiss-error">×</span>
        </div>
      )}
      
      {!user ? (
        <div className="login-box">
          <h2>Welcome to Hornet Helper</h2>
          <p>Sign in with your Google account to get started</p>
          <button 
            className={`google-signin-btn ${loading ? 'loading' : ''}`}
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      ) : !user.major ? (
        <div className="major-form">
          <h2>Complete Your Profile</h2>
          <p>Please enter your major to continue</p>
          <form onSubmit={handleMajorSubmit}>
            <div className="form-group">
              <label htmlFor="major">What's your major?</label>
              <input
                type="text"
                id="major"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="Enter your major"
                disabled={loading}
                required
              />
            </div>
            <button 
              type="submit" 
              className={`submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default Login;