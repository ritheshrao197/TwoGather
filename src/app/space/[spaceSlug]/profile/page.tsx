
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Header } from '@/components/shared/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, User, Upload, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MemberProfile {
  avatarUrl?: string;
  bio?: string;
  mood?: string;
  pronouns?: string;
}

interface MemberData {
  id: string;
  displayName: string;
  profile: MemberProfile;
}

const compressImage = (file: File, maxSize: number = 256): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl);
      };
      img.onerror = (error: any) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.spaceSlug as string;
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [mood, setMood] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const memberId = localStorage.getItem(`memberId-for-${spaceSlug}`);
    if (!memberId) {
      router.push(`/space/${spaceSlug}/lobby`);
    } else {
      setCurrentMemberId(memberId);
    }
  }, [spaceSlug, router]);

  const memberDocRef = useMemoFirebase(() => {
    if (!firestore || !spaceSlug || !currentMemberId) return null;
    return doc(firestore, `spaces/${spaceSlug}/members`, currentMemberId);
  }, [firestore, spaceSlug, currentMemberId]);

  const { data: memberData, isLoading: isLoadingMember } = useDoc<MemberData>(memberDocRef);

  useEffect(() => {
    if (memberData) {
      setDisplayName(memberData.displayName || '');
      setBio(memberData.profile?.bio || '');
      setMood(memberData.profile?.mood || '');
      setPronouns(memberData.profile?.pronouns || '');
      setAvatarUrl(memberData.profile?.avatarUrl || '');
    }
  }, [memberData]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !memberDocRef) return;

    setIsUploading(true);
    try {
      const compressedDataUrl = await compressImage(file);
      await updateDoc(memberDocRef, { 'profile.avatarUrl': compressedDataUrl });
      setAvatarUrl(compressedDataUrl); // Optimistic update
      toast({ title: 'Avatar Updated!', description: 'Your new avatar has been saved.' });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not update your avatar.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!memberDocRef) return;
    setIsSaving(true);
    try {
      await updateDoc(memberDocRef, {
        displayName,
        'profile.bio': bio,
        'profile.mood': mood,
        'profile.pronouns': pronouns,
      });
      toast({ title: 'Profile Saved!', description: 'Your changes have been saved successfully.' });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save your profile changes.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingMember || !currentMemberId) {
    return (
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
        </main>
      </div>
    );
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarUpload}
        className="hidden"
        accept="image/*"
      />
      <div className="flex flex-col min-h-dvh bg-background text-foreground">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-headline font-bold">Profile</h1>
                <p className="text-muted-foreground font-caption mt-1">Avatar, display name, short bio, local timezone, theme preference</p>
              </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="w-24 h-24 border-4 border-muted">
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback>
                            <User className="w-10 h-10 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          size="icon"
                          variant="outline"
                          className="absolute -bottom-2 -right-2 rounded-full h-10 w-10 bg-background"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? <Loader2 className="animate-spin" /> : <Upload className="w-5 h-5"/>}
                        </Button>
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          className="text-lg font-headline"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                       <div>
                        <Label htmlFor="bio">Short Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="A little about yourself..."
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                          rows={2}
                        />
                      </div>
                       <div>
                        <Label htmlFor="mood">Status</Label>
                        <Input
                          id="mood"
                          placeholder="e.g., Listening to music"
                          value={mood}
                          onChange={e => setMood(e.target.value)}
                        />
                      </div>
                       <div>
                        <Label htmlFor="pronouns">Pronouns</Label>
                        <Input
                          id="pronouns"
                          placeholder="e.g., they/them"
                          value={pronouns}
                          onChange={e => setPronouns(e.target.value)}
                        />
                      </div>
                    </div>
                </CardContent>
                <CardContent>
                    <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full">
                        {isSaving ? <Loader2 className="animate-spin"/> : <><Save className="mr-2"/> Save Changes</>}
                    </Button>
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
    </>
  );
}
