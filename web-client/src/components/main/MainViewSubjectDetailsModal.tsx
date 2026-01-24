import { useMemo } from 'preact/hooks';
import clsx from 'clsx';
import { stripTime } from '../../date/dateUtils';
import { TIME_ZONE } from '../../date/timeZone';
import { useNow } from '../../date/useNow';
import { complexLabels } from '../../i18n/labels';
import { useCurrentLocale } from '../../i18n/useCurrentLocale';
import { createMoodleCourseURL } from '../../api/common';
import { getScheduleItemTypeCategory, useGlobalScheduleQuery } from '../../api/globalScheduleQuery';
import { updateQueryParams } from '../../state/queryParams/manager';
import {
    subjectDetailsModalShowOnlyUpcomingItemsGlobalState,
    subjectDetailsModalSubjectGlobalState,
} from '../../state/queryParams/subjectDetailsModal';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Checkbox } from '../common/Checkbox';

const getItemTypeTextClass = (itemType: string) => {
    switch (getScheduleItemTypeCategory(itemType)) {
        case 'lecture':
            return 'text-sky-400';
        case 'exercise':
            return 'text-amber-400';
        case 'language':
            return 'text-green-400';
        case 'exam':
            return 'text-red-400';
        case 'special':
            return 'text-violet-400';
        default:
            return '';
    }
};

const IGNORED_ITEM_CATEGORIES_FOR_SUMMARIES = ['cancelled', 'reservation'] as Readonly<string[]>;

export const MainViewSubjectDetailsModalHost = () => {
    const subject = subjectDetailsModalSubjectGlobalState.use();
    if (!subject) {
        return null;
    }

    return <MainViewSubjectDetailsModal subject={subject} />;
};

const MainViewSubjectDetailsModal = ({ subject }: { subject: string }) => {
    const currentLocale = useCurrentLocale();
    const query = useGlobalScheduleQuery();
    const now = useNow('minute');
    const nowWithoutTime = stripTime(now);
    const showOnlyUpcomingItems = subjectDetailsModalShowOnlyUpcomingItemsGlobalState.use();

    const allSubjectItems = useMemo(
        () => query.data?.resource.aggregateSchedule.items.filter((item) => item.subject === subject) ?? [],
        [query.data?.resource.aggregateSchedule.items, subject],
    );

    const visibleSubjectItems = useMemo(() => {
        if (!showOnlyUpcomingItems) {
            return allSubjectItems;
        }

        return allSubjectItems.filter((item) => item.end.date > now);
    }, [allSubjectItems, showOnlyUpcomingItems, now.getTime()]);

    const itemTypeInfos = useMemo(() => {
        const itemTypeToInfo = {} as Record<
            string,
            { remainingCount: number; remainingDuration: number; totalCount: number; totalDuration: number }
        >;

        for (const item of allSubjectItems) {
            if (IGNORED_ITEM_CATEGORIES_FOR_SUMMARIES.includes(item.type.category)) {
                continue;
            }

            itemTypeToInfo[item.type.value] = itemTypeToInfo[item.type.value] ?? {
                remainingCount: 0,
                remainingDuration: 0,
                totalCount: 0,
                totalDuration: 0,
            };
            const itemTypeInfo = itemTypeToInfo[item.type.value]!;
            itemTypeInfo.totalCount++;

            const itemDuration = item.end.date.getTime() - item.start.date.getTime();
            itemTypeInfo.totalDuration += itemDuration;

            if (item.end.date.getTime() > now.getTime()) {
                itemTypeInfo.remainingCount++;
                itemTypeInfo.remainingDuration += itemDuration;
            }
        }

        return Object.entries(itemTypeToInfo)
            .map(([itemType, info]) => ({ itemType, ...info }))
            .sort((a, b) => a.itemType.localeCompare(b.itemType));
    }, [allSubjectItems, now.getTime()]);

    const lecturerInfos = useMemo(() => {
        const lecturerNameToLecturerInfo = {} as Record<
            string,
            {
                moodleCourseId?: number;
                itemTypes: Set<string>;
            }
        >;

        for (const item of allSubjectItems) {
            if (IGNORED_ITEM_CATEGORIES_FOR_SUMMARIES.includes(item.type.category)) {
                continue;
            }

            for (const lecturer of item.lecturers) {
                lecturerNameToLecturerInfo[lecturer.name] = lecturerNameToLecturerInfo[lecturer.name] ?? {
                    moodleCourseId: lecturer.moodleCourseId,
                    itemTypes: new Set(),
                };

                lecturerNameToLecturerInfo[lecturer.name]!.itemTypes.add(item.type.value);
            }
        }

        return Object.entries(lecturerNameToLecturerInfo)
            .map(([lecturerName, { moodleCourseId, itemTypes }]) => ({
                name: lecturerName,
                moodleURL: moodleCourseId ? createMoodleCourseURL(moodleCourseId) : null,
                itemTypes: Array.from(itemTypes).sort((a, b) => a.localeCompare(b)),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [allSubjectItems]);

    const allItemsGroups = useMemo(
        () =>
            Array.from(
                allSubjectItems.reduce((set, item) => {
                    item.groups.forEach((group) => set.add(group));
                    return set;
                }, new Set<string>()),
            ).sort((a, b) => a.localeCompare(b)),
        [allSubjectItems],
    );

    const [itemDateFormatter, daysFromNowFormatter] = useMemo(
        () => [
            new Intl.DateTimeFormat(currentLocale.value, {
                timeZone: TIME_ZONE.APP,
                day: 'numeric',
                month: 'long',
            }),
            new Intl.RelativeTimeFormat(currentLocale.value, {
                numeric: 'auto',
                style: 'long',
            }),
        ],
        [currentLocale.value],
    );

    return (
        <Modal
            title={currentLocale.getLabel('main.subjectDetails.modalTitle', {
                args: [subject],
            })}
            onClose={() =>
                updateQueryParams(
                    'pushState',
                    subjectDetailsModalSubjectGlobalState.createUpdate(''),
                    subjectDetailsModalShowOnlyUpcomingItemsGlobalState.createClearUpdate(),
                )
            }
        >
            <div class="flex flex-col lg:grid lg:grid-cols-2">
                <div class="border-r-x-main-bg-5 lg:border-r-2 lg:pr-2">
                    <p class="text-lg font-semibold md:text-xl">
                        {currentLocale.getLabel('main.subjectDetails.remainingSectionHeader')}
                    </p>
                    {itemTypeInfos.map((itemTypeInfo) => (
                        <p key={itemTypeInfo.itemType} class="text-sm">
                            <span class="font-semibold">
                                {currentLocale.getLabel('common.XOutOfY', {
                                    args: [itemTypeInfo.remainingCount, itemTypeInfo.totalCount],
                                })}
                            </span>
                            <span class={getItemTypeTextClass(itemTypeInfo.itemType)}> {itemTypeInfo.itemType}</span>
                            <span>{` - ${currentLocale.getLabel('common.XOutOfY', {
                                args: [
                                    complexLabels.durationHoursAndMinutesShort(
                                        currentLocale.value,
                                        itemTypeInfo.remainingDuration,
                                    ),
                                    complexLabels.durationHoursAndMinutesShort(
                                        currentLocale.value,
                                        itemTypeInfo.totalDuration,
                                    ),
                                ],
                            })}`}</span>
                        </p>
                    ))}
                </div>
                <hr class="border-x-main-bg-5 my-2 lg:hidden" />
                <div class="divide-x-main-bg-5 flex flex-col lg:gap-1 lg:pl-2">
                    <p class="text-lg font-semibold md:text-xl">
                        {currentLocale.getLabel('main.subjectDetails.lecturersSectionHeader')}
                    </p>
                    {lecturerInfos.map((lecturerInfo) => (
                        <div key={lecturerInfo.name} class="flex flex-col py-1">
                            <div class="flex items-center gap-2">
                                <span class="text-sm lg:text-base">- {lecturerInfo.name}</span>
                                {lecturerInfo.moodleURL !== null && (
                                    <Button
                                        class="max-w-fit text-sm"
                                        text={currentLocale.getLabel('main.subjectDetails.eBusinessCard')}
                                        icon="externalLink"
                                        title={currentLocale.getLabel('common.eBusinessCardForX', {
                                            args: [lecturerInfo.name],
                                        })}
                                        href={lecturerInfo.moodleURL}
                                    />
                                )}
                            </div>
                            <div class="flex flex-wrap">
                                {lecturerInfo.itemTypes.map((itemType) => (
                                    <span
                                        class={clsx(
                                            'not-first:border-l-x-main-bg-5 text-xs not-first:ml-1 not-first:border-l-2 not-first:pl-1 lg:text-sm lg:not-first:ml-2 lg:not-first:pl-2',
                                            getItemTypeTextClass(itemType),
                                        )}
                                    >
                                        {itemType}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                    {(allItemsGroups.length > 1 || query.params.scheduleType !== 'G') && (
                        <>
                            <p class="text-lg font-semibold md:text-xl">
                                {currentLocale.getLabel('main.subjectDetails.groupsSectionHeader')}
                            </p>
                            {allItemsGroups.map((group) => (
                                <p key={group}>- {group}</p>
                            ))}
                        </>
                    )}
                </div>
            </div>

            <p class="border-t-x-main-bg-5 mt-2 flex items-center gap-2 border-t-2 pt-2 text-lg font-semibold">
                <span>{currentLocale.getLabel('main.subjectDetails.itemListHeader')}</span>
                <span class="bg-x-main-bg-4 h-6 w-0.5" />
                <Checkbox
                    class="max-w-fit"
                    label={currentLocale.getLabel('main.subjectDetails.itemListShowAllSwitchText')}
                    value={showOnlyUpcomingItems}
                    onChange={() =>
                        updateQueryParams(
                            'replaceState',
                            subjectDetailsModalShowOnlyUpcomingItemsGlobalState.createUpdate(!showOnlyUpcomingItems),
                        )
                    }
                />
            </p>
            <div class="overflow-y-auto rounded-md text-xs sm:text-sm md:text-base lg:max-h-75">
                {visibleSubjectItems.length === 0 && (
                    <p class="my-2 text-center text-base italic">
                        {currentLocale.getLabel(
                            showOnlyUpcomingItems
                                ? 'main.subjectDetails.itemListUpcomingEmptyMessage'
                                : 'main.subjectDetails.itemListEmptyMessage',
                        )}
                    </p>
                )}
                {visibleSubjectItems.map((item) => (
                    <div
                        key={item.id}
                        class={clsx(
                            'grid grid-cols-10 items-center rounded border-2 border-transparent p-0.5 transition-all md:p-1',
                            item.end.date.getTime() < now.getTime()
                                ? 'hover:border-x-main-bg-5'
                                : 'hover:border-x-brand-500',
                            IGNORED_ITEM_CATEGORIES_FOR_SUMMARIES.includes(item.type.category) &&
                                'opacity-60 transition-opacity hover:opacity-100',
                        )}
                    >
                        <p class={clsx('col-span-3')}>
                            <span>{itemDateFormatter.format(item.start.date)}</span>
                            <br class="sm:hidden" />
                            <span class="text-xxs lg:text-xs">
                                {` (${daysFromNowFormatter.format(
                                    Math.round(
                                        (item.start.parts.stripTime().toDate().getTime() - nowWithoutTime.getTime()) /
                                            (1000 * 60 * 60 * 24),
                                    ),
                                    'days',
                                )})`}
                            </span>
                        </p>
                        <p
                            class={clsx(
                                'col-span-4 mx-2 flex flex-col border-x-2 px-2 py-0.5 sm:flex-row sm:items-center sm:gap-1',
                                item.end.date.getTime() < now.getTime() ? 'border-x-main-bg-5' : 'border-x-brand-500',
                            )}
                        >
                            <span>
                                {item.start.parts.toTimeString()}-{item.end.parts.toTimeString()}
                            </span>
                            <span class="text-xxs sm:text-xs">
                                {` (${complexLabels.durationHoursAndMinutesShort(currentLocale.value, item.end.date.getTime() - item.start.date.getTime())})`}
                            </span>
                        </p>
                        <p class={clsx('col-span-3', getItemTypeTextClass(item.type.value))}>{item.type.value}</p>
                    </div>
                ))}
            </div>
        </Modal>
    );
};
