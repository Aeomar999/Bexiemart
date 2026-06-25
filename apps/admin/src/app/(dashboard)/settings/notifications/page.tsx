"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { toast } from "sonner";

export default function NotificationSettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [vendorAlerts, setVendorAlerts] = useState(true);
  
  const [isPending, setIsPending] = useState(false);

  const handleSave = () => {
    setIsPending(true);
    // Simulate API call for now, since notification preferences might not be fully supported in the backend yet
    setTimeout(() => {
      setIsPending(false);
      toast.success("Notification preferences updated successfully");
    }, 800);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to be notified about activity on the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Delivery Channels</h3>
            
            <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-md">
              <div>
                <p className="font-medium text-[var(--color-text)]">Email Notifications</p>
                <p className="text-sm text-[var(--color-text-muted)]">Receive daily summaries and critical alerts via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={emailAlerts}
                  onChange={() => setEmailAlerts(!emailAlerts)}
                />
                <div className="w-11 h-6 bg-[var(--color-bg-hover)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-md">
              <div>
                <p className="font-medium text-[var(--color-text)]">Push Notifications</p>
                <p className="text-sm text-[var(--color-text-muted)]">Receive real-time alerts in your browser</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={pushAlerts}
                  onChange={() => setPushAlerts(!pushAlerts)}
                />
                <div className="w-11 h-6 bg-[var(--color-bg-hover)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
              </label>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Alert Types</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">New High-Value Orders</p>
                <p className="text-xs text-[var(--color-text-muted)]">Get notified when orders over 1000 GHS are placed</p>
              </div>
              <input 
                type="checkbox" 
                checked={orderAlerts}
                onChange={() => setOrderAlerts(!orderAlerts)}
                className="w-4 h-4 text-[var(--color-primary)] bg-[var(--color-bg)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary)]"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">New Vendor Registrations</p>
                <p className="text-xs text-[var(--color-text-muted)]">Get notified when a new vendor requires approval</p>
              </div>
              <input 
                type="checkbox" 
                checked={vendorAlerts}
                onChange={() => setVendorAlerts(!vendorAlerts)}
                className="w-4 h-4 text-[var(--color-primary)] bg-[var(--color-bg)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-2">
        <Button onClick={handleSave} isLoading={isPending} disabled={isPending}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
