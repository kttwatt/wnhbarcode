"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  History,
  Minus,
  Plus,
  ScanLine,
  Search,
  Trash2,
} from "lucide-react";
import { ScanModeTabs } from "@/components/scan-mode-tabs";
import { ScanPanel, type ScanQueueItem } from "@/components/scan-panel";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import {
  addPrescanItem,
  changePrescanQty,
  completePrescanScan,
  removePrescanItem,
  searchDeptItems,
} from "@/lib/actions/prescan";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDateTime } from "@/lib/utils";
import type { Item, PrescanItem } from "@/lib/types";

type Flash = { type: "success" | "error"; message: string } | null;

function creatorName(entry: PrescanItem) {
  return (
    entry.created_by_profile?.full_name ||
    entry.created_by_profile?.username ||
    "—"
  );
}

export function PrescanClient({
  departmentId,
  pending,
  history,
  initialResults,
  staleHours,
}: {
  departmentId: string;
  pending: PrescanItem[];
  history: PrescanItem[];
  initialResults: Item[];
  staleHours: number;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<PrescanItem[]>(pending);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>(initialResults);
  const [showHistory, setShowHistory] = useState(false);
  const [scanQueue, setScanQueue] = useState<ScanQueueItem[] | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [flash, setFlash] = useState<Flash>(null);

  const [, startAction] = useTransition();
  const [searching, startSearch] = useTransition();
  const firstRun = useRef(true);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setEntries(pending);
  }, [pending]);

  // Read the clock outside render so staleness stays pure/idempotent.
  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const showFlash = useCallback((f: Flash) => {
    setFlash(f);
    if (f) {
      window.setTimeout(() => setFlash(null), 2500);
    }
  }, []);

  // Realtime: refresh when anyone in the department changes the shared list.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`prescan:${departmentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prescan_items",
          filter: `department_id=eq.${departmentId}`,
        },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [departmentId, router]);

  // Debounced server-side search.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      startSearch(async () => {
        const res = await searchDeptItems(query);
        setResults(res.items);
      });
    }, 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const pendingByItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) map.set(e.item_id, e.qty);
    return map;
  }, [entries]);

  const staleMs = staleHours * 60 * 60 * 1000;

  const isStale = useCallback(
    (entry: PrescanItem) =>
      now > 0 && now - new Date(entry.created_at).getTime() > staleMs,
    [now, staleMs]
  );

  const staleCount = useMemo(
    () => entries.filter((e) => isStale(e)).length,
    [entries, isStale]
  );

  const handleAdd = (item: Item) => {
    startAction(async () => {
      const res = await addPrescanItem(item.id, 1);
      if (res?.error) showFlash({ type: "error", message: res.error });
      else showFlash({ type: "success", message: `จด ${item.code} แล้ว` });
      router.refresh();
    });
  };

  const handleQty = (entry: PrescanItem, delta: number) => {
    const next = Math.max(1, entry.qty + delta);
    if (next === entry.qty) return;
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, qty: next } : e))
    );
    startAction(async () => {
      const res = await changePrescanQty(entry.item_id, delta);
      if (res?.error) {
        showFlash({ type: "error", message: res.error });
        router.refresh();
      }
    });
  };

  const handleRemove = (entry: PrescanItem) => {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    startAction(async () => {
      const res = await removePrescanItem(entry.id);
      if (res?.error) {
        showFlash({ type: "error", message: res.error });
        router.refresh();
      }
    });
  };

  const startScan = () => {
    const queue: ScanQueueItem[] = entries
      .filter((e) => e.item)
      .map((e) => ({
        id: e.item!.id,
        code: e.item!.code,
        name: e.item!.name,
        barcode: e.item!.barcode,
        unit: e.item!.unit,
        qty: e.qty,
        prescanId: e.id,
      }));
    if (queue.length === 0) return;
    setScanQueue(queue);
    setQueueIndex(0);
  };

  const closeQueue = () => {
    setScanQueue(null);
    setQueueIndex(0);
  };

  const handleScanComplete = () => {
    closeQueue();
    showFlash({ type: "success", message: "บันทึกการสแกนเข้า IPISS แล้ว" });
    router.refresh();
  };

  const confirmScan = async () => {
    if (!scanQueue) return {};
    const ids = scanQueue
      .map((q) => q.prescanId)
      .filter((id): id is string => Boolean(id));
    return completePrescanScan(ids);
  };

  const queueItem = scanQueue?.[queueIndex] ?? null;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <ScanModeTabs prescanCount={entries.length} />
        <p className="text-sm text-slate-500">
          เก็บรายการไว้ในระบบ (แชร์ทั้งแผนก) แล้วกลับมาไล่สแกนเข้า IPISS ภายหลัง
        </p>
      </div>

      {flash && (
        <div
          role="status"
          className={cn(
            "rounded-lg px-4 py-2 text-sm",
            flash.type === "success"
              ? "bg-teal-50 text-teal-800"
              : "bg-red-50 text-red-700"
          )}
        >
          {flash.message}
        </div>
      )}

      <Card className="border-amber-200 bg-amber-50/40">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-amber-700" />
            <h2 className="font-medium text-amber-900">
              รายการที่จดไว้ ({entries.length})
            </h2>
            {staleCount > 0 && (
              <Badge variant="red" className="gap-1">
                <Clock className="h-3 w-3" /> ค้างนาน {staleCount}
              </Badge>
            )}
          </div>
          {entries.length > 0 && (
            <Button type="button" onClick={startScan}>
              <ScanLine className="mr-1 h-4 w-4" />
              เริ่มสแกน ({entries.length})
            </Button>
          )}
        </div>

        {entries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-amber-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
            ยังไม่มีรายการที่จดไว้ — ค้นหาด้านล่างแล้วแตะเพื่อจด
          </p>
        ) : (
          <div className="divide-y rounded-lg border border-amber-200 bg-white">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {entry.item
                        ? `${entry.item.code} — ${entry.item.name}`
                        : "(ไม่พบรายการ)"}
                    </span>
                    {isStale(entry) && (
                      <Badge variant="red" className="shrink-0 gap-1">
                        <Clock className="h-3 w-3" /> ค้างนาน
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {entry.item?.unit} · จดโดย {creatorName(entry)} ·{" "}
                    {formatDateTime(entry.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQty(entry, -1)}
                    className="rounded-md border border-slate-300 p-1 hover:bg-slate-50 disabled:opacity-40"
                    disabled={entry.qty <= 1}
                    aria-label="ลดจำนวน"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm tabular-nums">
                    {entry.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQty(entry, 1)}
                    className="rounded-md border border-slate-300 p-1 hover:bg-slate-50"
                    aria-label="เพิ่มจำนวน"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(entry)}
                  className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="ยกเลิกรายการ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหารหัส ชื่อ หรือบาร์โค้ด..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm"
          />
          {searching && <span className="text-xs text-slate-400">กำลังค้นหา…</span>}
        </div>

        <div className="divide-y rounded-lg border">
          {results.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">ไม่พบรายการ</p>
          ) : (
            results.map((item) => {
              const notedQty = pendingByItem.get(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAdd(item)}
                  className={cn(
                    "group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-amber-50",
                    notedQty ? "bg-amber-50/60" : ""
                  )}
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {item.code} — {item.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.barcode} | {item.unit}
                    </div>
                  </div>
                  {notedQty ? (
                    <Badge variant="amber">จดแล้ว x{notedQty}</Badge>
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm transition group-hover:bg-teal-700">
                      <Plus className="h-5 w-5" strokeWidth={2.5} />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </Card>

      <Card>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="flex items-center gap-2 font-medium text-slate-700">
            <History className="h-4 w-4" />
            ประวัติที่สแกนแล้ว ({history.length})
          </span>
          <span className="text-xs text-slate-400">
            {showHistory ? "ซ่อน" : "แสดง"}
          </span>
        </button>

        {showHistory && (
          <div className="mt-3 divide-y rounded-lg border">
            {history.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">ยังไม่มีประวัติ</p>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">
                      {entry.item
                        ? `${entry.item.code} — ${entry.item.name}`
                        : "(ไม่พบรายการ)"}
                      <span className="ml-2 text-xs text-slate-400">
                        x{entry.qty}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      สแกนโดย{" "}
                      {entry.scanned_by_profile?.full_name ||
                        entry.scanned_by_profile?.username ||
                        "—"}{" "}
                      ·{" "}
                      {entry.scanned_at
                        ? formatDateTime(entry.scanned_at)
                        : "—"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {entries.length === 0 && history.length === 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p>
            ฟีเจอร์นี้เก็บรายการเข้าระบบและแชร์กับทุกคนในแผนก เหมาะกับการรวบรวมก่อน
            แล้วค่อยไล่สแกนเข้า IPISS ทีหลัง
          </p>
        </div>
      )}

      {queueItem && scanQueue && (
        <ScanPanel
          key={queueItem.id}
          variant="modal"
          item={queueItem}
          index={queueIndex}
          total={scanQueue.length}
          queueItems={scanQueue}
          onNext={() => setQueueIndex((i) => Math.min(scanQueue.length - 1, i + 1))}
          onPrev={() => setQueueIndex((i) => Math.max(0, i - 1))}
          onClose={closeQueue}
          onComplete={handleScanComplete}
          onConfirm={confirmScan}
        />
      )}
    </div>
  );
}
