import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/category1">Category 1</Link>
          <Link to="/category2">Category 2</Link>
          <Link to="/calendar">Calendar</Link>
        </div>
        <div className="footer-copyright">
            {new Date().getFullYear()} Hornet Helper.
        </div>
      </div>
    </footer>
  );
};

export default Footer;