"use client";

import { useMemo, useState } from "react";
import { ListChecks } from "lucide-react";
import { FavoriteItemsSection } from "@/components/favorite-items-section";
import { RecentItemsSection } from "@/components/recent-items-section";
import { ScanModeTabs } from "@/components/scan-mode-tabs";
import { ScanPanel, type ScanQueueItem } from "@/components/scan-panel";
import { Button, Card, Input } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/types";

function toQueueItem(item: Item): ScanQueueItem {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    barcode: item.barcode,
    unit: item.unit,
  };
}

export function ScanClient({
  deptItems,
  favorites,
  favoriteIds,
  recentItems,
  frequentItems,
  prescanCount = 0,
}: {
  departmentId: string;
  deptItems: Item[];
  favorites: Item[];
  favoriteIds: Set<string>;
  recentItems: Item[];
  frequentItems: Item[];
  prescanCount?: number;
}) {
  const [query, setQuery] = useState("");
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeItem, setActiveItem] = useState<ScanQueueItem | null>(null);
  const [scanQueue, setScanQueue] = useState<ScanQueueItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return deptItems;
    return deptItems.filter(
      (i) =>
        i.code.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.barcode.toLowerCase().includes(q)
    );
  }, [deptItems, query]);

  const queueItem = scanQueue[queueIndex] ?? null;

  const startScan = (item: Item) => {
    if (multiSelectMode) return;
    setScanQueue([]);
    setQueueIndex(0);
    setActiveItem(toQueueItem(item));
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleMultiSelectMode = () => {
    setMultiSelectMode((prev) => !prev);
    setSelected(new Set());
    setActiveItem(null);
    setScanQueue([]);
    setQueueIndex(0);
  };

  const startSelectedQueue = () => {
    const items = deptItems
      .filter((item) => selected.has(item.id))
      .map(toQueueItem);
    if (items.length === 0) return;
    setMultiSelectMode(false);
    setSelected(new Set());
    setActiveItem(null);
    setScanQueue(items);
    setQueueIndex(0);
  };

  const closePanel = () => {
    setActiveItem(null);
    setScanQueue([]);
    setQueueIndex(0);
  };

  const advanceQueue = () => {
    if (queueIndex + 1 >= scanQueue.length) {
      setScanQueue([]);
      setQueueIndex(0);
      return;
    }
    setQueueIndex((i) => i + 1);
  };

  const retreatQueue = () => {
    if (queueIndex <= 0) return;
    setQueueIndex((i) => i - 1);
  };

  const handleScanComplete = () => {
    setActiveItem(null);
    setScanQueue([]);
    setQueueIndex(0);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <ScanModeTabs prescanCount={prescanCount} />
        <p className="text-sm text-slate-500">
          เลือกรายการ &gt; สแกนเข้า IPISS &gt; กดสแกนสำเร็จ เพื่อบันทึก
        </p>
      </div>

      {(recentItems.length > 0 || frequentItems.length > 0) && (
        <Card>
          <RecentItemsSection
            recentItems={recentItems}
            frequentItems={frequentItems}
            onSelect={startScan}
          />
        </Card>
      )}

      <Card>
        <FavoriteItemsSection favorites={favorites} onScanOne={startScan} />
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input
            placeholder="ค้นหารหัส ชื่อ หรือบาร์โค้ด..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button
            type="button"
            variant={multiSelectMode ? "primary" : "secondary"}
            onClick={toggleMultiSelectMode}
          >
            <ListChecks className="mr-1 h-4 w-4" />
            เลือกหลายรายการ
          </Button>
          {multiSelectMode && selected.size > 0 && (
            <Button type="button" onClick={startSelectedQueue}>
              สแกนที่เลือก ({selected.size})
            </Button>
          )}
        </div>

        {activeItem && scanQueue.length === 0 && (
          <div className="mb-4">
            <ScanPanel
              key={activeItem.id}
              item={activeItem}
              onClose={closePanel}
              onComplete={handleScanComplete}
            />
          </div>
        )}

        <div className="divide-y rounded-lg border">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">ไม่พบรายการ</p>
          ) : (
            filtered.map((item) => {
              const isActive = activeItem?.id === item.id;
              const isChecked = selected.has(item.id);

              if (multiSelectMode) {
                return (
                  <label
                    key={item.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-slate-50",
                      isChecked ? "bg-teal-50" : ""
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelected(item.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.code} — {item.name}
                      </div>
                    </div>
                    {favoriteIds.has(item.id) && (
                      <span className="text-xs text-amber-600">★ โปรด</span>
                    )}
                  </label>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => startScan(item)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50",
                    isActive ? "bg-teal-50" : ""
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
                  {favoriteIds.has(item.id) && (
                    <span className="text-xs text-amber-600">★ โปรด</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </Card>

      {queueItem && scanQueue.length > 0 && (
        <ScanPanel
          key={queueItem.id}
          variant="modal"
          item={queueItem}
          index={queueIndex}
          total={scanQueue.length}
          queueItems={scanQueue}
          onNext={advanceQueue}
          onPrev={retreatQueue}
          onClose={closePanel}
          onComplete={handleScanComplete}
        />
      )}
    </div>
  );
}
