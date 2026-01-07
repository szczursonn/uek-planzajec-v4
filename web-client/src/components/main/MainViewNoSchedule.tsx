import { useCurrentLocale } from '../../i18n/useCurrentLocale';
import { anchorPushStateHandler, useURLCreator } from '../../state/queryParams/manager';
import { selectorModalOpenGlobalState } from '../../state/queryParams/selector';
import { Button } from '../common/Button';

export const MainViewNoSchedule = () => {
    const currentLocale = useCurrentLocale();
    const createURL = useURLCreator();

    return (
        <Button
            class="max-w-48"
            variant="brand"
            text={currentLocale.getLabel('main.selectScheduleCTA')}
            href={createURL(selectorModalOpenGlobalState.createUpdate(true))}
            onClick={anchorPushStateHandler}
        />
    );
};
