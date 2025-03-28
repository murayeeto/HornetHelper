import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Category1 from './pages/Category1';
import Category2 from './pages/Category2';
import Category3 from './pages/Category3';
import Calendar from './pages/Calendar';
import AI from './pages/AI';
import Account from './pages/Account';

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
                path="/category1" 
                element={
                  <PrivateRoute>
                    <Category1 />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/category2" 
                element={
                  <PrivateRoute>
                    <Category2 />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/category3" 
                element={
                  <PrivateRoute>
                    <Category3 />
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
                path="/ai" 
                element={
                  <PrivateRoute>
                    <AI />
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
        </div>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;