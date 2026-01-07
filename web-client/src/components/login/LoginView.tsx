import { useState } from 'preact/hooks';
import { getLabel } from '../../i18n/labels';
import { useCurrentLocale } from '../../i18n/useCurrentLocale';
import { ALL_LOCALES } from '../../i18n/locales';
import { useDocumentTitle } from '../../useDocumentTitle';
import { useEncryptBasicAuth } from '../../api/encryptBasicAuth';
import { currentLocaleGlobalState } from '../../state/localStorage/locale';
import { ErrorAlert } from '../common/ErrorAlert';
import { Button } from '../common/Button';
import { TextInput } from '../common/TextInput';
import { Checkbox } from '../common/Checkbox';

export const LoginView = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [acknowledgmentChecked, setAcknowledgmentChecked] = useState(false);
    const currentLocale = useCurrentLocale();

    useDocumentTitle(() => [currentLocale.getLabel('login.documentTitlePart')], []);

    const encryptBasicAuth = useEncryptBasicAuth();

    return (
        <div class="flex flex-1 flex-col items-center justify-center py-8">
            <h1 class="mb-0.5 text-3xl font-semibold sm:text-4xl lg:text-5xl">
                {currentLocale.getLabel('common.appTitle')}
            </h1>
            <div class="mb-6 flex gap-2 text-sm">
                {ALL_LOCALES.filter((locale) => locale !== currentLocale.value).map((locale) => (
                    <button
                        class="text-x-main-text-muted cursor-pointer hover:underline"
                        type="button"
                        title={getLabel(locale, 'common.selfLanguageSwitchCTA')}
                        onClick={() => currentLocaleGlobalState.set(locale)}
                    >
                        {getLabel(locale, 'common.selfLanguage')}
                    </button>
                ))}
            </div>

            <form
                class="mx-4 flex flex-col gap-2 lg:min-w-96"
                onSubmit={(e) => {
                    e.preventDefault();
                    encryptBasicAuth.call(login, password);
                }}
            >
                <TextInput
                    placeholder={currentLocale.getLabel('login.loginInputPlaceholder')}
                    autocomplete="username"
                    value={login}
                    onChange={(value) => setLogin(value.trim())}
                />
                <TextInput
                    placeholder={currentLocale.getLabel('login.passwordInputPlaceholder')}
                    autocomplete="current-password"
                    value={password}
                    type="password"
                    onChange={(value) => setPassword(value.trim())}
                />

                <div class="border-x-warn-400 bg-x-main-bg-2 rounded-lg border-2 p-3 lg:p-4">
                    <p class="text-lg font-bold lg:text-xl">
                        ℹ️ {currentLocale.getLabel('login.securityDisclaimerText')}
                    </p>
                    <ul class="my-3 list-disc pl-5 text-sm lg:my-2 lg:text-base">
                        <li>{currentLocale.getLabel('login.securityDisclaimerPointBrowserStore')}</li>
                        <li>{currentLocale.getLabel('login.securityDisclaimerPointServerDecrypt')}</li>
                        <li class="font-bold">
                            {currentLocale.getLabel('login.securityDisclaimerPointUnsureFuckOff')}
                        </li>
                    </ul>
                    <Checkbox
                        value={acknowledgmentChecked}
                        label={currentLocale.getLabel('login.securityDisclaimerAcknowledgementCheckboxText')}
                        onChange={setAcknowledgmentChecked}
                    />
                </div>

                <Button
                    disabled={encryptBasicAuth.isLoading || !login || !password || !acknowledgmentChecked}
                    class="mt-4"
                    variant="brand"
                    type="submit"
                    icon={encryptBasicAuth.isLoading ? 'refresh' : 'save'}
                    iconClass={encryptBasicAuth.isLoading ? 'animate-spin' : ''}
                    text={currentLocale.getLabel(
                        encryptBasicAuth.isLoading ? 'login.encryptingInProgressMessage' : 'login.loginButtonText',
                    )}
                />

                {encryptBasicAuth.error && !encryptBasicAuth.isLoading && <ErrorAlert error={encryptBasicAuth.error} />}
            </form>
        </div>
    );
};
