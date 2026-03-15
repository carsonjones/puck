import { useEffect } from 'react';

interface HeadProps {
  title?: string;
  description?: string;
}

const APP_NAME = 'puck';

export function Head({ title, description }: HeadProps) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);

  useEffect(() => {
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'description';
      document.head.appendChild(tag);
    }
    tag.content = description ?? '';
  }, [description]);

  return null;
}
