import { useEffect, useRef } from 'preact/hooks';
import clsx from 'clsx';
import { Icon, type IconName } from './Icon';

export const TextInput = ({
    value,
    class: className,
    placeholder,
    focusOnRender = false,
    icon,
    type: inputType,
    autocomplete,
    onChange,
}: {
    value: string;
    class?: string;
    placeholder?: string;
    focusOnRender?: boolean;
    icon?: IconName;
    type?: HTMLInputElement['type'];
    autocomplete?: string;
    onChange: (newValue: string) => void;
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (focusOnRender) {
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, []);

    return (
        <div class="relative">
            <input
                ref={inputRef}
                class={clsx(
                    className,
                    'border-x-main-bg-4 bg-x-main-bg-3 focus-visible:outline-x-brand-400 w-full rounded border-2 p-2 outline-2 outline-transparent',
                    icon && 'pl-10',
                )}
                type={inputType}
                placeholder={placeholder}
                autocomplete={autocomplete}
                value={value}
                onInput={(event) => onChange(event.currentTarget.value)}
            />
            {icon && (
                <Icon name={icon} class="text-x-main-text-muted pointer-events-none absolute top-3 left-3 h-5 w-5" />
            )}
        </div>
    );
};
