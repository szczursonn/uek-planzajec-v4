import { complexLabels } from '../../../i18n/labels';
import { useCurrentLocale } from '../../../i18n/useCurrentLocale';
import { highlightOnlineOnlyDaysGlobalState } from '../../../state/localStorage/highlightOnlineOnlyDays';
import { showLongBreaksGlobalState } from '../../../state/localStorage/showLongBreaks';
import { longBreakThresholdMinutesGlobalState } from '../../../state/localStorage/longBreakThreshold';
import { encryptedBasicAuthGlobalState } from '../../../state/localStorage/encryptedBasicAuth';
import { MainViewSidebarSection } from './MainViewSidebarSection';
import { Button } from '../../common/Button';
import { Checkbox } from '../../common/Checkbox';

export const MainViewSidebarOtherSettingsSection = () => {
    const currentLocale = useCurrentLocale();
    const highlightOnlineOnlyDays = highlightOnlineOnlyDaysGlobalState.use();
    const showLongBreaks = showLongBreaksGlobalState.use();
    const longBreakThresholdMinutes = longBreakThresholdMinutesGlobalState.use();

    return (
        <MainViewSidebarSection title={currentLocale.getLabel('main.sidebar.otherSettings.sectionTitle')}>
            <Checkbox
                label={currentLocale.getLabel('main.sidebar.otherSettings.highlightOnlineOnlyDays')}
                value={highlightOnlineOnlyDays}
                onChange={(val) => highlightOnlineOnlyDaysGlobalState.set(val)}
            />

            <Checkbox
                label={currentLocale.getLabel('main.sidebar.otherSettings.showLongBreaks')}
                value={showLongBreaks}
                onChange={(val) => showLongBreaksGlobalState.set(val)}
            />

            <label class="hover:bg-x-main-bg-3 accent-x-main-bg-5 flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors">
                <input
                    class="focus-visible:outline-x-brand-400 outline-2 outline-transparent"
                    type="range"
                    value={longBreakThresholdMinutes}
                    min={10}
                    max={300}
                    step={10}
                    onChange={(e) => longBreakThresholdMinutesGlobalState.set(e.currentTarget.valueAsNumber)}
                />
                <span class="truncate text-sm">
                    {complexLabels.durationHoursAndMinutesShort(
                        currentLocale.value,
                        longBreakThresholdMinutes * 1000 * 60,
                    )}
                </span>
            </label>

            <div class="contents lg:hidden">
                <hr class="border-x-main-bg-4 my-2" />

                <Button
                    variant="secondary"
                    class="text-x-err-300 hover:underline"
                    type="button"
                    text={currentLocale.getLabel('common.logoutCTA')}
                    onClick={() => encryptedBasicAuthGlobalState.set('')}
                />
            </div>
        </MainViewSidebarSection>
    );
};
