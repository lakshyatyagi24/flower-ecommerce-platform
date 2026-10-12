import type { ComponentPropsWithoutRef, ElementType } from 'react';

type Props = ComponentPropsWithoutRef<'div'> & { as?: ElementType };

export default function Container({ as: Tag = 'div', className = '', ...rest }: Props) {
  return <Tag {...rest} className={`mx-auto w-full max-w-[1280px] px-5 md:px-8 ${className}`.trim()} />;
}
