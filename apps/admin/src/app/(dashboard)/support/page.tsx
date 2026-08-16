"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Circle, SendHorizonal, ArrowLeft, Loader2 } from "lucide-react";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { apiClient } from "../../../lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { useAuthStore } from "../../../lib/stores/auth-store";

interface SupportTicketSummary {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  user: { id: string; name?: string | null; email?: string | null };
  conversation: { id: string; updatedAt: string };
}

interface SupportTicketDetail extends SupportTicketSummary {
  agent?: { id: string; name?: string | null; email?: string | null } | null;
  conversation: {
    id: string;
    updatedAt: string;
    participants: Array<{ user: { id: string; name?: string | null; email?: string | null } }>;
    messages: Array<{
      id: string;
      content?: string | null;
      type: string;
      createdAt: string;
      sender: { id: string; name?: string | null; email?: string | null };
    }>;
  };
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-amber-500/10 text-amber-600",
  ASSIGNED: "bg-sky-500/10 text-sky-600",
  IN_PROGRESS: "bg-violet-500/10 text-violet-600",
  RESOLVED: "bg-emerald-500/10 text-emerald-600",
  CLOSED: "bg-slate-500/10 text-slate-600",
};

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: "bg-rose-500/10 text-rose-600",
  HIGH: "bg-orange-500/10 text-orange-600",
  NORMAL: "bg-slate-500/10 text-slate-600",
  LOW: "bg-emerald-500/10 text-emerald-600",
};

function formatTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SupportPage() {
  return (
    <DashboardLayout>
      <SupportPageContent />
    </DashboardLayout>
  );
}

function SupportPageContent() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state: { user: { id: string } | null }) => state.user);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin", "support", "tickets"],
    queryFn: async () => {
      const response = await apiClient.get<SupportTicketSummary[]>("/support/admin/tickets");
      return response.data;
    },
  });

  const { data: activeTicket, isFetching: isLoadingTicket } = useQuery({
    queryKey: ["admin", "support", "tickets", activeTicketId],
    queryFn: async () => {
      if (!activeTicketId) return null;
      const response = await apiClient.get<SupportTicketDetail>(`/support/admin/tickets/${activeTicketId}`);
      return response.data;
    },
    enabled: !!activeTicketId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      const response = await apiClient.post(`/support/admin/tickets/${ticketId}/messages`, {
        content,
        type: "TEXT",
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "tickets", variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
    },
  });

  useEffect(() => {
    if (!activeTicketId && tickets[0]?.id) {
      setActiveTicketId(tickets[0].id);
    }
  }, [activeTicketId, tickets]);

  const currentTicket = useMemo(() => {
    if (!activeTicketId) return null;
    return tickets.find((ticket: SupportTicketSummary) => ticket.id === activeTicketId) || null;
  }, [activeTicketId, tickets]);

  const handleSend = () => {
    if (!message.trim() || !activeTicketId) return;
    sendMessageMutation.mutate({ ticketId: activeTicketId, content: message.trim() });
  };

  return (
    <div className="flex h-full flex-col gap-4 lg:flex-row">
      <Card className="w-full lg:w-90 lg:shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Support Inbox
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-3 sm:p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-(--color-text-muted)">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-(--color-border) p-6 text-center text-sm text-(--color-text-muted)">
              No support tickets yet.
            </div>
          ) : (
            tickets.map((ticket: SupportTicketSummary) => {
              const isActive = ticket.id === activeTicketId;
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setActiveTicketId(ticket.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${isActive ? "border-(--color-primary) bg-(--color-primary)/8" : "border-(--color-border) bg-white/50 dark:bg-slate-900/30"}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-(--color-text)">{ticket.subject}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLES[ticket.status] || "bg-slate-100 text-slate-600"}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs text-(--color-text-muted)">
                    <span>{ticket.user.name || ticket.user.email || "Customer"}</span>
                    <span className={`rounded-full px-2 py-0.5 ${PRIORITY_STYLES[ticket.priority] || "bg-slate-100 text-slate-600"}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-(--color-text-muted)">
                    <Circle className="h-2.5 w-2.5 fill-current" />
                    {formatTime(ticket.createdAt)}
                  </div>
                </button>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="min-h-125 flex-1">
        <CardHeader className="border-b border-(--color-border) pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">{currentTicket?.subject || "Select a ticket"}</CardTitle>
              <p className="text-sm text-(--color-text-muted)">
                {currentTicket ? `${currentTicket.user.name || currentTicket.user.email || "Customer"} • ${currentTicket.status}` : "Choose a ticket from the inbox to reply"}
              </p>
            </div>
            {currentTicket && (
              <div className="hidden items-center gap-2 rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-(--color-text-muted) sm:flex">
                <ArrowLeft className="h-3.5 w-3.5" />
                {currentTicket.priority}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex h-[calc(100%-120px)] flex-col p-0">
          {!activeTicketId ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-(--color-text-muted)">
              Select a conversation to start replying.
            </div>
          ) : isLoadingTicket ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-(--color-text-muted)">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading conversation...
            </div>
          ) : !activeTicket ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-(--color-text-muted)">
              No conversation found for this ticket.
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {activeTicket.conversation.messages.map((message: SupportTicketDetail["conversation"]["messages"][number]) => {
                  const isMine = message.sender.id === user?.id;
                  return (
                    <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm sm:max-w-[75%] ${isMine ? "bg-(--color-primary) text-white" : "bg-surface-100 text-(--color-text)"}`}>
                        <div className="mb-1 text-[11px] font-medium opacity-80">{message.sender.name || message.sender.email || "Support"}</div>
                        <div>{message.content}</div>
                        <div className={`mt-1 text-[10px] ${isMine ? "text-white/70" : "text-(--color-text-muted)"}`}>
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-(--color-border) bg-(--color-card) p-3 sm:p-4">
                <div className="flex items-end gap-2">
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Type your reply..."
                    className="min-h-24 flex-1 rounded-2xl border border-(--color-border) bg-transparent px-3 py-2 text-sm outline-none ring-0"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-(--color-primary) text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
