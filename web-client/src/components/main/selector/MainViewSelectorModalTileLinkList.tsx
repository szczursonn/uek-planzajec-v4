import type { ComponentChildren } from 'preact';
import { anchorPushStateHandler } from '../../../state/queryParams/manager';

export const MainViewSelectorModalTileLinkList = ({
    title,
    children,
}: {
    title?: string;
    children: ComponentChildren;
}) => (
    <div class="mx-4 my-auto flex h-full flex-col items-center justify-center gap-4 lg:mx-16 lg:gap-16">
        {title && <span class="text-center text-4xl font-bold lg:text-5xl">{title}</span>}
        <div class="flex w-full flex-wrap items-center justify-center gap-4 lg:gap-12">{children}</div>
    </div>
);

export const MainViewSelectorModalTileLink = ({
    label,
    href,
    children,
}: {
    label: string;
    href: string;
    children?: ComponentChildren;
}) => (
    <a
        class="border-x-brand-500 bg-x-main-bg-3 hover:bg-x-main-bg-4 active:bg-x-main-bg-5 hover:border-x-brand-400 shadow-x-main-bg-1 flex aspect-square h-32 shrink-0 grow cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-4 p-4 shadow-2xl transition-all hover:scale-105 hover:border-6 active:scale-110 lg:h-42"
        title={label}
        target="_blank"
        href={href}
        onClick={anchorPushStateHandler}
    >
        {children}
        <span class="max-w-full p-0.5 text-center font-semibold text-wrap lg:text-xl">{label}</span>
    </a>
);

export const MainViewSelectorModalTileLinkListSkeleton = ({ childCount }: { childCount: number }) => {
    return (
        <div class="my-auto flex h-full flex-col items-center justify-center gap-8">
            <div class="bg-x-main-bg-4 h-10 w-96 animate-pulse rounded-xl" />
            <div class="flex w-full flex-wrap items-center justify-center gap-12">
                {Array.from(Array(childCount).keys()).map((i) => (
                    <div
                        key={i}
                        class="border-x-brand-500 bg-x-main-bg-4 shadow-x-main-bg-1 flex aspect-square h-32 animate-pulse flex-col items-center justify-center gap-2 rounded-3xl border-4 p-4 shadow-2xl transition-all lg:h-42"
                    />
                ))}
            </div>
        </div>
    );
};
