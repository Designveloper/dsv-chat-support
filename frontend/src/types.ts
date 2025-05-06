import { useChatStore } from "./stores/useChatStore";
import type { VisitorData } from "./stores/useChatStore";

declare global {
    interface Window {
        initChatWidget: (container: HTMLElement, workspaceId: string) => void;
        useChatStore: typeof useChatStore;
        _chatSupport: {
            open: () => boolean;
            hide: () => boolean;
            identify: (userId: string, userData: VisitorData) => boolean;
            isShown: () => boolean;
        };
    }
}