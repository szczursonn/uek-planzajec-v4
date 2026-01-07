import { useMemo } from 'preact/hooks';
import clsx from 'clsx';
import { useCurrentLocale } from '../../../i18n/useCurrentLocale';
import { useGlobalScheduleQuery } from '../../../api/globalScheduleQuery';
import { hiddenSubjectsGlobalState } from '../../../state/queryParams/hiddenSubjects';
import { anchorPushStateHandler, useURLCreator } from '../../../state/queryParams/manager';
import { subjectDetailsModalSubjectGlobalState } from '../../../state/queryParams/subjectDetailsModal';
import { MainViewSidebarSection } from './MainViewSidebarSection';
import { RoundIconButton } from '../../common/RoundIconButton';

export const MainViewSidebarSubjectsSection = () => {
    const currentLocale = useCurrentLocale();
    const query = useGlobalScheduleQuery();

    const subjectsEntries = useMemo(() => {
        const subjectToLecturerNameToItemCount = {} as Record<string, Record<string, number>>;
        for (const item of query.data?.resource.aggregateSchedule.items ?? []) {
            subjectToLecturerNameToItemCount[item.subject] = subjectToLecturerNameToItemCount[item.subject] ?? {};
            for (const lecturer of item.lecturers) {
                subjectToLecturerNameToItemCount[item.subject]![lecturer.name] =
                    (subjectToLecturerNameToItemCount[item.subject]![lecturer.name] ?? 0) + 1;
            }
        }

        return Object.entries(subjectToLecturerNameToItemCount)
            .map(([subject, lecturerNameToItemCount]) => ({
                subject,
                lecturersDisplayList: Object.entries(lecturerNameToItemCount)
                    .sort(
                        ([lecturerNameA, countA], [lecturerNameB, countB]) =>
                            countB - countA || lecturerNameA.localeCompare(lecturerNameB),
                    )
                    .map(([lecturerName]) => lecturerName)
                    .join(', '),
                isHidden: query.params.hiddenSubjects.includes(subject),
            }))
            .sort((a, b) => {
                if (!a.subject) {
                    return 1;
                }

                if (!b.subject) {
                    return -1;
                }

                return a.subject.localeCompare(b.subject);
            });
    }, [query.data, query.params.hiddenSubjects]);

    const createDerivedURL = useURLCreator();

    const unnamedPlaceholderLabel = currentLocale.getLabel('main.sidebar.subjects.unnamedPlaceholder');

    return (
        <MainViewSidebarSection title={currentLocale.getLabel('main.sidebar.subjects.sectionTitle')}>
            <div class="divide-x-main-bg-4 divide-y-2">
                {subjectsEntries.map(({ subject, lecturersDisplayList, isHidden }) => (
                    <div
                        class={clsx(
                            'flex items-center justify-between py-1.5 transition-opacity',
                            isHidden && 'opacity-50 hover:opacity-100',
                        )}
                    >
                        <div class="overflow-hidden">
                            {subject ? (
                                <p class="truncate" title={subject}>
                                    {subject}
                                </p>
                            ) : (
                                <p class="truncate italic" title={unnamedPlaceholderLabel}>
                                    {unnamedPlaceholderLabel}
                                </p>
                            )}
                            <p class="text-x-main-text-muted truncate text-xs" title={lecturersDisplayList}>
                                {lecturersDisplayList}
                            </p>
                        </div>

                        <div class="text-x-main-text-muted flex gap-0.5">
                            <RoundIconButton
                                class="h-9 p-1.25"
                                icon={isHidden ? 'eyeHide' : 'eyeShow'}
                                title={currentLocale.getLabel(
                                    isHidden ? 'main.sidebar.subjects.showXCTA' : 'main.sidebar.subjects.hideXCTA',
                                    {
                                        args: [subject || unnamedPlaceholderLabel],
                                    },
                                )}
                                href={createDerivedURL(
                                    (isHidden
                                        ? hiddenSubjectsGlobalState.createRemoveUpdate
                                        : hiddenSubjectsGlobalState.createAddUpdate)(subject),
                                )}
                                onClick={anchorPushStateHandler}
                            />
                            {subject && (
                                <RoundIconButton
                                    class="h-9 p-1.25"
                                    icon="info"
                                    title={`${subject} - ${currentLocale.getLabel('main.sidebar.subjects.details')}`}
                                    href={createDerivedURL(subjectDetailsModalSubjectGlobalState.createUpdate(subject))}
                                    onClick={anchorPushStateHandler}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </MainViewSidebarSection>
    );
};
