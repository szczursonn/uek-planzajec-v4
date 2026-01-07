import clsx from 'clsx';
import { SCHEDULE_TYPES } from '../../../api/common';
import { useCurrentLocale } from '../../../i18n/useCurrentLocale';
import { scheduleTypeGlobalState } from '../../../state/queryParams/scheduleType';
import {
    createSelectorClearUpdates,
    selectorGroupingGlobalState,
    selectorModalOpenGlobalState,
} from '../../../state/queryParams/selector';
import { scheduleIdsGlobalState } from '../../../state/queryParams/scheduleIds';
import { updateQueryParams } from '../../../state/queryParams/manager';
import { MainViewSelectorModalGroupings } from './MainViewSelectorModalGroupings';
import { MainViewSelectorModalHeaders } from './MainViewSelectorModalHeaders';
import { Modal } from '../../common/Modal';
import { RoundIconButton } from '../../common/RoundIconButton';

export const MainViewSelectorModalHost = () => (selectorModalOpenGlobalState.use() ? <MainViewSelectorModal /> : null);

const MainViewSelectorModal = () => {
    const currentLocale = useCurrentLocale();
    const currentScheduleType = scheduleTypeGlobalState.use();
    const selectedGrouping = selectorGroupingGlobalState.use();
    const shouldShowScheduleTypes = scheduleIdsGlobalState.use().length === 0 && !selectedGrouping;

    return (
        <Modal
            title={[
                currentLocale.getLabel(`main.selector.selectedScheduleCTA.${currentScheduleType}`),
                selectedGrouping,
            ]
                .filter(Boolean)
                .join(' - ')}
            width="large"
            height="full"
            onClose={() => updateQueryParams('pushState', ...createSelectorClearUpdates())}
        >
            <div class="flex min-h-full flex-col gap-2 lg:gap-4">
                {selectedGrouping && window.history.length > 1 && (
                    <RoundIconButton
                        class="h-8 w-8 p-1"
                        icon="arrowLeft"
                        title={currentLocale.getLabel('main.selector.goBackCTA')}
                        onClick={() => window.history.back()}
                    />
                )}

                {shouldShowScheduleTypes && (
                    <div class="flex text-center">
                        {SCHEDULE_TYPES.map((scheduleType) => (
                            <button
                                key={scheduleType}
                                class={clsx(
                                    'w-full rounded-t p-3 text-sm transition-colors sm:text-base lg:p-2',
                                    scheduleType === currentScheduleType
                                        ? 'border-b-x-brand-500 text-x-brand-400 bg-x-main-bg-3 border-b-4 font-semibold'
                                        : 'border-b-x-main-bg-4 hover:border-b-x-main-bg-5 hover:bg-x-main-bg-3 cursor-pointer border-b-2 hover:border-b-4',
                                )}
                                disabled={scheduleType === currentScheduleType}
                                type="button"
                                onClick={() =>
                                    updateQueryParams('pushState', scheduleTypeGlobalState.createUpdate(scheduleType))
                                }
                            >
                                {currentLocale.getLabel(`main.selector.scheduleTypePlural.${scheduleType}`)}
                            </button>
                        ))}
                    </div>
                )}

                {selectedGrouping || currentScheduleType === 'N' ? (
                    <MainViewSelectorModalHeaders />
                ) : (
                    <MainViewSelectorModalGroupings />
                )}
            </div>
        </Modal>
    );
};
