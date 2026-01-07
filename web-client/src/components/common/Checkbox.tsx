import clsx from 'clsx';

export const Checkbox = ({
    value,
    class: className,
    label,
    title = label,
    onChange,
}: {
    value: boolean;
    class?: string;
    label: string;
    title?: string;
    onChange: (newValue: boolean) => void;
}) => (
    <label
        class={clsx(
            className,
            'hover:bg-x-main-bg-3 accent-x-main-bg-5 outline-x-brand-400 flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 focus-visible:outline-2',
        )}
        title={title}
    >
        <input
            class="outline-x-brand-400 h-5 w-5 cursor-pointer focus-visible:outline-2"
            type="checkbox"
            checked={value}
            onChange={(event) => {
                onChange(event.currentTarget.checked);
            }}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    onChange(!event.currentTarget.checked);
                }
            }}
        />
        <span class="w-full truncate text-sm">{label}</span>
    </label>
);
