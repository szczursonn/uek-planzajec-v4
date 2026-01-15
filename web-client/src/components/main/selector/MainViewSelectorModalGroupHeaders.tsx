import { useMemo } from 'preact/hooks';
import { useCurrentLocale } from '../../../i18n/useCurrentLocale';
import type { GroupMode, GroupStage, ScheduleHeader } from '../../../api/headers';
import { updateQueryParams, useURLCreator } from '../../../state/queryParams/manager';
import {
    createSelectorClearUpdates,
    selectorFilterLanguageGlobalState,
    selectorFilterLanguageLevelGlobalState,
    selectorFilterModeGlobalState,
    selectorFilterSearchGlobalState,
    selectorFilterSemesterGlobalState,
    selectorFilterStageGlobalState,
} from '../../../state/queryParams/selector';
import { scheduleIdsGlobalState } from '../../../state/queryParams/scheduleIds';
import {
    MainViewSelectorModalLinkListItem,
    MainViewSelectorModalNestableLinkList,
} from '../selector/MainViewSelectorModalLinkList';
import {
    MainViewSelectorModalTileLink,
    MainViewSelectorModalTileLinkList,
    MainViewSelectorModalTileLinkListSkeleton,
} from '../selector/MainViewSelectorModalTileLinkList';
import { Icon, type IconName } from '../../common/Icon';
import { TextInput } from '../../common/TextInput';

const GROUP_MODE_ORDER = {
    'full-time': 1,
    'part-time': 2,
} as const;

const GROUP_STAGE_ORDER = {
    bachelor: 1,
    master: 2,
    uniform: 3,
} as const;

const LANGUAGE_TO_FLAG_IMG = {
    ANG: 'https://www.countryflags.com/wp-content/uploads/united-kingdom-flag-png-large.png',
    CHI: 'https://www.countryflags.com/wp-content/uploads/china-flag-png-large.png',
    ENG: 'https://www.countryflags.com/wp-content/uploads/united-kingdom-flag-png-large.png',
    FRA: 'https://www.countryflags.com/wp-content/uploads/france-flag-png-large.png',
    GER: 'https://www.countryflags.com/wp-content/uploads/germany-flag-png-large.png',
    HIS: 'https://www.countryflags.com/wp-content/uploads/spain-flag-png-large.png',
    NIE: 'https://www.countryflags.com/wp-content/uploads/germany-flag-png-large.png',
    POL: 'https://www.countryflags.com/wp-content/uploads/poland-flag-png-large.png',
    PLO: 'https://www.countryflags.com/wp-content/uploads/poland-flag-png-large.png',
    ROS: 'https://www.countryflags.com/wp-content/uploads/russia-flag-png-large.png',
    SPA: 'https://www.countryflags.com/wp-content/uploads/spain-flag-png-large.png',
    WLO: 'https://www.countryflags.com/wp-content/uploads/italy-flag-png-large.png',
} as Readonly<Partial<Record<string, string>>>;

const GROUP_STAGE_TO_ICON = {
    bachelor: 'roman1',
    master: 'roman2',
} as Readonly<Partial<Record<GroupStage, IconName>>>;

export const MainViewSelectorModalGroupHeaders = ({ headers }: { headers?: readonly ScheduleHeader[] }) => {
    const currentLocale = useCurrentLocale();

    const filtersOptions = useMemo(() => {
        const uniqueModes = new Set<GroupMode>();
        const uniqueStages = new Set<GroupStage>();
        let highestSemester = null;
        const uniqueLanguages = new Set<string>();
        const uniqueLanguageLevels = new Set<string>();

        for (const header of headers ?? []) {
            if (header.details) {
                uniqueModes.add(header.details.mode);
                uniqueStages.add(header.details.stage);
                highestSemester = Math.max(highestSemester ?? -Infinity, header.details.semester);
                if (header.details.language) {
                    uniqueLanguages.add(header.details.language);
                }
                if (header.details.languageLevel) {
                    uniqueLanguageLevels.add(header.details.languageLevel);
                }
            }
        }

        return {
            modes: Array.from(uniqueModes).sort((a, b) => (GROUP_MODE_ORDER[a] > GROUP_MODE_ORDER[b] ? 1 : -1)),
            stages: Array.from(uniqueStages).sort((a, b) => (GROUP_STAGE_ORDER[a] > GROUP_STAGE_ORDER[b] ? 1 : -1)),
            semesters:
                highestSemester === null
                    ? []
                    : Array.from(Array(highestSemester).keys()).map((i) => {
                          const semester = Math.floor(i + 1);
                          const year = Math.floor((semester + 1) / 2);

                          return {
                              label: `${currentLocale.getLabel('main.selector.nYear', {
                                  pluralRulesN: year,
                                  args: [year],
                              })}, ${currentLocale.getLabel('main.selector.nSemester', {
                                  pluralRulesN: semester,
                                  args: [semester],
                              })}`,
                              value: semester,
                          };
                      }),
            languages: Array.from(uniqueLanguages).sort(),
            languageLevels: Array.from(uniqueLanguageLevels).sort(),
        } as const;
    }, [headers, currentLocale.getLabel]);

    const searchValueLowerCase = selectorFilterSearchGlobalState.use().toLowerCase();
    const selectedMode = selectorFilterModeGlobalState.use();
    const selectedStage = selectorFilterStageGlobalState.use();
    const selectedSemester = selectorFilterSemesterGlobalState.use();
    const selectedLanguage = selectorFilterLanguageGlobalState.use();
    const selectedLanguageLevel = selectorFilterLanguageLevelGlobalState.use();

    const createURL = useURLCreator();

    const linkListGroups = useMemo(() => {
        const createLink = (header: ScheduleHeader) => ({
            label: header.name,
            href: createURL(...createSelectorClearUpdates(), scheduleIdsGlobalState.createAddUpdate(header.id)),
        });

        const unfilterableByDetailsLinks: MainViewSelectorModalLinkListItem[] = [];
        const filteredByDetailsLinks: MainViewSelectorModalLinkListItem[] = [];

        for (const header of headers ?? []) {
            if (searchValueLowerCase && !header.name.toLowerCase().includes(searchValueLowerCase)) {
                continue;
            }

            if (!header.details) {
                unfilterableByDetailsLinks.push(createLink(header));
                continue;
            }

            if (
                (!selectedMode || header.details.mode === selectedMode) &&
                (!selectedStage || header.details.stage === selectedStage) &&
                (selectedSemester === null || header.details.semester === selectedSemester) &&
                (!selectedLanguage || header.details.language === selectedLanguage) &&
                (!selectedLanguageLevel || header.details.languageLevel === selectedLanguageLevel)
            ) {
                filteredByDetailsLinks.push(createLink(header));
            }
        }

        if (
            !selectedMode &&
            !selectedStage &&
            selectedSemester === null &&
            !selectedLanguage &&
            !selectedLanguageLevel
        ) {
            return [
                {
                    label: currentLocale.getLabel('main.selector.otherLinks'),
                    items: unfilterableByDetailsLinks,
                },
            ];
        }

        const linkGroups = [
            {
                label:
                    [
                        currentLocale.getLabel(`main.selector.groupMode.${selectedMode}`, {
                            fallback: '',
                        }),
                        currentLocale.getLabel(`main.selector.groupStage.${selectedStage}`, {
                            fallback: '',
                        }),
                        selectedSemester !== null &&
                            currentLocale.getLabel('main.selector.nSemester', {
                                pluralRulesN: selectedSemester,
                                args: [selectedSemester],
                                fallback: '',
                            }),
                        [selectedLanguage, selectedLanguageLevel].filter(Boolean).join(' '),
                    ]
                        .filter(Boolean)
                        .join(', ') || currentLocale.getLabel('main.selector.otherLinks'),
                items: filteredByDetailsLinks,
            },
        ];

        if (unfilterableByDetailsLinks.length > 0) {
            linkGroups.push({
                label: currentLocale.getLabel('main.selector.otherLinks'),
                items: unfilterableByDetailsLinks,
            });
        }

        return linkGroups;
    }, [
        headers,
        searchValueLowerCase,
        selectedMode,
        selectedStage,
        selectedSemester,
        selectedLanguage,
        selectedLanguageLevel,
        createURL,
        currentLocale.getLabel,
    ]);

    if (!headers) {
        return <MainViewSelectorModalTileLinkListSkeleton childCount={2} />;
    }

    if (!selectedMode && filtersOptions.modes.length > 1) {
        return (
            <MainViewSelectorModalTileLinkList title={currentLocale.getLabel('main.selector.selectGroupModeCTA')}>
                {filtersOptions.modes.map((mode) => (
                    <MainViewSelectorModalTileLink
                        key={mode}
                        label={currentLocale.getLabel(`main.selector.groupMode.${mode}`)}
                        href={createURL(selectorFilterModeGlobalState.createUpdate(mode))}
                    />
                ))}
            </MainViewSelectorModalTileLinkList>
        );
    }

    if (!selectedStage && filtersOptions.stages.length > 1) {
        return (
            <MainViewSelectorModalTileLinkList title={currentLocale.getLabel('main.selector.selectGroupStageCTA')}>
                {filtersOptions.stages.map((stage) => (
                    <MainViewSelectorModalTileLink
                        key={stage}
                        label={currentLocale.getLabel(`main.selector.groupStage.${stage}`)}
                        href={createURL(selectorFilterStageGlobalState.createUpdate(stage))}
                    >
                        {GROUP_STAGE_TO_ICON[stage] && <Icon name={GROUP_STAGE_TO_ICON[stage]} class="w-16 p-4" />}
                    </MainViewSelectorModalTileLink>
                ))}
            </MainViewSelectorModalTileLinkList>
        );
    }

    if (selectedSemester === null && filtersOptions.semesters.length > 1) {
        return (
            <MainViewSelectorModalTileLinkList title={currentLocale.getLabel('main.selector.selectSemesterCTA')}>
                {filtersOptions.semesters.map((semesterOption) => (
                    <MainViewSelectorModalTileLink
                        key={semesterOption.value}
                        label={semesterOption.label}
                        href={createURL(selectorFilterSemesterGlobalState.createUpdate(semesterOption.value))}
                    />
                ))}
            </MainViewSelectorModalTileLinkList>
        );
    }

    if (!selectedLanguage && filtersOptions.languages.length > 1) {
        return (
            <MainViewSelectorModalTileLinkList title={currentLocale.getLabel('main.selector.selectLanguageCTA')}>
                {filtersOptions.languages.map((language) => (
                    <MainViewSelectorModalTileLink
                        key={language}
                        label={language}
                        href={createURL(selectorFilterLanguageGlobalState.createUpdate(language))}
                    >
                        {LANGUAGE_TO_FLAG_IMG[language] && (
                            <img src={LANGUAGE_TO_FLAG_IMG[language]} class="shadow-x-main-bg-1 max-h-3/5 shadow-2xl" />
                        )}
                    </MainViewSelectorModalTileLink>
                ))}
            </MainViewSelectorModalTileLinkList>
        );
    }

    if (!selectedLanguageLevel && filtersOptions.languageLevels.length > 1) {
        return (
            <MainViewSelectorModalTileLinkList title={currentLocale.getLabel('main.selector.selectLanguageLevelCTA')}>
                {filtersOptions.languageLevels.map((languageLevel) => (
                    <MainViewSelectorModalTileLink
                        key={languageLevel}
                        label={languageLevel}
                        href={createURL(selectorFilterLanguageLevelGlobalState.createUpdate(languageLevel))}
                    />
                ))}
            </MainViewSelectorModalTileLinkList>
        );
    }

    return (
        <>
            <TextInput
                icon="search"
                type="search"
                value={searchValueLowerCase}
                focusOnRender
                onChange={(newValue) =>
                    updateQueryParams('replaceState', selectorFilterSearchGlobalState.createUpdate(newValue))
                }
            />
            <MainViewSelectorModalNestableLinkList groups={linkListGroups} />
        </>
    );
};
