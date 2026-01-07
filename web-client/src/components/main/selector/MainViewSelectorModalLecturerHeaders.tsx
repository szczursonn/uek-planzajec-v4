import { useMemo } from 'preact/hooks';
import { useCurrentLocale } from '../../../i18n/useCurrentLocale';
import type { ScheduleHeader } from '../../../api/headers';
import { updateQueryParams, useURLCreator } from '../../../state/queryParams/manager';
import { createSelectorClearUpdates, selectorFilterSearchGlobalState } from '../../../state/queryParams/selector';
import { scheduleIdsGlobalState } from '../../../state/queryParams/scheduleIds';
import {
    MainViewSelectorModalLinkList,
    MainViewSelectorModalLinkListSkeleton,
} from '../selector/MainViewSelectorModalLinkList';
import { TextInput } from '../../common/TextInput';

const MAX_VISIBLE_HEADERS = 45;

export const MainViewSelectorModalLecturerHeaders = ({ headers }: { headers?: readonly ScheduleHeader[] }) => {
    const currentLocale = useCurrentLocale();
    const searchValueLowerCase = selectorFilterSearchGlobalState.use().toLowerCase();
    const createURL = useURLCreator();

    const links = useMemo(() => {
        const filteredLimitedHeaders: ScheduleHeader[] = [];

        for (const header of headers ?? []) {
            if (!searchValueLowerCase || header.name.toLowerCase().includes(searchValueLowerCase)) {
                filteredLimitedHeaders.push(header);
            }

            if (filteredLimitedHeaders.length === MAX_VISIBLE_HEADERS) {
                break;
            }
        }

        return filteredLimitedHeaders.map((header) => ({
            label: header.name,
            href: createURL(...createSelectorClearUpdates(), scheduleIdsGlobalState.createAddUpdate(header.id)),
        }));
    }, [headers, searchValueLowerCase, createURL]);

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

            {headers ? (
                <>
                    <MainViewSelectorModalLinkList items={links} />
                    {links.length === MAX_VISIBLE_HEADERS && (
                        <p class="my-6 text-center text-lg font-bold">
                            {currentLocale.getLabel('main.selector.useSearchToSeeMoreLecturers')}
                        </p>
                    )}
                </>
            ) : (
                <MainViewSelectorModalLinkListSkeleton />
            )}
        </>
    );
};
