import type { ElementType, ReactNode } from 'react';

export default function Container({
  as: Tag = 'div',
  className = '',
  children,
}: {
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}) {
  return <Tag className={`mx-auto w-full max-w-[1280px] px-5 md:px-8 ${className}`.trim()}>{children}</Tag>;
}
