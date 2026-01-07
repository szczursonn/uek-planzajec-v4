import { useCurrentLocale } from '../../i18n/useCurrentLocale';
import { UnexpectedStatusCodeError } from '../../api/common';
import { formatError, isFetchError } from '../../errorUtils';
import { encryptedBasicAuthGlobalState } from '../../state/localStorage/encryptedBasicAuth';
import { Icon } from './Icon';
import { Button } from './Button';

export const ErrorAlert = ({ error, onRetry }: { error: unknown; onRetry?: () => void }) => {
    const currentLocale = useCurrentLocale();

    const retryButtonCmp = onRetry ? (
        <Button class="max-w-48" text={currentLocale.getLabel('common.retryCTA')} type="button" onClick={onRetry} />
    ) : null;

    return (
        <div class="bg-x-err-900 border-x-err-950 text-x-err-text mx-auto my-auto flex max-w-full flex-col items-center gap-2 rounded-xl border-4 p-4 text-center xl:max-w-196">
            <Icon name="alert" class="h-16 w-16" />

            {error instanceof UnexpectedStatusCodeError ? (
                error.isUnauthorized ? (
                    <>
                        <p class="text-lg">{currentLocale.getLabel('common.errorMessageAuth')}</p>
                        <Button
                            class="max-w-48"
                            type="button"
                            text={currentLocale.getLabel('common.logoutCTA')}
                            onClick={() => encryptedBasicAuthGlobalState.set('')}
                        />
                        {retryButtonCmp}
                    </>
                ) : (
                    <>
                        <p class="text-lg">
                            <span>{currentLocale.getLabel('common.errorMessageUnableToContactUEK')}</span>
                            <span class="font-bold"> [{error.statusCode}]</span>
                        </p>
                        {retryButtonCmp}
                    </>
                )
            ) : isFetchError(error) ? (
                <>
                    <p class="text-lg">{currentLocale.getLabel('common.errorMessageUnableToContactAppServer')}</p>
                    {retryButtonCmp}
                </>
            ) : (
                <>
                    <p class="text-lg">{currentLocale.getLabel('common.errorMessageUnexpected')}</p>
                    {retryButtonCmp}
                    <pre class="bg-x-err-950 text-xxs max-h-96 max-w-full overflow-auto rounded-md p-2 text-left font-mono">
                        {formatError(error)}
                    </pre>
                </>
            )}
        </div>
    );
};
