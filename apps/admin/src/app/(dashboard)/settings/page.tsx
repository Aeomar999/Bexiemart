"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useConfig, useUpdateConfig } from "../../../lib/hooks/use-config";
import { Skeleton } from "../../../components/ui/Skeleton";

export default function SettingsPage() {
  const { data: config, isLoading } = useConfig();
  const { mutate: updateConfig, isPending } = useUpdateConfig();

  const [commissionRate, setCommissionRate] = useState("0.05");
  const [taxRate, setTaxRate] = useState("0.075");
  const [withdrawalFeeFlat, setWithdrawalFeeFlat] = useState("2.00");
  const [minTopup, setMinTopup] = useState("5.00");
  const [maxTopup, setMaxTopup] = useState("5000.00");
  const [minWithdrawal, setMinWithdrawal] = useState("10.00");
  const [dailyWithdrawalLimit, setDailyWithdrawalLimit] = useState("5000.00");

  useEffect(() => {
    if (config) {
      setCommissionRate(config.commissionRate?.toString() || "0.05");
      setTaxRate(config.taxRate?.toString() || "0.075");
      setWithdrawalFeeFlat(config.withdrawalFeeFlat?.toString() || "2.00");
      setMinTopup(config.minTopup?.toString() || "5.00");
      setMaxTopup(config.maxTopup?.toString() || "5000.00");
      setMinWithdrawal(config.minWithdrawal?.toString() || "10.00");
      setDailyWithdrawalLimit(config.dailyWithdrawalLimit?.toString() || "5000.00");
    }
  }, [config]);

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
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Settings</h1>
        </div>

        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Configuration</CardTitle>
              <CardDescription>Manage global settings for the BexieMart platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Commission Rate (Decimal)</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={commissionRate} 
                      onChange={(e) => setCommissionRate(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Tax Rate (Decimal)</label>
                    <Input 
                      type="number" 
                      step="0.001"
                      value={taxRate} 
                      onChange={(e) => setTaxRate(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Flat Withdrawal Fee (GHS)</label>
                    <Input 
                      type="number" 
                      value={withdrawalFeeFlat} 
                      onChange={(e) => setWithdrawalFeeFlat(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Minimum Topup (GHS)</label>
                    <Input 
                      type="number" 
                      value={minTopup} 
                      onChange={(e) => setMinTopup(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Maximum Topup (GHS)</label>
                    <Input 
                      type="number" 
                      value={maxTopup} 
                      onChange={(e) => setMaxTopup(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Minimum Withdrawal (GHS)</label>
                    <Input 
                      type="number" 
                      value={minWithdrawal} 
                      onChange={(e) => setMinWithdrawal(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Daily Withdrawal Limit (GHS)</label>
                    <Input 
                      type="number" 
                      value={dailyWithdrawalLimit} 
                      onChange={(e) => setDailyWithdrawalLimit(e.target.value)} 
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 pt-4">
                    <Button onClick={handleSave} isLoading={isPending} disabled={isPending}>Save Changes</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
