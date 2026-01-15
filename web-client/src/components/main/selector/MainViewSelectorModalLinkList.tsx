import { useState } from 'preact/hooks';
import clsx from 'clsx';
import { anchorPushStateHandler } from '../../../state/queryParams/manager';
import { Icon } from '../../common/Icon';

export type MainViewSelectorModalNestableLinkListGroup = {
    label: string;
    childGroups?: MainViewSelectorModalNestableLinkListGroup[];
    items?: MainViewSelectorModalLinkListItem[];
};

export const MainViewSelectorModalNestableLinkList = ({
    nestLevel = 0,
    groups,
}: {
    nestLevel?: number;
    groups: MainViewSelectorModalNestableLinkListGroup[];
}) => (
    <ul class="flex flex-col gap-4">
        {groups.map((group) => (
            <MainViewSelectorModalNestableLinkListGroupCmp key={group.label} nestLevel={nestLevel} group={group} />
        ))}
    </ul>
);

const NEST_LEVEL_CLASSES = [
    {
        button: 'text-3xl font-extrabold',
        icon: 'h-4 w-4',
    },
    {
        button: 'text-2xl font-bold',
        icon: 'h-3.5 w-3.5',
    },
    {
        button: 'text-xl font-semibold',
        icon: 'h-3 w-3',
    },
];

const MainViewSelectorModalNestableLinkListGroupCmp = ({
    nestLevel,
    group,
}: {
    nestLevel: number;
    group: MainViewSelectorModalNestableLinkListGroup;
}) => {
    const [isOpen, setIsOpen] = useState(true);

    const nestLevelClass = NEST_LEVEL_CLASSES[nestLevel] ?? NEST_LEVEL_CLASSES.at(-1)!;

    return (
        <li key={group.label}>
            <button
                class={clsx(
                    'hover:bg-x-main-bg-3 flex w-full cursor-pointer items-center gap-2 rounded p-2 transition-all',
                    nestLevelClass.button,
                    !isOpen && 'opacity-60',
                )}
                type="button"
                onClick={() => setIsOpen((v) => !v)}
            >
                <Icon
                    name="chevronDown"
                    class={clsx('shrink-0 transition-transform', nestLevelClass.icon, isOpen && 'rotate-180')}
                />
                <span class="text-left">{group.label}</span>
            </button>
            {isOpen && (
                <>
                    {!!group.childGroups?.length && (
                        <MainViewSelectorModalNestableLinkList nestLevel={nestLevel + 1} groups={group.childGroups} />
                    )}
                    {!!group.items && <MainViewSelectorModalLinkList items={group.items} />}
                </>
            )}
        </li>
    );
};

export type MainViewSelectorModalLinkListItem = {
    label: string;
    href: string;
};

export const MainViewSelectorModalLinkList = ({ items }: { items: MainViewSelectorModalLinkListItem[] }) => (
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && <span class="col-span-full text-center font-bold">-</span>}
        {items.map((item) => (
            <a
                key={item.label}
                class="hover:bg-x-main-bg-3 active:bg-x-main-bg-4 border-b-x-main-bg-5 rounded-xs border-b-2 p-3 font-semibold transition-colors hover:underline"
                href={item.href}
                target="_blank"
                title={item.label}
                onClick={anchorPushStateHandler}
            >
                {item.label}
            </a>
        ))}
    </div>
);

export const MainViewSelectorModalLinkListSkeleton = () => (
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from(Array(8 * 3).keys()).map((i) => {
            return (
                <div
                    key={i}
                    class={clsx(
                        'bg-x-main-bg-3 h-12 w-full animate-pulse rounded-xs',
                        i % 2 === 0 && 'sm:hidden',
                        i % 4 === 0 && 'lg:hidden',
                    )}
                />
            );
        })}
    </div>
);
