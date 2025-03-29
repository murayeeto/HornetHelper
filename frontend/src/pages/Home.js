import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import departmentsAndMajors from '../data/departmentsAndMajors';

// Flatten majors list
const allMajors = Object.values(departmentsAndMajors).flat().sort();

const Home = () => {
  const [homeData, setHomeData] = useState({
    title: 'Welcome to Hornet Helper',
    description: 'Your one-stop solution for all your needs'
  });
  const [loading, setLoading] = useState(true);
  const [major, setMajor] = useState('');
  const { user, signInWithGoogle, updateMajor } = useAuth();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/home`);
        setHomeData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching home data:', error);
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Failed to sign in with Google:', error);
    }
  };

  const handleMajorSubmit = async (e) => {
    e.preventDefault();
    if (!major.trim()) return;

    try {
      await updateMajor(major.trim());
      setMajor('');
    } catch (error) {
      console.error('Failed to update major:', error);
    }
  };

  const handleSkipMajor = async () => {
    try {
      await updateMajor('non denominated');
    } catch (error) {
      console.error('Failed to set default major:', error);
    }
  };

  const showMajorInput = user && (!user.major || user.major === 'non denominated');

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <section className="hero-section">
        <h1>{homeData.title}</h1>
        <p style={{ color: 'white' }}>{homeData.description}</p>
        {!user ? (
          <button onClick={handleGoogleSignIn} className="btn btn-primary google-signin">
            Login to Get Started
          </button>
        ) : showMajorInput ? (
          <div className="major-section">
            <form onSubmit={handleMajorSubmit} className="major-form-hero">
              <select
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="major-input-hero"
              >
                <option value="">Select your major</option>
                {allMajors.map((majorOption) => (
                  <option key={majorOption} value={majorOption}>
                    {majorOption}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary">
                Set Major
              </button>
            </form>
            {!user.major && (
              <>
                <button onClick={handleSkipMajor} className="btn btn-secondary skip-major">
                  Skip for Now
                </button>
                <p className="major-note">You can continue using the website without setting your major</p>
              </>
            )}
          </div>
        ) : null}
      </section>

      <section className="section">
        <h2 className="text-center">Our Features</h2>
        <div className="features-section">
          <div className="feature-card">
            <h3>Easy Navigation</h3>
            <p>Navigate through different categories with our intuitive interface.</p>
            <Link to="/category1" className="btn btn-primary">Learn More</Link>
          </div>
          <div className="feature-card">
            <h3>Comprehensive Solutions</h3>
            <p>Find solutions for all your needs in one place.</p>
            <Link to="/category2" className="btn btn-primary">Learn More</Link>
          </div>
          <div className="feature-card">
            <h3>AI Integration</h3>
            <p>Leverage the power of AI to enhance your experience.</p>
            <Link to="/ai" className="btn btn-primary">Learn More</Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .major-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .major-form-hero {
          display: flex;
          gap: 1rem;
          width: 100%;
        }

        .major-input-hero {
          flex: 1;
          padding: 0.8rem 1rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          background: white;
          color: #333;
        }

        .major-input-hero:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.5);
        }

        .skip-major {
          width: 100%;
          background: transparent;
          border: 2px solid #4285f4;
          color: #4285f4;
        }

        .skip-major:hover {
          background: rgba(66, 133, 244, 0.1);
        }

        .major-note {
          color: white;
          font-size: 0.9rem;
          text-align: center;
          margin-top: 0.5rem;
        }

        .google-signin {
          padding: 0.8rem 2rem;
          font-size: 1.1rem;
          background: white;
          color: #4285f4;
          border: none;
          transition: all 0.3s ease;
        }

        .google-signin:hover {
          background: #4285f4;
          color: var(--primary-red);
          box-shadow: 0 0 15px rgba(66, 133, 244, 0.5);
        }
      `}</style>
    </div>
  );
};

export default Home;