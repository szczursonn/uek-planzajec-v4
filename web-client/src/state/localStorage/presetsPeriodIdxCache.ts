import * as z from 'zod/mini';
import { createLocalStorageState } from './manager';

const presetIdxSchema = z.nullable(z.number().check(z.nonnegative()));

const presetsPeriodIdxSchema = z.object({
    currentYear: presetIdxSchema,
});

const baseState = createLocalStorageState(
    'presetsPeriodIdxCache',
    (encodedValue) => {
        try {
            return presetsPeriodIdxSchema.parse(JSON.parse(encodedValue));
        } catch (_) {
            return {
                currentYear: null,
            };
        }
    },
    (value) => JSON.stringify(value),
);

export type CachedPresetPeriodIdxKey = keyof z.infer<typeof presetsPeriodIdxSchema>;

export const presetsPeriodIdxGlobalState = {
    ...baseState,
    setPeriod: (presetName: CachedPresetPeriodIdxKey, value: number | null) => {
        baseState.set({
            ...baseState.get(),
            [presetName]: value,
        });
    },
};
