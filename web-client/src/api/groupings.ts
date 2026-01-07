import * as z from 'zod/mini';
import { type ScheduleType, scheduleTypeSchema } from './common';
import { createUseDataAPI } from './dataApiUtils';

const groupingsResponseSchema = z.array(
    z.object({
        name: z.string().check(z.minLength(1)),
        type: scheduleTypeSchema,
    }),
);

export const useGroupingsAPI = createUseDataAPI({
    resourceType: 'groupings',
    freshTimeMs: 1000 * 60 * 60 * 24 * 7,
    resourceProcessor: (data, scheduleType: ScheduleType) =>
        groupingsResponseSchema
            .parse(data)
            .filter((grouping) => grouping.type === scheduleType)
            .map((grouping) => grouping.name)
            .sort((a, b) => a.localeCompare(b)),
});
