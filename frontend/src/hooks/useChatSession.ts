import { useState, useEffect } from 'react';
import { chatService } from '../services/chatService';

export function useChatSession(workspaceId?: string, workspaces?: { id: string }[]) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Set workspace based on props
    useEffect(() => {
        // Direct workspaceId has priority (visitor mode)
        if (workspaceId) {
            setActiveWorkspace(workspaceId);
        }
        // Otherwise use workspaces array
        else if (workspaces && workspaces.length > 0 && !activeWorkspace) {
            setActiveWorkspace(workspaces[0].id);
        }
    }, [workspaceId, workspaces, activeWorkspace]);

    // Check for existing session on mount
    useEffect(() => {
        const existingSessionId = chatService.getSavedSession();
        if (existingSessionId) {
            setSessionId(existingSessionId);
        }
    }, []);

    // Check online status
    const checkOnlineStatus = async () => {
        if (!activeWorkspace) return;

        try {
            const online = await chatService.checkOnlineStatus(activeWorkspace);
            setIsOnline(online);
        } catch (error) {
            console.error("Error checking online status:", error);
            setIsOnline(false);
        }
    };

    // Start a new chat session
    const startChatSession = async () => {
        if (!activeWorkspace) return;

        setLoading(true);
        setError(null);

        try {
            const { session_id } = await chatService.startChatSession(activeWorkspace);
            setSessionId(session_id);

            // Add welcome message
            const initialMessages = [
                {
                    text: "Welcome! How can we help you today?",
                    isUser: false,
                }
            ];
            chatService.saveMessages(session_id, initialMessages);

            setLoading(false);
            return initialMessages;
        } catch (error) {
            console.error("Error starting chat session:", error);
            setError("Failed to start chat session");
            setLoading(false);
            return [];
        }
    };

    // End a chat session
    const endChatSession = async () => {
        if (!sessionId) return;

        try {
            await chatService.endChatSession(sessionId);
            localStorage.removeItem(`chat_messages_${sessionId}`);
            localStorage.removeItem('chat_session_id');

            setSessionId(null);
            return {
                endMessage: {
                    text: "Chat session ended. Thank you for chatting with us!",
                    isUser: false
                }
            };
        } catch (error) {
            console.error("Error ending chat session:", error);
            setError("Failed to end chat session");
            return null;
        }
    };

    return {
        sessionId,
        activeWorkspace,
        isOnline,
        loading,
        error,
        checkOnlineStatus,
        startChatSession,
        endChatSession
    };
}