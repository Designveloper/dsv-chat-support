import { StoreApi } from 'zustand';
import { ChatState } from './stores/useChatStore';

declare global {
    interface Window {
        _chatSupport: {
            open: () => boolean;
            hide: () => boolean;
            isShown: () => boolean;
            identify: (userId: string, userData: Record<string, unknown>) => boolean;
        };
        useChatStore: StoreApi<ChatState>;
    }
}

export { };