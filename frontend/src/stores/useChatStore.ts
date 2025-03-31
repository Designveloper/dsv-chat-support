import { create } from 'zustand';

export interface VisitorData {
    [key: string]: string | number | boolean | null;
}

export interface ChatState {
    // Widget state
    isOpen: boolean;
    isReady: boolean;

    // Visitor information
    visitorId: string | null;
    visitorData: VisitorData | null;

    // Actions
    open: () => void;
    hide: () => void;
    identify: (userId: string, userData: VisitorData) => boolean;
    getVisitorInfo: () => { id: string | null; data: VisitorData | null };
    initialize: () => void;

    // Add setIsReady for API use
    setIsOpen: (value: boolean) => void;
    setVisitor: (userId: string, userData: VisitorData) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    isOpen: false,
    isReady: false,
    visitorId: null,
    visitorData: null,

    open: () => {
        set({ isOpen: true });
    },

    hide: () => {
        set({ isOpen: false });
    },

    // Add this for API use
    setIsOpen: (value) => {
        set({ isOpen: value });
    },

    setVisitor: (userId, userData) => {
        set({ visitorId: userId, visitorData: userData });
    },

    identify: (userId, userData) => {
        if (!userId || typeof userId !== 'string') {
            console.error('Invalid userId provided to identify()');
            return false;
        }

        if (!userData || typeof userData !== 'object') {
            console.error('Invalid userData provided to identify()');
            return false;
        }

        set({ visitorId: userId, visitorData: userData });
        return true;
    },

    getVisitorInfo: () => {
        const { visitorId, visitorData } = get();
        return { id: visitorId, data: visitorData };
    },

    initialize: () => {
        // Only set isReady to true if it's not already true
        const { isReady } = get();
        if (!isReady) {
            console.log("Initializing chat widget store");
            set({ isReady: true });
        }
    }
}));