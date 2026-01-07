import { useCurrentLocale } from '../../../i18n/useCurrentLocale';
import { SCHEDULE_VIEWS, scheduleViewGlobalState, scheduleViewSchema } from '../../../state/localStorage/scheduleView';
import { MainViewSidebarSection } from './MainViewSidebarSection';

export const MainViewSidebarScheduleViewSection = () => {
    const currentLocale = useCurrentLocale();
    const currentScheduleView = scheduleViewGlobalState.use();

    return (
        <MainViewSidebarSection title={currentLocale.getLabel('main.sidebar.scheduleView.sectionTitle')}>
            <select
                class="border-b-x-main-bg-4 hover:border-b-x-brand-400 hover:bg-x-main-bg-3 focus-visible:outline-x-brand-400 m-0.5 w-[calc(100%-0.25rem)] cursor-pointer truncate border-b px-1 py-1.5 outline-2 outline-transparent transition-colors"
                value={currentScheduleView}
                onChange={(event) => scheduleViewGlobalState.set(scheduleViewSchema.parse(event.currentTarget.value))}
            >
                {SCHEDULE_VIEWS.map((scheduleView) => (
                    <option
                        key={scheduleView}
                        class="bg-x-main-bg-3"
                        label={currentLocale.getLabel(`main.sidebar.scheduleView.option.${scheduleView}`)}
                        value={scheduleView}
                    />
                ))}
            </select>
        </MainViewSidebarSection>
    );
};
