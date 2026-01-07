import * as z from 'zod/mini';
import { createQueryParamState } from './manager';

const schema = z.array(z.string());
const sortAndDeduplicate = (subjects: string[]) => Array.from(new Set(subjects)).sort((a, b) => a.localeCompare(b));

const baseState = createQueryParamState(
    'hiddenSubjects',
    (queryParamValue) => {
        try {
            return sortAndDeduplicate(schema.parse(JSON.parse(queryParamValue)));
        } catch (_) {
            return [];
        }
    },
    (subjects) => (subjects.length > 0 ? JSON.stringify(sortAndDeduplicate(subjects)) : ''),
);

export const hiddenSubjectsGlobalState = {
    ...baseState,
    createAddUpdate: (newHiddenSubject: string) => baseState.createUpdate([...baseState.get(), newHiddenSubject]),
    createRemoveUpdate: (hiddenSubjectToRemove: string) =>
        baseState.createUpdate(baseState.get().filter((hiddenSubject) => hiddenSubject !== hiddenSubjectToRemove)),
};
