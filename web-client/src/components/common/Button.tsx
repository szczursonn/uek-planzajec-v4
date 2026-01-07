import type { MouseEventHandler } from 'preact';
import clsx from 'clsx';
import { Icon, type IconName } from './Icon';

const VARIANT_CLASSES = {
    bare: 'outline-transparent',
    brand: 'outline-x-brand-500 bg-x-brand-500 disabled:bg-x-brand-950 disabled:outline-x-brand-900',
    secondary: 'outline-x-main-bg-4 bg-x-main-bg-2',
    tertiary: 'outline-x-main-bg-5 bg-x-main-bg-3',
} as const;

const VARIANT_ENABLED_CLASSES = {
    bare: '',
    brand: 'hover:bg-x-brand-400 hover:outline-x-brand-400 hover:outline-x-brand-500 active:outline-x-brand-400 focus-visible:outline-x-brand-400',
    secondary:
        'hover:bg-x-main-bg-3 active:bg-x-main-bg-4 hover:outline-x-brand-500 active:outline-x-brand-400 focus-visible:outline-x-brand-400',
    tertiary:
        'hover:bg-x-main-bg-4 active:bg-x-main-bg-5 hover:outline-x-brand-500 active:outline-x-brand-400 focus-visible:outline-x-brand-400',
} as const;

export type ButtonProps = (
    | {
          href: string;
          onClick?: MouseEventHandler<HTMLAnchorElement>;
          type?: undefined;
      }
    | {
          href?: undefined;
          onClick?: MouseEventHandler<HTMLButtonElement>;
          type: 'button' | 'submit';
      }
) & {
    variant?: keyof typeof VARIANT_CLASSES;
    class?: string;
    text?: string;
    title?: string;
    disabled?: boolean;
    icon?: IconName;
    iconClass?: string;
};

export const Button = ({
    href,
    type: buttonType,
    onClick,
    variant = 'secondary',
    class: className,
    text,
    title,
    disabled = false,
    icon,
    iconClass,
}: ButtonProps) => {
    const finalTitle = title || text;
    const finalClassName = clsx(
        'flex items-center justify-center gap-3 w-[calc(100%-0.25rem)] rounded-md py-1.5 px-3 lg:px-4 transition-all m-0.5 outline-2',
        VARIANT_CLASSES[variant],
        disabled ? 'cursor-not-allowed text-x-main-text-muted' : ['cursor-pointer', VARIANT_ENABLED_CLASSES[variant]],
        className,
    );

    const buttonInternals = (
        <>
            {icon && <Icon name={icon} class={clsx('h-4 w-4 shrink-0 md:h-3 md:w-3 lg:h-4 lg:w-4', iconClass)} />}
            {text && <span class="text-center">{text}</span>}
        </>
    );

    if (href === undefined) {
        return (
            <button type={buttonType} class={finalClassName} title={finalTitle} disabled={disabled} onClick={onClick}>
                {buttonInternals}
            </button>
        );
    }

    if (disabled) {
        return (
            <span class={finalClassName} title={finalTitle}>
                {buttonInternals}
            </span>
        );
    }

    return (
        <a href={href} target="_blank" class={finalClassName} title={finalTitle} onClick={onClick}>
            {buttonInternals}
        </a>
    );
};
