import './index.css';
import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { pwaLaunchGlobalState } from './state/queryParams/pwaLaunch';
import { updateQueryParams, type QueryParamsUpdate } from './state/queryParams/manager';
import { createSavedScheduleSelectionUpdates, savedSchedulesGlobalState } from './state/localStorage/savedSchedules';
import { AppRoot } from './components/AppRoot';

registerSW();

if (pwaLaunchGlobalState.get()) {
    const updates = [pwaLaunchGlobalState.createUpdate(false)] as QueryParamsUpdate[];

    const firstSavedSchedule = savedSchedulesGlobalState.get()[0];
    if (firstSavedSchedule) {
        updates.push(...createSavedScheduleSelectionUpdates(firstSavedSchedule));
    }

    updateQueryParams('replaceState', ...updates);
}

render(<AppRoot />, document.getElementById('uekpz4-root')!);
