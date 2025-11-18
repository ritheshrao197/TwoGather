
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Settings } from 'lucide-react';

export default function SettingsPage() {
  const params = useParams();
  const spaceSlug = params.spaceSlug as string;

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-4xl font-headline font-bold">Space Settings</h1>
                <p className="text-muted-foreground font-caption mt-1">
                  Manage the settings for your shared space.
                </p>
              </div>
            </div>
          </div>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>Coming Soon!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The space settings page is under construction. Soon you'll be able to manage members, change your space name, and more.
              </p>
            </CardContent>
          </Card>

          <div className="mt-12 text-center">
            <Button asChild variant="outline">
              <Link href={`/space/${spaceSlug}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Your Space
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

  