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
        const subjectToSubtextPartToCount = {} as Record<string, Record<string, number>>;

        for (const item of query.data?.resource.aggregateSchedule.items ?? []) {
            subjectToSubtextPartToCount[item.subject] = subjectToSubtextPartToCount[item.subject] ?? {};
            for (const part of query.params.scheduleType === 'N'
                ? item.groups
                : item.lecturers.map((lecturer) => lecturer.name)) {
                subjectToSubtextPartToCount[item.subject]![part] =
                    (subjectToSubtextPartToCount[item.subject]![part] ?? 0) + 1;
            }
        }

        return Object.entries(subjectToSubtextPartToCount)
            .map(([subject, subtextPartToCount]) => ({
                subject,
                subtext: Object.entries(subtextPartToCount)
                    .sort(
                        ([subtextPartA, countA], [subtextPartB, countB]) =>
                            countB - countA || subtextPartA.localeCompare(subtextPartB),
                    )
                    .map(([lecturerName]) => lecturerName)
                    .join(', '),
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
    }, [query.data?.resource.aggregateSchedule.items, query.params.scheduleType]);

    const createDerivedURL = useURLCreator();

    const unnamedPlaceholderLabel = currentLocale.getLabel('main.sidebar.subjects.unnamedPlaceholder');

    return (
        <MainViewSidebarSection title={currentLocale.getLabel('main.sidebar.subjects.sectionTitle')}>
            <div class="divide-x-main-bg-4 divide-y-2">
                {subjectsEntries.map(({ subject, subtext }) => {
                    const isHidden = query.params.hiddenSubjects.includes(subject);

                    return (
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
                                <p class="text-x-main-text-muted truncate text-xs" title={subtext}>
                                    {subtext}
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
                                        href={createDerivedURL(
                                            subjectDetailsModalSubjectGlobalState.createUpdate(subject),
                                        )}
                                        onClick={anchorPushStateHandler}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </MainViewSidebarSection>
    );
};
