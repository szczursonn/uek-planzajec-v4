import { type ComponentChildren, createContext } from 'preact';
import { useContext, useEffect, useMemo } from 'preact/hooks';
import * as z from 'zod/mini';
import hash from 'stable-hash';
import { scheduleIdSchema, type SchedulePeriod, type ScheduleType } from './common';
import { extractHeaderDetails } from './headers';
import { createUseDataAPI } from './dataApiUtils';
import { DateParts } from '../date/dateParts';
import { stripTime } from '../date/dateUtils';
import { useNow } from '../date/useNow';
import { scheduleTypeGlobalState } from '../state/queryParams/scheduleType';
import { scheduleIdsGlobalState } from '../state/queryParams/scheduleIds';
import { hiddenSubjectsGlobalState } from '../state/queryParams/hiddenSubjects';
import {
    type CachedPresetPeriodIdxKey,
    presetsPeriodIdxGlobalState,
} from '../state/localStorage/presetsPeriodIdxCache';
import { schedulePeriodGlobalState } from '../state/queryParams/schedulePeriod';

export const getScheduleItemTypeCategory = (itemType: string) => {
    switch (itemType) {
        case 'wykład':
        case 'wykład do wyboru':
        case 'wykład zdalny':
        case 'PPUZ wykład':
            return 'lecture' as const;
        case 'ćwiczenia':
        case 'ćwiczenia do wyboru':
        case 'ćwiczenia warsztatowe':
        case 'ćwiczenia audytoryjne':
        case 'ćwiczenia e-learningowe':
        case 'ćwiczenia zdalne':
        case 'PPUZ ćwicz. warsztatowe':
        case 'PPUZ ćwicz. laboratoryjne':
        case 'projekt':
        case 'laboratorium':
        case 'konwersatorium':
        case 'konwersatorium do wyboru':
        case 'seminarium':
            return 'exercise' as const;
        case 'lektorat':
        case 'PPUZ lektorat':
            return 'language' as const;
        case 'wstępna rezerwacja':
        case 'rezerwacja':
            return 'reservation' as const;
        case 'egzamin':
            return 'exam' as const;
        case 'przeniesienie zajęć':
            return 'cancelled' as const;
        default:
            return 'unknown' as const;
    }
};

export type ScheduleItemTypeCategory = ReturnType<typeof getScheduleItemTypeCategory>;

const aggregateScheduleResponseSchema = z.object({
    aggregateSchedule: z.object({
        headers: z.array(
            z.object({
                id: scheduleIdSchema,
                name: z.string().check(z.minLength(1)),
            }),
        ),
        items: z.array(
            z.object({
                start: z.iso.datetime({
                    offset: true,
                }),
                end: z.iso.datetime({
                    offset: true,
                }),
                subject: z.string(),
                type: z.string(),
                groups: z._default(z.array(z.string().check(z.minLength(1))), []),
                lecturers: z._default(
                    z.array(
                        z.object({
                            name: z.string().check(z.minLength(1)),
                            moodleCourseId: z.optional(z.number()),
                        }),
                    ),
                    [],
                ),
                roomName: z.optional(z.string().check(z.minLength(1))),
                roomUrl: z.optional(z.url()),
                extra: z.optional(z.string().check(z.minLength(1))),
            }),
        ),
    }),
    periods: z.array(
        z.object({
            start: z.iso.datetime({
                offset: true,
            }),
            end: z.iso.datetime({
                offset: true,
            }),
        }),
    ),
});

const useAggregateScheduleAPI = createUseDataAPI({
    resourceType: 'aggregate-schedule',
    freshTimeMs: 1000 * 60 * 15,
    queryParamsCreator: (scheduleType: ScheduleType, scheduleIds: number[], periodIdx: number) =>
        scheduleIds.length > 0
            ? `type=${encodeURIComponent(scheduleType)}&periodIdx=${periodIdx}${scheduleIds.map((id) => `&id=${id}`).join('')}`
            : null,
    resourceProcessor: (data, scheduleType) => {
        const res = aggregateScheduleResponseSchema.parse(data);

        return {
            aggregateSchedule: {
                headers: res.aggregateSchedule.headers.map((header) => ({
                    ...header,
                    details: extractHeaderDetails(scheduleType, header.name),
                })),
                items: res.aggregateSchedule.items.map((apiItem) => ({
                    ...apiItem,
                    id: hash(apiItem),
                    start: {
                        date: new Date(apiItem.start),
                        parts: DateParts.fromISO(apiItem.start),
                    },
                    end: {
                        date: new Date(apiItem.end),
                        parts: DateParts.fromISO(apiItem.end),
                    },
                    type: {
                        value: apiItem.type,
                        category: getScheduleItemTypeCategory(apiItem.type),
                    },
                    isOnline: !!apiItem.roomUrl || apiItem.roomName === 'Platforma Moodle',
                })),
            },
            periods: res.periods.map((apiPeriod) => ({
                start: new Date(apiPeriod.start),
                end: new Date(apiPeriod.end),
            })),
        };
    },
});

export type ScheduleItem = NonNullable<
    ReturnType<typeof useAggregateScheduleAPI>['data']
>['resource']['aggregateSchedule']['items'][number];

const SCHEDULE_PERIOD_PRESET_TO_PERIOD_IDX_KEY = {
    inferCurrentYear: 'currentYear',
    inferUpcoming: 'currentYear',
} satisfies Record<SchedulePeriod, CachedPresetPeriodIdxKey>;

const useGlobalScheduleQueryContextData = () => {
    const scheduleIds = scheduleIdsGlobalState.use();
    const schedulePeriod = schedulePeriodGlobalState.use();
    const scheduleType = scheduleTypeGlobalState.use();

    let periodIdx;
    {
        const presetsPeriodIdx = presetsPeriodIdxGlobalState.use();

        periodIdx =
            typeof schedulePeriod === 'string'
                ? (presetsPeriodIdx[SCHEDULE_PERIOD_PRESET_TO_PERIOD_IDX_KEY[schedulePeriod]] ?? 0)
                : schedulePeriod;
    }

    const query = useAggregateScheduleAPI(scheduleType, scheduleIds, periodIdx);
    const now = useNow('day');

    // if fetched via preset and there is an error - delete the cached period idx, it might have become invalid
    useEffect(() => {
        if (query.error && typeof schedulePeriod === 'string') {
            presetsPeriodIdxGlobalState.setPeriod(SCHEDULE_PERIOD_PRESET_TO_PERIOD_IDX_KEY[schedulePeriod], null);
        }
    }, [query.error, schedulePeriod]);

    // update the cache with fresh period idx (may trigger revalidation)
    useEffect(() => {
        const periods = query.data?.resource.periods;
        if (!periods) {
            return;
        }

        let longestCurrentPeriodIdx = null as number | null;

        for (let i = 0; i < periods.length; i++) {
            const period = periods[i]!;

            if (period.start > now || period.end < now) {
                continue;
            }

            if (
                longestCurrentPeriodIdx === null ||
                period.end.getTime() - period.start.getTime() >
                    periods[longestCurrentPeriodIdx]!.end.getTime() - periods[longestCurrentPeriodIdx]!.start.getTime()
            ) {
                longestCurrentPeriodIdx = i;
            }
        }

        presetsPeriodIdxGlobalState.setPeriod('currentYear', longestCurrentPeriodIdx);
    }, [query.data, schedulePeriod, now.getTime()]);

    const hiddenSubjects = hiddenSubjectsGlobalState.use();
    const filteredItems = useMemo(() => {
        if (!query.data) {
            return [];
        }

        const nowWithoutTimeTimestamp = stripTime(now).getTime();

        return query.data.resource.aggregateSchedule.items.filter(
            (item) =>
                !hiddenSubjects.includes(item.subject) &&
                (schedulePeriod !== 'inferUpcoming' || item.start.date.getTime() >= nowWithoutTimeTimestamp),
        );
    }, [query.data, hiddenSubjects, schedulePeriod, now.getTime()]);

    const isPeriodIdxDeterminationInProgress =
        query.data !== null &&
        typeof schedulePeriod === 'string' &&
        presetsPeriodIdxGlobalState.get()[SCHEDULE_PERIOD_PRESET_TO_PERIOD_IDX_KEY[schedulePeriod]] !== periodIdx;

    return {
        data: useMemo(
            () =>
                query.data && !isPeriodIdxDeterminationInProgress
                    ? {
                          resource: {
                              periods: query.data.resource.periods,
                              aggregateSchedule: {
                                  ...query.data.resource.aggregateSchedule,
                                  filteredItems,
                              },
                          },
                          createdAt: query.data.createdAt,
                          resolvedPeriodIdx: periodIdx,
                      }
                    : null,
            [query.data, filteredItems, isPeriodIdxDeterminationInProgress],
        ),
        error: query.error,
        isLoading: query.isLoading || isPeriodIdxDeterminationInProgress,
        refresh: query.refresh,
        params: {
            scheduleIds,
            scheduleType,
            schedulePeriod,
            hiddenSubjects,
        },
    };
};

const GlobalScheduleQueryContext = createContext<ReturnType<typeof useGlobalScheduleQueryContextData> | null>(null);

export const useGlobalScheduleQuery = () => {
    const value = useContext(GlobalScheduleQueryContext);
    if (value === null) {
        throw new Error('missing global schedule query context');
    }

    return value;
};

export const GlobalScheduleQueryProvider = ({ children }: { children?: ComponentChildren }) => (
    <GlobalScheduleQueryContext.Provider value={useGlobalScheduleQueryContextData()}>
        {children}
    </GlobalScheduleQueryContext.Provider>
);
