import { useCurrentLocale } from '../../../i18n/useCurrentLocale';
import { showPWAInstallPrompt, usePWAInstallPromptAvailability } from '../../../pwaInstallPrompt';
import { MainViewSidebarSection } from './MainViewSidebarSection';
import { Button } from '../../common/Button';

export const MainViewSidebarPWAInstallSection = () => {
    const currentLocale = useCurrentLocale();
    const isPWAInstallPromptAvailable = usePWAInstallPromptAvailability();

    if (!isPWAInstallPromptAvailable) {
        return null;
    }

    const text = currentLocale.getLabel('main.sidebar.pwaInstall.text');

    return (
        <MainViewSidebarSection title={text}>
            <Button type="button" class="text-sm" text={text} icon="plus" onClick={showPWAInstallPrompt} />
        </MainViewSidebarSection>
    );
};
