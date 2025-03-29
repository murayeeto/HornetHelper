import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { FaRobot } from 'react-icons/fa';
import axios from 'axios';
import firebase from '../firebase';
import './ChatWindow.css';

/**
 * ChatWindow Component
 * Provides real-time chat functionality with AI integration for both duo and group study sessions.
 *
 * @param {string} sessionId - Unique identifier for the chat session
 * @param {boolean} isOpen - Controls chat window visibility
 * @param {function} onClose - Handler for closing the chat window
 * @param {boolean} isHornet - Indicates if user has AI assistant privileges
 */
const ChatWindow = ({ sessionId, isOpen, onClose, isHornet }) => {
    // State management for chat functionality
    const [messages, setMessages] = useState([]); // Chat message history
    const [newMessage, setNewMessage] = useState(''); // Current message input
    const [showAiButtons, setShowAiButtons] = useState(false); // AI feature visibility toggle
    const [charCount, setCharCount] = useState(0); // Message length counter
    const [loading, setLoading] = useState(false); // Loading state for AI operations
    const messagesContainerRef = useRef(null); // Reference for auto-scrolling
    const MAX_CHARS = 400; // Maximum characters per message
    
    // Set up real-time listener for chat messages
    useEffect(() => {
        if (!sessionId) return;

        let unsubscribe = () => {};

        const setupMessagesListener = async () => {
            try {
                // Smart collection detection: tries group sessions first, then falls back to duo sessions
                let collectionPath = 'groupSessions';
                let sessionDocRef = doc(firebase.db, collectionPath, sessionId);
                let sessionDoc = await getDoc(sessionDocRef);

                if (!sessionDoc.exists()) {
                    collectionPath = 'sessions';
                    sessionDocRef = doc(firebase.db, collectionPath, sessionId);
                }

                // Set up real-time updates for messages
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
        // Clean up listener on unmount or session change
        return () => unsubscribe();
    }, [sessionId]);

    // Auto-scroll chat to bottom when new messages arrive
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

    /**
     * Handles video recommendations for the current course
     * Fetches course-specific educational videos and displays them as clickable links
     */
    const handleAiRecommend = async () => {
        setLoading(true);
        try {
            if (!sessionId) {
                throw new Error('No session ID provided');
            }

            // Smart session detection for both group and duo sessions
            let collectionPath = 'groupSessions';
            let sessionDocRef = doc(firebase.db, collectionPath, sessionId);
            let sessionDoc = await getDoc(sessionDocRef);

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

            if (!sessionData?.course) {
                throw new Error(`Session found but no course information available. Session ID: ${sessionId}`);
            }

            // Fetch video recommendations from AI service
            const response = await axios.post('http://localhost:8888/api/recommend-video', {
                major: sessionData.course
            });

            // Format videos with clickable links and visual organization
            const videos = response.data;
            const recommendationText = videos.map(video => (
                `<div style="margin-bottom: 20px;">
                    <strong>📺 ${video.title}</strong><br/>
                    <a href="${video.url}" target="_blank" rel="noopener noreferrer">🔗 Watch Video</a><br/>
                    <span>📝 ${video.description}</span>
                </div>`
            )).join('\n');
            
            // Add formatted recommendations to chat
            await addDoc(messagesRef, {
                text: `<div>
                    <h3>Here are some recommended videos for ${sessionData.course}:</h3>
                    ${recommendationText}
                </div>`,
                isHtml: true,
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

    /**
     * Handles AI-powered Q&A interactions
     * Sends user's question to AI service and displays the response in chat
     */
    const handleAiAsk = async () => {
        setLoading(true);
        try {
            // Smart session detection for both group and duo sessions
            let collectionPath = 'groupSessions';
            let sessionDocRef = doc(firebase.db, collectionPath, sessionId);
            let sessionDoc = await getDoc(sessionDocRef);

            if (!sessionDoc.exists()) {
                collectionPath = 'sessions';
                sessionDocRef = doc(firebase.db, collectionPath, sessionId);
            }

            const messagesRef = collection(sessionDocRef, 'messages');
            
            if (!newMessage.trim()) {
                return;
            }

            // Get AI response for user's question
            const response = await axios.post('http://localhost:8888/api/ask-ai', {
                message: newMessage.trim()
            });
            
            // Add user's question to chat history
            await addDoc(messagesRef, {
                text: newMessage.trim(),
                userId: firebase.auth.currentUser.uid,
                displayName: firebase.auth.currentUser.displayName,
                timestamp: serverTimestamp(),
                isAiMessage: false
            });

            // Add AI's response to chat history
            await addDoc(messagesRef, {
                text: response.data.response,
                userId: "ai",
                displayName: "AI Assistant",
                timestamp: serverTimestamp(),
                isAiMessage: true,
                visibleToHornet: true
            });
            
            // Reset input state
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
            {/* Chat Header with AI Assistant Toggle */}
            <div className="chat-header">
                <h3>The Hive</h3>
                <div className="header-controls">
                    {/* AI Assistant button only shown to users with Hornet privileges */}
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

            {/* Messages Display with Auto-scroll */}
            <div className="messages-container" ref={messagesContainerRef}>
                {messages.map((message) => (
                    // Hide AI messages from non-Hornet users
                    (message.isAiMessage && !isHornet) ? null : (
                        <div
                            key={message.id}
                            className={`chat-message ${message.userId === firebase.auth.currentUser?.uid ? 'user' : 'ai'}`}
                        >
                            <div className="message-content">
                                <span className="message-sender">
                                    {message.userId === firebase.auth.currentUser?.uid ? 'You' : message.displayName}
                                </span>
                                {/* Support for both HTML and plain text messages */}
                                {message.isHtml ? (
                                    <p dangerouslySetInnerHTML={{ __html: message.text }} />
                                ) : (
                                    <p>{message.text}</p>
                                )}
                            </div>
                        </div>
                    )
                ))}
                {/* Loading indicator for AI operations */}
                {loading && (
                    <div className="chat-message ai">
                        <div className="message-content">
                            <span className="message-sender">AI Assistant</span>
                            <p>Thinking...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Message Input and AI Controls */}
            <div className="message-form-container">
                {/* AI Feature Buttons */}
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