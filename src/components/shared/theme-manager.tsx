'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { themeDefinitions, fontDefinitions } from '@/lib/theme-definitions';

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
        
        // Apply themes to document root by directly setting CSS variables
        const root = document.documentElement;
        console.log('Root element:', root);
        
        // Get theme definitions
        const colorThemeVars = themeDefinitions[savedColorTheme as keyof typeof themeDefinitions] || themeDefinitions['midnight-blue'];
        const fontThemeVars = fontDefinitions[savedFontTheme as keyof typeof fontDefinitions] || fontDefinitions['gentle-rounded'];
        
        // Apply color theme variables
        Object.entries(colorThemeVars).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
        
        // Apply font theme variables
        Object.entries(fontThemeVars).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
        
        console.log('Applied theme variables:', { colorThemeVars, fontThemeVars });
        
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