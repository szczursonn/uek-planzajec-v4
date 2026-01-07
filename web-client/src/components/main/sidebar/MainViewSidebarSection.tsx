import type { ComponentChildren } from 'preact';

export const MainViewSidebarSection = ({ title, children }: { title: string; children?: ComponentChildren }) => (
    <>
        <p class="text-x-main-text-muted mt-2 mb-1 shrink-0 truncate text-sm font-bold">{title}</p>
        {children}
    </>
);
