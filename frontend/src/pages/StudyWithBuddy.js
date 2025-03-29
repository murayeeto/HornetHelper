import React, { useState, useEffect } from "react";
import "./StudyWithBuddy.css";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { FaComments } from 'react-icons/fa';
import ChatWindow from '../components/ChatWindow';
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    doc,
    getDoc,
    setDoc,
    writeBatch
} from 'firebase/firestore';
import firebase from '../firebase';
import dsuCampusLocations from '../data/dsuCampusLocations';
import departmentsAndMajors from '../data/departmentsAndMajors';
import Calendar from './Calendar';
import { useSessionHandlers, addToCalendar } from '../utils/sessionHandlers';

ChartJS.register(ArcElement, Tooltip, Legend);

function HomeScreen({ setScreen }) {
    return (
        <section className="home-container">
            <h1 className="title">Welcome To StudyBuddy!</h1>
            <p className="description">
                Connect with fellow students to enhance your learning experience.
            </p>
            <p className="preference-text">Choose your preference</p>
            <div className="options-container">
                <div className="option">
                    <img
                        src="https://st.depositphotos.com/10048732/60933/i/450/depositphotos_609338354-stock-photo-two-young-woman-studying-test.jpg"
                        alt="Duo Sessions"
                        className="option-image"
                    />
                    <button className="option-button" onClick={() => setScreen("duo")}>
                        Duo Sessions
                    </button>
                </div>
                <div className="option">
                    <img
                        src="https://images.squarespace-cdn.com/content/v1/61771b1f446e7b7538117de2/1725056417585-KCWIMR04ZYIJS4KSOM7C/Picture1.png"
                        alt="Group Sessions"
                        className="option-image"
                    />
                    <button className="option-button" onClick={() => setScreen("group")}>
                        Group Sessions
                    </button>
                </div>
            </div>
        </section>
    );
}

function DuoSessions({ setScreen }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dateTime, setDateTime] = useState("");
    const [location, setLocation] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedMajor, setSelectedMajor] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [gender, setGender] = useState("");
    const [sessions, setSessions] = useState([]);
    const [filteredSessions, setFilteredSessions] = useState([]);
    const [showFiltered, setShowFiltered] = useState(false);
    const [activeChatSession, setActiveChatSession] = useState(null);

    const fetchSessions = async () => {
        try {
            const sessionsRef = collection(firebase.db, 'sessions');
            const q = query(sessionsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const sessionData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSessions(sessionData);
            setFilteredSessions(sessionData);
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    };

    const { handleJoinSession, handleLeaveSession, handleDisbandSession } = useSessionHandlers(user, sessions, setSessions, 'sessions', fetchSessions);
    // Get all majors from all departments
    const allMajors = Object.values(departmentsAndMajors).flat();

    // Update sessions when user profile changes
    useEffect(() => {
        if (!user) return;

        const updateUserSessions = async () => {
            const updatedSessions = sessions.map(session => {
                // Update session owner info
                if (session.userId === user.uid) {
                    session.displayName = user.displayName;
                    session.photoURL = user.photoURL;
                }
                
                // Update participant info
                session.participants = session.participants.map(participant => {
                    if (participant.uid === user.uid) {
                        return {
                            ...participant,
                            displayName: user.displayName,
                            photoURL: user.photoURL
                        };
                    }
                    return participant;
                });
                
                return session;
            });

            // Update state
            setSessions(updatedSessions);
            
            // Update Firebase
            for (const session of updatedSessions) {
                if (session.userId === user.uid || session.participants.some(p => p.uid === user.uid)) {
                    const sessionRef = doc(firebase.db, 'sessions', session.id);
                    await setDoc(sessionRef, {
                        displayName: session.userId === user.uid ? user.displayName : session.displayName,
                        photoURL: session.userId === user.uid ? user.photoURL : session.photoURL,
                        participants: session.participants
                    }, { merge: true });
                }
            }
        };

        updateUserSessions();
    }, [user?.displayName, user?.photoURL]);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const sessionsRef = collection(firebase.db, 'sessions');
                const q = query(sessionsRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const sessionData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setSessions(sessionData);
                setFilteredSessions(sessionData);
            } catch (error) {
                console.error("Error fetching sessions:", error);
            }
        };
        fetchSessions();
    }, []);

    useEffect(() => {
        if (showFiltered && selectedDepartment) {
            const filtered = sessions.filter(session =>
                departmentsAndMajors[selectedDepartment]?.includes(session.major)
            );
            setFilteredSessions(filtered);
        } else {
            setFilteredSessions(sessions);
        }
    }, [selectedDepartment, sessions, showFiltered]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const sessionData = {
                course: selectedCourse,
                major: selectedMajor,
                dateTime,
                location,
                gender,
                userId: user.uid,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                participants: [{
                    uid: user.uid,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                }],
                userGender: gender,
                full: false,
                active: true
            };

            const docRef = await addDoc(collection(firebase.db, 'sessions'), sessionData);
            
            const newSession = {
                id: docRef.id,
                ...sessionData,
                createdAt: new Date()
            };
            
            // Add the new session to the state
            setSessions(prevSessions => [newSession, ...prevSessions]);

            // Add to calendar
            await addToCalendar(newSession, 'sessions', user);

            // Clear form
            setDateTime("");
            setLocation("");
            setSelectedCourse("");
            setSelectedMajor("");
            setSelectedDepartment("");
            setGender("");
        } catch (error) {
            console.error("Error creating session:", error);
        }
    };

    return (
        <div className="duo-container">
            <div className="duo-grid">
                <div className="create-session">
                    <h2>Create new session {!user && <span style={{color: '#ff6b6b'}}>(Login required)</span>}</h2>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!user) {
                            alert('Please login to create a session');
                            return;
                        }
                        handleSubmit(e);
                    }}>
                        <div className="form-group">
                            <label>Course</label>
                            <input
                                type="text"
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                placeholder="Enter course (e.g. COMP 3700)"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Major</label>
                            <select
                                value={selectedMajor}
                                onChange={(e) => setSelectedMajor(e.target.value)}
                                required
                            >
                                <option value="">Select major</option>
                                {allMajors.map(major => (
                                    <option key={major} value={major}>
                                        {major}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Date/Time</label>
                            <input
                                type="datetime-local"
                                value={dateTime}
                                onChange={(e) => setDateTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                            >
                                <option value="">Select location</option>
                                {dsuCampusLocations.map(loc => (
                                    <option key={loc.name} value={loc.name}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="submit-btn">Submit</button>
                    </form>
                </div>

                <div className="stats-section">
                    <h2>Number of active sessions: {sessions.filter(s => s.active).length}</h2>
                    <h3>Sessions by Department:</h3>
                    <div style={{ width: '600px', height: '400px', margin: '0 auto' }}>
                        <Pie
                            data={{
                                labels: Object.keys(departmentsAndMajors),
                                datasets: [{
                                    data: Object.keys(departmentsAndMajors).map(dept => 
                                        sessions.filter(session => 
                                            departmentsAndMajors[dept].includes(session.major)
                                        ).length
                                    ),
                                    backgroundColor: [
                                        '#FF6384',
                                        '#36A2EB',
                                        '#FFCE56',
                                        '#4BC0C0',
                                        '#9966FF',
                                        '#FF9F40',
                                        '#FF6384',
                                        '#36A2EB'
                                    ],
                                    borderColor: [
                                        '#FF6384',
                                        '#36A2EB',
                                        '#FFCE56',
                                        '#4BC0C0',
                                        '#9966FF',
                                        '#FF9F40',
                                        '#FF6384',
                                        '#36A2EB'
                                    ],
                                    borderWidth: 1,
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    layout: {
                                        padding: {
                                            right: 100
                                        }
                                    },
                                    legend: {
                                        position: 'right',
                                        align: 'start',
                                        labels: {
                                            boxWidth: 10,
                                            padding: 15,
                                            font: {
                                                size: 11
                                            },
                                            textAlign: 'left',
                                            wrap: true,
                                            maxWidth: 250
                                        }
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                const label = context.label || '';
                                                const value = context.raw || 0;
                                                return `${label}: ${value} sessions`;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="action-buttons">
                <button className="action-btn" onClick={() => navigate("/calendar")}>View Calendar</button>
                <button className="action-btn" onClick={() => setScreen("group")}>
                    Switch to Group Session
                </button>
            </div>

            <div className="filters">
                <div className="filter-group">
                    <label>Department:</label>
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                        <option value="">Select department</option>
                        {Object.keys(departmentsAndMajors).map(dept => (
                            <option key={dept} value={dept}>
                                {dept}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Gender:</label>
                    <div className="gender-options">
                        <label className="gender-option">
                            <input
                                type="radio"
                                name="gender"
                                value="M"
                                checked={gender === "M"}
                                onChange={(e) => setGender(e.target.value)}
                            />
                            M
                        </label>
                        <label className="gender-option">
                            <input
                                type="radio"
                                name="gender"
                                value="F"
                                checked={gender === "F"}
                                onChange={(e) => setGender(e.target.value)}
                            />
                            F
                        </label>
                        <label className="gender-option">
                            <input
                                type="radio"
                                name="gender"
                                value="O"
                                checked={gender === "O"}
                                onChange={(e) => setGender(e.target.value)}
                            />
                            Other
                        </label>
                    </div>
                </div>

                <button 
                    className="action-btn" 
                    onClick={() => setShowFiltered(!showFiltered)}
                >
                    {showFiltered ? 'Show All Sessions' : 'View Open Sessions'}
                </button>
            </div>

            <div className="session-section">
                <h2>Available Study Sessions</h2>
                <div className="session-cards">
                    {filteredSessions.map((session) => {
                        const isParticipant = user ? session.participants?.some(p => p.uid === user.uid) : false;
                        return (
                            <div key={session.id} className="session-card">
                                <img
                                    src={session.photoURL || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                    alt={session.displayName}
                                    className="profile-img"
                                />
                                <h3>{session.displayName}</h3>
                                <p>Course: {session.course}</p>
                                <p>Major: {session.major}</p>
                                <p>Time: {new Date(session.dateTime).toLocaleString()}</p>
                                <p>Place: {session.location}</p>
                                <div className="participants-list">
                                    <div className="participants-header">
                                        <h4>Participants:</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    cursor: 'pointer',
                                                    padding: '5px 10px',
                                                    borderRadius: '4px',
                                                    backgroundColor: activeChatSession === session.id ? '#4a90e2' : 'transparent',
                                                    color: activeChatSession === session.id ? 'white' : 'inherit',
                                                    border: 'none',
                                                    fontSize: 'inherit'
                                                }}
                                                onClick={() => setActiveChatSession(activeChatSession === session.id ? null : session.id)}
                                            >
                                                <FaComments
                                                    className="chat-icon"
                                                    style={{ fontSize: '20px' }}
                                                />
                                            </button>
                                            {session.full && (
                                                <span className="session-status full">Session Full</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="participant-grid">
                                        {session.participants?.map(participant => (
                                            <div key={participant.uid} className="participant-item">
                                                <img
                                                    src={participant.photoURL || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                                    alt={participant.displayName}
                                                    className="participant-img"
                                                />
                                                <span>{participant.displayName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="session-actions">
                                    {!user ? (
                                        <button
                                            className="join-btn"
                                            onClick={() => alert('Please login to join sessions')}
                                        >
                                            Login to Join
                                        </button>
                                    ) : user.uid === session.userId ? (
                                        <button
                                            className="disband-btn"
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to disband this session? This action cannot be undone.')) {
                                                    handleDisbandSession(session.id);
                                                }
                                            }}
                                        >
                                            Disband Session
                                        </button>
                                    ) : isParticipant ? (
                                        <button
                                            className="leave-btn"
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to leave this session?')) {
                                                    handleLeaveSession(session.id);
                                                }
                                            }}
                                        >
                                            Leave Session
                                        </button>
                                    ) : (
                                        <button
                                            className={`join-btn ${session.full ? 'full' : ''}`}
                                            onClick={() => !session.full && handleJoinSession(session.id)}
                                            disabled={session.full}
                                        >
                                            {session.full ? 'Session Full' : 'Join Session'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <button className="back-button" onClick={() => setScreen("home")}>
                Back to Home
            </button>
            
            {activeChatSession && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 999
                        }}
                        onClick={() => setActiveChatSession(null)}
                    />
                    <ChatWindow
                        sessionId={activeChatSession}
                        isOpen={true}
                        onClose={() => setActiveChatSession(null)}
                    />
                </>
            )}
        </div>
    );
}

function GroupSessions({ setScreen }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dateTime, setDateTime] = useState("");
    const [location, setLocation] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedMajor, setSelectedMajor] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [capacity, setCapacity] = useState(3);
    const [sessions, setSessions] = useState([]);
    const [filteredSessions, setFilteredSessions] = useState([]);
    const [showFiltered, setShowFiltered] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [activeChatSession, setActiveChatSession] = useState(null);

    const fetchSessions = async () => {
        try {
            const sessionsRef = collection(firebase.db, 'groupSessions');
            const q = query(sessionsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const sessionData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSessions(sessionData);
            setFilteredSessions(sessionData);
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    };

    const { handleJoinSession, handleLeaveSession, handleDisbandSession } = useSessionHandlers(user, sessions, setSessions, 'groupSessions', fetchSessions);

    const handleCapacityClick = (session, event) => {
        event.stopPropagation();
        setSelectedSession(selectedSession?.id === session.id ? null : session);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectedSession && !event.target.closest('.participants-menu') && !event.target.closest('.capacity-indicator')) {
                setSelectedSession(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [selectedSession]);

    // Add styles for the capacity indicator
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .capacity-indicator {
                cursor: pointer;
                transition: transform 0.2s;
            }
            .capacity-indicator:hover {
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    // Update sessions when user profile changes
    useEffect(() => {
        if (!user) return;

        const updateUserSessions = async () => {
            try {
                // Get all sessions where user is owner or participant
                const sessionsRef = collection(firebase.db, 'groupSessions');
                const q = query(sessionsRef);
                const querySnapshot = await getDocs(q);
                
                const batch = writeBatch(firebase.db);
                let needsUpdate = false;

                querySnapshot.forEach(doc => {
                    const session = doc.data();
                    if (session.userId === user.uid || session.participants?.some(p => p.uid === user.uid)) {
                        needsUpdate = true;
                        const sessionRef = doc.ref;
                        
                        // Update owner info if user is owner
                        if (session.userId === user.uid) {
                            batch.update(sessionRef, {
                                displayName: user.displayName,
                                photoURL: user.photoURL
                            });
                        }
                        
                        // Update participant info
                        const updatedParticipants = session.participants.map(p =>
                            p.uid === user.uid
                                ? { ...p, displayName: user.displayName, photoURL: user.photoURL }
                                : p
                        );
                        
                        batch.update(sessionRef, { participants: updatedParticipants });
                    }
                });

                if (needsUpdate) {
                    await batch.commit();
                    await fetchSessions();
                }
            } catch (error) {
                console.error("Error updating sessions:", error);
            }
        };

        updateUserSessions();
    }, [user?.displayName, user?.photoURL]);

    // Get all majors from all departments
    const allMajors = Object.values(departmentsAndMajors).flat();


    // Initial fetch
    useEffect(() => {
        fetchSessions();
    }, []);

    // Fetch after profile updates
    useEffect(() => {
        if (user?.displayName) {
            fetchSessions();
        }
    }, [user?.displayName, user?.photoURL]);

    useEffect(() => {
        if (showFiltered && selectedDepartment) {
            const filtered = sessions.filter(session =>
                departmentsAndMajors[selectedDepartment]?.includes(session.major)
            );
            setFilteredSessions(filtered);
        } else {
            setFilteredSessions(sessions);
        }
    }, [selectedDepartment, sessions, showFiltered]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const sessionData = {
                course: selectedCourse,
                major: selectedMajor,
                dateTime,
                location,
                capacity: parseInt(capacity),
                userId: user.uid,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                participants: [{
                    uid: user.uid,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                }],
                full: false,
                active: true
            };

            const docRef = await addDoc(collection(firebase.db, 'groupSessions'), sessionData);
            
            const newSession = {
                id: docRef.id,
                ...sessionData,
                createdAt: new Date()
            };
            
            // Add the new session to the state
            setSessions(prevSessions => [newSession, ...prevSessions]);

            // Add to calendar
            await addToCalendar(newSession, 'groupSessions', user);

            // Clear form
            setDateTime("");
            setLocation("");
            setSelectedCourse("");
            setSelectedMajor("");
            setSelectedDepartment("");
            setCapacity(3);
        } catch (error) {
            console.error("Error creating session:", error);
        }
    };

    return (
        <div className="duo-container">
            <div className="duo-grid">
                <div className="create-session">
                    <h2>Create new group session {!user && <span style={{color: '#ff6b6b'}}>(Login required)</span>}</h2>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!user) {
                            alert('Please login to create a session');
                            return;
                        }
                        handleSubmit(e);
                    }}>
                        <div className="form-group">
                            <label>Course</label>
                            <input
                                type="text"
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                placeholder="Enter course (e.g. COMP 3700)"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Major</label>
                            <select
                                value={selectedMajor}
                                onChange={(e) => setSelectedMajor(e.target.value)}
                                required
                            >
                                <option value="">Select major</option>
                                {allMajors.map(major => (
                                    <option key={major} value={major}>
                                        {major}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Date/Time</label>
                            <input
                                type="datetime-local"
                                value={dateTime}
                                onChange={(e) => setDateTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                            >
                                <option value="">Select location</option>
                                {dsuCampusLocations.map(loc => (
                                    <option key={loc.name} value={loc.name}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Capacity</label>
                            <input
                                type="number"
                                min="3"
                                max="10"
                                value={capacity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val >= 3 && val <= 10) {
                                        setCapacity(val);
                                    }
                                }}
                                required
                            />
                        </div>
                        <button type="submit" className="submit-btn">Submit</button>
                    </form>
                </div>

                <div className="stats-section">
                    <h2>Number of active sessions: {sessions.filter(s => s.active).length}</h2>
                    <h3>Sessions by Department:</h3>
                    <div style={{ width: '600px', height: '400px', margin: '0 auto' }}>
                        <Pie
                            data={{
                                labels: Object.keys(departmentsAndMajors),
                                datasets: [{
                                    data: Object.keys(departmentsAndMajors).map(dept => 
                                        sessions.filter(session => 
                                            departmentsAndMajors[dept].includes(session.major)
                                        ).length
                                    ),
                                    backgroundColor: [
                                        '#FF6384',
                                        '#36A2EB',
                                        '#FFCE56',
                                        '#4BC0C0',
                                        '#9966FF',
                                        '#FF9F40',
                                        '#FF6384',
                                        '#36A2EB'
                                    ],
                                    borderColor: [
                                        '#FF6384',
                                        '#36A2EB',
                                        '#FFCE56',
                                        '#4BC0C0',
                                        '#9966FF',
                                        '#FF9F40',
                                        '#FF6384',
                                        '#36A2EB'
                                    ],
                                    borderWidth: 1,
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    layout: {
                                        padding: {
                                            right: 100
                                        }
                                    },
                                    legend: {
                                        position: 'right',
                                        align: 'start',
                                        labels: {
                                            boxWidth: 10,
                                            padding: 15,
                                            font: {
                                                size: 11
                                            },
                                            textAlign: 'left',
                                            wrap: true,
                                            maxWidth: 250
                                        }
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                const label = context.label || '';
                                                const value = context.raw || 0;
                                                return `${label}: ${value} sessions`;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="action-buttons">
                <button className="action-btn" onClick={() => navigate("/calendar")}>View Calendar</button>
                <button className="action-btn" onClick={() => setScreen("duo")}>
                    Switch to Duo Session
                </button>
            </div>

            <div className="filters">
                <div className="filter-group">
                    <label>Department:</label>
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                        <option value="">Select department</option>
                        {Object.keys(departmentsAndMajors).map(dept => (
                            <option key={dept} value={dept}>
                                {dept}
                            </option>
                        ))}
                    </select>
                </div>

                <button 
                    className="action-btn" 
                    onClick={() => setShowFiltered(!showFiltered)}
                >
                    {showFiltered ? 'Show All Sessions' : 'View Open Sessions'}
                </button>
            </div>

            <div className="session-section">
                <h2>Available Group Sessions</h2>
                <div className="session-cards">
                    {filteredSessions.map((session) => {
                        const isParticipant = user ? session.participants?.some(p => p.uid === user.uid) : false;
                        const participantCount = session.participants?.length || 0;
                        return (
                            <div key={session.id} className="session-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img
                                            src={session.photoURL || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                            alt={session.displayName}
                                            className="profile-img"
                                        />
                                        <h3 style={{ margin: 0 }}>{session.displayName}</h3>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                cursor: 'pointer',
                                                padding: '5px 10px',
                                                borderRadius: '4px',
                                                backgroundColor: activeChatSession === session.id ? '#4a90e2' : 'transparent',
                                                color: activeChatSession === session.id ? 'white' : 'inherit',
                                                marginRight: '10px'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveChatSession(activeChatSession === session.id ? null : session.id);
                                            }}
                                        >
                                            <FaComments
                                                className="chat-icon"
                                                style={{ fontSize: '20px' }}
                                            />
                                        </div>
                                        <div
                                            className="capacity-indicator"
                                            onClick={(e) => handleCapacityClick(session, e)}
                                            style={{
                                                backgroundColor: (() => {
                                                    const fillPercentage = (participantCount / session.capacity) * 100;
                                                    if (fillPercentage >= 75) return '#ff6b6b';  // Red
                                                    if (fillPercentage >= 50) return '#ffd93d';  // Yellow
                                                    return '#4BC0C0';  // Green
                                                })(),
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                textShadow: '0px 1px 2px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            {participantCount}/{session.capacity}
                                        </div>
                                    </div>
                                </div>
                                <p>Course: {session.course}</p>
                                <p>Major: {session.major}</p>
                                <p>Time: {new Date(session.dateTime).toLocaleString()}</p>
                                <p>Place: {session.location}</p>
                                <div className="session-actions">
                                    {!user ? (
                                        <button
                                            className="join-btn"
                                            onClick={() => alert('Please login to join sessions')}
                                        >
                                            Login to Join
                                        </button>
                                    ) : user.uid === session.userId ? (
                                        <button
                                            className="disband-btn"
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to disband this session? This action cannot be undone.')) {
                                                    handleDisbandSession(session.id);
                                                }
                                            }}
                                        >
                                            Disband Session
                                        </button>
                                    ) : isParticipant ? (
                                        <button
                                            className="leave-btn"
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to leave this session?')) {
                                                    handleLeaveSession(session.id);
                                                }
                                            }}
                                        >
                                            Leave Session
                                        </button>
                                    ) : (
                                        <button
                                            className={`join-btn ${participantCount >= session.capacity ? 'full' : ''}`}
                                            onClick={() => !session.full && handleJoinSession(session.id)}
                                            disabled={participantCount >= session.capacity}
                                        >
                                            {participantCount >= session.capacity ? 'Session Full' : 'Join Session'}
                                        </button>
                                    )}
                                </div>
                                {selectedSession?.id === session.id && (
                                    <div className={`participants-menu ${selectedSession ? 'open' : ''}`}>
                                        <h3>Session Participants</h3>
                                        <div className="participants-grid">
                                            {session.participants?.map(participant => (
                                                <div key={participant.uid} className="participant-item">
                                                    <img
                                                        src={participant.photoURL || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                                        alt={participant.displayName}
                                                        className="participant-img"
                                                    />
                                                    <span className="participant-name">{participant.displayName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <button className="back-button" onClick={() => setScreen("home")}>
                Back to Home
            </button>

            {activeChatSession && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 999
                        }}
                        onClick={() => setActiveChatSession(null)}
                    />
                    <ChatWindow
                        sessionId={activeChatSession}
                        isOpen={true}
                        onClose={() => setActiveChatSession(null)}
                    />
                </>
            )}
        </div>
    );
}

export default function StudyWithBuddy() {
    const [screen, setScreen] = useState("home");

    return (
        <div>
            {screen === "home" && <HomeScreen setScreen={setScreen} />}
            {screen === "duo" && <DuoSessions setScreen={setScreen} />}
            {screen === "group" && <GroupSessions setScreen={setScreen} />}
        </div>
    );
}