import { useState, useEffect } from 'react';

type ScheduleItem = {
    day: string;
    startTime: string;
    endTime: string;
    enabled: boolean;
};

type UseOperatingHoursResult = {
    isWithinOperatingHours: boolean;
    nextOpenTime: string | null;
    timezone: string;
    isLoading: boolean;
};

export function useOperatingHours(operatingHoursJson: string | null | undefined): UseOperatingHoursResult {
    const [isWithinOperatingHours, setIsWithinOperatingHours] = useState<boolean>(true);
    const [nextOpenTime, setNextOpenTime] = useState<string | null>(null);
    const [timezone, setTimezone] = useState<string>('UTC');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!operatingHoursJson || operatingHoursJson === 'none') {
            setIsWithinOperatingHours(true);
            setNextOpenTime(null);
            setIsLoading(false);
            return;
        }

        try {
            const operatingHours = JSON.parse(operatingHoursJson);
            const { schedule, timezone } = operatingHours;

            if (timezone) {
                setTimezone(timezone);
            }

            const now = new Date();
            const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

            const todaySchedule = schedule.find((item: ScheduleItem) => item.day === dayOfWeek);

            if (todaySchedule && todaySchedule.enabled) {
                if (currentTimeStr >= todaySchedule.startTime && currentTimeStr <= todaySchedule.endTime) {
                    setIsWithinOperatingHours(true);
                    setNextOpenTime(null);
                } else {
                    setIsWithinOperatingHours(false);

                    if (currentTimeStr < todaySchedule.startTime) {
                        setNextOpenTime(`Today at ${todaySchedule.startTime}`);
                    } else {
                        let nextOpenDay = null;
                        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                        const currentDayIndex = daysOfWeek.indexOf(dayOfWeek);

                        for (let i = 1; i <= 7; i++) {
                            const nextDayIndex = (currentDayIndex + i) % 7;
                            const nextDay = daysOfWeek[nextDayIndex];
                            const nextDaySchedule = schedule.find((item: ScheduleItem) => item.day === nextDay);

                            if (nextDaySchedule && nextDaySchedule.enabled) {
                                nextOpenDay = nextDaySchedule;
                                setNextOpenTime(`${nextDay} at ${nextDaySchedule.startTime}`);
                                break;
                            }
                        }

                        if (!nextOpenDay) {
                            setNextOpenTime(null);
                        }
                    }
                }
            } else {
                setIsWithinOperatingHours(false);

                let nextOpenDay = null;
                const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const currentDayIndex = daysOfWeek.indexOf(dayOfWeek);

                for (let i = 1; i <= 7; i++) {
                    const nextDayIndex = (currentDayIndex + i) % 7;
                    const nextDay = daysOfWeek[nextDayIndex];
                    const nextDaySchedule = schedule.find((item: ScheduleItem) => item.day === nextDay);

                    if (nextDaySchedule && nextDaySchedule.enabled) {
                        nextOpenDay = nextDaySchedule;
                        setNextOpenTime(`${nextDay} at ${nextDaySchedule.startTime}`);
                        break;
                    }
                }

                if (!nextOpenDay) {
                    setNextOpenTime(null);
                }
            }

            setIsLoading(false);
        } catch (err) {
            console.error('Error parsing operating hours data:', err);
            setIsWithinOperatingHours(true);
            setNextOpenTime(null);
            setIsLoading(false);
        }
    }, [operatingHoursJson]);

    return { isWithinOperatingHours, nextOpenTime, timezone, isLoading };
}