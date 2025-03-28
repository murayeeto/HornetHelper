import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Category1 from './pages/Category1';
import Category2 from './pages/Category2';
import Category3 from './pages/Category3';
import Category4 from './pages/Category4';
//import SignIn from './pages/SignIn';
import AI from './pages/AI';
import Calendar from './pages/Calendar';

function App() {
  return (
    <HashRouter>
      <div className="App">
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category1" element={<Category1 />} />
            <Route path="/category2" element={<Category2 />} />
            <Route path="/category3" element={<Category3 />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/ai" element={<AI />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;