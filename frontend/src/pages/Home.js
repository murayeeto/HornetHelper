import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  const [homeData, setHomeData] = useState({
    title: 'Welcome to Hornet Helper',
    description: 'Your one-stop solution for all your needs'
  });
  const [loading, setLoading] = useState(true);

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
        <p>{homeData.description}</p>
        <Link to="/category1" className="btn btn-secondary">Explore Categories</Link>
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

      <section className="section text-center">
        <h2>Ready to Get Started?</h2>
        <p>Explore our categories and find what you need.</p>
        <div className="btn-group">
          <Link to="/category1" className="btn btn-primary">Category 1</Link>
          <Link to="/category2" className="btn btn-primary">Category 2</Link>
          <Link to="/category3" className="btn btn-primary">Category 3</Link>
          <Link to="/category4" className="btn btn-primary">Category 4</Link>
          <Link to="/ai" className="btn btn-secondary">AI Solutions</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;