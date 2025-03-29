import React, { useState, useEffect } from "react";
import "./StudyWithBuddy.css";
import { useAuth } from "../contexts/AuthContext";
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    doc,
    setDoc,
    deleteDoc,
    arrayUnion,
    arrayRemove,
    getDoc
} from 'firebase/firestore';
import firebase from '../firebase';
import dsuCampusLocations from '../data/dsuCampusLocations';
import departmentsAndMajors from '../data/departmentsAndMajors';

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
    const [dateTime, setDateTime] = useState("");
    const [location, setLocation] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedMajor, setSelectedMajor] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [gender, setGender] = useState("");
    const [sessions, setSessions] = useState([]);

    // Get all majors from all departments
    const allMajors = Object.values(departmentsAndMajors).flat();

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
            } catch (error) {
                console.error("Error fetching sessions:", error);
            }
        };
        fetchSessions();
    }, []);

    const handleLeaveSession = async (sessionId) => {
        try {
            const sessionRef = doc(firebase.db, 'sessions', sessionId);
            const session = sessions.find(s => s.id === sessionId);
            
            // Remove from calendar
            await removeFromCalendar(session);
            
            await setDoc(sessionRef, {
                participants: arrayRemove({
                    uid: user.uid,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                }),
                full: false,
                updatedAt: serverTimestamp()
            }, { merge: true });

            // Update local state
            setSessions(prevSessions =>
                prevSessions.map(session =>
                    session.id === sessionId
                        ? {
                            ...session,
                            participants: session.participants.filter(p => p.uid !== user.uid),
                            full: false
                        }
                        : session
                )
            );
        } catch (error) {
            console.error("Error leaving session:", error);
        }
    };

    const removeFromCalendar = async (sessionData) => {
        try {
            const date = new Date(sessionData.dateTime);
            const dateKey = date.toISOString().split('T')[0];
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const timeValue = hours + (minutes / 60);

            // Get current calendar events
            const eventsRef = doc(firebase.db, 'users', user.uid, 'data', 'events');
            const eventsSnap = await getDoc(eventsRef);
            
            if (eventsSnap.exists()) {
                const currentEvents = eventsSnap.data().events || {};
                
                if (currentEvents[dateKey] && currentEvents[dateKey][timeValue]) {
                    delete currentEvents[dateKey][timeValue];
                    
                    // Clean up empty dates
                    if (Object.keys(currentEvents[dateKey]).length === 0) {
                        delete currentEvents[dateKey];
                    }
                    
                    // Update Firebase
                    await setDoc(eventsRef, { events: currentEvents });
                }
            }
        } catch (error) {
            console.error("Error removing from calendar:", error);
        }
    };

    const handleDisbandSession = async (sessionId) => {
        try {
            const session = sessions.find(s => s.id === sessionId);
            const sessionRef = doc(firebase.db, 'sessions', sessionId);
            
            // Remove from calendar
            await removeFromCalendar(session);
            
            // Delete session
            await deleteDoc(sessionRef);

            // Update local state
            setSessions(prevSessions =>
                prevSessions.filter(session => session.id !== sessionId)
            );
        } catch (error) {
            console.error("Error disbanding session:", error);
        }
    };

    const addToCalendar = async (sessionData) => {
        try {
            const date = new Date(sessionData.dateTime);
            const dateKey = date.toISOString().split('T')[0];
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            const timeValue = hours + (minutes / 60);

            // Get current calendar events
            const eventsRef = doc(firebase.db, 'users', user.uid, 'data', 'events');
            const eventsSnap = await getDoc(eventsRef);
            const currentEvents = eventsSnap.exists() ? eventsSnap.data().events || {} : {};

            // Create new event
            const newEvents = {
                ...currentEvents,
                [dateKey]: {
                    ...(currentEvents[dateKey] || {}),
                    [timeValue]: {
                        id: Date.now(),
                        title: `Study Session: ${sessionData.course}`,
                        color: '#00A7E3',
                        displayTime: `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
                    }
                }
            };

            // Update Firebase
            await setDoc(eventsRef, { events: newEvents }, { merge: true });
        } catch (error) {
            console.error("Error adding to calendar:", error);
        }
    };

    const handleJoinSession = async (sessionId) => {
        try {
            const sessionRef = doc(firebase.db, 'sessions', sessionId);
            const session = sessions.find(s => s.id === sessionId);
            
            if (session.participants?.length >= 2) {
                alert("Session is full, please join another one");
                return;
            }

            const newParticipant = {
                uid: user.uid,
                displayName: user.displayName,
                photoURL: user.photoURL
            };

            const updatedParticipants = [...(session.participants || []), newParticipant];
            const isFull = updatedParticipants.length === 2;

            await setDoc(sessionRef, {
                participants: arrayUnion(newParticipant),
                full: isFull,
                updatedAt: serverTimestamp()
            }, { merge: true });

            // Add to calendar
            await addToCalendar(session);

            // Update local state
            setSessions(prevSessions =>
                prevSessions.map(session =>
                    session.id === sessionId
                        ? {
                            ...session,
                            participants: updatedParticipants,
                            full: isFull
                        }
                        : session
                )
            );
        } catch (error) {
            console.error("Error joining session:", error);
        }
    };

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
            
            // Add to calendar
            await addToCalendar(sessionData);
            
            // Add the new session to the state
            setSessions(prevSessions => [{
                id: docRef.id,
                ...sessionData,
                createdAt: new Date() // Use current date for immediate display
            }, ...prevSessions]);

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
                    <h2>Create new session</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Course</label>
                            <input
                                type="text"
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                placeholder="Enter course (e.g. COMP 3700)"
                            />
                        </div>
                        <div className="form-group">
                            <label>Major</label>
                            <select
                                value={selectedMajor}
                                onChange={(e) => setSelectedMajor(e.target.value)}
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
                            />
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
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
                    <h3>Sections by subject:</h3>
                    {/* Add your pie chart component here */}
                </div>
            </div>

            <div className="action-buttons">
                <button className="action-btn">View Calendar</button>
                <button className="action-btn" onClick={() => setScreen("group")}>
                    Switch to Group Session
                </button>
                <button className="action-btn">Ask AI for help</button>
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

                <button className="action-btn">View Open Sessions</button>
            </div>

            <div className="session-section">
                <h2>Available Study Sessions</h2>
                <div className="session-cards">
                    {sessions
                        .filter(session => !selectedDepartment || departmentsAndMajors[selectedDepartment].includes(session.major))
                        .map(session => {
                        const isParticipant = session.participants?.some(p => p.uid === user.uid);
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
                                        {session.full && (
                                            <span className="session-status full">Session Full</span>
                                        )}
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
                                    {user.uid === session.userId ? (
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
        </div>
    );
}

function GroupSessions({ setScreen }) {
    return (
        <section className="session-container">
            <h1 className="title">Group Sessions</h1>
            <p className="description">Join a group study session and learn together.</p>
            <button className="back-button" onClick={() => setScreen("home")}>
                Back to Home
            </button>
        </section>
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