'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, ArrowRight, SkipForward, Loader2, X } from 'lucide-react';
import Image from 'next/image';

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    topSize: '',
    bottomSize: '',
    budgetMin: '',
    budgetMax: '',
  });

  // If the user already has a profile, skip onboarding
  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const res = await fetch('/api/user/profile', { cache: 'no-store' });
        if (res.ok) {
          // User already has a profile, redirect to swipe page
          router.replace('/swipe');
          return;
        }
      } catch (e) {
        // ignore errors
      } finally {
        setChecking(false);
      }
    };
    checkExistingProfile();
  }, [router]);

  // Debug: Monitor state changes
  useEffect(() => {
    console.log('🔄 State changed - photos:', photos.length, 'previews:', photoPreviewUrls.length);
    console.log('Preview URLs:', photoPreviewUrls);
    console.log('Should show preview grid?', photoPreviewUrls.length > 0);
  }, [photos, photoPreviewUrls]);

  // Show loader while checking if user has completed onboarding
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 Photo upload triggered');
    console.log('Files from event:', e.target.files ? e.target.files.length : 0, 'files');
    
    if (e.target.files) {
      let files = Array.from(e.target.files);
      console.log('✅ Files array:', files);
      console.log('Number of files:', files.length);
      
      // Enforce max 5 photos
      if (files.length > 5) {
        alert('You can upload a maximum of 5 photos. We will use the first 5.');
        files = files.slice(0, 5);
      }
      
      files.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
          name: file.name,
          type: file.type,
          size: file.size,
        });
      });
      
      setPhotos(files);
      console.log('✅ Photos state updated');
      
      // Create preview URLs
      try {
        const previews = files.map(file => {
          const url = URL.createObjectURL(file);
          console.log(`Created preview URL for ${file.name}:`, url);
          return url;
        });
        setPhotoPreviewUrls(previews);
        console.log('✅ Preview URLs set:', previews);
      } catch (error) {
        console.error('❌ Error creating preview URLs:', error);
      }
    } else {
      console.warn('⚠️ No files in event.target.files');
    }
  };

  const removePhoto = (index: number) => {
    console.log(`🗑️ Removing photo at index ${index}`);
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviewUrls.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviewUrls(newPreviews);
    console.log('✅ Photo removed, remaining:', newPhotos.length);
  };

  const handleComplete = async () => {
    console.log('🚀 Starting onboarding completion');
    console.log('Current photos:', photos);
    console.log('Current preferences:', preferences);
    
    setSaving(true);
    
    try {
      // Upload photos first
      const uploadedUrls: string[] = [];
      
      if (photos.length > 0) {
        console.log(`📤 Uploading ${photos.length} photos...`);
        setUploading(true);
        
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          console.log(`Uploading photo ${i + 1}/${photos.length}:`, photo.name);
          
          const formData = new FormData();
          formData.append('file', photo);
          console.log('FormData created:', formData);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          console.log('Upload response status:', uploadResponse.status);
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('❌ Upload failed:', errorText);
            throw new Error('Failed to upload photo');
          }
          
          const uploadData = await uploadResponse.json();
          console.log('✅ Upload successful:', uploadData);
          uploadedUrls.push(uploadData.url);
        }
        
        setUploading(false);
        console.log('✅ All photos uploaded:', uploadedUrls.length);
      } else {
        console.log('ℹ️ No photos to upload');
      }
      
      // Save profile data
      const profileData = {
        // name omitted; will be taken from Google/Clerk profile on server
        preferences: {
          sizes: {
            top: preferences.topSize,
            bottom: preferences.bottomSize,
          },
          budgetRange: preferences.budgetMin && preferences.budgetMax 
            ? [parseInt(preferences.budgetMin), parseInt(preferences.budgetMax)]
            : undefined,
        },
        photoUrls: uploadedUrls,
        primaryPhotoIndex: 0, // First photo is primary
      };
      
      console.log('💾 Saving profile data:', profileData);
      
      const profileResponse = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      console.log('Profile response status:', profileResponse.status);
      
      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('❌ Profile save failed:', errorText);
        throw new Error('Failed to save profile');
      }
      
      const profileResult = await profileResponse.json();
      console.log('✅ Profile saved successfully:', profileResult);
      
      // Success! Redirect to swipe page
      console.log('✅ Redirecting to /swipe');
      router.replace('/swipe');
    } catch (error) {
      console.error('❌ ERROR completing onboarding:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      console.log('🏁 Onboarding process finished');
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8">
        <div className="mb-6">
          <h1 className="text-5xl font-serif font-normal tracking-tight text-gray-900 mb-2">Welcome to Vesaki</h1>
          <p className="text-xl text-gray-700">Let's set up your personal styling experience</p>
        </div>
        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
                <Label>Upload Your Photos (1-5 photos)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload clear, full-body photos for accurate virtual try-on
                </p>
                
                {/* Photo Preview Grid */}
                {photoPreviewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-[#E5E5E5]">
                        <img 
                          src={url} 
                          alt={`Photo ${index + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-white text-[#1A1A1A] rounded-full p-1.5 hover:bg-[#FAFAFA] transition shadow-sm"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-[#1A1A1A] text-white text-xs px-2 py-1 rounded-lg font-medium">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="border-2 border-dashed border-[#E5E5E5] rounded-xl p-8 text-center hover:border-[#1A1A1A] hover:bg-[#FAFAFA] transition cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    max="5"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-[#6B6B6B]" />
                    <p className="mt-2 text-sm text-[#6B6B6B]">
                      {photos.length > 0
                        ? `${photos.length} photo(s) selected - Click to change`
                        : 'Click to upload photos'}
                    </p>
                  </label>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full rounded-lg bg-[#1A1A1A] px-6 py-3 text-sm font-medium text-white hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={photos.length === 0}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#1A1A1A]">Style Preferences (Optional)</h3>
              <p className="text-sm text-[#6B6B6B]">
                Help us personalize your experience
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="topSize" className="text-xs font-medium text-[#1A1A1A]">Top Size</Label>
                <Input
                  id="topSize"
                  value={preferences.topSize}
                  onChange={(e) => setPreferences({ ...preferences, topSize: e.target.value })}
                  placeholder="S, M, L, XL"
                  className="mt-2 rounded-lg border border-[#E5E5E5] focus:border-[#1A1A1A]"
                />
              </div>
              <div>
                <Label htmlFor="bottomSize" className="text-xs font-medium text-[#1A1A1A]">Bottom Size</Label>
                <Input
                  id="bottomSize"
                  value={preferences.bottomSize}
                  onChange={(e) => setPreferences({ ...preferences, bottomSize: e.target.value })}
                  placeholder="28, 30, 32"
                  className="mt-2 rounded-lg border border-[#E5E5E5] focus:border-[#1A1A1A]"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-[#1A1A1A]">Budget Range</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input
                  value={preferences.budgetMin}
                  onChange={(e) => setPreferences({ ...preferences, budgetMin: e.target.value })}
                  placeholder="Min ($)"
                  type="number"
                  className="rounded-lg border border-[#E5E5E5] focus:border-[#1A1A1A]"
                />
                <Input
                  value={preferences.budgetMax}
                  onChange={(e) => setPreferences({ ...preferences, budgetMax: e.target.value })}
                  placeholder="Max ($)"
                  type="number"
                  className="rounded-lg border border-[#E5E5E5] focus:border-[#1A1A1A]"
                />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleComplete} 
                  className="flex-1 rounded-lg bg-white border border-[#E5E5E5] px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={saving || uploading}
                >
                  {saving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <SkipForward className="h-3 w-3" />
                  )}
                  {saving ? 'Saving...' : 'Skip'}
                </button>
                <button 
                  onClick={handleComplete} 
                  className="flex-1 rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={saving || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Uploading...
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
