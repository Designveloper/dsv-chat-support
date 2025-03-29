import { useState } from 'react';
import { chatService } from '../services/chatService';

export function useOfflineForm(workspaceId: string | null) {
    const [offlineEmail, setOfflineEmail] = useState<string>("");
    const [offlineMessage, setOfflineMessage] = useState<string>("");
    const [offlineName, setOfflineName] = useState<string>("");
    const [offlineFormSubmitted, setOfflineFormSubmitted] = useState<boolean>(
        chatService.hasSubmittedOfflineForm()
    );
    const [offlineFormLoading, setOfflineFormLoading] = useState<boolean>(false);

    const submitOfflineForm = async () => {
        if (!workspaceId || !offlineEmail.trim() || !offlineMessage.trim()) return;

        try {
            setOfflineFormLoading(true);
            await chatService.submitOfflineMessage(
                workspaceId,
                offlineEmail,
                offlineMessage,
                offlineName
            );
            setOfflineFormSubmitted(true);
            setOfflineFormLoading(false);
        } catch (error) {
            console.error("Error submitting offline form:", error);
            setOfflineFormLoading(false);
        }
    };

    return {
        offlineEmail,
        setOfflineEmail,
        offlineMessage,
        setOfflineMessage,
        offlineName,
        setOfflineName,
        offlineFormSubmitted,
        offlineFormLoading,
        submitOfflineForm
    };
}