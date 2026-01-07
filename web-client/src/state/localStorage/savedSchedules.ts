import * as z from 'zod/mini';
import { createLocalStorageState } from './manager';
import { scheduleIdSchema, scheduleTypeSchema } from '../../api/common';
import { scheduleIdsGlobalState } from '../queryParams/scheduleIds';
import { scheduleTypeGlobalState } from '../queryParams/scheduleType';
import { hiddenSubjectsGlobalState } from '../queryParams/hiddenSubjects';

const savedSchedulesSchema = z.array(
    z.object({
        type: scheduleTypeSchema,
        headers: z.array(
            z.object({
                id: scheduleIdSchema,
                name: z.string().check(z.minLength(1)),
            }),
        ),
        hiddenSubjects: z.array(z.string()),
    }),
);

export type SavedSchedule = z.infer<typeof savedSchedulesSchema>[number];

const baseState = createLocalStorageState(
    'savedSchedules',
    (encodedValue) => {
        try {
            return savedSchedulesSchema.parse(JSON.parse(encodedValue));
        } catch (_) {
            return [];
        }
    },
    (value) => JSON.stringify(value),
);

export const savedSchedulesGlobalState = {
    ...baseState,
    add: (newSavedSchedule: SavedSchedule) => baseState.set([...baseState.get(), newSavedSchedule]),
    remove: (savedScheduleToDelete: SavedSchedule) =>
        baseState.set(baseState.get().filter((savedSchedule) => savedSchedule !== savedScheduleToDelete)),
};

export const createSavedScheduleSelectionUpdates = (savedSchedule: SavedSchedule) =>
    [
        scheduleIdsGlobalState.createUpdate(savedSchedule.headers.map((header) => header.id)),
        scheduleTypeGlobalState.createUpdate(savedSchedule.type),
        hiddenSubjectsGlobalState.createUpdate(savedSchedule.hiddenSubjects),
    ] as const;
