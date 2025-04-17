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
                    text: "Question? Just type it below and we are online and ready to answer.",
                    isUser: false
                }]);
            }

            // Set up socket for messages
            const socket = chatService.setupWebSocketConnection(
                sessionId,
                (text) => {
                    setMessages((prev) => [...prev, { text, isUser: false }]);
                    console.log("🚀 ~ useEffect ~ playSoundEnabled:", playSoundEnabled)
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
    }, [sessionId, setIsOnline, playSoundEnabled]);

    useEffect(() => {
        if (sessionId && messages.length > 0) {
            chatService.saveMessages(sessionId, messages);
        }
    }, [messages, sessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Send a message
    const sendMessage = async () => {
        if (!messageText.trim() || !sessionId) return;

        const visitorEmail = localStorage.getItem('chat_visitor_email');
        const visitorName = localStorage.getItem('chat_visitor_name');

        const userInfo = {
            email: visitorEmail || '',
            userId: visitorName || undefined
        };

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