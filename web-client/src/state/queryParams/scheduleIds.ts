import * as z from 'zod/mini';
import { scheduleIdSchema, MAX_SCHEDULES_PER_REQUEST } from '../../api/common';
import { createQueryParamState } from './manager';

const LIST_SEPERATOR = '_';
const schemaForParse = z.pipe(
    z.pipe(
        z.string(),
        z.transform((value) => Array.from(new Set(value.split(LIST_SEPERATOR).map((value) => parseInt(value))))),
    ),
    z.array(scheduleIdSchema).check(z.maxLength(MAX_SCHEDULES_PER_REQUEST)),
);

const baseState = createQueryParamState(
    'id',
    (queryParamValue) => schemaForParse.safeParse(queryParamValue).data ?? [],
    (value) => value.join(LIST_SEPERATOR),
);

export const scheduleIdsGlobalState = {
    ...baseState,
    createAddUpdate: (newScheduleId: number) => baseState.createUpdate([...baseState.get(), newScheduleId]),
    createRemoveUpdate: (scheduleIdToRemove: number) =>
        baseState.createUpdate(baseState.get().filter((scheduleId) => scheduleId !== scheduleIdToRemove)),
};
