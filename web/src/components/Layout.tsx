import type { ReactNode } from 'react';

interface LayoutProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function Layout({ header, footer, children }: LayoutProps) {
  return (
    <div className="grid grid-rows-[auto_minmax(0,1fr)_auto] h-screen min-h-0 px-3 overflow-hidden">
      <header className="bg-surface flex items-center justify-between gap-4 px-3 py-4 min-h-7 whitespace-nowrap max-[960px]:flex-col max-[960px]:items-start">
        {header}
      </header>
      <main className="contents">{children}</main>
      <footer className="bg-surface flex items-center justify-between gap-4 px-3 py-3 min-h-7 whitespace-nowrap text-dim overflow-hidden [&>span]:overflow-hidden [&>span]:text-ellipsis [&>span]:whitespace-nowrap">
        {footer}
      </footer>
    </div>
  );
}
