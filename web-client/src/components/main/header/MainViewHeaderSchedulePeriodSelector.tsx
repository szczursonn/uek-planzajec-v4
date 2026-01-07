import { useMemo } from 'preact/hooks';
import { TIME_ZONE } from '../../../date/timeZone';
import { useCurrentLocale } from '../../../i18n/useCurrentLocale';
import { SCHEDULE_PERIOD_PRESETS, schedulePeriodSchema } from '../../../api/common';
import { useGlobalScheduleQuery } from '../../../api/globalScheduleQuery';
import { schedulePeriodGlobalState } from '../../../state/queryParams/schedulePeriod';
import { updateQueryParams } from '../../../state/queryParams/manager';

export const MainViewHeaderSchedulePeriodSelector = () => {
    const query = useGlobalScheduleQuery();
    const currentLocale = useCurrentLocale();

    const otherOptionsDateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(currentLocale.value, {
                timeZone: TIME_ZONE.APP,
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }),
        [currentLocale.value],
    );

    const isLoadingDynamicPeriodOption =
        !query.data && query.isLoading && typeof query.params.schedulePeriod === 'number';

    return (
        <select
            class="border-b-x-main-bg-4 hover:border-b-x-brand-400 hover:bg-x-bg-tertiary focus-visible:outline-x-brand-400 max-w-40 cursor-pointer truncate border-b px-1 py-2.5 text-xs outline-2 outline-transparent transition-colors hover:rounded-t sm:text-sm md:max-w-full lg:px-2 lg:py-3 lg:text-base"
            value={query.params.schedulePeriod}
            onChange={(event) => {
                const valueAsNumber = parseInt(event.currentTarget.value);
                updateQueryParams(
                    'replaceState',
                    schedulePeriodGlobalState.createUpdate(
                        schedulePeriodSchema.parse(isNaN(valueAsNumber) ? event.currentTarget.value : valueAsNumber),
                    ),
                );
            }}
        >
            <optgroup
                class="bg-x-main-bg-3"
                label={currentLocale.getLabel('main.header.schedulePeriodSelector.categoryPresets')}
            >
                {SCHEDULE_PERIOD_PRESETS.map((preset) => (
                    <option
                        key={preset}
                        value={preset}
                        label={currentLocale.getLabel(`main.header.schedulePeriodSelector.categoryPreset.${preset}`)}
                    />
                ))}
            </optgroup>
            {(query.data || isLoadingDynamicPeriodOption) && (
                <optgroup
                    class="bg-x-main-bg-3"
                    label={currentLocale.getLabel('main.header.schedulePeriodSelector.categoryDynamic')}
                >
                    {isLoadingDynamicPeriodOption && <option value={query.params.schedulePeriod} label="..." />}
                    {query.data?.resource.periods.map((period, i) => (
                        <option
                            key={i}
                            value={i}
                            label={`${otherOptionsDateFormatter.format(period.start)} - ${otherOptionsDateFormatter.format(period.end)}`}
                        />
                    ))}
                </optgroup>
            )}
        </select>
    );
};
