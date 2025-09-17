import React, { useState, useEffect, useRef } from 'react';
import { getConversations, getMessagesInConversation, sendMessage, getAllDoctors, startConversation } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import './MessagesPage.css';

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const messagesEndRef = useRef(null);

  const currentUserId = parseInt(localStorage.getItem('user_id'));

  useEffect(() => {
    fetchConversations();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      setError('Failed to fetch conversations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await getAllDoctors();
      setDoctors(data);
    } catch (err) {
      console.error("Could not fetch doctors");
    }
  };

  const fetchMessages = async (convoId) => {
    try {
      const data = await getMessagesInConversation(convoId);
      setMessages(data);
    } catch (err) {
      setError('Failed to fetch messages.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      await sendMessage(selectedConversation.id, newMessage);
      setNewMessage('');
      fetchMessages(selectedConversation.id);
    } catch (err) {
      setError('Failed to send message.');
    }
  };

  const handleStartConversation = async (doctorUserId) => {
    try {
      const newConvo = await startConversation(doctorUserId);
      setShowNewChatModal(false);
      fetchConversations();
      setSelectedConversation(newConvo); // Automatically select the new chat
    } catch (err) {
      setError("Failed to start new conversation. A chat may already exist.");
    }
  };


  if (loading) return <LoadingSpinner />;

  return (
    <div className="messages-container">
      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Start a new chat</h2>
            <div className="doctors-list">
              {doctors.map(doc => (
                <div key={doc.user} className="doctor-item" onClick={() => handleStartConversation(doc.user)}>
                  <p>Dr. {doc.full_name}</p>
                  <span>{doc.specialization}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowNewChatModal(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="conversations-list">
        <div className="conversations-header">
          <h2>Chats</h2>
          <button onClick={() => setShowNewChatModal(true)} className="new-chat-btn">+</button>
        </div>
        {conversations.map(convo => (
          <div
            key={convo.id}
            className={`conversation-item ${selectedConversation?.id === convo.id ? 'selected' : ''}`}
            onClick={() => setSelectedConversation(convo)}
          >
            {convo.participants.find(p => p.id !== currentUserId)?.username || 'Conversation'}
          </div>
        ))}
      </div>
      <div className="chat-window">
        {selectedConversation ? (
          <>
            <div className="messages-list">
              {messages.map(msg => (
                <div key={msg.id} className={`message-item ${msg.sender === currentUserId ? 'sent' : 'received'}`}>
                  <div className="message-bubble">
                    <strong>{msg.sender_username}</strong>
                    <p>{msg.message}</p>
                    <span className="timestamp">{new Date(msg.sent_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">Select a conversation to start chatting.</div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;