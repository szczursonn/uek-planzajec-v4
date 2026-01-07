import { useMemo } from 'preact/hooks';
import { Fragment } from 'preact/jsx-runtime';
import clsx from 'clsx';
import { useNow } from '../../../date/useNow';
import { DateParts } from '../../../date/dateParts';
import { getClosestFutureSunday, getClosestPastMonday } from '../../../date/dateUtils';
import { TIME_ZONE } from '../../../date/timeZone';
import { createMoodleCourseURL } from '../../../api/common';
import {
    useGlobalScheduleQuery,
    type ScheduleItemTypeCategory,
    type ScheduleItem,
} from '../../../api/globalScheduleQuery';
import { complexLabels } from '../../../i18n/labels';
import { useCurrentLocale } from '../../../i18n/useCurrentLocale';
import { highlightOnlineOnlyDaysGlobalState } from '../../../state/localStorage/highlightOnlineOnlyDays';
import { showLongBreaksGlobalState } from '../../../state/localStorage/showLongBreaks';
import { longBreakThresholdMinutesGlobalState } from '../../../state/localStorage/longBreakThreshold';
import { Icon } from '../../common/Icon';
import { Button } from '../../common/Button';

const getScheduleItemTypeCategoryClass = (category: ScheduleItemTypeCategory) => {
    switch (category) {
        case 'lecture':
            return 'bg-sky-800 border-sky-900 shadow-sky-700/25';
        case 'exercise':
            return 'bg-amber-800 border-amber-900 shadow-amber-700/25';
        case 'language':
            return 'bg-green-700 border-green-900 shadow-green-700/25';
        case 'exam':
            return 'bg-red-700 border-red-900 shadow-red-700/25';
        case 'cancelled':
            return 'bg-zinc-800 border-zinc-900 text-zinc-400 shadow-zinc-800/25';
        default:
            return 'bg-zinc-800 border-zinc-900 shadow-zinc-800/25';
    }
};

// TODO: split this monstrosity
export const MainViewScheduleViewCalendar = () => {
    const currentLocale = useCurrentLocale();
    const query = useGlobalScheduleQuery();
    const isSchedulePeriodUpcoming = query.params.schedulePeriod === 'inferUpcoming';
    const now = useNow('minute');
    const showLongBreaks = showLongBreaksGlobalState.use();
    const highlightOnlineOnlyDays = highlightOnlineOnlyDaysGlobalState.use();
    const longBreakThresholdMs = longBreakThresholdMinutesGlobalState.useMs();

    const formatItemRelativeTime = useMemo(() => {
        const relativeTimeFormatter = new Intl.RelativeTimeFormat(currentLocale.value, {
            numeric: 'auto',
            style: 'long',
        });

        return (itemDate: Date) => {
            const minutes = Math.round((itemDate.getTime() - now.getTime()) / (60 * 1000));
            const minutesAbs = Math.abs(minutes);

            // Minutes format is shown below 2h difference
            if (minutesAbs < 120) {
                return relativeTimeFormatter.format(minutes, 'minutes');
            }

            if (minutesAbs < 1440) {
                return relativeTimeFormatter.format(Math.round(minutes / 60), 'hours');
            }

            return relativeTimeFormatter.format(Math.round(minutes / 1440), 'days');
        };
    }, [currentLocale.value, now.getTime()]);

    const dayColumns = useMemo(() => {
        const nowParts = DateParts.fromDate(now);
        const groupLabelFormatter = new Intl.DateTimeFormat(currentLocale.value, {
            timeZone: TIME_ZONE.APP,
            day: 'numeric',
            month: 'short',
            weekday: 'short',
        });

        const dayColumns: {
            label: string;
            currentDateRelation: 'past' | 'current' | 'future';
            isOnlineOnly: boolean;
            items: ScheduleItem[];
        }[] = [];
        let currentItemIndex = 0;

        const dateIterator = DateParts.fromDate(
            getClosestPastMonday(
                isSchedulePeriodUpcoming
                    ? now
                    : (query.data?.resource.aggregateSchedule.filteredItems[0]?.start.date ?? now),
            ),
        ).iterateDaysUntil(
            DateParts.fromDate(
                getClosestFutureSunday(
                    new Date(
                        Math.max(
                            query.data?.resource.aggregateSchedule.filteredItems.at(-1)?.start.date.getTime() ??
                                now.getTime(),
                            now.getTime(),
                        ),
                    ),
                ),
            ),
        );

        for (const dateParts of dateIterator) {
            const compareNowResult = dateParts.compareWithoutTime(nowParts);
            const newDayColumn = {
                label: groupLabelFormatter.format(dateParts.toDate()),
                currentDateRelation: compareNowResult === -1 ? 'past' : compareNowResult === 0 ? 'current' : 'future',
                isOnlineOnly: false,
                items: [],
            } as (typeof dayColumns)[number];

            while (currentItemIndex < (query.data?.resource.aggregateSchedule.filteredItems.length ?? 0)) {
                const item = query.data!.resource.aggregateSchedule.filteredItems[currentItemIndex]!;
                if (!item.start.parts.isEqualWithoutTime(dateParts)) {
                    break;
                }

                newDayColumn.items.push(item);
                currentItemIndex++;
            }

            newDayColumn.isOnlineOnly =
                newDayColumn.items.length > 0 && newDayColumn.items.every((item) => item.isOnline);

            dayColumns.push(newDayColumn);
        }

        return dayColumns;
    }, [query.data, now.getTime(), isSchedulePeriodUpcoming, currentLocale.value]);

    let hasFutureItemOutlineBeenRendered = false;

    return (
        <ul class="mt-2 grid w-full grid-cols-1 gap-x-1 gap-y-4 sm:grid-cols-7 sm:gap-y-10 md:gap-x-2">
            {query.data?.resource.aggregateSchedule.filteredItems.length === 0 && (
                <span class="text-center text-xl font-semibold sm:hidden">
                    {currentLocale.getLabel('main.calendar.noItemsMessage')}
                </span>
            )}
            {!query.data && query.isLoading
                ? [...Array(7 * 4).keys()].map((i) => (
                      <li key={i} class="cursor-progress">
                          <span class="bg-x-main-bg-3 my-3 flex h-10 animate-pulse rounded-md"></span>
                          <ul>
                              {[...Array(3).keys()].map((i) => (
                                  <li key={i} class="bg-x-main-bg-2 my-1.5 h-20 animate-pulse rounded-md"></li>
                              ))}
                          </ul>
                      </li>
                  ))
                : dayColumns.map((dayColumn) => (
                      <li
                          key={dayColumn.label}
                          class={clsx('flex-col gap-2', dayColumn.items.length === 0 ? 'hidden sm:flex' : 'flex')}
                      >
                          <span
                              class={clsx(
                                  'flex flex-col items-center border-y-3 text-center text-base sm:text-xs md:text-sm lg:text-base',
                                  dayColumn.currentDateRelation === 'current'
                                      ? 'border-x-brand-400 bg-x-brand-500 font-bold'
                                      : 'font-semibold',
                                  dayColumn.items.length === 0 && 'italic opacity-50',
                                  isSchedulePeriodUpcoming &&
                                      dayColumn.currentDateRelation === 'past' &&
                                      'italic line-through opacity-50',
                              )}
                          >
                              <span class="truncate">{dayColumn.label}</span>
                              {highlightOnlineOnlyDays && dayColumn.isOnlineOnly && (
                                  <span class="text-xs font-semibold text-cyan-300">
                                      {currentLocale.getLabel('main.calendar.online')}
                                  </span>
                              )}
                          </span>
                          <ul class="flex flex-col gap-y-1">
                              {dayColumn.items.map((item, itemIndex) => {
                                  const isPastItem = item.end.date.getTime() < now.getTime();
                                  const isFutureItem = item.start.date.getTime() > now.getTime();

                                  const shouldRenderItemOutline =
                                      (!hasFutureItemOutlineBeenRendered && isFutureItem) ||
                                      (!isPastItem && !isFutureItem);
                                  hasFutureItemOutlineBeenRendered ||= isFutureItem;

                                  const previousItemDateDiff =
                                      itemIndex > 0
                                          ? item.start.date.getTime() -
                                            dayColumn.items[itemIndex - 1]!.end.date.getTime()
                                          : null;

                                  return (
                                      <Fragment key={item.id}>
                                          {showLongBreaks &&
                                              previousItemDateDiff !== null &&
                                              previousItemDateDiff > longBreakThresholdMs && (
                                                  <div
                                                      class={clsx(
                                                          'bg-x-main-bg-3 border-x-warn-400 text-x-warn-text w-full rounded-lg border-2 p-2 text-center transition-opacity lg:p-3',
                                                          isSchedulePeriodUpcoming &&
                                                              !isFutureItem &&
                                                              'opacity-50 hover:opacity-100',
                                                      )}
                                                  >
                                                      <p class="sm:text-xxs text-sm md:text-xs lg:text-sm">
                                                          {currentLocale.getLabel('main.calendar.longBreakXMessage', {
                                                              args: [
                                                                  complexLabels.durationHoursAndMinutesShort(
                                                                      currentLocale.value,
                                                                      previousItemDateDiff,
                                                                  ),
                                                              ],
                                                          })}
                                                      </p>
                                                      <p class="text-xxs lg:text-xs">{`${dayColumn.items[itemIndex - 1]!.end.parts.toTimeString()}-${item.start.parts.toTimeString()}`}</p>
                                                  </div>
                                              )}
                                          <div
                                              class={clsx(
                                                  'sm:text-xxxs relative z-10 flex w-full flex-col gap-y-0.5 rounded-lg border-2 p-3 text-left text-xs transition-all hover:shadow-2xl sm:p-1.25 lg:p-2.5 lg:text-xs',
                                                  getScheduleItemTypeCategoryClass(item.type.category),
                                                  isSchedulePeriodUpcoming &&
                                                      isPastItem &&
                                                      'opacity-50 hover:opacity-100',
                                              )}
                                          >
                                              {shouldRenderItemOutline && (
                                                  <div
                                                      class={clsx(
                                                          'border-x-brand-500 pointer-events-none absolute -bottom-0.5 -left-0.5 flex h-[calc(100%+4px)] w-[calc(100%+4px)] justify-center rounded-lg border-4',
                                                          !isFutureItem && 'animate-pulse',
                                                      )}
                                                  >
                                                      <div class="bg-x-brand-500 sm:text-xxs pointer-events-auto h-min w-full truncate pb-0.5 text-center text-sm font-bold lg:py-1 lg:text-sm">
                                                          {isFutureItem
                                                              ? formatItemRelativeTime(item.start.date)
                                                              : currentLocale.getLabel(
                                                                    'main.calendar.endOfScheduleItemMessage',
                                                                    {
                                                                        args: [formatItemRelativeTime(item.end.date)],
                                                                    },
                                                                )}
                                                      </div>
                                                  </div>
                                              )}
                                              <span
                                                  class={clsx(
                                                      'sm:text-xxxs text-sm font-bold lg:text-xs lg:font-bold',
                                                      shouldRenderItemOutline && 'mt-5 sm:mt-4 lg:mt-6',
                                                  )}
                                              >
                                                  {[item.subject, item.type.value].filter(Boolean).join(' - ')}
                                              </span>
                                              <div class="flex flex-wrap items-center gap-x-1">
                                                  <span class="truncate font-semibold">
                                                      {`${item.start.parts.toTimeString()}-${item.end.parts.toTimeString()} (${complexLabels.durationHoursAndMinutesShort(currentLocale.value, item.end.date.getTime() - item.start.date.getTime())})`}
                                                  </span>
                                                  {item.roomName && item.isOnline && (
                                                      <span class="font-semibold text-cyan-300">
                                                          {currentLocale.getLabel('main.calendar.online')}
                                                      </span>
                                                  )}
                                              </div>
                                              {(query.params.scheduleType !== 'S' ||
                                                  query.data!.resource.aggregateSchedule.headers.length > 1) &&
                                                  item.roomName &&
                                                  !item.isOnline && (
                                                      <div class="flex items-center gap-1.5 sm:gap-1 lg:gap-2">
                                                          <Icon
                                                              name="pin"
                                                              class="h-3 w-3 shrink-0 sm:h-2 sm:w-2 lg:h-3 lg:w-3"
                                                          />
                                                          <span class="truncate" title={item.roomName}>
                                                              {item.roomName}
                                                          </span>
                                                      </div>
                                                  )}
                                              {(query.params.scheduleType !== 'N' ||
                                                  query.data!.resource.aggregateSchedule.headers.length > 1) &&
                                                  item.lecturers.map((lecturer) => (
                                                      <div class="flex items-center gap-1.5 sm:gap-1 lg:gap-2">
                                                          <Icon
                                                              name="person"
                                                              class="h-3 w-3 shrink-0 sm:h-2 sm:w-2 lg:h-3 lg:w-3"
                                                          />

                                                          {lecturer.moodleCourseId ? (
                                                              <a
                                                                  key={lecturer.name}
                                                                  href={createMoodleCourseURL(lecturer.moodleCourseId)}
                                                                  title={currentLocale.getLabel(
                                                                      'common.eBusinessCardForX',
                                                                      {
                                                                          args: [lecturer.name],
                                                                      },
                                                                  )}
                                                                  target="_blank"
                                                                  class="focus-visible:outline-x-brand-400 truncate outline-2 outline-transparent hover:underline"
                                                              >
                                                                  {lecturer.name}
                                                              </a>
                                                          ) : (
                                                              <span key={lecturer.name}>{lecturer.name}</span>
                                                          )}
                                                      </div>
                                                  ))}
                                              {query.params.scheduleType !== 'G' &&
                                                  item.groups.map((group) => (
                                                      <div
                                                          key={group}
                                                          class="flex items-center gap-1.5 sm:gap-1 lg:gap-2"
                                                      >
                                                          <Icon
                                                              name="group"
                                                              class="h-3 w-3 shrink-0 sm:h-2 sm:w-2 lg:h-3 lg:w-3"
                                                          />
                                                          <span>{group}</span>
                                                      </div>
                                                  ))}
                                              {item.roomUrl && (
                                                  <Button
                                                      variant="tertiary"
                                                      icon="externalLink"
                                                      class="mt-1"
                                                      href={item.roomUrl}
                                                      text={item.roomName}
                                                  />
                                              )}
                                              {item.extra && (
                                                  <>
                                                      <hr class="border-x-err-300 my-1" />
                                                      <p class="text-x-err-text">{item.extra}</p>
                                                  </>
                                              )}
                                          </div>
                                      </Fragment>
                                  );
                              })}
                          </ul>
                      </li>
                  ))}
        </ul>
    );
};
