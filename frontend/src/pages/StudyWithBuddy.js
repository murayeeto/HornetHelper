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
    return (
        <section className="session-container">
            <h1 className="title">Duo Sessions</h1>
            <p className="description">Find a study partner and collaborate on learning.</p>
            <button className="back-button" onClick={() => setScreen("home")}>
                Back to Home
            </button>
        </section>
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