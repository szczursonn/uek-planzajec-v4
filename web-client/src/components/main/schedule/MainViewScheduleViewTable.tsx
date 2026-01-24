import { useMemo } from 'preact/hooks';
import clsx from 'clsx';
import { createMoodleCourseURL } from '../../../api/common';
import { type ScheduleItemTypeCategory, useGlobalScheduleQuery } from '../../../api/globalScheduleQuery';
import { useCurrentLocale } from '../../../i18n/useCurrentLocale';
import { TIME_ZONE } from '../../../date/timeZone';

const getScheduleItemTypeCategoryClass = (category: ScheduleItemTypeCategory) => {
    switch (category) {
        case 'lecture':
            return 'text-sky-500';
        case 'exercise':
            return 'text-amber-500';
        case 'language':
            return 'text-green-500';
        case 'exam':
            return 'text-red-500';
        case 'special':
            return 'text-violet-500';
        case 'cancelled':
        case 'reservation':
            return 'text-zinc-400';
        default:
            return '';
    }
};

export const MainViewScheduleViewTable = () => {
    const currentLocale = useCurrentLocale();
    const query = useGlobalScheduleQuery();

    const itemDateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(currentLocale.value, {
                timeZone: TIME_ZONE.APP,
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                weekday: 'short',
            }),
        [currentLocale.value],
    );

    return (
        <table class="mt-4 w-full break-all">
            <thead class="border-b-x-main-bg-4 text-xxs text-secondary border-b-2 font-bold sm:text-sm md:text-base lg:text-lg">
                <tr class={clsx(query.isLoading && !query.data && 'animate-pulse')}>
                    <th>{currentLocale.getLabel('main.schedule.tableHead.date')}</th>
                    <th>{currentLocale.getLabel('main.schedule.tableHead.subject')}</th>
                    <th>{currentLocale.getLabel('main.schedule.tableHead.type')}</th>
                    {(query.params.scheduleType !== 'N' || query.params.scheduleIds.length > 1) && (
                        <th>{currentLocale.getLabel('main.schedule.tableHead.lecturers')}</th>
                    )}
                    {(query.params.scheduleType !== 'G' || query.params.scheduleIds.length > 1) && (
                        <th>{currentLocale.getLabel('main.schedule.tableHead.groups')}</th>
                    )}
                    {(query.params.scheduleType !== 'S' || query.params.scheduleIds.length > 1) && (
                        <th>{currentLocale.getLabel('main.schedule.tableHead.rooms')}</th>
                    )}
                </tr>
            </thead>

            <tbody class="text-xxxs sm:text-xxs lg:text-sm xl:text-base">
                {query.data?.resource.aggregateSchedule.filteredItems.map((item) => (
                    <tr key={item.id} class="border-b-x-main-bg-3 hover:bg-x-main-bg-2 border-b-2 transition-colors">
                        <td class="p-1">{itemDateFormatter.formatRange(item.start.date, item.end.date)}</td>
                        <td>{item.subject || '-'}</td>
                        <td class={getScheduleItemTypeCategoryClass(item.type.category)}>{item.type.value || '-'}</td>
                        {(query.params.scheduleType !== 'N' || query.params.scheduleIds.length > 1) && (
                            <td>
                                {item.lecturers.map((lecturer) =>
                                    lecturer.moodleCourseId ? (
                                        <a
                                            class="hover:underline"
                                            href={createMoodleCourseURL(lecturer.moodleCourseId)}
                                            target="_blank"
                                        >
                                            {lecturer.name}
                                        </a>
                                    ) : (
                                        <>{lecturer.name}</>
                                    ),
                                )}
                            </td>
                        )}
                        {(query.params.scheduleType !== 'G' || query.params.scheduleIds.length > 1) && (
                            <td>{item.groups.join(', ')}</td>
                        )}
                        {(query.params.scheduleType !== 'S' || query.params.scheduleIds.length > 1) && (
                            <td>
                                {item.roomUrl ? (
                                    <a class="hover:underline" target="_blank" href={item.roomUrl}>
                                        {item.roomName}
                                    </a>
                                ) : (
                                    <>{item.roomName || '-'}</>
                                )}
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
