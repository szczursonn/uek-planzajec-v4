import * as z from 'zod/mini';
import { createEnumLocalStorageState } from './manager';

export const SCHEDULE_VIEWS = ['calendar', 'table'] as const;
export const scheduleViewSchema = z.enum(SCHEDULE_VIEWS);
export type ScheduleView = z.infer<typeof scheduleViewSchema>;

export const scheduleViewGlobalState = createEnumLocalStorageState('scheduleView', scheduleViewSchema, 'calendar');
