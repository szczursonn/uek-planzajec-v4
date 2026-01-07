import { useState } from 'preact/hooks';
import { useHeadersAPI } from '../../../api/headers';
import { scheduleTypeGlobalState } from '../../../state/queryParams/scheduleType';
import { selectorGroupingGlobalState } from '../../../state/queryParams/selector';
import { ErrorAlert } from '../../common/ErrorAlert';
import { MainViewSelectorModalGroupHeaders } from './MainViewSelectorModalGroupHeaders';
import { MainViewSelectorModalLecturerHeaders } from './MainViewSelectorModalLecturerHeaders';
import { MainViewSelectorModalRoomHeaders } from './MainViewSelectorModalRoomHeaders';
import { MainViewDataRefreshStatus } from '../MainViewDataRefreshStatus';

export const MainViewSelectorModalHeaders = () => {
    const scheduleType = scheduleTypeGlobalState.use();
    const query = useHeadersAPI(scheduleType, selectorGroupingGlobalState.use());
    const SelectorCmp =
        scheduleType === 'G'
            ? MainViewSelectorModalGroupHeaders
            : scheduleType === 'N'
              ? MainViewSelectorModalLecturerHeaders
              : MainViewSelectorModalRoomHeaders;
    const [forceShowQueryError, setForceShowQueryError] = useState(false);

    return (
        <>
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
            {query.error && !query.isLoading && (!query.data || forceShowQueryError) ? (
                <ErrorAlert error={query.error} />
            ) : (
                <SelectorCmp headers={query.data?.resource} />
            )}
        </>
    );
};
