import { useCallback, useRef } from 'react';
// import sound from '../assets/sounds/message-notification.mp3';

export function useSound() {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playNotificationSound = useCallback(() => {
        try {
            console.log("Attempting to play notification sound");

            if (!audioRef.current) {
                audioRef.current = new Audio('/frontend/src/assets/sounds/message-notification.mp3');
                audioRef.current.volume = 0.5;
            }

            const audio = audioRef.current;
            audio.currentTime = 0;
            // audio.muted = true;

            audio.play().then(() => {
                console.log("Notification sound played successfully");
            }).catch((error) => {
                console.error("Error playing notification sound:", error);
            });
        } catch (error) {
            console.error("Error playing notification sound:", error);
        }
    }, []);

    return { playNotificationSound };
}