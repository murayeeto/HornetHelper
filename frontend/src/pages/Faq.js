import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Faq.css';

const Faq = () => {
  const [faqData, setFaqData] = useState({
    title: "Frequently Asked Questions",
    categories: [
      {
        title: "General Questions",
        items: [
          {
            question: "What is this service?",
            answer: "Our platform helps students find study groups and provides AI-powered resource recommendations for premium users."
          },
          {
            question: "Is there a free version?",
            answer: "Yes, you can join and create study groups for free. AI resource recommendations require a premium subscription."
          }
        ]
      },
      {
        title: "Study Groups",
        items: [
          {
            question: "How do I find study groups?",
            answer: "You can browse available groups by department and gender. Use our search filters to find the perfect match."
          },
          {
            question: "Can I create my own study group?",
            answer: "Absolutely! Free users can create up to 3 study groups. Premium users can create unlimited groups."
          },
          {
            question: "What sizes do study groups come in?",
            answer: "Groups range from small (2 people) to large (3-10 people). You can choose based on your preference."
          }
        ]
      },
      {
        title: "Premium Features",
        items: [
          {
            question: "What does premium offer?",
            answer: "Premium includes AI-powered resource recommendations with unlimited group creation."
          },
          {
            question: "How much does premium cost?",
            answer: "We offer monthly ($9.99) and annual ($89.99) subscription options."
          },
          {
            question: "How does the AI resource recommendation work?",
            answer: "Our AI analyzes."
          }
        ]
      }
    ]
  });
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const fetchFaqData = async () => {
      try {
        // In a real app, you might fetch this from your API
        // const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/faq`);
        // setFaqData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching FAQ data:', error);
        setLoading(false);
      }
    };

    fetchFaqData();
  }, []);

  const toggleAnswer = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="faq-page">
      <div className="faq-header">
        <h1>{faqData.title}</h1>
        <p>Find answers to common questions about our study platform</p>
      </div>

      <div className="faq-content">
        {faqData.categories.map((category, catIndex) => (
          <div key={catIndex} className="faq-category">
            <h2>{category.title}</h2>
            <div className="faq-items">
              {category.items.map((item, itemIndex) => {
                const uniqueIndex = `${catIndex}-${itemIndex}`;
                return (
                  <div key={uniqueIndex} className="faq-item">
                    <div 
                      className="faq-question" 
                      onClick={() => toggleAnswer(uniqueIndex)}
                    >
                      <h3>{item.question}</h3>
                      <span className="toggle-icon">
                        {activeIndex === uniqueIndex ? '−' : '+'}
                      </span>
                    </div>
                    {activeIndex === uniqueIndex && (
                      <div className="faq-answer">
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="faq-support">
        <h2>Still have questions?</h2>
        <p>Contact our support team at <a href="mailto:support@studyservice.com">support@studyservice.com</a> or use the chat feature in the app.</p>
      </div>
    </div>
  );
};

export default Faq;