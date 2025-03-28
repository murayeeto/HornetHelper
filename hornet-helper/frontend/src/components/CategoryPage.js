import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CategoryPage.css';

const CategoryPage = ({ categoryId, title }) => {
  const [categoryData, setCategoryData] = useState({
    title: title,
    items: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/category/${categoryId}`);
        setCategoryData(response.data);
        setLoading(false);
      } catch (error) {
        console.error(`Error fetching ${categoryId} data:`, error);
        setError('Failed to load category data. Please try again later.');
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Oops!</h2>
        <p>{error}</p>
        <button 
          className="btn btn-primary" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="category-page">
      <div className="page-header">
        <h1>{categoryData.title}</h1>
        <p>Explore all our offerings in this category</p>
      </div>

      <div className="page-content">
        <p>
          Browse through our selection of items in the {categoryData.title} category. 
          Each item is carefully selected to provide you with the best experience.
        </p>

        <div className="category-items">
          {categoryData.items && categoryData.items.map((item, index) => (
            <div key={index} className="category-item">
              <h3>{item}</h3>
              <p>This is a detailed description of {item}. It provides information about the features and benefits.</p>
              <button className="btn btn-primary">Learn More</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;