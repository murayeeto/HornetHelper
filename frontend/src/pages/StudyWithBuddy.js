import React, { useState } from "react";
import "./StudyWithBuddy.css";

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
    const [subject, setSubject] = useState("");
    const [dateTime, setDateTime] = useState("");
    const [location, setLocation] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");
    const [gender, setGender] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle session creation logic here
    };

    return (
        <div className="duo-container">
            <div className="duo-grid">
                <div className="create-session">
                    <h2>Create new session</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Enter subject"
                            />
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
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Enter location"
                            />
                        </div>
                        <button type="submit" className="submit-btn">Submit</button>
                    </form>
                </div>

                <div className="stats-section">
                    <h2>Number of active sessions: 21</h2>
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
                    <label>Course:</label>
                    <select 
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                    >
                        <option value="">Select course</option>
                        <option value="networking">Computer Networking</option>
                        <option value="programming">Programming</option>
                        <option value="database">Database Systems</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Gender:</label>
                    <input
                        type="radio"
                        id="male"
                        name="gender"
                        value="M"
                        checked={gender === "M"}
                        onChange={(e) => setGender(e.target.value)}
                    />
                    <label htmlFor="male">M</label>
                    <input
                        type="radio"
                        id="female"
                        name="gender"
                        value="F"
                        checked={gender === "F"}
                        onChange={(e) => setGender(e.target.value)}
                    />
                    <label htmlFor="female">F</label>
                </div>

                <button className="action-btn">View Open Sessions</button>
            </div>

            <div className="session-cards">
                <div className="session-card">
                    <img
                        src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                        alt="Valery Louis"
                        className="profile-img"
                    />
                    <h3>Valery Louis</h3>
                    <p>Course: Computer Networking</p>
                    <p>Time: 04/01/25 at 4:00pm</p>
                    <p>Place: William C. Jason Library</p>
                    <button className="join-btn">Join Session</button>
                </div>

                <div className="session-card">
                    <img
                        src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                        alt="Matthew Little"
                        className="profile-img"
                    />
                    <h3>Matthew Little</h3>
                    <p>Course: Computer Networking</p>
                    <p>Time: 04/01/25 at 4:00pm</p>
                    <p>Place: William C. Jason Library</p>
                    <button className="join-btn">Join Session</button>
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