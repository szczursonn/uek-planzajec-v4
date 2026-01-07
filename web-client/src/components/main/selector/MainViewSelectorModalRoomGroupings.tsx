import { useMemo } from 'preact/hooks';
import { useURLCreator } from '../../../state/queryParams/manager';
import { selectorGroupingGlobalState } from '../../../state/queryParams/selector';
import {
    MainViewSelectorModalLinkList,
    MainViewSelectorModalLinkListSkeleton,
} from '../selector/MainViewSelectorModalLinkList';

export const MainViewSelectorModalRoomGroupings = ({ groupings }: { groupings?: readonly string[] }) => {
    const createURL = useURLCreator();

    const options = useMemo(
        () =>
            groupings?.map((grouping) => ({
                label: grouping,
                href: createURL(selectorGroupingGlobalState.createUpdate(grouping)),
            })) ?? [],
        [groupings, createURL],
    );

    if (!groupings) {
        return <MainViewSelectorModalLinkListSkeleton />;
    }

    return <MainViewSelectorModalLinkList items={options} />;
};
