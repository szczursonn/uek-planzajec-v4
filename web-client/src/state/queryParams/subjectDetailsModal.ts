import { createBooleanQueryParamState, createStringQueryParamState } from './manager';

export const subjectDetailsModalSubjectGlobalState = createStringQueryParamState('subjectDetails');
export const subjectDetailsModalShowOnlyUpcomingItemsGlobalState = createBooleanQueryParamState(
    'subjectDetails_upcomingOnly',
    true,
);
