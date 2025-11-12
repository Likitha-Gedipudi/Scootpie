'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import Image from 'next/image';

interface Photo {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences: {
    sizes?: { top?: string; bottom?: string; shoes?: string };
    budgetRange?: [number, number];
  };
  photos: Photo[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preferences, setPreferences] = useState({
    topSize: '',
    bottomSize: '',
    budgetMin: '',
    budgetMax: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    console.log('🔄 [PROFILE] Fetching user profile...');
    try {
      // Add cache busting parameter to force fresh data
      const response = await fetch(`/api/user/profile?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      console.log('📡 [PROFILE] API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [PROFILE] Profile data received:', {
          userId: data.user.id,
          name: data.user.name,
          email: data.user.email,
          photosCount: data.user.photos?.length || 0,
          photoIds: data.user.photos?.map((p: any) => p.id.substring(0, 8)),
          preferences: data.user.preferences,
        });
        
        console.log('🔄 [PROFILE] Setting profile state with', data.user.photos?.length, 'photos');
        setProfile(data.user);
        
        // Set preferences from profile
        if (data.user.preferences) {
          const prefs = {
            topSize: data.user.preferences.sizes?.top || '',
            bottomSize: data.user.preferences.sizes?.bottom || '',
            budgetMin: data.user.preferences.budgetRange?.[0]?.toString() || '',
            budgetMax: data.user.preferences.budgetRange?.[1]?.toString() || '',
          };
          console.log('⚙️ [PROFILE] Setting preferences:', prefs);
          setPreferences(prefs);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [PROFILE] Failed to fetch profile:', errorText);
      }
    } catch (error) {
      console.error('❌ [PROFILE] Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      console.log('⚠️ [PROFILE] No files selected');
      return;
    }

    let files = Array.from(e.target.files);
    const currentCount = profile?.photos?.length || 0;
    const remaining = Math.max(0, 5 - currentCount);
    if (files.length > remaining) {
      alert(`You can only add ${remaining} more photo${remaining !== 1 ? 's' : ''}. We'll upload the first ${remaining}.`);
      files = files.slice(0, remaining);
    }

    console.log(`📸 [PROFILE] Starting upload for ${files.length} file(s)`);
    files.forEach((file, i) => {
      console.log(`  File ${i + 1}: ${file.name} (${(file.size / 1024).toFixed(2)} KB, ${file.type})`);
    });
    
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`⬆️ [PROFILE] Uploading file ${i + 1}/${files.length}: ${file.name}`);
        
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        console.log(`📡 [PROFILE] Upload response status:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          const urlLength = data.url.length;
          console.log(`✅ [PROFILE] File uploaded successfully (URL length: ${urlLength} chars)`);
          uploadedUrls.push(data.url);
        } else {
          const errorText = await response.text();
          console.error(`❌ [PROFILE] Upload failed:`, errorText);
        }
      }

      console.log(`📦 [PROFILE] All uploads complete. Total URLs: ${uploadedUrls.length}`);

      // Add photos to profile
      console.log('💾 [PROFILE] Adding photos to user profile...');
      const updateResponse = await fetch('/api/user/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrls: uploadedUrls }),
      });

      console.log('📡 [PROFILE] Add photos response status:', updateResponse.status);
      
      if (updateResponse.ok) {
        const result = await updateResponse.json();
        console.log('✅ [PROFILE] Photos added to profile:', result);
        await fetchProfile();
      } else {
        const errorText = await updateResponse.text();
        console.error('❌ [PROFILE] Failed to add photos:', errorText);
        alert('Failed to add photos. Please try again.');
      }
    } catch (error) {
      console.error('❌ [PROFILE] Error during photo upload:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
      console.log('🏁 [PROFILE] Photo upload process complete');
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    const trimmed = (photoId || '').trim();
    console.log(`🗑️ [PROFILE] Removing photo: ${trimmed} (len=${trimmed.length})`);

    if (!trimmed) {
      console.error('❌ [PROFILE] Delete aborted: empty photo id');
      alert('Invalid photo. Please refresh and try again.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this photo?')) {
      console.log('⚠️ [PROFILE] Delete cancelled by user');
      return;
    }
    
    try {
      const encodedId = encodeURIComponent(trimmed);
      const response = await fetch(`/api/user/photos/${encodedId}`, {
        method: 'DELETE',
      });

      console.log('📡 [PROFILE] Delete response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ [PROFILE] Photo deleted successfully');
        console.log('✅ [PROFILE] Server response:', result);
        console.log('✅ [PROFILE] Rows affected:', result.rowsAffected);
        
        // Immediately update UI by filtering out the deleted photo
        if (profile) {
          console.log('🔄 [PROFILE] Current photos before filter:', profile.photos.map(p => p.id.substring(0, 8)));
          console.log('🔄 [PROFILE] Filtering out photoId:', trimmed.substring(0, 8));
          
          const updatedPhotos = profile.photos.filter(p => {
            const keep = p.id !== trimmed;
            console.log(`  Photo ${p.id.substring(0, 8)}: ${keep ? 'KEEP' : 'REMOVE'}`);
            return keep;
          });
          
          console.log('🔄 [PROFILE] Photos after filter:', updatedPhotos.map(p => p.id.substring(0, 8)));
          console.log('🔄 [PROFILE] Setting new profile state with', updatedPhotos.length, 'photos');
          
          setProfile({
            ...profile,
            photos: updatedPhotos,
          });
          
          console.log('✅ [PROFILE] State update triggered, remaining photos:', updatedPhotos.length);
        }
        
        // Also fetch fresh data from server to be sure
        console.log('🔄 [PROFILE] Fetching fresh profile data from server...');
        setTimeout(async () => {
          await fetchProfile();
          console.log('✅ [PROFILE] Server refresh complete');
        }, 100);
      } else {
        const errorText = await response.text();
        console.error('❌ [PROFILE] Delete failed:', errorText);
        try {
          const { message } = JSON.parse(errorText);
          alert(message || 'Failed to remove photo. Please try again.');
        } catch (jsonParseError) {
          console.error('❌ [PROFILE] Failed to parse error response as JSON:', jsonParseError);
          alert(`Failed to remove photo. ${errorText ? `Details: ${errorText.substring(0, 100)}${errorText.length > 100 ? '...' : ''}` : 'Please try again.'}`);
        }
      }
    } catch (error) {
      console.error('❌ [PROFILE] Error removing photo:', error);
      alert('Failed to remove photo. Please try again.');
    }
  };

  const handleReplacePhoto = async (photoId: string, file: File) => {
    try {
      setUploading(true);
      // 1) Upload file to get URL
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const t = await uploadRes.text();
        throw new Error(`Upload failed: ${t}`);
      }
      const { url } = await uploadRes.json();
      // 2) Replace the photo URL
      const putRes = await fetch(`/api/user/photos/${encodeURIComponent(photoId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!putRes.ok) {
        const t = await putRes.text();
        throw new Error(`Replace failed: ${t}`);
      }
      await fetchProfile();
    } catch (err) {
      console.error('❌ [PROFILE] Error replacing photo:', err);
      alert('Failed to replace photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    console.log(`⭐ [PROFILE] Setting photo as primary: ${photoId}`);
    try {
      const response = await fetch(`/api/user/photos/${photoId}/primary`, {
        method: 'PUT',
      });

      console.log('📡 [PROFILE] Set primary response status:', response.status);
      
      if (response.ok) {
        console.log('✅ [PROFILE] Primary photo updated');
        await fetchProfile();
      } else {
        const errorText = await response.text();
        console.error('❌ [PROFILE] Failed to set primary:', errorText);
      }
    } catch (error) {
      console.error('❌ [PROFILE] Error setting primary photo:', error);
    }
  };

  const handleSavePreferences = async () => {
    console.log('💾 [PROFILE] Saving preferences:', preferences);
    setSaving(true);
    try {
      const prefsData = {
        preferences: {
          sizes: {
            top: preferences.topSize,
            bottom: preferences.bottomSize,
          },
          budgetRange:
            preferences.budgetMin && preferences.budgetMax
              ? [parseInt(preferences.budgetMin), parseInt(preferences.budgetMax)]
              : undefined,
        },
      };
      
      console.log('📤 [PROFILE] Sending preferences:', prefsData);
      
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefsData),
      });

      console.log('📡 [PROFILE] Save preferences response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ [PROFILE] Preferences saved:', result);
        alert('Preferences saved successfully!');
        await fetchProfile();
      } else {
        const errorText = await response.text();
        console.error('❌ [PROFILE] Failed to save preferences:', errorText);
        alert('Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('❌ [PROFILE] Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
      console.log('🏁 [PROFILE] Save preferences complete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#8B5CF6]/5 to-white flex items-center justify-center relative overflow-hidden">
        {/* Noise Background */}
        <svg className="absolute inset-0 w-full h-full opacity-65 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise-profile-loading">
            <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise-profile-loading)"/>
        </svg>
        <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6] relative z-10" />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-white via-[#8B5CF6]/5 to-white p-4 pb-24 lg:pb-8 lg:pl-56 relative">
      {/* Noise Background - Fixed */}
      <div className="fixed inset-0 pointer-events-none z-0 lg:left-56">
        <svg className="w-full h-full opacity-65" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise-profile">
            <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise-profile)"/>
        </svg>
      </div>
      
      {/* Floating Gradient Orbs - Fixed */}
      <div className="fixed top-20 right-10 w-72 h-72 bg-[#8B5CF6]/10 rounded-full blur-3xl animate-pulse pointer-events-none z-0 lg:left-[calc(224px+10rem)]"></div>
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse pointer-events-none z-0 lg:left-[calc(224px+2.5rem)]" style={{animationDelay: '1s'}}></div>
      
      <div className="relative z-10">
      <div className="lg:px-6 lg:py-6 max-w-6xl space-y-4">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1A1A1A] mb-2 tracking-[-0.04em]">Profile & Settings</h1>
            <p className="text-sm text-[#5A5A5A] font-light">Manage your account and preferences</p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-1 tracking-[-0.04em]">Profile</h1>
            <p className="text-xs text-[#5A5A5A] font-light">Settings</p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>

        <div className="bg-white rounded-xl shadow-md border border-[#E8E8E6] p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#1A1A1A] mb-1 tracking-[-0.02em]">My Photos</h2>
              <p className="text-xs text-[#5A5A5A] font-light">Manage your photos for virtual try-on (max 5 photos)</p>
            </div>
              {profile?.photos && profile.photos.length < 5 && (
                <label className="inline-flex items-center gap-2 rounded-full bg-white border border-[#E8E8E6] px-3 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#FAFAF8] transition-all cursor-pointer shadow-sm">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3" />
                      Add Photos
                    </>
                  )}
                </label>
              )}
          </div>
          <div>
            {(!profile?.photos || profile.photos.length === 0) ? (
              <div className="text-center py-12">
                <Camera className="mx-auto h-16 w-16 text-[#E8E8E6] mb-4" />
                <p className="text-[#5A5A5A] mb-4 font-light">No photos yet. Upload photos for virtual try-on.</p>
                <label className="relative inline-flex items-center gap-2 bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 px-6 py-2.5 text-sm font-medium text-white rounded-xl cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5 overflow-hidden group transition-all"
                  style={{
                    background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.9), rgba(124, 58, 237, 0.9))',
                  }}
                >
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'linear-gradient(90deg, #8B5CF6, #7C3AED, #8B5CF6)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s linear infinite'
                    }}
                  ></div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin relative z-10" />
                      <span className="relative z-10">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 relative z-10" />
                      <span className="relative z-10">Upload Your First Photo</span>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-[#E8E8E6] group shadow-sm">
                      <img
                        src={photo.url}
                        alt="Profile photo"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          console.log('🖱️ [PROFILE] Delete button clicked for:', photo.id);
                          handleRemovePhoto(photo.id);
                        }}
                        className="absolute top-2 right-2 bg-white text-[#1A1A1A] rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition hover:scale-110 z-10 shadow-md border border-[#E8E8E6]"
                        title="Delete photo"
                      >
                        <X className="h-3 w-3" />
                      </button>

                      {/* Replace photo */}
                      <label className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm text-[#1A1A1A] text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer z-10 border border-[#E8E8E6] shadow-sm">
                        Replace
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleReplacePhoto(photo.id, f);
                          }}
                          disabled={uploading}
                        />
                      </label>

                      {photo.isPrimary ? (
                        <div className="absolute bottom-2 left-2 bg-[#1A1A1A] text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                          ⭐ Primary
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSetPrimary(photo.id)}
                          className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm text-[#1A1A1A] text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-white border border-[#E8E8E6] shadow-sm"
                          title="Set as primary"
                        >
                          Set Primary
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {profile.photos.length < 5 && (
                    <label className="aspect-square border-2 border-dashed border-[#E8E8E6] rounded-lg flex flex-col items-center justify-center hover:border-[#1A1A1A] hover:bg-[#FAFAF8] transition-all cursor-pointer shadow-sm">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <>
                          <Loader2 className="h-8 w-8 text-[#8A8A8A] animate-spin mb-2" />
                          <span className="text-xs text-[#5A5A5A] font-light">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="h-8 w-8 text-[#8A8A8A] mb-2" />
                          <span className="text-xs text-[#5A5A5A] font-light">Add Photo</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
                <p className="text-xs text-[#5A5A5A] font-light">
                  💡 Tip: Hover over photos to delete or set as primary. You can upload up to {5 - profile.photos.length} more photo{5 - profile.photos.length !== 1 ? 's' : ''}.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-[#E8E8E6] p-4">
          <h2 className="text-lg font-serif font-bold text-[#1A1A1A] mb-1 tracking-[-0.02em]">Style Preferences</h2>
          <p className="text-xs text-[#5A5A5A] mb-4 font-light">Update your sizing and preferences</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="topSize" className="text-xs font-medium text-[#1A1A1A]">Top Size</Label>
                <Input
                  id="topSize"
                  value={preferences.topSize}
                  onChange={(e) => setPreferences({ ...preferences, topSize: e.target.value })}
                  placeholder="S, M, L, XL"
                  className="mt-2 rounded-full border border-[#E8E8E6] focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 transition-all shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="bottomSize" className="text-xs font-medium text-[#1A1A1A]">Bottom Size</Label>
                <Input
                  id="bottomSize"
                  value={preferences.bottomSize}
                  onChange={(e) => setPreferences({ ...preferences, bottomSize: e.target.value })}
                  placeholder="28, 30, 32"
                  className="mt-2 rounded-full border border-[#E8E8E6] focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 transition-all shadow-sm"
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
                  className="rounded-full border border-[#E8E8E6] focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 transition-all shadow-sm"
                />
                <Input
                  value={preferences.budgetMax}
                  onChange={(e) => setPreferences({ ...preferences, budgetMax: e.target.value })}
                  placeholder="Max ($)"
                  type="number"
                  className="rounded-full border border-[#E8E8E6] focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10 transition-all shadow-sm"
                />
              </div>
            </div>
            <button 
              onClick={handleSavePreferences} 
              disabled={saving} 
              className="relative rounded-xl bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 px-5 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 overflow-hidden group"
              style={{
                background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.9), rgba(124, 58, 237, 0.9))',
              }}
            >
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(90deg, #8B5CF6, #7C3AED, #8B5CF6)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite'
                }}
              ></div>
              {saving ? (
                <>
                  <Loader2 className="inline mr-2 h-3 w-3 animate-spin relative z-10" />
                  <span className="relative z-10">Saving...</span>
                </>
              ) : (
                <span className="relative z-10">Save Changes</span>
              )}
            </button>
          </div>
        </div>

      </div>
      </div>
    </div>
    <Navigation />
    </>
  );
}
