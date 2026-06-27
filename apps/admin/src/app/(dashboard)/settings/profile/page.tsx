"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { useAuthStore } from "../../../../lib/stores/auth-store";
import { useUpdateProfile, useUploadAvatar } from "../../../../lib/hooks/use-profile";
import { User, Upload, Loader2 } from "lucide-react";
import { Skeleton } from "../../../../components/ui/Skeleton";

export default function ProfileSettingsPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return <ProfileSettingsForm user={user} />;
}

function ProfileSettingsForm({ user }: { user: any }) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutateAsync: uploadAvatar, isPending: isUploading } = useUploadAvatar();

  const [name, setName] = useState(user.name || "");
  const [image, setImage] = useState(user.image || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateProfile(
      { name, image },
      {
        onSuccess: () => {
          // Update the local auth store so the header reflects changes immediately
          if (user && token) {
            setAuth({ ...user, name, image } as any, token);
          }
        },
      }
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadAvatar(file);
      if (result && result.url) {
        setImage(result.url);
      }
    } catch (err) {
      console.error("Avatar upload failed", err);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Update your personal information and avatar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="h-24 w-24 rounded-full bg-(--color-bg) border-2 border-dashed border-(--color-border) flex items-center justify-center overflow-hidden relative">
                {image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={image} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-(--color-text-muted)" />
                )}
                
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
                
                {!isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="h-5 w-5 text-white mb-1" />
                    <span className="text-white text-[10px] font-medium">Change</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp" 
                onChange={handleFileChange}
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-(--color-text)">Profile Picture</h3>
              <p className="text-sm text-(--color-text-muted)">
                We support PNGs, JPEGs and WebP under 5MB
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Full Name</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Email Address</label>
              <Input 
                value={user?.email || ""} 
                disabled 
                className="bg-(--color-bg-hover) text-(--color-text-muted) cursor-not-allowed"
                title="Email addresses cannot be changed here."
              />
              <p className="text-xs text-(--color-text-muted) mt-1">
                Your email is used for login and cannot be changed directly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-2">
        <Button onClick={handleSave} isLoading={isUpdating} disabled={isUpdating || isUploading}>
          Save Profile
        </Button>
      </div>
    </div>
  );
}
