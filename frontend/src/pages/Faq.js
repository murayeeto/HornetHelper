import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import departmentsAndMajors from '../data/departmentsAndMajors';
import './Faq.css';

// Flatten majors list
const allMajors = Object.values(departmentsAndMajors).flat().sort();

// Static FAQ data
const faqData = {
  title: "Frequently Asked Questions",
  categories: [
    {
      title: "General Questions.",
      items: [
        {
          question: "What is Hornet Helper?",
          answer: "Hornet Helper is an AI-powered platform that helps students form study groups, automate scheduling, and discover personalized learning resources. Unlike manual tools, Hornet Helper connects you with peers, adds study sessions to your calendar automatically, and uses machine learning to recommend the best videos and textbooks"
        },
        {
          question: "How is this different from Discord or Facebook Groups?",
          answer: "While Discord and Facebook are great for casual chats, Hornet Helper is designed specifically for focused learning with no manual scheduling: meetings auto-sync to your calendar when you join a group and AI-curated resources: Get recommendations tailored to your subject (e.g., STEM, languages) instead of searching endlessly."
        },
        {
          question: "Is Hornet Helper free?",
          answer: "Hornet Helper offers a free plan with limited features, as well as many useful extra features for our Hornet Pro users."
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
          answer: "Absolutely! Both Free and Pro plan members can create groups to find new Study Buddies!"
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
          answer: "Pro users get access to tailored resource recommendation for textbooks and videos."
        },
        {
          question: "How much does premium cost?",
          answer: "We offer monthly ($4.99) and annual ($49.99) subscription options."
        },
        {
          question: "How does the AI resource recommendation work?",
          answer: "Great question!"
        }
      ]
    }
  ]
};

const Faq = () => {
  const { user } = useAuth();
  const [showAiDemo, setShowAiDemo] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [videoRecommendation, setVideoRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [selectedMajor, setSelectedMajor] = useState(user?.major || allMajors[0]);

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

  useEffect(() => {
    if (user?.major) {
      setSelectedMajor(user.major);
    }
  }, [user]);

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
    if (user && !user.major) {
      setVideoRecommendation('no-major');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/recommend-video', {
        major: user ? user.major : selectedMajor
      });
      console.log('Video response:', response.data);
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setVideoRecommendation(response.data);
      } else {
        console.error('No videos found in response:', response.data);
        setVideoRecommendation(null);
      }
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
              {chatMessages.length === 0 && !loading && (
                <div className="chat-message ai">
                  <div className="message-content">
                    <span className="message-sender">AI Assistant:</span>
                    <p>Hello! I'm your personal study assistant, ready to help you succeed in your studies. I can help with study techniques, difficult concepts, or time management. What would you like help with today?</p>
                  </div>
                </div>
              )}
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

        {!user && (
          <div className="major-selector">
            <select 
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="major-dropdown"
            >
              {allMajors.map((major) => (
                <option key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>
          </div>
        )}

        {videoRecommendation === 'no-major' ? (
          <div className="video-recommendations">
            <h3>Major Not Set</h3>
            <p>Please set your major in your account settings to get personalized video recommendations.</p>
          </div>
        ) : videoRecommendation ? (
          <div className="video-recommendations">
            <h3>Recommended Videos for {user ? user.major : selectedMajor}:</h3>
            <div className="video-grid">
              {videoRecommendation.map((video, index) => (
                <div key={index} className="video-card">
                  <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
                  <h4>{video.title}</h4>
                  <p>{video.description}</p>
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="watch-button">
                    Watch Video
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : loading ? null : videoRecommendation === null && (
          <div className="video-recommendations">
            <h3>No Videos Found</h3>
            <p>Sorry, we couldn't find any educational videos for your major at the moment. Please try again later.</p>
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