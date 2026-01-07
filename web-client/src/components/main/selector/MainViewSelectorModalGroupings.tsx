import { useState } from 'preact/hooks';
import { useGroupingsAPI } from '../../../api/groupings';
import { scheduleTypeGlobalState } from '../../../state/queryParams/scheduleType';
import { ErrorAlert } from '../../common/ErrorAlert';
import { MainViewDataRefreshStatus } from '../MainViewDataRefreshStatus';
import { MainViewSelectorModalGroupGroupings } from './MainViewSelectorModalGroupGroupings';
import { MainViewSelectorModalRoomGroupings } from './MainViewSelectorModalRoomGroupings';

export const MainViewSelectorModalGroupings = () => {
    const scheduleType = scheduleTypeGlobalState.use();
    const query = useGroupingsAPI(scheduleType);
    const SelectorCmp = scheduleType === 'G' ? MainViewSelectorModalGroupGroupings : MainViewSelectorModalRoomGroupings;
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
                <SelectorCmp groupings={query.data?.resource} />
            )}
        </>
    );
};
