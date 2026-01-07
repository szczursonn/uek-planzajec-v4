import { useMemo } from 'preact/hooks';
import { updateQueryParams, useURLCreator } from '../../../state/queryParams/manager';
import { selectorFilterSearchGlobalState, selectorGroupingGlobalState } from '../../../state/queryParams/selector';
import {
    MainViewSelectorModalLinkListSkeleton,
    MainViewSelectorModalNestableLinkList,
} from '../selector/MainViewSelectorModalLinkList';
import { TextInput } from '../../common/TextInput';

export const MainViewSelectorModalGroupGroupings = ({ groupings }: { groupings?: readonly string[] }) => {
    const searchValueLowerCase = selectorFilterSearchGlobalState.use().toLowerCase();
    const createURL = useURLCreator();

    const firstLetterGroups = useMemo(
        () =>
            Array.from(
                (groupings ?? [])
                    .reduce((firstLetterToGroupings, grouping) => {
                        if (!searchValueLowerCase || grouping.toLowerCase().includes(searchValueLowerCase)) {
                            const firstLetterUpperCase = grouping[0]?.toUpperCase() ?? '';

                            let arr = firstLetterToGroupings.get(firstLetterUpperCase);
                            if (!arr) {
                                arr = [];
                                firstLetterToGroupings.set(firstLetterUpperCase, arr);
                            }

                            arr.push(grouping);
                        }

                        return firstLetterToGroupings;
                    }, new Map<string, string[]>())
                    .entries(),
            )
                .map(([firstLetterUppercase, groups]) => ({
                    label: firstLetterUppercase,
                    items: groups
                        .sort((a, b) => a.localeCompare(b))
                        .map((group) => ({
                            label: group,
                            href: createURL(
                                selectorFilterSearchGlobalState.createUpdate(''),
                                selectorGroupingGlobalState.createUpdate(group),
                            ),
                        })),
                }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        [groupings, searchValueLowerCase, createURL],
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

            {groupings ? (
                <MainViewSelectorModalNestableLinkList groups={firstLetterGroups} />
            ) : (
                <MainViewSelectorModalLinkListSkeleton />
            )}
        </>
    );
};
