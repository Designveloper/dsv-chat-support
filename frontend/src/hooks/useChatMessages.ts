import { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import { useSound } from './useSound';

export function useChatMessages(sessionId: string | null, setIsOnline: (status: boolean) => void, playSoundEnabled?: boolean) {
    const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
    const [messageText, setMessageText] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { playNotificationSound } = useSound();

    // Load saved messages when session ID changes
    useEffect(() => {
        if (sessionId) {
            const savedMessages = chatService.getSavedMessages(sessionId);
            if (savedMessages && savedMessages.length > 0) {
                setMessages(savedMessages);
            } else {
                setMessages([{
                    text: "Welcome! How can we help you today?",
                    isUser: false
                }]);
            }

            // Set up socket for messages
            const socket = chatService.setupWebSocketConnection(
                sessionId,
                (text) => {
                    setMessages((prev) => [...prev, { text, isUser: false }]);
                    if (playSoundEnabled) {
                        console.log("Playing notification sound");
                        playNotificationSound();
                    }
                },
                (online) => {
                    setIsOnline(online);
                }
            );

            // Cleanup
            return () => {
                if (socket) {
                    socket.disconnect();
                }
            };
        } else {
            setMessages([]);
        }
    }, [sessionId, setIsOnline]);

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
    const sendMessage = async () => {
        if (!messageText.trim() || !sessionId) return;

        // Get visitor data from localStorage
        const visitorEmail = localStorage.getItem('chat_visitor_email');
        const visitorName = localStorage.getItem('chat_visitor_name');

        // Construct user info object
        const userInfo = {
            email: visitorEmail || '',
            userId: visitorName || undefined
        };

        // Add message to UI
        const newMessage = { text: messageText, isUser: true };
        setMessages((prev) => [...prev, newMessage]);

        const messageToSend = messageText;
        setMessageText("");

        try {
            // Send message with user info
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
        setMessages((prev) => [...prev, {
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