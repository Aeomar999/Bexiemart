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

  // Delivery pricing knobs
  const [deliveryBaseFare, setDeliveryBaseFare] = useState("5.00");
  const [deliveryPerKm, setDeliveryPerKm] = useState("1.50");
  const [deliveryPerMin, setDeliveryPerMin] = useState("0.20");
  const [deliveryMinFee, setDeliveryMinFee] = useState("6.00");
  const [deliveryCommissionRate, setDeliveryCommissionRate] = useState("0.20");
  const [deliverySurgeMultiplier, setDeliverySurgeMultiplier] = useState("1.00");
  const [deliveryBikeMultiplier, setDeliveryBikeMultiplier] = useState("1.00");
  const [deliveryCarMultiplier, setDeliveryCarMultiplier] = useState("1.60");
  const [deliveryVanMultiplier, setDeliveryVanMultiplier] = useState("2.20");

  useEffect(() => {
    if (config) {
      setCommissionRate(config.commissionRate?.toString() || "0.05");
      setTaxRate(config.taxRate?.toString() || "0.075");
      setWithdrawalFeeFlat(config.withdrawalFeeFlat?.toString() || "2.00");
      setMinTopup(config.minTopup?.toString() || "5.00");
      setMaxTopup(config.maxTopup?.toString() || "5000.00");
      setMinWithdrawal(config.minWithdrawal?.toString() || "10.00");
      setDailyWithdrawalLimit(config.dailyWithdrawalLimit?.toString() || "5000.00");
      setDeliveryBaseFare(config.deliveryBaseFare?.toString() ?? "5.00");
      setDeliveryPerKm(config.deliveryPerKm?.toString() ?? "1.50");
      setDeliveryPerMin(config.deliveryPerMin?.toString() ?? "0.20");
      setDeliveryMinFee(config.deliveryMinFee?.toString() ?? "6.00");
      setDeliveryCommissionRate(config.deliveryCommissionRate?.toString() ?? "0.20");
      setDeliverySurgeMultiplier(config.deliverySurgeMultiplier?.toString() ?? "1.00");
      setDeliveryBikeMultiplier(config.deliveryBikeMultiplier?.toString() ?? "1.00");
      setDeliveryCarMultiplier(config.deliveryCarMultiplier?.toString() ?? "1.60");
      setDeliveryVanMultiplier(config.deliveryVanMultiplier?.toString() ?? "2.20");
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
      deliveryBaseFare: Number(deliveryBaseFare),
      deliveryPerKm: Number(deliveryPerKm),
      deliveryPerMin: Number(deliveryPerMin),
      deliveryMinFee: Number(deliveryMinFee),
      deliveryCommissionRate: Number(deliveryCommissionRate),
      deliverySurgeMultiplier: Number(deliverySurgeMultiplier),
      deliveryBikeMultiplier: Number(deliveryBikeMultiplier),
      deliveryCarMultiplier: Number(deliveryCarMultiplier),
      deliveryVanMultiplier: Number(deliveryVanMultiplier),
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
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Pricing</CardTitle>
              <CardDescription>
                Distance-based fare for all deliveries. customerFee = max(min fee, (base + per-km·km +
                per-min·min) × vehicle × surge). Commission is Bexiemart&apos;s cut of that fee.
              </CardDescription>
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
                    <label className="text-sm font-medium text-[var(--color-text)]">Base Fare (GHS)</label>
                    <Input type="number" step="0.5" value={deliveryBaseFare} onChange={(e) => setDeliveryBaseFare(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Per Kilometre (GHS)</label>
                    <Input type="number" step="0.1" value={deliveryPerKm} onChange={(e) => setDeliveryPerKm(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Per Minute (GHS)</label>
                    <Input type="number" step="0.05" value={deliveryPerMin} onChange={(e) => setDeliveryPerMin(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Minimum Fee (GHS)</label>
                    <Input type="number" step="0.5" value={deliveryMinFee} onChange={(e) => setDeliveryMinFee(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Commission Rate (Decimal)</label>
                    <Input type="number" step="0.01" value={deliveryCommissionRate} onChange={(e) => setDeliveryCommissionRate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Surge Multiplier</label>
                    <Input type="number" step="0.1" value={deliverySurgeMultiplier} onChange={(e) => setDeliverySurgeMultiplier(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Bike Multiplier</label>
                    <Input type="number" step="0.1" value={deliveryBikeMultiplier} onChange={(e) => setDeliveryBikeMultiplier(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Car Multiplier</label>
                    <Input type="number" step="0.1" value={deliveryCarMultiplier} onChange={(e) => setDeliveryCarMultiplier(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-text)]">Van Multiplier</label>
                    <Input type="number" step="0.1" value={deliveryVanMultiplier} onChange={(e) => setDeliveryVanMultiplier(e.target.value)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="pt-2">
            <Button onClick={handleSave} isLoading={isPending} disabled={isPending}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
