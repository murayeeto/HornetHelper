import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';
import dsuLogo from '../assets/dsucslogo.png'

// Default profile picture
const DEFAULT_PROFILE_PIC = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

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
        setCategories([
          { id: 'studywithbuddy', name: 'Study With Buddy' },
          { id: 'calendar', name: 'Calendar' },
          { id: 'pricing', name: 'Pricing' },
          { id: 'faq', name: 'Faq' }
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
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <NavLink to="/" className="logo-link">
            <div className="logo-container">
              <img 
                src={dsuLogo} 
                alt="DSU Logo" 
                className="logo-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_PROFILE_PIC;
                }}
              />
              <span className="logo-text">Hornet Helper</span>
            </div>
          </NavLink>
        </div>
        <div className='nav-items-div'>
      
          <div className="menu-icon" onClick={toggleMenu}>
            <div className={isMenuOpen ? 'hamburger open' : 'hamburger'}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <ul className={isMenuOpen ? 'nav-menu active' : 'nav-menu'}>
            {categories.map((category) => (
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

            {user && (
              <li className="nav-item auth-item">
                <div className="user-info">
                  <NavLink to="/account" className="user-profile">
                    <img 
                      src={user.photoURL || DEFAULT_PROFILE_PIC} 
                      alt="Profile" 
                      className="profile-picture"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_PROFILE_PIC;
                      }}
                    />
                  </NavLink>
                  <button onClick={handleLogout} className="logout-btn">
                    Logout
                  </button>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;