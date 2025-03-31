import { useChatStore } from '../stores/useChatStore';

export function useWidgetController() {
    const isOpen = useChatStore(state => state.isOpen);
    const open = useChatStore(state => state.open);
    const hide = useChatStore(state => state.hide);
    const getVisitorInfo = useChatStore(state => state.getVisitorInfo);

    const toggleWidget = () => {
        if (!isOpen) {
            open();
        } else {
            hide();
        }
    };

    return {
        isOpen,
        toggleWidget,
        // For compatibility with existing components that use controllerRef
        controllerRef: {
            current: {
                getVisitorInfo
            }
        }
    };
}