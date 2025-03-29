import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc } from 'firebase/firestore';
import { FaRobot } from 'react-icons/fa';
import firebase from '../firebase';
import './ChatWindow.css';

const ChatWindow = ({ sessionId, isOpen, onClose, isHornet }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showAiButtons, setShowAiButtons] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const messagesContainerRef = useRef(null);
    const MAX_CHARS = 400;
    
    useEffect(() => {
        if (!sessionId) return;

        const isGroupSession = window.location.pathname.includes('group');
        const collectionPath = isGroupSession ? 'groupSessions' : 'sessions';
        const sessionRef = doc(firebase.db, collectionPath, sessionId);
        const messagesRef = collection(sessionRef, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(newMessages);
        });

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
            const isGroupSession = window.location.pathname.includes('group');
            const collectionPath = isGroupSession ? 'groupSessions' : 'sessions';
            const sessionRef = doc(firebase.db, collectionPath, sessionId);
            const messagesRef = collection(sessionRef, 'messages');
            
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
        try {
            const isGroupSession = window.location.pathname.includes('group');
            const collectionPath = isGroupSession ? 'groupSessions' : 'sessions';
            const sessionRef = doc(firebase.db, collectionPath, sessionId);
            const messagesRef = collection(sessionRef, 'messages');
            
            await addDoc(messagesRef, {
                text: "Here are some recommended videos:\n\nhttps://youtube.com/watch?v=example1\nhttps://youtube.com/watch?v=example2\nhttps://youtube.com/watch?v=example3",
                userId: "ai",
                displayName: "AI Assistant",
                timestamp: serverTimestamp(),
                isAiMessage: true,
                visibleToHornet: true
            });
            
            setShowAiButtons(false);
        } catch (error) {
            console.error("Error getting recommendations:", error);
        }
    };

    const handleAiAsk = async () => {
        try {
            const isGroupSession = window.location.pathname.includes('group');
            const collectionPath = isGroupSession ? 'groupSessions' : 'sessions';
            const sessionRef = doc(firebase.db, collectionPath, sessionId);
            const messagesRef = collection(sessionRef, 'messages');
            
            await addDoc(messagesRef, {
                text: "This is a simulated AI response. Replace with actual backend integration.",
                userId: "ai",
                displayName: "AI Assistant",
                timestamp: serverTimestamp(),
                isAiMessage: true,
                visibleToHornet: true
            });
            
            setShowAiButtons(false);
        } catch (error) {
            console.error("Error getting AI response:", error);
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
            </div>
            <div className="message-form-container">
                {showAiButtons && isHornet && (
                    <div className="ai-buttons">
                        <button onClick={handleAiRecommend} className="ai-button recommend">
                            Recommend
                        </button>
                        <button onClick={handleAiAsk} className="ai-button ask">
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
                        disabled={!newMessage.trim() || newMessage.length > MAX_CHARS}
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;