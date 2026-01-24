import { useGlobalScheduleQuery } from '../../api/globalScheduleQuery';
import { useCurrentLocale } from '../../i18n/useCurrentLocale';
import { selectorModalOpenGlobalState } from '../../state/queryParams/selector';
import { useDocumentTitle } from '../../useDocumentTitle';

export const MainViewDocumentTitleController = () => {
    const currentLocale = useCurrentLocale();
    const query = useGlobalScheduleQuery();
    const isSelectorModalOpen = selectorModalOpenGlobalState.use();

    useDocumentTitle(() => {
        const parts = [] as string[];

        if (isSelectorModalOpen) {
            parts.push(
                currentLocale.getLabel(
                    `main.selector.${query.params.scheduleIds.length === 0 ? 'selectScheduleCTA' : 'selectExtraScheduleCTA'}.${query.params.scheduleType}`,
                ),
            );
        }

        if (query.data) {
            parts.push(query.data?.resource.aggregateSchedule.headers.map((header) => header.name).join(', '));
        } else {
            if (query.isLoading) {
                parts.push(currentLocale.getLabel('main.documentTitlePartLoading'));
            }

            parts.push(query.params.scheduleIds.join(', '));
        }

        return parts;
    }, [
        currentLocale.getLabel,
        query.data?.resource.aggregateSchedule.headers,
        query.isLoading,
        query.params.scheduleIds,
        query.params.scheduleType,
        isSelectorModalOpen,
    ]);

    return null;
};
