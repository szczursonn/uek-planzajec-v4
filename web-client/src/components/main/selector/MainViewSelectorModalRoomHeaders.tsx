import { useMemo } from 'preact/hooks';
import type { ScheduleHeader } from '../../../api/headers';
import { updateQueryParams, useURLCreator } from '../../../state/queryParams/manager';
import { createSelectorClearUpdates, selectorFilterSearchGlobalState } from '../../../state/queryParams/selector';
import { scheduleIdsGlobalState } from '../../../state/queryParams/scheduleIds';
import {
    MainViewSelectorModalLinkList,
    MainViewSelectorModalLinkListSkeleton,
} from '../selector/MainViewSelectorModalLinkList';
import { TextInput } from '../../common/TextInput';

export const MainViewSelectorModalRoomHeaders = ({ headers }: { headers?: readonly ScheduleHeader[] }) => {
    const searchValueLowerCase = selectorFilterSearchGlobalState.use().toLowerCase();
    const createURL = useURLCreator();

    const options = useMemo(
        () =>
            (headers ?? [])
                .filter((header) => !searchValueLowerCase || header.name.toLowerCase().includes(searchValueLowerCase))
                .map((header) => ({
                    label: header.name,
                    href: createURL(...createSelectorClearUpdates(), scheduleIdsGlobalState.createAddUpdate(header.id)),
                })),
        [headers, searchValueLowerCase, createURL],
    );

    return (
        <>
            <TextInput
                icon="search"
                type="search"
                value={searchValueLowerCase}
                focusOnRender
                onChange={(newValue) =>
                    updateQueryParams('replaceState', selectorFilterSearchGlobalState.createUpdate(newValue))
                }
            />

            {headers ? <MainViewSelectorModalLinkList items={options} /> : <MainViewSelectorModalLinkListSkeleton />}
        </>
    );
};
