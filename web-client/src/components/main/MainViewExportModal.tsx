import { useEffect, useMemo, useState } from 'preact/hooks';
import { TIME_ZONE } from '../../date/timeZone';
import { useCurrentLocale } from '../../i18n/useCurrentLocale';
import { createICalURL } from '../../api/common';
import { useGlobalScheduleQuery } from '../../api/globalScheduleQuery';
import { updateQueryParams } from '../../state/queryParams/manager';
import { encryptedBasicAuthGlobalState } from '../../state/localStorage/encryptedBasicAuth';
import { isExportModalOpenGlobalState } from '../../state/queryParams/exportModal';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Icon } from '../common/Icon';

export const MainViewExportModalHost = () => (isExportModalOpenGlobalState.use() ? <MainViewExportModal /> : null);

const MainViewExportModal = () => {
    const currentLocale = useCurrentLocale();
    const query = useGlobalScheduleQuery();
    const [isCopySuccessIconVisible, setIsCopySuccessIconVisible] = useState(false);
    const encryptedBasicAuth = encryptedBasicAuthGlobalState.use();

    useEffect(() => {
        if (!isCopySuccessIconVisible) {
            return;
        }

        const resetCopySuccessIconTimeout = setTimeout(() => {
            setIsCopySuccessIconVisible(false);
        }, 3_000);

        return () => {
            clearTimeout(resetCopySuccessIconTimeout);
        };
    }, [isCopySuccessIconVisible]);

    const dateRangeFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(currentLocale.value, {
                timeZone: TIME_ZONE.APP,
                dateStyle: 'full',
            }),
        [currentLocale.value],
    );

    const icalURL = query.data
        ? createICalURL({
              scheduleType: query.params.scheduleType,
              scheduleIds: query.params.scheduleIds,
              hiddenSubjects: query.params.hiddenSubjects,
              periodIdx: query.data.resolvedPeriodIdx,
              encryptedBasicAuth,
          })
        : null;

    return (
        <Modal
            title={currentLocale.getLabel('main.export.modalTitle')}
            onClose={() => updateQueryParams('pushState', isExportModalOpenGlobalState.createUpdate(false))}
        >
            {icalURL && (
                <div class="flex flex-col items-center gap-4 text-center">
                    <div class="border-x-warn-400 bg-x-main-bg-3 flex flex-col items-center rounded-lg border-2 p-3 lg:p-4">
                        <Icon name="alert" class="text-x-warn-400 h-8 w-8" />
                        <p class="text-lg font-bold lg:text-xl">
                            {currentLocale.getLabel('main.export.securityDisclaimerText')}
                        </p>
                    </div>

                    <p class="flex flex-col items-center text-sm sm:text-base">
                        {dateRangeFormatter.formatRange(
                            query.data!.resource.periods[query.data!.resolvedPeriodIdx]!.start,
                            query.data!.resource.periods[query.data!.resolvedPeriodIdx]!.end,
                        )}
                    </p>

                    <div class="flex w-full flex-col items-center justify-center gap-2 lg:flex-row">
                        <a
                            href={icalURL}
                            target="_blank"
                            download
                            class="bg-x-main-bg-3 border-x-main-bg-4 max-w-full overflow-x-auto rounded-lg border-2 px-1 py-2 text-xs whitespace-nowrap hover:underline md:text-sm"
                        >
                            {icalURL}
                        </a>
                        <div class="flex gap-2">
                            {window.navigator.clipboard && (
                                <Button
                                    type="button"
                                    variant="tertiary"
                                    class="h-12 w-12"
                                    iconClass={isCopySuccessIconVisible ? 'fill-green-500' : ''}
                                    icon={isCopySuccessIconVisible ? 'check' : 'copy'}
                                    title={currentLocale.getLabel('main.export.copyCTA')}
                                    onClick={() =>
                                        navigator.clipboard
                                            .writeText(icalURL)
                                            .then(() => setIsCopySuccessIconVisible(true))
                                    }
                                />
                            )}

                            {window.navigator.canShare?.({
                                url: icalURL,
                            }) && (
                                <Button
                                    type="button"
                                    variant="tertiary"
                                    class="h-12 w-12"
                                    icon="share"
                                    title={currentLocale.getLabel('main.export.shareCTA')}
                                    onClick={() =>
                                        window.navigator.share({
                                            url: icalURL,
                                        })
                                    }
                                />
                            )}
                        </div>
                    </div>

                    <a
                        href="https://support.google.com/calendar/answer/37100"
                        target="_blank"
                        class="text-x-brand-400 hover:underline"
                    >
                        {currentLocale.getLabel('main.export.howToAddGoogleCalendarMessage')}
                    </a>
                </div>
            )}
        </Modal>
    );
};
