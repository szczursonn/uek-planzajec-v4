import { SWRConfig, type SWRConfiguration } from 'swr';
import { APP_VERSION, APP_REPO_URL } from '../versionInfo';
import { swrLocalStorageCache } from '../api/swrLocalStorageCache';
import { encryptedBasicAuthGlobalState } from '../state/localStorage/encryptedBasicAuth';
import { LoginView } from './login/LoginView';
import { MainView } from './main/MainView';
import { TimeZoneMismatchWarningBanner } from './TimeZoneMismatchWarningBanner';

const GLOBAL_SWR_CONFIG = {
    provider: () => swrLocalStorageCache,
} satisfies SWRConfiguration;

export const AppRoot = () => {
    const isLoggedIn = !!encryptedBasicAuthGlobalState.use();

    return (
        <SWRConfig value={GLOBAL_SWR_CONFIG}>
            <TimeZoneMismatchWarningBanner />
            {isLoggedIn ? <MainView /> : <LoginView />}
            <a
                href={APP_REPO_URL}
                target="_blank"
                class="text-x-main-text-supermuted fixed right-1 bottom-1 z-50 font-mono text-xs hover:underline xl:text-sm"
            >
                {APP_VERSION}
            </a>
        </SWRConfig>
    );
};
