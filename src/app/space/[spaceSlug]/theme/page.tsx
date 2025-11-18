
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Palette, Type, Save, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const colorThemes = [
  { id: 'midnight-blue', name: 'Midnight Blue', colors: ['hsl(225 35% 20%)', 'hsl(244 33% 83%)', 'hsl(147 50% 78%)'] },
  { id: 'calm-sand', name: 'Calm Sand', colors: ['hsl(45 50% 95%)', 'hsl(40 30% 50%)', 'hsl(35 60% 70%)'] },
  { id: 'muted-lavender', name: 'Muted Lavender', colors: ['hsl(250 40% 96%)', 'hsl(250 35% 75%)', 'hsl(270 50% 80%)'] },
  { id: 'natural-green', name: 'Natural Green', colors: ['hsl(120 15% 97%)', 'hsl(130 25% 55%)', 'hsl(100 30% 75%)'] },
  { id: 'minimal-grey', name: 'Minimal Grey', colors: ['hsl(0 0% 98%)', 'hsl(0 0% 40%)', 'hsl(0 0% 60%)'] },
];

const fontThemes = [
  { id: 'gentle-rounded', name: 'Gentle Rounded', description: 'Poppins & Inter' },
  { id: 'clean-modern', name: 'Clean Modern', description: 'DM Sans & Inter' },
  { id: 'calm-serif', name: 'Calm Serif', description: 'Cormorant & Lora' },
];

export default function ThemePage() {
  const params = useParams();
  const spaceSlug = params.spaceSlug as string;
  const { toast } = useToast();

  const [selectedColorTheme, setSelectedColorTheme] = useState('midnight-blue');
  const [selectedFontTheme, setSelectedFontTheme] = useState('gentle-rounded');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // On mount, read the current theme from local storage for this space
    const savedColorTheme = localStorage.getItem(`space-theme-color-${spaceSlug}`);
    const savedFontTheme = localStorage.getItem(`space-theme-font-${spaceSlug}`);

    if (savedColorTheme) {
      setSelectedColorTheme(savedColorTheme);
    }
    if (savedFontTheme) {
      setSelectedFontTheme(savedFontTheme);
    }
  }, [spaceSlug]);

  useEffect(() => {
    const root = document.documentElement;
    // Remove old theme classes
    root.classList.forEach(className => {
      if (className.startsWith('theme-') || className.startsWith('font-')) {
        root.classList.remove(className);
      }
    });

    // Add new theme classes
    root.classList.add(`theme-${selectedColorTheme}`);
    root.classList.add(`font-${selectedFontTheme}`);
  }, [selectedColorTheme, selectedFontTheme]);


  const getThemeVars = () => {
    const theme = colorThemes.find(t => t.id === selectedColorTheme);
    const font = fontThemes.find(f => f.id === selectedFontTheme);
    if (!theme || !font) return {};

    let fontVars = {};
    if (font.id === 'gentle-rounded') fontVars = { '--font-heading-preview': "'Poppins', sans-serif", '--font-body-preview': "'Inter', sans-serif" };
    if (font.id === 'clean-modern') fontVars = { '--font-heading-preview': "'DM Sans', sans-serif", '--font-body-preview': "'Inter', sans-serif" };
    if (font.id === 'calm-serif') fontVars = { '--font-heading-preview': "'Cormorant Garamond', serif", '--font-body-preview': "'Lora', serif" };

    return {
      '--color-background-preview': theme.colors[0],
      '--color-primary-preview': theme.colors[1],
      '--color-accent-preview': theme.colors[2],
      '--color-foreground-preview': selectedColorTheme === 'minimal-grey' || selectedColorTheme === 'calm-sand' || selectedColorTheme === 'natural-green' || selectedColorTheme === 'muted-lavender' ? '#111827' : '#f8fafc',
      '--color-primary-foreground-preview': selectedColorTheme === 'minimal-grey' || selectedColorTheme === 'calm-sand' ? '#f8fafc' : '#111827',
       ...fontVars,
    };
  }

  const handleSaveTheme = () => {
    setIsSaving(true);
    localStorage.setItem(`space-theme-color-${spaceSlug}`, selectedColorTheme);
    localStorage.setItem(`space-theme-font-${spaceSlug}`, selectedFontTheme);
    toast({
        title: 'Theme Saved!',
        description: 'Your new look has been saved for this space.',
    });
    setTimeout(() => setIsSaving(false), 1000);
  };
  
  const handleReset = () => {
      setSelectedColorTheme('midnight-blue');
      setSelectedFontTheme('gentle-rounded');
      localStorage.removeItem(`space-theme-color-${spaceSlug}`);
      localStorage.removeItem(`space-theme-font-${spaceSlug}`);
      toast({
        title: 'Theme Reset',
        description: 'The theme has been reset to the default.',
      });
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Palette className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-4xl font-headline font-bold">Theme & Layout</h1>
              <p className="text-muted-foreground font-caption mt-1">
                Customize the look and feel of your shared space.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/space/${spaceSlug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Space
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preview Pane */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>Changes will appear here instantly.</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="p-4 rounded-lg border"
                  style={getThemeVars() as React.CSSProperties}
                >
                    <div style={{ background: 'var(--color-background-preview)', color: 'var(--color-foreground-preview)', padding: '1rem', borderRadius: 'var(--radius)'}}>
                        <h3 className="text-lg" style={{ fontFamily: 'var(--font-heading-preview)' }}>A Sample Headline</h3>
                        <p className="text-sm" style={{ fontFamily: 'var(--font-body-preview)' }}>This is body text to preview fonts and colors.</p>
                        <div className="flex gap-2 mt-4">
                            <Button size="sm" style={{ backgroundColor: 'var(--color-primary-preview)', color: 'var(--color-primary-foreground-preview)' }}>Primary</Button>
                            <Button size="sm" variant="secondary" style={{ backgroundColor: 'var(--color-accent-preview)' }}>Accent</Button>
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls Pane */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5"/> Theme Colors</CardTitle>
                  <CardDescription>Choose a primary color set for the entire space.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {colorThemes.map(theme => (
                    <div 
                      key={theme.id}
                      onClick={() => setSelectedColorTheme(theme.id)}
                      className={cn(
                        'p-3 rounded-lg border-2 cursor-pointer transition-colors',
                        selectedColorTheme === theme.id ? 'border-primary' : 'border-border hover:border-border/50'
                      )}
                    >
                      <div className="flex gap-2 mb-2">
                        {theme.colors.map((color, index) => (
                          <div key={index} className="w-6 h-6 rounded-full" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      <p className="font-medium text-sm">{theme.name}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Type className="w-5 h-5"/> Typography</CardTitle>
                  <CardDescription>Choose a font style that matches your shared mood.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fontThemes.map(theme => (
                    <div
                      key={theme.id}
                      onClick={() => setSelectedFontTheme(theme.id)}
                      className={cn(
                        'p-4 rounded-lg border-2 cursor-pointer transition-colors',
                         selectedFontTheme === theme.id ? 'border-primary' : 'border-border hover:border-border/50'
                      )}
                    >
                      <p className="font-bold text-lg" style={{fontFamily: `var(--font-${theme.id}-heading, 'sans-serif')`}}>{theme.name}</p>
                      <p className="text-muted-foreground text-sm">{theme.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <div className="flex justify-end gap-4">
                 <Button variant="ghost" onClick={handleReset} disabled={isSaving}>
                   <RotateCcw className="mr-2"/> Reset to Default
                </Button>
                <Button onClick={handleSaveTheme} disabled={isSaving}>
                   <Save className="mr-2"/> Save Theme
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
