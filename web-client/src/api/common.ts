import * as z from 'zod/mini';

export const MAX_SCHEDULES_PER_REQUEST = 4;

export const scheduleIdSchema = z.number().check(z.nonnegative());

export const SCHEDULE_TYPES = ['G', 'N', 'S'] as const;
export const scheduleTypeSchema = z.enum(SCHEDULE_TYPES);
export type ScheduleType = z.infer<typeof scheduleTypeSchema>;

export const SCHEDULE_PERIOD_PRESETS = ['inferUpcoming', 'inferCurrentYear'] as const;
export const schedulePeriodSchema = z.union([z.enum(SCHEDULE_PERIOD_PRESETS), z.number().check(z.nonnegative())]);
export type SchedulePeriod = z.infer<typeof schedulePeriodSchema>;
export const DEFAULT_SCHEDULE_PERIOD = 'inferUpcoming' satisfies SchedulePeriod;

export const createMoodleCourseURL = (moodleCourseId: number) =>
    `https://e-uczelnia.uek.krakow.pl/course/view.php?id=${moodleCourseId}`;

export const createOfficialScheduleURL = (scheduleType: ScheduleType, scheduleId: number, periodIdx = 0) =>
    `https://planzajec.uek.krakow.pl/index.php?typ=${scheduleType}&id=${scheduleId}&okres=${periodIdx + 1}`;

export const createICalURL = (options: {
    encryptedBasicAuth: string;
    scheduleType: ScheduleType;
    scheduleIds: number[];
    hiddenSubjects: string[];
    periodIdx: number;
}) =>
    `${window.location.origin}/api/ical/${encodeURIComponent(
        btoa(
            JSON.stringify({
                authScheme: 'Bearer',
                authValue: options.encryptedBasicAuth,
                scheduleType: options.scheduleType,
                scheduleIds: options.scheduleIds,
                hiddenSubjects: options.hiddenSubjects,
                periodIdx: options.periodIdx,
            }),
        ),
    )}`;

export class UnexpectedStatusCodeError extends Error {
    constructor(public readonly statusCode: number) {
        super(`Unexpected response status code: ${statusCode}`);
    }

    public get isUnauthorized() {
        return this.statusCode === 401;
    }
}
