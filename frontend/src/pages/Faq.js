import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Faq.css';

const Faq = () => {
  const [aiData, setAiData] = useState({
    title: "Something title like",
    items: ["Thing1", "Thing2", "Thing3"]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAiData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/category/ai`);
        setAiData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching AI data:', error);
        setLoading(false);
      }
    };

    fetchAiData();
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
    <div className="ai-page">
      <div className="ai-container">
        <h1>{aiData.title}</h1>
        <p>Discover the power of blah blah blah</p>
      </div>

      <div className="page-content">
        <h2>Something big</h2>
        <p>
          blah blah blah
        </p>

        <div className="ai-solutions">
          {aiData.items && aiData.items.map((item, index) => (
            <div key={index} className="ai-solution-card">
              <h3>{item}</h3>
              <p>
                blah blah blah
              </p>
            </div>
          ))}
        </div>

        <div className="ai-features">
          <h2>Why Choose Our AI Solutions?</h2>
          <div className="ai-features-grid">
            <div className="ai-feature">
              <h3>Advanced Technology</h3>
              <p>We use state-of-the-art AI models and algorithms</p>
            </div>
            <div className="ai-feature">
              <h3>Seamless Integration</h3>
              <p>Our AI solutions integrate smoothly with existing systems</p>
            </div>
            <div className="ai-feature">
              <h3>Continuous Learning</h3>
              <p>Our AI systems continuously learn and improve</p>
            </div>
            <div className="ai-feature">
              <h3>Customizable Solutions</h3>
              <p>Tailor our AI solutions to your specific needs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Faq;