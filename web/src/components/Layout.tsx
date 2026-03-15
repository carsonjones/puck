import type { ReactNode } from 'react';

interface LayoutProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function Layout({ header, footer, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="topbar">{header}</header>
      <main className="layout-main">{children}</main>
      <footer className="statusbar">{footer}</footer>
    </div>
  );
}
