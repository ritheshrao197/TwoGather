
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Palette, Type, Save, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const colorThemes = [
  { id: 'midnight-blue', name: 'Midnight Blue', colors: ['#1F2A44', '#C7C4E2', '#A7E3C3'] },
  { id: 'calm-sand', name: 'Calm Sand', colors: ['#FDF6E3', '#A99A7B', '#655B49'] },
  { id: 'muted-lavender', name: 'Muted Lavender', colors: ['#E6E0F8', '#C4B7E1', '#7A6B99'] },
  { id: 'natural-green', name: 'Natural Green', colors: ['#F0F4F0', '#A9B9A9', '#576757'] },
  { id: 'minimal-grey', name: 'Minimal Grey', colors: ['#F5F5F5', '#CCCCCC', '#555555'] },
];

const fontThemes = [
  { id: 'gentle-rounded', name: 'Gentle Rounded', description: 'Poppins & Nunito' },
  { id: 'clean-modern', name: 'Clean Modern', description: 'Inter & DM Sans' },
  { id: 'calm-serif', name: 'Calm Serif', description: 'Cormorant & Lora' },
];

export default function ThemePage() {
  const params = useParams();
  const spaceSlug = params.spaceSlug as string;

  const [selectedColorTheme, setSelectedColorTheme] = useState('midnight-blue');
  const [selectedFontTheme, setSelectedFontTheme] = useState('gentle-rounded');
  const [isSaving, setIsSaving] = useState(false);

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
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <h3 className="font-headline text-lg text-foreground">A Sample Headline</h3>
                    <p className="font-body text-sm text-muted-foreground mt-1">This is body text to preview fonts and colors.</p>
                    <div className="flex gap-2 mt-4">
                        <Button size="sm" style={{ backgroundColor: 'var(--color-primary-preview)', color: 'var(--color-primary-foreground-preview)' }}>Primary</Button>
                        <Button size="sm" variant="secondary" style={{ backgroundColor: 'var(--color-accent-preview)' }}>Accent</Button>
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
                        selectedColorTheme === theme.id ? 'border-primary' : 'border-border'
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
                        selectedFontTheme === theme.id ? 'border-primary' : 'border-border'
                      )}
                    >
                      <p className="font-bold text-lg">{theme.name}</p>
                      <p className="text-muted-foreground text-sm">{theme.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <div className="flex justify-end gap-4">
                 <Button variant="ghost" disabled={isSaving}>
                   <RotateCcw className="mr-2"/> Reset to Default
                </Button>
                <Button disabled={isSaving}>
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
