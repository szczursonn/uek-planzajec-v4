import { createIntLocalStorageState } from './manager';

const baseState = createIntLocalStorageState('longBreakThreshold', 1, Infinity, 60);

export const longBreakThresholdMinutesGlobalState = {
    ...baseState,
    useMs: () => baseState.use() * 60 * 1000,
};
