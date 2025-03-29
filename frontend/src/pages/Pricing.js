import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Pricing.css';
import { useEffect } from 'react';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [message, setMessage] = useState('');
  const { upgradeToHornet } = useAuth();
  
  const handleUpgrade = async () => {
    if (window.confirm('Would you like to upgrade to Hornet Pro status?')) {
      try {
        await upgradeToHornet();
        setMessage('Successfully upgraded to Hornet Pro!');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage(error.message || 'Failed to upgrade. Please try again.');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  const toggleBillingCycle = () => {
    setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly');
  };

  useEffect(() => {
      window.scrollTo(0,0);
  }
  , []);

  const plans = [
    {
      name: 'Standard',
      color: 'grey',
      price: 'Free',
      features: [
        'Duo study sessions',
        'Group sessions (up to 5 people)',
        'Study calendar',
        'Reminders & notifications',
        'Basic progress tracking'
      ],
      cta: 'Get Started'
    },
    {
      name: 'Hornet Pro',
      color: 'red',
      price: billingCycle === 'monthly' ? '$4.99/month' : '$49.99/year',
      features: [
        'Everything in Standard',
        'YouTube video recommendations',
        'Textbook recommendations',
        'AI-powered study tips'
      ],
      cta: 'Upgrade Now'
    },
    {
      name: 'Hornet Pro Max',
      color: 'gold',
      price: billingCycle === 'monthly' ? '$9.99/month' : '$89.99/year',
      features: [
        'Personalized study plans',
        'Sub-tasker',
        'Video Calls',
        'Group white boards'
      ],
      cta: 'Coming Soon',
      disabled: true
    }
  ];

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1>Choose Your Plan</h1>
        <p className="subtitle">Unlock exclusive premium features and maximize your study potential</p>
        
        <div className="billing-toggle">
          <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={billingCycle === 'annual'}
              onChange={toggleBillingCycle}
            />
            <span className="slider"></span>
          </label>
          <span className={billingCycle === 'annual' ? 'active' : ''}>
            Annual <span className="save-badge">Save 25%</span>
          </span>
        </div>
      </div>

      <div className="plans-container">
        {plans.map((plan, index) => (
          <div 
            key={index} 
            className={`plan-card ${plan.color} ${plan.disabled ? 'disabled' : ''}`}
          >
            <div className="plan-header">
              <h2>{plan.name}</h2>
              <div className="price">{plan.price}</div>
            </div>
            <ul className="features">
              {plan.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
            <button
              className={`cta-button ${plan.disabled ? 'disabled' : ''}`}
              disabled={plan.disabled}
              onClick={plan.name === 'Pro' ? handleUpgrade : undefined}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
      {message && (
        <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default Pricing;