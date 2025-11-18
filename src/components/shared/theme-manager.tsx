
'use client';

import { useEffect } from 'react';

export function ThemeManager() {
  useEffect(() => {
    // This effect runs once on the client to apply the saved theme.
    // It is specific to the current URL, so it only runs on space pages.
    const pathParts = window.location.pathname.split('/');
    const spaceSlugIndex = pathParts.indexOf('space') + 1;
    let savedColorTheme = null;
    let savedFontTheme = null;

    if (spaceSlugIndex > 0 && pathParts.length > spaceSlugIndex) {
      const spaceSlug = pathParts[spaceSlugIndex];
      savedColorTheme = localStorage.getItem(`space-theme-color-${spaceSlug}`);
      savedFontTheme = localStorage.getItem(`space-theme-font-${spaceSlug}`);
    }

    const root = document.documentElement;

    // Clear any existing theme classes
    root.classList.forEach(className => {
      if (className.startsWith('theme-') || className.startsWith('font-')) {
        root.classList.remove(className);
      }
    });

    // Apply the saved theme or fall back to defaults
    root.classList.add(savedColorTheme || 'theme-midnight-blue');
    root.classList.add(savedFontTheme || 'font-gentle-rounded');
    
  }, []); // Empty dependency array ensures this runs once on mount.

  // This component renders nothing.
  return null;
}
