import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Category2 from './pages/Category2';
import Calendar from './pages/Calendar';
import AI from './pages/AI';
import Account from './pages/Account';
import StudyWithBuddy from './pages/StudyWithBuddy';
import Pricing from './pages/Pricing'


// Auth Context
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="App">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="/studywithbuddy"
                element={
                  <PrivateRoute>
                    <StudyWithBuddy />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ai"
                element={
                  <PrivateRoute>
                    <AI />
                  </PrivateRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <PrivateRoute>
                    <Calendar />
                  </PrivateRoute>
                }
              />
              <Route
                path="/pricing"
                element={
                  <PrivateRoute>
                    <Pricing />
                  </PrivateRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <PrivateRoute>
                    <Account />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
          <Footer></Footer>
        </div>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;