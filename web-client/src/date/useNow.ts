import { useEffect, useState } from 'preact/hooks';
import { DateParts } from './dateParts';

const UPDATE_RESOLUTION_TO_TIMEOUT_DURATION_PROVIDER = {
    second: () => {
        const now = new Date();
        return 1000 - now.getMilliseconds();
    },
    minute: () => {
        const now = new Date();
        return 60_000 - now.getSeconds() * 1000 - now.getMilliseconds();
    },
    day: () => {
        const now = new Date();
        return DateParts.fromDate(now).incrementDay().stripTime().toDate().getTime() - now.getTime();
    },
} as const;

export const useNow = (updateResolution: 'second' | 'minute' | 'day') => {
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const getTimeoutDuration = UPDATE_RESOLUTION_TO_TIMEOUT_DURATION_PROVIDER[updateResolution];
        let timeout: ReturnType<typeof setTimeout> | null = null;

        const updateNow = () => setCurrentDate(new Date());

        const startTimeout = () => {
            if (!timeout) {
                timeout = setTimeout(() => {
                    stopTimeout();
                    updateNow();
                    startTimeout();
                }, getTimeoutDuration());
            }
        };

        const stopTimeout = () => {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updateNow();
                startTimeout();
            } else {
                stopTimeout();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        if (document.visibilityState === 'visible') {
            startTimeout();
        }

        return () => {
            stopTimeout();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [updateResolution]);

    return currentDate;
};
