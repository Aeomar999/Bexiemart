"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useDispute,
  useDisputeSupportTicket,
  useEnsureDisputeSupportTicket,
  useResolveDispute,
  useSendSupportTicketMessage,
} from "../../../../lib/hooks/use-disputes";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../../../../components/ui/Card";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { formatCurrency } from "../../../../lib/utils";
import { ConfirmModal } from "../../../../components/ui/ConfirmModal";
import { CardSkeleton } from "../../../../components/ui/Skeleton";
import { useAuthStore } from "../../../../lib/stores/auth-store";
import { Loader2, MessageSquare, SendHorizonal } from "lucide-react";

interface DisputeSupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  user: { id: string; name?: string | null; email?: string | null };
  conversation: {
    id: string;
    messages: Array<{
      id: string;
      content?: string | null;
      type: string;
      mediaUrl?: string | null;
      createdAt: string;
      sender: { id: string; name?: string | null; email?: string | null };
    }>;
  };
}

function formatChatTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DisputeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const disputeId = id as string;
  const user = useAuthStore((state: { user: { id: string } | null }) => state.user);
  
  const { data: dispute, isLoading } = useDispute(disputeId);
  const { data: supportTicket, isLoading: isLoadingSupportTicket } = useDisputeSupportTicket(disputeId);
  const { mutate: ensureSupportTicket, isPending: isEnsuringSupportTicket } = useEnsureDisputeSupportTicket();
  const { mutate: sendSupportMessage, isPending: isSendingSupportMessage } = useSendSupportTicketMessage(disputeId);
  const { mutate: resolveDispute, isPending: isResolving } = useResolveDispute();
  
  const [resolutionAction, setResolutionAction] = useState<"REFUND" | "RELEASE" | "">("");
  const [resolutionReason, setResolutionReason] = useState("");
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" disabled>&larr; Back</Button>
            <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-surface-200)]"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dispute) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full items-center justify-center space-y-4">
          <p className="text-[var(--color-text-muted)]">Dispute not found.</p>
          <Button onClick={() => router.push("/disputes")}>Back to Disputes</Button>
        </div>
      </DashboardLayout>
    );
  }

  const confirmResolution = () => {
    if (!resolutionAction || !resolutionReason.trim()) return;
    resolveDispute({ 
      id: dispute.id, 
      action: resolutionAction as "REFUND" | "RELEASE", 
      reason: resolutionReason 
    }, {
      onSuccess: () => setIsResolveModalOpen(false)
    });
  };

  const ticket = supportTicket as DisputeSupportTicket | null | undefined;

  const handleSendSupportMessage = () => {
    if (!ticket?.id || !supportMessage.trim()) return;

    sendSupportMessage(
      { ticketId: ticket.id, content: supportMessage.trim() },
      {
        onSuccess: () => setSupportMessage(""),
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/disputes")}>
              &larr; Back
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Dispute: Escrow #{dispute.id.slice(0, 8)}
            </h1>
            <Badge 
              variant={
                dispute.status === "REFUNDED" ? "error" : 
                dispute.status === "DISPUTED" ? "warning" : "success"
              }
            >
              {dispute.status}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Escrow/Dispute Information */}
          <Card>
            <CardHeader>
              <CardTitle>Escrow Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)]">Total Amount (Paid by Customer)</span>
                  <span className="font-bold">{formatCurrency(dispute.amount)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)]">Vendor Net Amount</span>
                  <span className="font-medium text-[var(--color-primary)]">{formatCurrency(dispute.netAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)]">Platform Commission</span>
                  <span className="font-medium text-[var(--color-text-secondary)]">{formatCurrency(dispute.commission)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[var(--color-text-muted)]">Created At</span>
                  <span>{new Date(dispute.createdAt).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Details Quick Link */}
            <Card>
              <CardHeader>
                <CardTitle>Related Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--color-text-muted)]">Order ID</p>
                  <p className="font-medium">{dispute.orderId}</p>
                </div>
                <div>
                  <Button variant="outline" onClick={() => router.push(`/orders/${dispute.orderId}`)}>
                    View Full Order Details &rarr;
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-full">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Support Chat
                    </CardTitle>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Message the customer with this dispute and order context attached.
                    </p>
                  </div>
                  {ticket && (
                    <div className="flex items-center gap-2">
                      <Badge variant={ticket.status === "OPEN" ? "warning" : "success"}>
                        {ticket.status}
                      </Badge>
                      <span className="rounded-full bg-[var(--color-surface-100)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
                        {ticket.priority}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingSupportTicket ? (
                  <div className="flex items-center justify-center rounded-md border border-dashed border-[var(--color-border)] py-10 text-sm text-[var(--color-text-muted)]">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading support chat...
                  </div>
                ) : !ticket ? (
                  <div className="rounded-md border border-dashed border-[var(--color-border)] p-5">
                    <p className="text-sm font-medium text-[var(--color-text)]">No support chat yet.</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Open one to keep all dispute messages in a tracked support ticket.
                    </p>
                    <Button
                      className="mt-4 gap-2"
                      variant="outline"
                      isLoading={isEnsuringSupportTicket}
                      onClick={() => ensureSupportTicket(dispute.id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Open Support Chat
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          {ticket.user.name || ticket.user.email || "Customer"}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Ticket #{ticket.id.slice(0, 8)} for {ticket.subject}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={isEnsuringSupportTicket}
                        onClick={() => ensureSupportTicket(dispute.id)}
                      >
                        Refresh
                      </Button>
                    </div>

                    <div className="max-h-90 min-h-64 space-y-3 overflow-y-auto rounded-md border border-[var(--color-border)] bg-white p-4 dark:bg-slate-950/30">
                      {ticket.conversation.messages.length === 0 ? (
                        <div className="flex h-40 items-center justify-center text-sm text-[var(--color-text-muted)]">
                          No messages have been sent yet.
                        </div>
                      ) : (
                        ticket.conversation.messages.map((message) => {
                          const isMine = message.sender.id === user?.id;
                          return (
                            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm md:max-w-[70%] ${
                                  isMine
                                    ? "bg-[var(--color-primary)] text-white"
                                    : "bg-[var(--color-surface-100)] text-[var(--color-text)]"
                                }`}
                              >
                                <div className="mb-1 text-[11px] font-medium opacity-80">
                                  {message.sender.name || message.sender.email || "Support"}
                                </div>
                                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                                <div
                                  className={`mt-1 text-[10px] ${
                                    isMine ? "text-white/70" : "text-[var(--color-text-muted)]"
                                  }`}
                                >
                                  {formatChatTime(message.createdAt)}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <textarea
                        className="min-h-24 flex-1 resize-none rounded-md border border-[var(--color-border)] bg-white p-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] dark:bg-slate-900"
                        placeholder="Type a support reply..."
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                      />
                      <Button
                        className="gap-2 sm:h-11"
                        disabled={!supportMessage.trim() || isSendingSupportMessage}
                        isLoading={isSendingSupportMessage}
                        onClick={handleSendSupportMessage}
                      >
                        <SendHorizonal className="h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Resolution Action Card */}
            {dispute.status === "DISPUTED" && (
              <Card className="col-span-full border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
                <CardHeader>
                  <CardTitle className="text-red-700 dark:text-red-400">Resolve Dispute</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Select Resolution Action:</p>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-slate-900 p-3 rounded-md border border-[var(--color-border)]">
                        <input 
                          type="radio" 
                          name="resolutionAction" 
                          value="REFUND" 
                          checked={resolutionAction === "REFUND"} 
                          onChange={() => setResolutionAction("REFUND")}
                          className="w-4 h-4 text-red-600"
                        />
                        <span>Refund Customer ({formatCurrency(dispute.amount)})</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-slate-900 p-3 rounded-md border border-[var(--color-border)]">
                        <input 
                          type="radio" 
                          name="resolutionAction" 
                          value="RELEASE" 
                          checked={resolutionAction === "RELEASE"} 
                          onChange={() => setResolutionAction("RELEASE")}
                          className="w-4 h-4 text-green-600"
                        />
                        <span>Release to Vendor ({formatCurrency(dispute.netAmount)})</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Resolution Notes (Required):</label>
                  <textarea
                    className="w-full h-24 p-3 rounded-md border border-[var(--color-border)] bg-white dark:bg-slate-900 text-[var(--color-text)] resize-none"
                    placeholder="Provide a detailed reason for this resolution..."
                    value={resolutionReason}
                    onChange={(e) => setResolutionReason(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="primary" 
                  disabled={isResolving || !resolutionAction || !resolutionReason.trim()}
                  onClick={() => setIsResolveModalOpen(true)}
                  className="w-full md:w-auto"
                >
                  Confirm Resolution
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* If already resolved, show the resolution */}
          {dispute.status !== "DISPUTED" && (
            <Card className="col-span-full border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-400">Dispute Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This escrow has been <strong>{dispute.status}</strong>.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        onConfirm={confirmResolution}
        title={`Confirm ${resolutionAction === "REFUND" ? "Refund" : "Release"}`}
        description={
          resolutionAction === "REFUND" 
            ? "Are you sure you want to refund this amount to the customer? This action is irreversible."
            : "Are you sure you want to release these funds to the vendor? This action is irreversible."
        }
        confirmText={resolutionAction === "REFUND" ? "Yes, Refund" : "Yes, Release"}
        variant={resolutionAction === "REFUND" ? "danger" : "default"}
        isLoading={isResolving}
      />
    </DashboardLayout>
  );
}
