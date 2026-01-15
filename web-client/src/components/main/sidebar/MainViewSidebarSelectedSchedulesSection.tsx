import clsx from 'clsx';
import { createOfficialScheduleURL, MAX_SCHEDULES_PER_REQUEST } from '../../../api/common';
import { useCurrentLocale } from '../../../i18n/useCurrentLocale';
import { useGlobalScheduleQuery } from '../../../api/globalScheduleQuery';
import { anchorPushStateHandler, useURLCreator } from '../../../state/queryParams/manager';
import { scheduleIdsGlobalState } from '../../../state/queryParams/scheduleIds';
import { selectorModalOpenGlobalState } from '../../../state/queryParams/selector';
import { isExportModalOpenGlobalState } from '../../../state/queryParams/exportModal';
import { MainViewSidebarSection } from './MainViewSidebarSection';
import { RoundIconButton } from '../../common/RoundIconButton';
import { Button } from '../../common/Button';
import { MainViewShareButton } from '../MainViewShareButton';

export const MainViewSidebarSelectedSchedulesSection = () => {
    const currentLocale = useCurrentLocale();
    const query = useGlobalScheduleQuery();

    const createURL = useURLCreator();

    return (
        <MainViewSidebarSection
            title={currentLocale.getLabel(
                `main.sidebar.selectedSchedules.sectionTitle.${query.params.scheduleIds.length === 0 ? 'noType' : query.params.scheduleType}`,
            )}
        >
            <div class="flex flex-col gap-1">
                {Array.from(Array(MAX_SCHEDULES_PER_REQUEST).keys()).map((i) => {
                    const scheduleId = query.params.scheduleIds[i] ?? null;
                    const scheduleDisplayName =
                        query.data?.resource.aggregateSchedule.headers[i]?.name ||
                        query.params.scheduleIds[i]?.toString() ||
                        '';

                    return (
                        <div
                            class={clsx(
                                'border-x-main-bg-4 flex w-full items-center justify-between p-1.25',
                                i === 0 ? 'rounded-t-md border' : 'border-x border-b',
                                i === MAX_SCHEDULES_PER_REQUEST - 1 && 'rounded-b-md',
                            )}
                        >
                            {scheduleId === null ? (
                                <span class="text-x-main-text-muted truncate">
                                    {currentLocale.getLabel('main.sidebar.selectedSchedules.emptySlot')}
                                </span>
                            ) : (
                                <span
                                    class={clsx(
                                        'truncate',
                                        !query.data && query.isLoading ? 'animate-pulse' : '',
                                        !query.data && query.error ? 'text-x-err-text' : '',
                                    )}
                                    title={scheduleDisplayName}
                                >
                                    {scheduleDisplayName}
                                </span>
                            )}

                            <div class="text-x-main-text-muted flex">
                                {scheduleId === null ? (
                                    <RoundIconButton
                                        class="h-8 p-0.75"
                                        icon="plus"
                                        title={currentLocale.getLabel('main.sidebar.selectedSchedules.addScheduleCTA')}
                                        href={createURL(selectorModalOpenGlobalState.createUpdate(true))}
                                        onClick={anchorPushStateHandler}
                                    />
                                ) : (
                                    <>
                                        <RoundIconButton
                                            class="h-8 p-1.25"
                                            icon="externalLink"
                                            title={currentLocale.getLabel(
                                                'main.sidebar.selectedSchedules.officialScheduleForX',
                                                { args: [scheduleDisplayName] },
                                            )}
                                            href={createOfficialScheduleURL(
                                                query.params.scheduleType,
                                                scheduleId,
                                                query.data && !query.isLoading && !query.error
                                                    ? query.data.resolvedPeriodIdx
                                                    : undefined,
                                            )}
                                        />
                                        <RoundIconButton
                                            class="h-8 p-1.25"
                                            icon="cross"
                                            title={currentLocale.getLabel(
                                                'main.sidebar.selectedSchedules.removeScheduleXCTA',
                                                { args: [scheduleDisplayName] },
                                            )}
                                            href={createURL(scheduleIdsGlobalState.createRemoveUpdate(scheduleId))}
                                            onClick={anchorPushStateHandler}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}

                <div class="contents xl:hidden">
                    <MainViewShareButton />
                </div>
                <Button
                    icon="export"
                    text={currentLocale.getLabel('main.sidebar.selectedSchedules.exportButtonText')}
                    disabled={query.params.scheduleIds.length === 0}
                    href={createURL(isExportModalOpenGlobalState.createUpdate(true))}
                    onClick={anchorPushStateHandler}
                />
            </div>
        </MainViewSidebarSection>
    );
};
