import { useEffect } from 'react';

interface HeadProps {
  description?: string;
}

const APP_NAME = 'PUCK';
const THEME_COLOR = '#262C36';

export function Head({ description }: HeadProps) {
  useEffect(() => {
    document.title = APP_NAME;

    let themeTag = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeTag) {
      themeTag = document.createElement('meta');
      themeTag.name = 'theme-color';
      document.head.appendChild(themeTag);
    }
    themeTag.content = THEME_COLOR;
  }, []);

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
