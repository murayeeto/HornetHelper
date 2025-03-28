import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [categories, setCategories] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback categories if API fails
        setCategories([
          { id: 'category1', name: 'Category 1' },
          { id: 'category2', name: 'Category 2' },
          { id: 'category3', name: 'Category 3' },
          { id: 'calendar', name: 'Calendar' },
          { id: 'ai', name: 'AI Solutions' }
        ]);
      }
    };

    fetchCategories();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <NavLink to="/">
            <span className="logo-text">Hornet Helper</span>
          </NavLink>
        </div>

        <div className="menu-icon" onClick={toggleMenu}>
          <div className={isMenuOpen ? 'hamburger open' : 'hamburger'}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <ul className={isMenuOpen ? 'nav-menu active' : 'nav-menu'}>
          {user && (
            <li className="nav-item">
              <NavLink 
                to="/" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </NavLink>
            </li>
          )}
          
          {user && categories.map((category) => (
            <li key={category.id} className="nav-item">
              <NavLink 
                to={`/${category.id}`} 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                onClick={() => setIsMenuOpen(false)}
              >
                {category.name}
              </NavLink>
            </li>
          ))}

          <li className="nav-item auth-item">
            {user ? (
              <div className="user-info">
                <span className="user-name">{user.displayName}</span>
                <span className="user-major">{user.major}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            ) : (
              <NavLink 
                to="/login" 
                className="nav-link login-btn"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </NavLink>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;