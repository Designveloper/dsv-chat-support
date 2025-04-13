import { useState } from 'react';
import { useChatStore } from '../stores/useChatStore';

export function useVisitorIdentification(workspaceId: string | null) {
    const [visitorEmail, setVisitorEmail] = useState<string>("");
    const [visitorName, setVisitorName] = useState<string>("");
    const [identificationSubmitted, setIdentificationSubmitted] = useState<boolean>(false);
    const [identificationLoading, setIdentificationLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const submitVisitorIdentification = async () => {
        if (!workspaceId || !visitorEmail.trim()) {
            setError("Email is required");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(visitorEmail)) {
            setError("Please enter a valid email address");
            return false;
        }

        try {
            setError(null);
            setIdentificationLoading(true);

            const userData = {
                email: visitorEmail,
                name: visitorName || '',
            };

            const identifySuccess = useChatStore.getState().identify(visitorEmail, userData);
            console.log("Visitor identification success:", identifySuccess);

            localStorage.setItem('chat_visitor_email', visitorEmail);
            if (visitorName) {
                localStorage.setItem('chat_visitor_name', visitorName);
            }
            sessionStorage.setItem('chat_identified', 'true');

            setIdentificationSubmitted(true);
            setIdentificationLoading(false);

            return true;
        } catch (error) {
            console.error("Error submitting visitor identification:", error);
            setError("Failed to submit your information. Please try again.");
            setIdentificationLoading(false);
            return false;
        }
    };

    const isIdentificationRequired = (visitorIdentificationSetting: string): boolean => {
        if (visitorIdentificationSetting !== 'prompt') {
            return false;
        }
        return sessionStorage.getItem('chat_identified') !== 'true';
    };

    const getStoredVisitorData = () => {
        const email = localStorage.getItem('chat_visitor_email');
        const name = localStorage.getItem('chat_visitor_name');

        return {
            email: email || '',
            name: name || ''
        };
    };

    return {
        visitorEmail,
        setVisitorEmail,
        visitorName,
        setVisitorName,
        identificationSubmitted,
        identificationLoading,
        error,
        submitVisitorIdentification,
        isIdentificationRequired,
        getStoredVisitorData
    };
}