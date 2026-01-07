import type { MouseEventHandler } from 'preact';
import clsx from 'clsx';
import { Icon, type IconName } from './Icon';

type RoundIconButtonProps = (
    | {
          href: string;
          disabled?: undefined;
          onClick?: MouseEventHandler<HTMLAnchorElement>;
      }
    | {
          href?: undefined;
          disabled?: boolean;
          onClick?: MouseEventHandler<HTMLButtonElement>;
      }
) & {
    class?: string;
    title?: string;
    icon: IconName;
};

export const RoundIconButton = ({ href, disabled, onClick, class: className, title, icon }: RoundIconButtonProps) => {
    const finalClassName = clsx(
        'focus-visible:outline-x-brand-400 outline-transparent outline-2 hover:bg-x-main-bg-3 block aspect-square cursor-pointer rounded-full border-2 border-transparent transition-all hover:opacity-70 active:opacity-50',
        className,
    );
    const internals = <Icon name={icon} class="h-full w-full shrink-0" />;

    if (href === undefined) {
        return (
            <button class={finalClassName} type="button" title={title} disabled={disabled} onClick={onClick}>
                {internals}
            </button>
        );
    }

    return (
        <a class={finalClassName} href={href} target="_blank" title={title} onClick={onClick}>
            {internals}
        </a>
    );
};
