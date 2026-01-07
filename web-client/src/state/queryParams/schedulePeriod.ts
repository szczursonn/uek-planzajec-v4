import * as z from 'zod/mini';
import { createQueryParamState } from './manager';
import { DEFAULT_SCHEDULE_PERIOD, schedulePeriodSchema } from '../../api/common';

export const schedulePeriodGlobalState = createQueryParamState(
    'period',
    (queryParamValue) => {
        const asNumber = parseInt(queryParamValue);
        return (
            schedulePeriodSchema.safeParse(isNaN(asNumber) ? queryParamValue : asNumber).data ?? DEFAULT_SCHEDULE_PERIOD
        );
    },
    (value) => (value === DEFAULT_SCHEDULE_PERIOD ? '' : value.toString()),
);
