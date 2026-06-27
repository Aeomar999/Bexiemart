"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { useConfig, useUpdateConfig } from "../../../../lib/hooks/use-config";
import { Skeleton } from "../../../../components/ui/Skeleton";

export default function PlatformSettingsPage() {
  const { data: config, isLoading } = useConfig();

  if (isLoading || !config) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Configuration</CardTitle>
            <CardDescription>Manage global settings for the BexieMart platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return <PlatformSettingsForm config={config} />;
}

function PlatformSettingsForm({ config }: { config: any }) {
  const { mutate: updateConfig, isPending } = useUpdateConfig();

  const [commissionRate, setCommissionRate] = useState(config.commissionRate?.toString() || "0.05");
  const [taxRate, setTaxRate] = useState(config.taxRate?.toString() || "0.075");
  const [withdrawalFeeFlat, setWithdrawalFeeFlat] = useState(config.withdrawalFeeFlat?.toString() || "2.00");
  const [minTopup, setMinTopup] = useState(config.minTopup?.toString() || "5.00");
  const [maxTopup, setMaxTopup] = useState(config.maxTopup?.toString() || "5000.00");
  const [minWithdrawal, setMinWithdrawal] = useState(config.minWithdrawal?.toString() || "10.00");
  const [dailyWithdrawalLimit, setDailyWithdrawalLimit] = useState(config.dailyWithdrawalLimit?.toString() || "5000.00");

  const handleSave = () => {
    updateConfig({
      commissionRate: Number(commissionRate),
      taxRate: Number(taxRate),
      withdrawalFeeFlat: Number(withdrawalFeeFlat),
      minTopup: Number(minTopup),
      maxTopup: Number(maxTopup),
      minWithdrawal: Number(minWithdrawal),
      dailyWithdrawalLimit: Number(dailyWithdrawalLimit),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Configuration</CardTitle>
          <CardDescription>Manage global settings for the BexieMart platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Commission Rate (Decimal)</label>
              <Input 
                type="number" 
                step="0.01"
                value={commissionRate} 
                onChange={(e) => setCommissionRate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Tax Rate (Decimal)</label>
              <Input 
                type="number" 
                step="0.001"
                value={taxRate} 
                onChange={(e) => setTaxRate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Flat Withdrawal Fee (GHS)</label>
              <Input 
                type="number" 
                value={withdrawalFeeFlat} 
                onChange={(e) => setWithdrawalFeeFlat(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Minimum Topup (GHS)</label>
              <Input 
                type="number" 
                value={minTopup} 
                onChange={(e) => setMinTopup(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Maximum Topup (GHS)</label>
              <Input 
                type="number" 
                value={maxTopup} 
                onChange={(e) => setMaxTopup(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Minimum Withdrawal (GHS)</label>
              <Input 
                type="number" 
                value={minWithdrawal} 
                onChange={(e) => setMinWithdrawal(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Daily Withdrawal Limit (GHS)</label>
              <Input 
                type="number" 
                value={dailyWithdrawalLimit} 
                onChange={(e) => setDailyWithdrawalLimit(e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-2">
        <Button onClick={handleSave} isLoading={isPending} disabled={isPending}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
