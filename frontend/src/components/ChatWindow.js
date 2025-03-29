import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc } from 'firebase/firestore';
import { FaRobot } from 'react-icons/fa';
import firebase from '../firebase';
import './ChatWindow.css';

const ChatWindow = ({ sessionId, isOpen, onClose, isHornet }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesContainerRef = useRef(null);
    
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
            messagesContainerRef.current.scrollTop = 0;
        }
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const isGroupSession = window.location.pathname.includes('group');
            const collectionPath = isGroupSession ? 'groupSessions' : 'sessions';
            const sessionRef = doc(firebase.db, collectionPath, sessionId);
            const messagesRef = collection(sessionRef, 'messages');
            
            await addDoc(messagesRef, {
                text: newMessage.trim(),
                userId: firebase.auth.currentUser.uid,
                displayName: firebase.auth.currentUser.displayName,
                photoURL: firebase.auth.currentUser.photoURL,
                timestamp: serverTimestamp()
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
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
                        />
                    )}
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
            </div>
            <div className="messages-container" ref={messagesContainerRef}>
                <div style={{ position: 'relative', minHeight: '100%' }}>
                    {messages.map((message, index) => (
                        <div 
                            key={message.id} 
                            className={`message ${message.userId === firebase.auth.currentUser?.uid ? 'own-message' : ''}`}
                            style={{
                                position: 'absolute',
                                top: `${index * 70}px`,
                                width: '100%'
                            }}
                        >
                            <div className="message-sender">
                                {message.displayName}
                            </div>
                            <div className="message-content">
                                {message.text}
                            </div>
                        </div>
                    ))}
                    <div style={{ height: `${messages.length * 70}px` }} />
                </div>
            </div>
            <form onSubmit={handleSubmit} className="message-form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                />
                <button type="submit" className="send-button">Send</button>
            </form>
        </div>
    );
};

export default ChatWindow;