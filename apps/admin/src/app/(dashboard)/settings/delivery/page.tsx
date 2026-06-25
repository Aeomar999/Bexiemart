"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { useConfig, useUpdateConfig } from "../../../../lib/hooks/use-config";
import { Skeleton } from "../../../../components/ui/Skeleton";

export default function DeliverySettingsPage() {
  const { data: config, isLoading } = useConfig();

  if (isLoading || !config) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Pricing</CardTitle>
            <CardDescription>
              Distance-based fare for all deliveries. customerFee = max(min fee, (base + per-km·km +
              per-min·min) × vehicle × surge). Commission is Bexiemart&apos;s cut of that fee.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return <DeliverySettingsForm config={config} />;
}

function DeliverySettingsForm({ config }: { config: any }) {
  const { mutate: updateConfig, isPending } = useUpdateConfig();

  const [deliveryBaseFare, setDeliveryBaseFare] = useState(config.deliveryBaseFare?.toString() ?? "5.00");
  const [deliveryPerKm, setDeliveryPerKm] = useState(config.deliveryPerKm?.toString() ?? "1.50");
  const [deliveryPerMin, setDeliveryPerMin] = useState(config.deliveryPerMin?.toString() ?? "0.20");
  const [deliveryMinFee, setDeliveryMinFee] = useState(config.deliveryMinFee?.toString() ?? "6.00");
  const [deliveryCommissionRate, setDeliveryCommissionRate] = useState(config.deliveryCommissionRate?.toString() ?? "0.20");
  const [deliverySurgeMultiplier, setDeliverySurgeMultiplier] = useState(config.deliverySurgeMultiplier?.toString() ?? "1.00");
  const [deliveryBikeMultiplier, setDeliveryBikeMultiplier] = useState(config.deliveryBikeMultiplier?.toString() ?? "1.00");
  const [deliveryCarMultiplier, setDeliveryCarMultiplier] = useState(config.deliveryCarMultiplier?.toString() ?? "1.60");
  const [deliveryVanMultiplier, setDeliveryVanMultiplier] = useState(config.deliveryVanMultiplier?.toString() ?? "2.20");

  const handleSave = () => {
    updateConfig({
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Delivery Pricing</CardTitle>
          <CardDescription>
            Distance-based fare for all deliveries. customerFee = max(min fee, (base + per-km·km +
            per-min·min) × vehicle × surge). Commission is Bexiemart&apos;s cut of that fee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Base Fare (GHS)</label>
              <Input type="number" step="0.5" value={deliveryBaseFare} onChange={(e) => setDeliveryBaseFare(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Per Kilometre (GHS)</label>
              <Input type="number" step="0.1" value={deliveryPerKm} onChange={(e) => setDeliveryPerKm(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Per Minute (GHS)</label>
              <Input type="number" step="0.05" value={deliveryPerMin} onChange={(e) => setDeliveryPerMin(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Minimum Fee (GHS)</label>
              <Input type="number" step="0.5" value={deliveryMinFee} onChange={(e) => setDeliveryMinFee(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Commission Rate (Decimal)</label>
              <Input type="number" step="0.01" value={deliveryCommissionRate} onChange={(e) => setDeliveryCommissionRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Surge Multiplier</label>
              <Input type="number" step="0.1" value={deliverySurgeMultiplier} onChange={(e) => setDeliverySurgeMultiplier(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Bike Multiplier</label>
              <Input type="number" step="0.1" value={deliveryBikeMultiplier} onChange={(e) => setDeliveryBikeMultiplier(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Car Multiplier</label>
              <Input type="number" step="0.1" value={deliveryCarMultiplier} onChange={(e) => setDeliveryCarMultiplier(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--color-text)">Van Multiplier</label>
              <Input type="number" step="0.1" value={deliveryVanMultiplier} onChange={(e) => setDeliveryVanMultiplier(e.target.value)} />
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
