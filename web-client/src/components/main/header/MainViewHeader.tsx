import clsx from 'clsx';
import { useCurrentLocale } from '../../../i18n/useCurrentLocale';
import { useGlobalScheduleQuery } from '../../../api/globalScheduleQuery';
import { encryptedBasicAuthGlobalState } from '../../../state/localStorage/encryptedBasicAuth';
import { MainViewHeaderSchedulePeriodSelector } from '../header/MainViewHeaderSchedulePeriodSelector';
import { MainViewShareButton } from '../MainViewShareButton';
import { Button } from '../../common/Button';
import { RoundIconButton } from '../../common/RoundIconButton';

export const MainViewHeader = ({
    isSidebarOpen,
    onToggleSidebar,
}: {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
}) => {
    const query = useGlobalScheduleQuery();
    const currentLocale = useCurrentLocale();

    return (
        <header class="bg-x-main-bg-2 border-b-x-main-bg-3 fixed top-0 z-20 flex h-16 w-full items-center gap-1.5 border-b px-3 py-2 lg:gap-4 lg:px-4">
            <RoundIconButton
                class={clsx('h-7', isSidebarOpen && 'rotate-180')}
                icon="burgerMenu"
                onClick={onToggleSidebar}
            />

            <a
                class="focus-visible:outline-x-brand-400 ml-2 hidden h-full shrink-0 items-center gap-3 text-lg font-semibold outline-2 outline-transparent transition-colors hover:underline md:flex lg:ml-0"
                href="/"
                title={currentLocale.getLabel('common.appTitle')}
                target="_blank"
            >
                {currentLocale.getLabel('common.appTitle')}
            </a>
            {query.params.scheduleIds.length > 0 && <div class="border-x-main-bg-3 h-4/5 w-0 border" />}

            <div class="flex min-w-0 flex-col justify-center">
                {query.data ? (
                    <>
                        <span class="truncate text-sm sm:text-base">
                            {query.data.resource.aggregateSchedule.headers.map((header) => header.name).join(', ')}
                        </span>
                        {query.params.hiddenSubjects.length > 0 && (
                            <span class="truncate text-xs lg:text-sm">
                                {currentLocale.getLabel('main.nHiddenSubjects', {
                                    pluralRulesN: query.params.hiddenSubjects.length,
                                    args: [query.params.hiddenSubjects.length],
                                })}
                            </span>
                        )}
                    </>
                ) : query.isLoading ? (
                    <div class="bg-x-main-bg-4 h-5 w-24 animate-pulse cursor-progress rounded-2xl lg:w-64" />
                ) : (
                    <span class="text-x-err-text truncate">{query.params.scheduleIds.join(', ')}</span>
                )}
            </div>

            <div class="hidden xl:block">
                <MainViewShareButton />
            </div>

            <div class="ml-auto flex gap-3">
                <div class="flex h-full gap-2">
                    <MainViewHeaderSchedulePeriodSelector />
                </div>

                <div class="hidden lg:contents">
                    <Button
                        variant="bare"
                        class="text-x-err-300 focus-visible:outline-x-err-300 hover:underline"
                        type="button"
                        text={currentLocale.getLabel('common.logoutCTA')}
                        onClick={() => encryptedBasicAuthGlobalState.set('')}
                    />
                </div>
            </div>
        </header>
    );
};
