"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { useUpdatePassword } from "../../../../lib/hooks/use-profile";

export default function SecuritySettingsPage() {
  const { mutate: updatePassword, isPending } = useUpdatePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    setError("");
    
    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    updatePassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password to keep it secure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          {error && (
            <div className="p-3 text-sm text-white bg-[var(--color-error)] rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text)]">Current Password</label>
            <Input 
              type="password"
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text)]">New Password</label>
            <Input 
              type="password"
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text)]">Confirm New Password</label>
            <Input 
              type="password"
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="••••••••"
            />
          </div>
        </CardContent>
      </Card>

      <div className="pt-2">
        <Button onClick={handleSave} isLoading={isPending} disabled={isPending}>
          Update Password
        </Button>
      </div>
    </div>
  );
}
