import React from "react";
import { formatMoney } from "../../lib/money";

export interface BalanceCardProps {
  label: string;
  available: number;
  held?: { label: string; amount: number; info?: string };
  footnote?: string;
}

// Web mirror of the mobile BalanceCard contract (docs/DESIGN-SYSTEM.md §0).
// Read-only: admins always see figures, so no hide toggle and no actions.
export function BalanceCard({ label, available, held, footnote }: BalanceCardProps) {
  const heldAmount = held?.amount ?? 0;
  const empty = available + heldAmount <= 0;

  return (
    <section
      aria-label={label}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 text-[var(--color-text)]"
    >
      <p className="text-xs font-bold text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 flex items-baseline gap-1 font-heading font-extrabold text-[var(--color-primary)] tabular-nums">
        <span className="text-base">GHS</span>
        <span className="text-3xl" data-testid="balance-amount">
          {formatMoney(available, "")}
        </span>
      </p>

      {held && (
        <>
          <div className="mt-4 flex h-1.5 gap-0.5" aria-hidden="true">
            {empty ? (
              <div data-testid="bar-empty" className="flex-1 rounded-full bg-[var(--color-border)]" />
            ) : (
              <>
                {available > 0 && (
                  <div
                    data-testid="bar-available"
                    className="rounded-full bg-[var(--color-primary)]"
                    style={{ flexGrow: available, flexBasis: 0 }}
                  />
                )}
                {heldAmount > 0 && (
                  <div
                    data-testid="bar-held"
                    className="rounded-full bg-[var(--color-money-held)]"
                    style={{ flexGrow: heldAmount, flexBasis: 0 }}
                  />
                )}
              </>
            )}
          </div>
          <dl className="mt-3 text-sm">
            <div className="flex justify-between py-2">
              <dt className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                Available
              </dt>
              <dd className="font-bold tabular-nums">{formatMoney(available)}</dd>
            </div>
            <div className="flex justify-between border-t border-[var(--color-border)] py-2">
              <dt
                className="flex items-center gap-2 text-[var(--color-text-secondary)]"
                title={held.info}
              >
                <span className="h-2 w-2 rounded-full bg-[var(--color-money-held)]" />
                {held.label}
              </dt>
              <dd className="font-bold tabular-nums">{formatMoney(heldAmount)}</dd>
            </div>
          </dl>
        </>
      )}

      {footnote && <p className="mt-2 text-xs text-[var(--color-text-muted)]">{footnote}</p>}
    </section>
  );
}
