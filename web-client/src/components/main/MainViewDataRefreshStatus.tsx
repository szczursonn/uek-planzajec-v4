import { useMemo } from 'preact/hooks';
import clsx from 'clsx';
import { useCurrentLocale } from '../../i18n/useCurrentLocale';
import { Button } from '../common/Button';
import { useNow } from '../../date/useNow';

export const MainViewDataRefreshStatus = ({
    lastUpdated,
    isRefreshing,
    hasError,
    isShowingError,
    onToggleShowError,
    onRefresh,
}: {
    lastUpdated?: Date;
    isRefreshing: boolean;
    hasError: boolean;
    isShowingError: boolean;
    onToggleShowError: () => void;
    onRefresh: () => void;
}) => {
    const currentLocale = useCurrentLocale();
    const now = useNow('minute');

    const lastUpdateDateString = useMemo(() => {
        if (!lastUpdated) {
            return '-';
        }

        const relativeTimeFormatter = new Intl.RelativeTimeFormat(currentLocale.value, {
            numeric: 'auto',
            style: 'long',
        });

        const minutes = -Math.abs(Math.round((lastUpdated.getTime() - now.getTime()) / (60 * 1000)));

        if (minutes === 0) {
            return relativeTimeFormatter.format(minutes, 'seconds');
        }

        if (minutes > -60) {
            return relativeTimeFormatter.format(minutes, 'minutes');
        }

        if (minutes > -1440) {
            return relativeTimeFormatter.format(Math.round(minutes / 60), 'hours');
        }

        return relativeTimeFormatter.format(Math.round(minutes / 1440), 'days');
    }, [currentLocale.value, lastUpdated, now.getTime()]);

    return (
        <p class="flex items-center justify-end gap-1 self-end text-xs sm:text-sm">
            <span>
                {currentLocale.getLabel('main.lastUpdatedAtX', {
                    args: [lastUpdateDateString],
                })}
            </span>

            <Button
                class="max-w-fit"
                type="button"
                text={currentLocale.getLabel('main.refreshCTA')}
                disabled={isRefreshing}
                iconClass={clsx(isRefreshing && 'animate-spin')}
                icon="refresh"
                onClick={onRefresh}
            />

            {hasError && (
                <Button
                    class="text-x-err-text max-w-fit"
                    type="button"
                    text={currentLocale.getLabel(
                        isShowingError ? 'main.refreshErrorMessageHideCTA' : 'main.refreshErrorMessageShowCTA',
                    )}
                    icon={isShowingError ? 'cross' : 'alert'}
                    onClick={() => onToggleShowError()}
                />
            )}
        </p>
    );
};
