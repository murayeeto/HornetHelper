import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Faq.css';

const Faq = () => {
  const [showAiDemo, setShowAiDemo] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [videoRecommendation, setVideoRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [faqData, setFaqData] = useState({
    title: "Frequently Asked Questions",
    categories: [
      {
        title: "AI Features",
        items: [
          {
            question: "What AI features are available?",
            answer: "We offer two powerful AI features: 1) An intelligent tutoring system powered by a neural chat model that can help with your studies, and 2) A smart YouTube video recommendation system that suggests educational content based on your major."
          },
          {
            question: "How accurate are the AI recommendations?",
            answer: "Our AI system uses state-of-the-art models including the IBL Tutoring Neural Chat model for personalized assistance and integrates with YouTube's API to find highly relevant educational content for your field of study."
          }
        ]
      },
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
            answer: "Our AI analyzes your major, interests, and study patterns to provide personalized learning resources and study materials."
          }
        ]
      }
    ]
  });

  const chatContainerRef = useRef(null);
  const aiDemoRef = useRef(null);

  const scrollToDemo = () => {
    if (aiDemoRef.current) {
      aiDemoRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    const fetchFaqData = async () => {
      try {
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

  const handleAskAi = async () => {
    if (!userInput.trim()) return;

    const userMessage = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/ask-ai', {
        message: userMessage
      });
      setChatMessages(prev => [...prev, { type: 'ai', text: response.data.response }]);
    } catch (error) {
      console.error('Error asking AI:', error);
      setChatMessages(prev => [...prev, {
        type: 'error',
        text: 'Sorry, there was an error connecting to the AI. Please try again later.'
      }]);
    }
    setLoading(false);
  };

  const handleGetVideoRecommendation = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/recommend-video', {
        major: "Computer Science" // This should come from user's profile
      });
      setVideoRecommendation(response.data);
    } catch (error) {
      console.error('Error getting video recommendation:', error);
      setVideoRecommendation(null);
    }
    setLoading(false);
  };

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

      <div className="ai-demo-section" ref={aiDemoRef}>
        <h2>AI Features Demo</h2>
        <div className="demo-buttons">
          <button
            type="button"
            onClick={() => {
              setShowAiDemo(true);
              scrollToDemo();
            }}
            className="demo-button"
          >
            Demo Now!
          </button>
          <button
            type="button"
            onClick={() => {
              handleGetVideoRecommendation();
              scrollToDemo();
            }}
            className="recommend-button"
          >
            Recommend Video
          </button>
        </div>

        {showAiDemo && (
          <div className={`ai-chat-demo ${loading ? 'loading' : ''}`}>
            <div className="chat-messages" ref={chatContainerRef}>
              {chatMessages.map((message, index) => (
                <div key={index} className={`chat-message ${message.type}`}>
                  <div className="message-content">
                    <span className="message-sender">
                      {message.type === 'user' ? 'You' : 'AI Assistant'}:
                    </span>
                    <p>{message.text}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chat-message ai">
                  <div className="message-content">
                    <span className="message-sender">AI Assistant:</span>
                    <p>Thinking...</p>
                  </div>
                </div>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAi();
                if (chatContainerRef.current) {
                  chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
              }}
              className="chat-input-form"
            >
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask me anything about studying..."
                className="chat-input"
                disabled={loading}
              />
              <button
                type="submit"
                className="ask-ai-button"
                disabled={loading || !userInput.trim()}
              >
                Send
              </button>
            </form>
          </div>
        )}

        {videoRecommendation && (
          <div className="video-recommendation">
            <h3>Recommended Video:</h3>
            <p>{videoRecommendation.title}</p>
            <a href={videoRecommendation.url} target="_blank" rel="noopener noreferrer">
              Watch Video
            </a>
          </div>
        )}
      </div>

      <div className="faq-support">
        <h2>Still have questions?</h2>
        <p>Contact our support team at <a href="mailto:support@studyservice.com">support@studyservice.com</a> or use the chat feature in the app.</p>
      </div>
    </div>
  );
};

export default Faq;