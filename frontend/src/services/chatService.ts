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
    location?: string;
    countryCode?: string;
}

export const chatService = {
    // Socket reference
    socket: null as Socket | null,

    // Start a new chat session
    async startChatSession(workspaceId: string): Promise<{ session_id: string }> {
        const payload = { workspace_id: workspaceId };

        const response = await axios.post(
            `${API_URL}/chat/start`,
            payload,
        );

        const { session_id } = response.data;
        localStorage.setItem('chat_session_id', session_id);

        return { session_id };
    },

    // End a chat session
    async endChatSession(sessionId: string): Promise<void> {

        if (this.socket?.connected) {
            this.socket.emit('end_session', { sessionId });
        } else {
            await axios.post(
                `${API_URL}/chat/end`,
                { session_id: sessionId },
            );
        }
        this.disconnect();
    },

    // Set up WebSocket connection
    setupWebSocketConnection(sessionId: string, onStaffMessage: (message: string) => void, onStatusChange: (isOnline: boolean) => void): Socket {
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

        // Listen for status updates
        socket.on('status', (data: { isOnline: boolean }) => {
            console.log('Received staff status update:', data);
            onStatusChange(data.isOnline);
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
            await axios.post(
                `${API_URL}/chat/message`,
                {
                    session_id: sessionId,
                    message,
                    userInfo,
                    currentPage,
                },
            );
        }
    },

    // Check slack online status
    async checkOnlineStatus(workspaceId: string): Promise<boolean> {
        if (this.socket?.connected) {
            console.log('Checking status via socket:', workspaceId);
            // Send request via socket if connected
            return new Promise((resolve) => {
                this.socket?.emit('check_status', { workspaceId }, (data: { isOnline: boolean }) => {
                    console.log('Received status response:', data);
                    resolve(data.isOnline);
                });
            });
        } else {
            // Fall back to REST API if socket not available
            try {
                console.log('Checking status via REST:', workspaceId);
                const response = await axios.get(
                    `${API_URL}/chat/status?workspace_id=${workspaceId}`,
                );
                // If API returns 'online', rename to 'isOnline' for consistency
                return response.data.isOnline !== undefined ?
                    response.data.isOnline :
                    response.data.online;
            } catch (error) {
                console.error('Error checking online status:', error);
                return false; // Default to offline if there's an error
            }
        }
    },

    // Add form submission for offline messages
    async submitOfflineMessage(workspaceId: string, email: string, message: string, name?: string): Promise<void> {
        await axios.post(
            `${API_URL}/chat/offline-message`,
            {
                workspace_id: workspaceId,
                email,
                message,
                name
            }
        );

        // Save submission status to local storage
        localStorage.setItem('chat_offline_submitted', 'true');
    },

    // Check if user has already submitted offline form
    hasSubmittedOfflineForm(): boolean {
        return localStorage.getItem('chat_offline_submitted') === 'true';
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