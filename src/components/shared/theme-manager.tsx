'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ThemeManager() {
  const pathname = usePathname();
  
  useEffect(() => {
    console.log('=== THEME MANAGER ACTIVATED ===', { pathname });
    
    // Force apply theme with maximum verbosity
    const applyTheme = () => {
      try {
        console.log('=== FORCE APPLYING THEME ===');
        
        // Always check for space slug regardless of path
        const path = window.location.pathname;
        console.log('Current path:', path);
        
        let spaceSlug = null;
        
        // Try to extract space slug from various possible locations
        if (path.includes('/space/')) {
          const pathParts = path.split('/');
          const spaceSlugIndex = pathParts.indexOf('space') + 1;
          if (spaceSlugIndex > 0 && spaceSlugIndex < pathParts.length) {
            spaceSlug = pathParts[spaceSlugIndex];
          }
        }
        
        // If we can't get it from path, try to get it from localStorage keys
        if (!spaceSlug) {
          console.log('Trying to find space slug from localStorage keys');
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('space-theme-color-')) {
              spaceSlug = key.replace('space-theme-color-', '');
              console.log('Found space slug from localStorage:', spaceSlug);
              break;
            }
          }
        }
        
        if (!spaceSlug) {
          console.log('No space slug found, using default theme');
          // Apply default theme
          const root = document.documentElement;
          root.classList.remove('theme-midnight-blue', 'theme-calm-sand', 'theme-muted-lavender', 'theme-natural-green', 'theme-minimal-grey');
          root.classList.remove('font-gentle-rounded', 'font-clean-modern', 'font-calm-serif');
          root.classList.add('theme-midnight-blue', 'font-gentle-rounded');
          return;
        }
        
        console.log('Using space slug:', spaceSlug);
        
        // Get saved themes from localStorage
        const savedColorTheme = localStorage.getItem(`space-theme-color-${spaceSlug}`);
        const savedFontTheme = localStorage.getItem(`space-theme-font-${spaceSlug}`);
        console.log('Retrieved from localStorage - Color:', savedColorTheme, 'Font:', savedFontTheme);
        
        // Apply themes to document root
        const root = document.documentElement;
        console.log('Root element:', root);
        console.log('Current root classes before cleanup:', Array.from(root.classList));
        
        // Remove ALL theme classes (be very aggressive)
        const classesToRemove = [];
        for (let i = 0; i < root.classList.length; i++) {
          const className = root.classList[i];
          if (className.startsWith('theme-') || className.startsWith('font-')) {
            classesToRemove.push(className);
          }
        }
        console.log('Classes to remove:', classesToRemove);
        
        // Remove classes one by one
        classesToRemove.forEach(cls => {
          console.log('Removing class:', cls);
          root.classList.remove(cls);
        });
        
        console.log('Root classes after removal:', Array.from(root.classList));
        
        // Add new theme classes with proper prefixes
        const colorThemeClass = savedColorTheme ? `theme-${savedColorTheme}` : 'theme-midnight-blue';
        const fontThemeClass = savedFontTheme ? `font-${savedFontTheme}` : 'font-gentle-rounded';
        
        console.log('Adding classes:', colorThemeClass, fontThemeClass);
        root.classList.add(colorThemeClass);
        root.classList.add(fontThemeClass);
        
        console.log('Final root classes:', Array.from(root.classList));
        
        // Verify the theme was applied by checking if the class exists in the document
        const themeExists = root.classList.contains(colorThemeClass);
        const fontExists = root.classList.contains(fontThemeClass);
        console.log('Theme class exists:', themeExists, 'Font class exists:', fontExists);
        
        // Log CSS variables to verify
        setTimeout(() => {
          try {
            const computedStyle = getComputedStyle(root);
            console.log('=== CSS VARIABLES ===');
            console.log('Background:', computedStyle.getPropertyValue('--background'));
            console.log('Primary:', computedStyle.getPropertyValue('--primary'));
            console.log('Font heading:', computedStyle.getPropertyValue('--font-heading'));
            console.log('Font body:', computedStyle.getPropertyValue('--font-body'));
          } catch (e) {
            console.error('Error reading CSS variables:', e);
          }
        }, 100);
        
      } catch (error) {
        console.error('Error in applyTheme:', error);
      }
    };
    
    // Apply immediately
    console.log('Applying theme immediately');
    applyTheme();
    
    // Apply after small delays to catch any timing issues
    const timeout1 = setTimeout(() => {
      console.log('Applying theme after 100ms delay');
      applyTheme();
    }, 100);
    
    const timeout2 = setTimeout(() => {
      console.log('Applying theme after 500ms delay');
      applyTheme();
    }, 500);
    
    // Set up event listeners
    const handleThemeChange = () => {
      console.log('=== CUSTOM THEME CHANGE EVENT ===');
      applyTheme();
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      console.log('=== STORAGE CHANGE EVENT ===', e);
      if (e.key && (e.key.startsWith('space-theme-color-') || e.key.startsWith('space-theme-font-'))) {
        console.log('Theme-related storage change detected');
        applyTheme();
      }
    };
    
    window.addEventListener('theme-change', handleThemeChange);
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      window.removeEventListener('theme-change', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [pathname]);

  return null;
}