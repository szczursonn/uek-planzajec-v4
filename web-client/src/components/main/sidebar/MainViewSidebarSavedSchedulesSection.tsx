import clsx from 'clsx';
import { useGlobalScheduleQuery } from '../../../api/globalScheduleQuery';
import {
    createSavedScheduleSelectionUpdates,
    savedSchedulesGlobalState,
} from '../../../state/localStorage/savedSchedules';
import { useCurrentLocale } from '../../../i18n/useCurrentLocale';
import { anchorPushStateHandler, useURLCreator } from '../../../state/queryParams/manager';
import { MainViewSidebarSection } from './MainViewSidebarSection';
import { Button } from '../../common/Button';
import { RoundIconButton } from '../../common/RoundIconButton';

export const MainViewSidebarSavedSchedulesSection = () => {
    const currentLocale = useCurrentLocale();
    const query = useGlobalScheduleQuery();
    const savedSchedules = savedSchedulesGlobalState.use();

    const activeSavedSchedule = savedSchedules.find(
        (savedSchedule) =>
            savedSchedule.type === query.params.scheduleType &&
            savedSchedule.headers.length === query.params.scheduleIds.length &&
            savedSchedule.headers.every((header, i) => header.id === query.params.scheduleIds[i]) &&
            savedSchedule.hiddenSubjects.length === query.params.hiddenSubjects.length &&
            savedSchedule.hiddenSubjects.every((hiddenSubject, i) => hiddenSubject === query.params.hiddenSubjects[i]),
    );

    const createURL = useURLCreator();

    return (
        <MainViewSidebarSection title={currentLocale.getLabel('main.sidebar.savedSchedules.sectionTitle')}>
            <div class="divide-x-main-bg-4 flex flex-col divide-y-2">
                {savedSchedules.map((savedSchedule) => {
                    const savedScheduleDisplayName = savedSchedule.headers.map((header) => header.name).join(', ');

                    return (
                        <div
                            class={clsx(
                                'flex w-full items-center justify-between p-1.25',
                                savedSchedule === activeSavedSchedule && 'bg-x-main-bg-3',
                            )}
                        >
                            <a
                                class="truncate hover:underline"
                                href={createURL(...createSavedScheduleSelectionUpdates(savedSchedule))}
                                onClick={anchorPushStateHandler}
                                title={currentLocale.getLabel('main.sidebar.savedSchedules.selectXCTA', {
                                    args: [savedScheduleDisplayName],
                                })}
                            >
                                <span>{savedScheduleDisplayName}</span>

                                {savedSchedule.hiddenSubjects.length > 0 && (
                                    <span class="text-xs">
                                        {` + ${currentLocale.getLabel('main.nHiddenSubjects', {
                                            pluralRulesN: savedSchedule.hiddenSubjects.length,
                                            args: [savedSchedule.hiddenSubjects.length],
                                        })}`}
                                    </span>
                                )}
                            </a>

                            <div class="text-x-main-text-muted flex">
                                <RoundIconButton
                                    class="h-8 p-1.25"
                                    icon="cross"
                                    title={currentLocale.getLabel('main.sidebar.savedSchedules.removeXCTA', {
                                        args: [savedScheduleDisplayName],
                                    })}
                                    onClick={() => savedSchedulesGlobalState.remove(savedSchedule)}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div class="mt-2 flex gap-2">
                {query.params.scheduleIds.length > 0 && (
                    <Button
                        type="button"
                        disabled={!query.data || !!activeSavedSchedule}
                        text={currentLocale.getLabel('main.sidebar.savedSchedules.saveCTAShort')}
                        title={currentLocale.getLabel('main.sidebar.savedSchedules.saveCTA')}
                        icon="save"
                        onClick={() =>
                            savedSchedulesGlobalState.add({
                                type: query.params.scheduleType,
                                headers: query.data!.resource.aggregateSchedule.headers,
                                hiddenSubjects: query.params.hiddenSubjects,
                            })
                        }
                    />
                )}
            </div>
        </MainViewSidebarSection>
    );
};
