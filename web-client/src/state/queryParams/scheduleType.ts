import { scheduleTypeSchema } from '../../api/common';
import { createEnumQueryParamState } from './manager';

export const scheduleTypeGlobalState = createEnumQueryParamState('type', scheduleTypeSchema, 'G');
