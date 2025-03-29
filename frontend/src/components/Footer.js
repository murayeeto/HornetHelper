import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/studywithbuddy">Study With Buddy</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/calendar">Calendar</Link>
          <Link to="/pricing">Pricing</Link>
        </div>
        <div className="footer-copyright">
            {new Date().getFullYear()} Hornet Helper.
        </div>
      </div>
    </footer>
  );
};

export default Footer;