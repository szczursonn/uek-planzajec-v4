import { useEffect, useMemo, useState } from 'preact/hooks';
import clsx from 'clsx';
import { useCurrentLocale } from '../../i18n/useCurrentLocale';
import { TIME_ZONE } from '../../date/timeZone';
import { createOfficialScheduleURL } from '../../api/common';
import { GlobalScheduleQueryProvider, useGlobalScheduleQuery } from '../../api/globalScheduleQuery';
import { useDocumentTitle } from '../../useDocumentTitle';
import { scheduleViewGlobalState } from '../../state/localStorage/scheduleView';
import { MainViewHeader } from './header/MainViewHeader';
import { MainViewExportModalHost } from './MainViewExportModal';
import { MainViewSubjectDetailsModalHost } from './MainViewSubjectDetailsModal';
import { MainViewSelectorModalHost } from './selector/MainViewSelectorModal';
import { ErrorAlert } from '../common/ErrorAlert';
import { MainViewNoSchedule } from './MainViewNoSchedule';
import { MainViewDataRefreshStatus } from './MainViewDataRefreshStatus';
import { MainViewScheduleViewCalendar } from './schedule/MainViewScheduleViewCalendar';
import { MainViewScheduleViewTable } from './schedule/MainViewScheduleViewTable';
import { MainViewSidebarPWAInstallSection } from './sidebar/MainViewSidebarPWAInstallSection';
import { MainViewSidebarSelectedSchedulesSection } from './sidebar/MainViewSidebarSelectedSchedulesSection';
import { MainViewSidebarSavedSchedulesSection } from './sidebar/MainViewSidebarSavedSchedulesSection';
import { MainViewSidebarSubjectsSection } from './sidebar/MainViewSidebarSubjectsSection';
import { MainViewSidebarScheduleViewSection } from './sidebar/MainViewSidebarScheduleViewSection';
import { MainViewSidebarLocalesSection } from './sidebar/MainViewSidebarLocalesSection';
import { MainViewSidebarOtherSettingsSection } from './sidebar/MainViewSidebarOtherSettingsSection';

const SCHEDULE_VIEW_TO_CMP = {
    calendar: MainViewScheduleViewCalendar,
    table: MainViewScheduleViewTable,
} as const;

export const MainView = () => (
    <>
        <GlobalScheduleQueryProvider>
            <MainViewActual />
            <MainViewExportModalHost />
            <MainViewSubjectDetailsModalHost />
        </GlobalScheduleQueryProvider>
        <MainViewSelectorModalHost />
    </>
);

const MainViewActual = () => {
    const currentLocale = useCurrentLocale();
    const query = useGlobalScheduleQuery();
    const ScheduleViewCmp = SCHEDULE_VIEW_TO_CMP[scheduleViewGlobalState.use()];
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [forceShowQueryError, setForceShowQueryError] = useState(false);

    useEffect(() => {
        document.body.classList.add('overflow-y-scroll');
        return () => {
            document.body.classList.remove('overflow-y-scroll');
        };
    }, []);

    useDocumentTitle(() => {
        const parts = [] as string[];

        if (query.data) {
            parts.push(query.data?.resource.aggregateSchedule.headers.map((header) => header.name).join(', '));
        } else {
            if (query.isLoading) {
                parts.push(currentLocale.getLabel('main.documentTitlePartLoading'));
            }

            parts.push(query.params.scheduleIds.join(', '));
        }

        return parts;
    }, [query.data?.resource.aggregateSchedule.headers, query.isLoading, query.params.scheduleIds]);

    const lastUpdateDateString = useMemo(() => {
        if (!query.data) {
            return '-';
        }

        return new Intl.DateTimeFormat(currentLocale.value, {
            timeZone: TIME_ZONE.APP,
            dateStyle: 'medium',
            timeStyle: 'medium',
        }).format(query.data.createdAt);
    }, [currentLocale.value, query.data?.createdAt]);

    return (
        <>
            <div class="flex flex-1 flex-col">
                <MainViewHeader isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen((val) => !val)} />

                <aside
                    class={clsx(
                        'bg-x-main-bg-2 border-r-x-main-bg-3 fixed top-0 z-30 mt-16 flex h-[calc(100%-4rem)] w-80 shrink-0 flex-col overflow-y-auto border-r p-2 pb-4 transition-all',
                        isSidebarOpen ? '' : '-translate-x-full',
                    )}
                >
                    <p class="mt-1 mb-4 text-center text-xl font-semibold md:hidden">
                        {currentLocale.getLabel('common.appTitle')}
                    </p>
                    <MainViewSidebarPWAInstallSection />
                    <MainViewSidebarSelectedSchedulesSection />
                    <MainViewSidebarSavedSchedulesSection />
                    <MainViewSidebarSubjectsSection />
                    <MainViewSidebarScheduleViewSection />
                    <MainViewSidebarLocalesSection />
                    <MainViewSidebarOtherSettingsSection />
                </aside>
                <button
                    class={clsx(
                        'bg-x-main-bg-2/75 fixed top-0 right-0 z-20 mt-16 h-[calc(100%-4rem)] w-full transition-all lg:hidden',
                        isSidebarOpen ? '' : 'translate-x-full',
                    )}
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                />

                <div
                    class={clsx(
                        '3xl:px-[10%] mt-16 flex min-h-[calc(100%-4rem)] flex-col items-center p-2 transition-all md:p-4 xl:px-[5%]',
                        isSidebarOpen && 'lg:ml-80',
                    )}
                >
                    {query.data && (
                        <MainViewDataRefreshStatus
                            lastUpdated={query.data.createdAt}
                            isRefreshing={query.isLoading}
                            hasError={!!query.error}
                            isShowingError={forceShowQueryError}
                            onToggleShowError={() => setForceShowQueryError((val) => !val)}
                            onRefresh={query.refresh}
                        />
                    )}

                    {query.params.scheduleIds.length === 0 ? (
                        <MainViewNoSchedule />
                    ) : query.error && !query.isLoading && (!query.data || forceShowQueryError) ? (
                        <div class="my-auto flex flex-col gap-2">
                            <ErrorAlert error={query.error} onRetry={query.refresh} />
                            <div class="bg-x-err-900 border-x-err-950 text-x-err-text mx-auto flex max-w-full flex-col items-center gap-2 rounded-xl border-4 p-4 text-center xl:max-w-196">
                                <p class="text-lg font-bold">{currentLocale.getLabel('common.officialSchedule')}</p>
                                {query.params.scheduleIds.map((id) => {
                                    const href = createOfficialScheduleURL(query.params.scheduleType, id);

                                    return (
                                        <p>
                                            <span key={id} class="font-semibold">{`${id}: `}</span>
                                            <a href={href} class="hover:underline" target="_blank">
                                                {href}
                                            </a>
                                        </p>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <ScheduleViewCmp />
                    )}
                </div>
            </div>
        </>
    );
};
