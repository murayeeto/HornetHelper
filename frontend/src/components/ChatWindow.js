import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { FaRobot } from 'react-icons/fa';
import axios from 'axios';
import firebase from '../firebase';
import './ChatWindow.css';

const ChatWindow = ({ sessionId, isOpen, onClose, isHornet }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showAiButtons, setShowAiButtons] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const messagesContainerRef = useRef(null);
    const MAX_CHARS = 400;
    
    useEffect(() => {
        if (!sessionId) return;

        let unsubscribe = () => {};

        const setupMessagesListener = async () => {
            try {
                // First try groupSessions
                let collectionPath = 'groupSessions';
                let sessionDocRef = doc(firebase.db, collectionPath, sessionId);
                let sessionDoc = await getDoc(sessionDocRef);

                // If not found, try regular sessions
                if (!sessionDoc.exists()) {
                    collectionPath = 'sessions';
                    sessionDocRef = doc(firebase.db, collectionPath, sessionId);
                }

                const messagesRef = collection(sessionDocRef, 'messages');
                const q = query(messagesRef, orderBy('timestamp', 'asc'));

                unsubscribe = onSnapshot(q, (snapshot) => {
                    const newMessages = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setMessages(newMessages);
                });
            } catch (error) {
                console.error("Error setting up messages listener:", error);
            }
        };

        setupMessagesListener();
        return () => unsubscribe();
    }, [sessionId]);

    useEffect(() => {
        if (messagesContainerRef.current) {
            const scrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedMessage = newMessage.trim();
        if (!trimmedMessage || trimmedMessage.length > MAX_CHARS) return;

        try {
            // First try groupSessions
            let collectionPath = 'groupSessions';
            let sessionDocRef = doc(firebase.db, collectionPath, sessionId);
            let sessionDoc = await getDoc(sessionDocRef);

            // If not found, try regular sessions
            if (!sessionDoc.exists()) {
                collectionPath = 'sessions';
                sessionDocRef = doc(firebase.db, collectionPath, sessionId);
            }

            const messagesRef = collection(sessionDocRef, 'messages');
            
            await addDoc(messagesRef, {
                text: trimmedMessage,
                userId: firebase.auth.currentUser.uid,
                displayName: firebase.auth.currentUser.displayName,
                photoURL: firebase.auth.currentUser.photoURL,
                timestamp: serverTimestamp(),
                isAiMessage: false
            });
            setNewMessage('');
            setCharCount(0);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleAiRecommend = async () => {
        setLoading(true);
        try {
            if (!sessionId) {
                throw new Error('No session ID provided');
            }

            // First try to find the session in groupSessions
            let collectionPath = 'groupSessions';
            let sessionDocRef = doc(firebase.db, collectionPath, sessionId);
            let sessionDoc = await getDoc(sessionDocRef);

            // If not found in groupSessions, try regular sessions
            if (!sessionDoc.exists()) {
                collectionPath = 'sessions';
                sessionDocRef = doc(firebase.db, collectionPath, sessionId);
                sessionDoc = await getDoc(sessionDocRef);
            }

            console.log("Getting session data for:", {
                sessionId,
                collectionPath,
                exists: sessionDoc.exists()
            });

            if (!sessionDoc.exists()) {
                throw new Error(`Session document not found: ${sessionId} in either collection`);
            }

            const sessionRef = sessionDocRef;
            const messagesRef = collection(sessionRef, 'messages');

            const sessionData = sessionDoc.data();
            console.log("Session data:", sessionData);
            console.log("Course from session:", sessionData?.course);

            // Check if we have course data
            if (!sessionData?.course) {
                throw new Error(`Session found but no course information available. Session ID: ${sessionId}`);
            }

            // Get video recommendations from backend
            const response = await axios.post('http://localhost:8888/api/recommend-video', {
                major: sessionData.course // Using course for recommendations
            });

            // Format video recommendations
            const videos = response.data;
            const recommendationText = videos.map(video => 
                `${video.title}\n${video.url}\n${video.description}\n`
            ).join('\n');
            
            await addDoc(messagesRef, {
                text: `Here are some recommended videos for ${sessionData.course}:\n\n${recommendationText}`,
                userId: "ai",
                displayName: "AI Assistant",
                timestamp: serverTimestamp(),
                isAiMessage: true,
                visibleToHornet: true
            });
            
            setShowAiButtons(false);
        } catch (error) {
            console.error("Error getting recommendations:", error);
            // Add error message to chat
            const isGroupSession = window.location.pathname.includes('group');
            const collectionPath = isGroupSession ? 'groupSessions' : 'sessions';
            const messagesRef = collection(doc(firebase.db, collectionPath, sessionId), 'messages');
            await addDoc(messagesRef, {
                text: error.message.includes('No session ID provided')
                    ? "Error: Chat session not properly initialized. Please try refreshing the page."
                    : error.message.includes('Session document not found')
                    ? "Error: Could not find the chat session. Please try refreshing the page."
                    : error.message.includes('Session found but no course information')
                    ? "Error: This chat session doesn't have a course assigned to it. Please make sure you're in a course-specific chat."
                    : "Sorry, I couldn't get video recommendations at the moment. Please try again later.",
                userId: "ai",
                displayName: "AI Assistant",
                timestamp: serverTimestamp(),
                isAiMessage: true,
                visibleToHornet: true
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAiAsk = async () => {
        setLoading(true);
        try {
            // First try groupSessions
            let collectionPath = 'groupSessions';
            let sessionDocRef = doc(firebase.db, collectionPath, sessionId);
            let sessionDoc = await getDoc(sessionDocRef);

            // If not found, try regular sessions
            if (!sessionDoc.exists()) {
                collectionPath = 'sessions';
                sessionDocRef = doc(firebase.db, collectionPath, sessionId);
            }

            const messagesRef = collection(sessionDocRef, 'messages');
            
            // Only proceed if there's a message
            if (!newMessage.trim()) {
                return;
            }

            // Get AI response from backend
            const response = await axios.post('http://localhost:8888/api/ask-ai', {
                message: newMessage.trim()
            });
            
            // Add user's question to chat
            await addDoc(messagesRef, {
                text: newMessage.trim(),
                userId: firebase.auth.currentUser.uid,
                displayName: firebase.auth.currentUser.displayName,
                timestamp: serverTimestamp(),
                isAiMessage: false
            });

            // Add AI's response to chat
            await addDoc(messagesRef, {
                text: response.data.response,
                userId: "ai",
                displayName: "AI Assistant",
                timestamp: serverTimestamp(),
                isAiMessage: true,
                visibleToHornet: true
            });
            
            // Clear the input after sending
            setNewMessage('');
            setCharCount(0);
            setShowAiButtons(false);
        } catch (error) {
            console.error("Error getting AI response:", error);
            console.error("Error details:", {
                message: error.message,
                response: error.response,
                status: error.response?.status,
                data: error.response?.data
            });
            // Add error message to chat
            const isGroupSession = window.location.pathname.includes('group');
            const collectionPath = isGroupSession ? 'groupSessions' : 'sessions';
            const messagesRef = collection(doc(firebase.db, collectionPath, sessionId), 'messages');
            await addDoc(messagesRef, {
                text: "Sorry, I'm having trouble connecting to the AI at the moment. Please try again later.",
                userId: "ai",
                displayName: "AI Assistant",
                timestamp: serverTimestamp(),
                isAiMessage: true,
                visibleToHornet: true
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="chat-window">
            <div className="chat-header">
                <h3>The Hive</h3>
                <div className="header-controls">
                    {isHornet && (
                        <FaRobot 
                            className="robot-icon"
                            style={{ 
                                fontSize: '20px',
                                marginRight: '10px',
                                color: 'white'
                            }}
                            onClick={() => setShowAiButtons(!showAiButtons)}
                        />
                    )}
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
            </div>
            <div className="messages-container" ref={messagesContainerRef}>
                {messages.map((message) => (
                    (message.isAiMessage && !isHornet) ? null : (
                        <div 
                            key={message.id} 
                            className={`chat-message ${message.userId === firebase.auth.currentUser?.uid ? 'user' : 'ai'}`}
                        >
                            <div className="message-content">
                                <span className="message-sender">
                                    {message.userId === firebase.auth.currentUser?.uid ? 'You' : message.displayName}
                                </span>
                                <p>{message.text}</p>
                            </div>
                        </div>
                    )
                ))}
                {loading && (
                    <div className="chat-message ai">
                        <div className="message-content">
                            <span className="message-sender">AI Assistant</span>
                            <p>Thinking...</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="message-form-container">
                {showAiButtons && isHornet && (
                    <div className="ai-buttons">
                        <button 
                            onClick={handleAiRecommend} 
                            className="ai-button recommend"
                            disabled={loading}
                        >
                            Recommend
                        </button>
                        <button 
                            onClick={handleAiAsk} 
                            className="ai-button ask"
                            disabled={loading}
                        >
                            Ask
                        </button>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="message-form">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            const text = e.target.value;
                            if (text.length <= MAX_CHARS) {
                                setNewMessage(text);
                                setCharCount(text.length);
                            }
                        }}
                        placeholder="Type a message..."
                        className="message-input"
                        maxLength={MAX_CHARS}
                        disabled={loading}
                    />
                    <div style={{
                        position: 'absolute',
                        right: '100px',
                        bottom: '-20px',
                        fontSize: '12px',
                        color: charCount >= MAX_CHARS ? '#ff4444' : '#666'
                    }}>
                        {charCount}/{MAX_CHARS}
                    </div>
                    <button 
                        type="submit" 
                        className="send-button"
                        disabled={loading || !newMessage.trim() || newMessage.length > MAX_CHARS}
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;