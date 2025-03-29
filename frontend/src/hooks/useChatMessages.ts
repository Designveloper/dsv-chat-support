import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { chatService } from '../services/chatService';

export function useChatMessages(sessionId: string | null) {
    const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
    const [messageText, setMessageText] = useState<string>("");
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load saved messages when session ID changes
    useEffect(() => {
        if (sessionId) {
            const savedMessages = chatService.getSavedMessages(sessionId);
            if (savedMessages && savedMessages.length > 0) {
                setMessages(savedMessages);
            } else {
                // Set welcome message if no saved messages
                setMessages([{
                    text: "Welcome! How can we help you today?",
                    isUser: false
                }]);
            }

            // Set up WebSocket connection
            const socket = chatService.setupWebSocketConnection(sessionId, (text) => {
                setMessages((prev) => [...prev, { text, isUser: false }]);
            });

            socketRef.current = socket;

            // Clean up on unmount
            return () => {
                chatService.disconnect();
            };
        } else {
            // Clear messages if no session
            setMessages([]);
        }
    }, [sessionId]);

    // Save messages to local storage when they change
    useEffect(() => {
        if (sessionId && messages.length > 0) {
            chatService.saveMessages(sessionId, messages);
        }
    }, [messages, sessionId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Send a message
    const sendMessage = async (userInfo: { email: string }) => {
        console.log("Sending message:", messageText);
        console.log("User info:", userInfo);
        if (!messageText.trim() || !sessionId) return;

        const newMessage = { text: messageText, isUser: true };
        setMessages((prev) => [...prev, newMessage]);

        const messageToSend = messageText;
        setMessageText("");

        try {
            await chatService.sendMessage({
                sessionId,
                message: messageToSend,
                userInfo,
                currentPage: window.location.href,
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // Set end chat message
    const setEndChatMessage = () => {
        setMessages([{
            text: "Chat session ended. Thank you for chatting with us!",
            isUser: false
        }]);
    };

    return {
        messages,
        messageText,
        setMessageText,
        sendMessage,
        messagesEndRef,
        setMessages,
        setEndChatMessage
    };
}