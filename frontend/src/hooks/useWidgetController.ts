import { useState, useEffect, useRef } from 'react';
import WidgetController from '../services/widgetController';

export function useWidgetController() {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const controllerRef = useRef(new WidgetController());

    useEffect(() => {
        // Connect controller to React's state
        const controller = controllerRef.current;
        controller.setUpdateCallback(setIsOpen);

        // Make the controller ready
        setTimeout(() => {
            controller.ready();
            console.log("Chat widget controller ready");
        }, 100);

        return () => {
            // Clean up by setting callback to null
            controller.setUpdateCallback(() => { });
        };
    }, []);

    const toggleWidget = () => {
        const controller = controllerRef.current;
        if (!isOpen) {
            controller.open();
        } else {
            controller.hide();
        }
    };

    return {
        isOpen,
        toggleWidget,
        controllerRef
    };
}