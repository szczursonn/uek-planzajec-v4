import { useMemo, useState } from 'preact/hooks';
import { useCurrentLocale } from '../i18n/useCurrentLocale';
import { useNow } from '../date/useNow';
import { TIME_ZONE } from '../date/timeZone';
import { Icon } from './common/Icon';
import { Button } from './common/Button';

export const TimeZoneMismatchWarningBanner = () => {
    const [isVisible, setIsVisible] = useState(TIME_ZONE.APP !== TIME_ZONE.BROWSER);
    return isVisible ? <TimeZoneMismatchWarningBannerActual onClose={() => setIsVisible(false)} /> : null;
};

const TimeZoneMismatchWarningBannerActual = ({ onClose }: { onClose: () => void }) => {
    const currentLocale = useCurrentLocale();
    const now = useNow('second');

    const appDateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(currentLocale.value, {
                timeZone: TIME_ZONE.APP,
                timeStyle: 'long',
            }),
        [currentLocale.value],
    );

    const browserDateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(currentLocale.value, {
                timeZone: TIME_ZONE.BROWSER,
                timeStyle: 'long',
            }),
        [currentLocale.value],
    );

    return (
        <div class="bg-x-main-bg-3 border-x-warn-400 flex w-full items-center justify-center gap-2 rounded border-2 px-2 py-2 sm:gap-4 lg:px-4">
            <Icon name="alert" class="text-x-warn-400 h-8 w-8" />
            <p class="text-xs sm:text-sm lg:text-lg">
                {currentLocale.getLabel('timeZoneMismatchWarning.tzDiffMessage')}
            </p>
            <table>
                <tbody>
                    <tr>
                        <td class="border-b-x-main-bg-5 border-b pr-1 text-right text-xs font-semibold lg:text-sm">
                            {currentLocale.getLabel('timeZoneMismatchWarning.timeApp')}
                        </td>
                        <td class="border-b-x-main-bg-5 text-xxs border-b lg:text-xs">{`${appDateFormatter.format(now)} [${TIME_ZONE.APP}]`}</td>
                    </tr>
                    <tr>
                        <td class="pr-1 text-right text-xs font-semibold lg:text-sm">
                            {currentLocale.getLabel('timeZoneMismatchWarning.timeBrowser')}
                        </td>
                        <td class="text-xxs lg:text-xs">{`${browserDateFormatter.format(now)} [${TIME_ZONE.BROWSER}]`}</td>
                    </tr>
                </tbody>
            </table>
            <Button
                class="w-min"
                type="button"
                text={currentLocale.getLabel('common.ok')}
                variant="brand"
                onClick={onClose}
            />
        </div>
    );
};
