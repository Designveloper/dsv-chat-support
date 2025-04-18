import { useState, useEffect } from 'react';

// Update the type definition to support multiple time ranges
type TimeRange = {
    startTime: string;
    endTime: string;
};

type ScheduleItem = {
    day: string;
    timeRanges: TimeRange[];
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

            console.log("🚀 ~ useEffect ~ operatingHoursJson:", operatingHoursJson)
            const operatingHours = JSON.parse(operatingHoursJson);
            console.log("🚀 ~ useEffect ~ operatingHours:", operatingHours)
            const { schedule, timezone } = operatingHours;
            console.log("🚀 ~ useEffect ~ schedule:", schedule)
            console.log("🚀 ~ useEffect ~ timezone:", timezone)

            if (timezone) {
                setTimezone(timezone);
            }

            const now = new Date();
            const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

            const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const currentDayIndex = daysOfWeek.indexOf(dayOfWeek);

            const findNextOpenTimeSlot = (): string | null => {
                const todaySchedule = schedule.find((item: ScheduleItem) => item.day === dayOfWeek);

                if (todaySchedule && todaySchedule.enabled) {
                    for (const timeRange of todaySchedule.timeRanges) {
                        if (currentTimeStr < timeRange.startTime) {
                            return `Today at ${timeRange.startTime}`;
                        }
                    }
                }

                for (let i = 1; i <= 7; i++) {
                    const nextDayIndex = (currentDayIndex + i) % 7;
                    const nextDay = daysOfWeek[nextDayIndex];
                    const nextDaySchedule = schedule.find((item: ScheduleItem) => item.day === nextDay && item.enabled);

                    if (nextDaySchedule && nextDaySchedule.timeRanges.length > 0) {
                        const earliestSlot = [...nextDaySchedule.timeRanges]
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

                        return `${nextDay} at ${earliestSlot.startTime}`;
                    }
                }

                return null;
            };

            const todaySchedule = schedule.find((item: ScheduleItem) => item.day === dayOfWeek);
            let isWithinAnyTimeSlot = false;

            if (todaySchedule && todaySchedule.enabled && todaySchedule.timeRanges.length > 0) {
                isWithinAnyTimeSlot = todaySchedule.timeRanges.some(
                    (timeRange: TimeRange) => currentTimeStr >= timeRange.startTime && currentTimeStr <= timeRange.endTime
                );
            }

            setIsWithinOperatingHours(isWithinAnyTimeSlot);

            if (!isWithinAnyTimeSlot) {
                setNextOpenTime(findNextOpenTimeSlot());
            } else {
                setNextOpenTime(null);
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