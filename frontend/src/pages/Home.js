import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSessionHandlers } from '../utils/sessionHandlers';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import firebase from '../firebase';
import './Home.css';

const Home = () => {
  const [homeData, setHomeData] = useState({
    title: 'Welcome to Hornet Helper',
    description: 'Find study partners, access recommended resources, and stay organized with our user-friendly platform. Your one-stop solution for all your needs!'
  });
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const { user, signInWithGoogle } = useAuth();
  const { handleLeaveSession: handleLeaveDuoSession, handleDisbandSession: handleDisbandDuoSession } = useSessionHandlers(user, sessions.filter(s => s.type === 'duo'), setSessions, 'sessions');
  const { handleLeaveSession: handleLeaveGroupSession, handleDisbandSession: handleDisbandGroupSession } = useSessionHandlers(user, sessions.filter(s => s.type === 'group'), setSessions, 'groupSessions');

  const handleLeaveSession = async (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session.type === 'duo') {
      await handleLeaveDuoSession(sessionId);
    } else {
      await handleLeaveGroupSession(sessionId);
    }
    setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));
  };

  const handleDisbandSession = async (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session.type === 'duo') {
      await handleDisbandDuoSession(sessionId);
    } else {
      await handleDisbandGroupSession(sessionId);
    }
    setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));
  };

  useEffect(() => {
    const fetchAllSessions = async () => {
      try {
        const sessionsRef = collection(firebase.db, 'sessions');
        const sessionsQuery = query(sessionsRef, orderBy('createdAt', 'desc'));
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const regularSessions = sessionsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'duo',
          ...doc.data()
        }));

        const groupSessionsRef = collection(firebase.db, 'groupSessions');
        const groupSessionsQuery = query(groupSessionsRef, orderBy('createdAt', 'desc'));
        const groupSessionsSnapshot = await getDocs(groupSessionsQuery);
        const groupSessions = groupSessionsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'group',
          ...doc.data()
        }));

        setSessions([...regularSessions, ...groupSessions]);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };

    if (user) {
      fetchAllSessions();
    }
  }, [user]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/home`);
        setHomeData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching home data:', error);
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Failed to sign in with Google:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <section className="hero-section" style={{backgroundColor: 'white'}}>
        <div className="hero-content">
          <div className="hero-text">
            <h1>{homeData.title}</h1>
            <p>{homeData.description}</p>
            {!user && (
              <button onClick={handleGoogleSignIn} className="google-signin">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" alt="Google" />
                Continue with Google
              </button>
            )}
          </div>
          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80" alt="Students studying" />
          </div>
        </div>
      </section>

      <div className="home-content-grid">
        {user && (
          <section className="home-upcoming-sessions">
            <h2>Upcoming sessions</h2>
            <div className="home-session-cards">
              {sessions
                .filter(session => {
                  const sessionDate = new Date(session.dateTime);
                  const now = new Date();
                  return session.participants.some(p => p.uid === user.uid) && sessionDate > now;
                })
                .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
                .slice(0, 2)
                .map(session => (
                  <div key={session.id} className="home-session-card">
                    <div className="home-session-info">
                      <div>
                        <h3>{session.course || 'Study session'} on {new Date(session.dateTime).toLocaleString()}</h3>
                        <p className="home-location">
                          <i className="fas fa-map-marker-alt"></i> {session.location}
                        </p>
                      </div>
                      <button
                        className="cancel-session"
                        onClick={() => {
                          const isOwner = user.uid === session.userId;
                          const message = isOwner ?
                            'Are you sure you want to disband this session? This will remove all participants.' :
                            'Are you sure you want to leave this session?';
                          
                          if (window.confirm(message)) {
                            if (isOwner) {
                              handleDisbandSession(session.id);
                            } else {
                              handleLeaveSession(session.id);
                            }
                          }
                        }}
                      >
                        Cancel session
                      </button>
                    </div>
                  </div>
                ))}
              {sessions.filter(session => {
                const sessionDate = new Date(session.dateTime);
                const now = new Date();
                return session.participants.some(p => p.uid === user.uid) && sessionDate > now;
              }).length === 0 && (
                <p>No future sessions scheduled</p>
              )}
            </div>
            <Link to="/calendar" className="go-to-calendar">Go to Calendar</Link>
          </section>
        )}

        <section className="home-features">
          <h2>Features</h2>
          <div className="home-feature-cards">
            <div className="home-feature-card">
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3" alt="Study buddy" />
              <h3>Find Your Perfect Study Buddy</h3>
              <Link to="/studywithbuddy" className="home-feature-btn study">Get Started</Link>
            </div>
            <div className="home-feature-card">
              <div className='robot-container'>
              <img src="https://entwickler.de/wp-content/uploads/2024/08/platform24_FSLE_OpenAI_Illustration_b.svg" alt="AI" className='home-feature-card-robot-image'/>
              </div>
              <h3>Get AI Powered Recommendations</h3>
              <Link to="/faq#ai-demo" className="home-feature-btn ai">Get Started</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;