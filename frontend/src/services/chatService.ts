import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_URL = 'http://localhost:3000';

interface MessagePayload {
    sessionId: string;
    message: string;
    userInfo: {
        email: string;
        userId?: string;
    };
    currentPage: string;
}

export const chatService = {
    // Socket reference
    socket: null as Socket | null,

    // Start a new chat session
    async startChatSession(workspaceId: string): Promise<{ session_id: string }> {
        const payload = { workspace_id: workspaceId };
        const token = localStorage.getItem('accessToken');

        const response = await axios.post(
            `${API_URL}/chat/start`,
            payload,
            {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
        );

        const { session_id } = response.data;
        localStorage.setItem('chat_session_id', session_id);

        return { session_id };
    },

    // End a chat session
    async endChatSession(sessionId: string): Promise<void> {
        const token = localStorage.getItem('accessToken');

        if (this.socket?.connected) {
            this.socket.emit('end_session', { sessionId });
        } else {
            await axios.post(
                `${API_URL}/chat/end`,
                { session_id: sessionId },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );
        }
        this.disconnect();
    },

    // Set up WebSocket connection
    setupWebSocketConnection(sessionId: string, onStaffMessage: (message: string) => void): Socket {
        if (this.socket) {
            this.socket.disconnect();
        }

        // Connect to WebSocket server
        const socket = io(API_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
        });

        this.socket = socket;

        // Handle connection events
        socket.on('connect', () => {
            console.log('Connected to chat server');
            socket.emit('register_session', { sessionId });
        });

        // Listen for staff messages
        socket.on('staff_message', (data: { text: string }) => {
            onStaffMessage(data.text);
        });

        // Handle errors and disconnection
        socket.on('error', (error: unknown) => {
            console.error('Socket error:', error);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from chat server');
        });

        return socket;
    },

    // Send a message
    async sendMessage(messagePayload: MessagePayload): Promise<void> {
        const { sessionId, message, userInfo, currentPage } = messagePayload;

        if (this.socket?.connected) {
            console.log('Sending message via socket:', message);
            // Send via socket if connected
            this.socket.emit('send_message', {
                sessionId,
                message,
                userInfo,
                currentPage,
            });
        } else {
            // Fall back to REST API if socket not available
            const token = localStorage.getItem('accessToken');
            await axios.post(
                `${API_URL}/chat/message`,
                {
                    session_id: sessionId,
                    message,
                    userInfo,
                    currentPage,
                },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );
        }
    },

    // Get saved session from local storage
    getSavedSession(): string | null {
        return localStorage.getItem('chat_session_id');
    },

    // Save messages to local storage
    saveMessages(sessionId: string, messages: { text: string; isUser: boolean }[]): void {
        localStorage.setItem(
            `chat_messages_${sessionId}`,
            JSON.stringify(messages)
        );
    },

    // Get saved messages from local storage
    getSavedMessages(sessionId: string): { text: string; isUser: boolean }[] | null {
        const savedMessages = localStorage.getItem(`chat_messages_${sessionId}`);
        if (savedMessages) {
            try {
                return JSON.parse(savedMessages);
            } catch (error) {
                console.error('Error parsing saved messages:', error);
                return null;
            }
        }
        return null;
    },

    // Disconnect socket
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
};