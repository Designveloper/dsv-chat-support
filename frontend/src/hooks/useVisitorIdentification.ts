import { useState } from 'react';

export function useVisitorIdentification(workspaceId: string | null) {
    const [visitorEmail, setVisitorEmail] = useState<string>("");
    const [visitorName, setVisitorName] = useState<string>("");
    const [identificationSubmitted, setIdentificationSubmitted] = useState<boolean>(false);
    const [identificationLoading, setIdentificationLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const submitVisitorIdentification = async () => {
        if (!workspaceId || !visitorEmail.trim()) {
            setError("Email is required");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(visitorEmail)) {
            setError("Please enter a valid email address");
            return;
        }

        try {
            setError(null);
            setIdentificationLoading(true);

            // Store visitor information in localStorage to persist across sessions
            localStorage.setItem('chat_visitor_email', visitorEmail);
            if (visitorName) {
                localStorage.setItem('chat_visitor_name', visitorName);
            }

            // Save to session storage to indicate identification is complete for this session
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

        // Check if user is already identified in this session
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