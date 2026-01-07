import * as z from 'zod/mini';
import { scheduleIdSchema, type ScheduleType } from './common';
import { createUseDataAPI } from './dataApiUtils';

export const GROUP_MODES = ['full-time', 'part-time'] as const;
export const groupModeSchema = z.enum(GROUP_MODES);
export type GroupMode = z.infer<typeof groupModeSchema>;

export const GROUP_STAGE = ['bachelor', 'master', 'uniform'] as const;
export const groupStageSchema = z.enum(GROUP_STAGE);
export type GroupStage = z.infer<typeof groupStageSchema>;

const HEADER_DETAIL_REGEX = {
    DEFAULT: /^[A-Z]{4}(?<mode>[SN])(?<stage>[12M])-(?<year>\d)(?<semester>\d)(?<groupNumber>.+)/,
    CJ: /(?<mode>[SN])(?<stage>[12M])-{1,2}(?<year>\d)\/(?<semester>\d)-?(?<language>[A-Z]{3})\.(?<languageLevel>[A-Z]\d\+?(?:\/[A-Z]\d)?)/,
    PPUZ: /^PPUZ-[A-Z]{3}(?<mode>[SN])(?<stage>[12M])-(?<year>\d)(?<semester>\d)(?<groupNumber>.+)/,
} as const;

const selectHeaderDetailRegexFromName = (headerName: string) => {
    if (headerName.startsWith('CJ')) {
        return HEADER_DETAIL_REGEX.CJ;
    }

    if (headerName.startsWith('PPUZ')) {
        return HEADER_DETAIL_REGEX.PPUZ;
    }

    return HEADER_DETAIL_REGEX.DEFAULT;
};

const extractGroupHeaderDetails = (headerName: string) => {
    const matches = headerName.match(selectHeaderDetailRegexFromName(headerName))?.groups;
    if (!matches) {
        return null;
    }

    const year = parseInt(matches.year!);
    const semester = parseInt(matches.semester!);

    return {
        stage:
            matches.stage === '1'
                ? ('bachelor' as const satisfies GroupStage)
                : matches.stage === '2'
                  ? ('master' as const satisfies GroupStage)
                  : ('uniform' as const satisfies GroupStage),
        mode:
            matches.mode === 'S'
                ? ('full-time' as const satisfies GroupMode)
                : ('part-time' as const satisfies GroupMode),
        // Semester 10 is represented by year=5, semester=1
        semester: year === 5 && semester === 1 ? 10 : semester,
        groupNumber: matches.groupNumber ?? null,
        language: matches.language ?? null,
        languageLevel: matches.languageLevel ?? null,
    };
};

export const extractHeaderDetails = (scheduleType: ScheduleType, headerName: string) => {
    if (scheduleType === 'G') {
        return extractGroupHeaderDetails(headerName);
    }

    return null;
};

const headersResponseSchema = z.array(
    z.object({
        id: scheduleIdSchema,
        name: z.string().check(z.minLength(1)),
    }),
);

export const useHeadersAPI = createUseDataAPI({
    resourceType: 'headers',
    freshTimeMs: 1000 * 60 * 60 * 24 * 7,
    queryParamsCreator: (scheduleType: ScheduleType, grouping: string) =>
        `type=${encodeURIComponent(scheduleType)}&grouping=${encodeURIComponent(grouping)}`,
    resourceProcessor: (data, scheduleType) =>
        headersResponseSchema
            .parse(data)
            .map(
                (apiHeader) =>
                    ({
                        ...apiHeader,
                        details: extractHeaderDetails(scheduleType, apiHeader.name),
                    }) as const,
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
});

export type ScheduleHeader = NonNullable<ReturnType<typeof useHeadersAPI>['data']>['resource'][number];
