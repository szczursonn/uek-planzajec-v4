import { useCurrentLocale } from '../../i18n/useCurrentLocale';
import { useURLCreator } from '../../state/queryParams/manager';
import { scheduleIdsGlobalState } from '../../state/queryParams/scheduleIds';
import { Button } from '../common/Button';

export const MainViewShareButton = () => {
    const currentLocale = useCurrentLocale();
    const currentScheduleIds = scheduleIdsGlobalState.use();

    const shareData = {
        url: useURLCreator()(),
    };

    if (currentScheduleIds.length === 0 || !navigator.canShare?.(shareData)) {
        return null;
    }

    return (
        <Button
            type="button"
            icon="share"
            text={currentLocale.getLabel('main.header.shareButtonText')}
            onClick={() => navigator.share(shareData)}
        />
    );
};
