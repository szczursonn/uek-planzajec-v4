import { createBooleanQueryParamState, createIntQueryParamState, createStringQueryParamState } from './manager';

export const selectorModalOpenGlobalState = createBooleanQueryParamState('select', false);
export const selectorGroupingGlobalState = createStringQueryParamState('select_grouping');

export const selectorFilterSearchGlobalState = createStringQueryParamState('select_f_search');
export const selectorFilterModeGlobalState = createStringQueryParamState('select_f_mode');
export const selectorFilterStageGlobalState = createStringQueryParamState('select_f_stage');
export const selectorFilterSemesterGlobalState = createIntQueryParamState('select_f_semester');
export const selectorFilterLanguageGlobalState = createStringQueryParamState('select_f_lang');
export const selectorFilterLanguageLevelGlobalState = createStringQueryParamState('select_f_langlevel');

export const createSelectorClearUpdates = () => [
    selectorModalOpenGlobalState.createUpdate(false),
    selectorGroupingGlobalState.createUpdate(''),
    selectorFilterSearchGlobalState.createUpdate(''),
    selectorFilterModeGlobalState.createUpdate(''),
    selectorFilterStageGlobalState.createUpdate(''),
    selectorFilterSemesterGlobalState.createUpdate(null),
    selectorFilterLanguageGlobalState.createUpdate(''),
    selectorFilterLanguageLevelGlobalState.createUpdate(''),
];
