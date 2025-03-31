import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { chatService } from '../services/chatService';
import { useChatStore } from '../stores/useChatStore';

export function useChatMessages(sessionId: string | null, setIsOnline: (status: boolean) => void) {
    const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
    const [messageText, setMessageText] = useState<string>("");
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { visitorData } = useChatStore((state) => state);

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

            const socket = chatService.setupWebSocketConnection(
                sessionId,
                (text) => {
                    setMessages((prev) => [...prev, { text, isUser: false }]);
                },
                (online) => {
                    setIsOnline(online); // Update online status from WebSocket
                }
            );

            socketRef.current = socket;

            // Clean up on unmount
            return () => {
                chatService.disconnect();
            };
        } else {
            // Clear messages if no session
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
        const userInfo = { email: String(visitorData?.email || "") };
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