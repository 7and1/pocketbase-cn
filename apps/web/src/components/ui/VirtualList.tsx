import { useRef, useCallback, useMemo, useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "../../lib/utils/cn";

export interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  itemClassName?: string;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  horizontal?: boolean;
}

export function VirtualList<T>({
  items,
  renderItem,
  keyExtractor,
  estimateSize = 80,
  overscan = 5,
  className,
  itemClassName,
  loading,
  loadingComponent,
  emptyComponent,
  onEndReached,
  endReachedThreshold = 200,
  horizontal = false,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const endReachedRef = useRef<boolean>(false);

  const count = items.length + (loading ? 1 : 0);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    enabled: items.length > 0,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const handleScroll = useCallback(() => {
    if (!onEndReached || loading) return;

    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const scrollFromBottom = scrollHeight - (scrollTop + clientHeight);

    if (scrollFromBottom < endReachedThreshold && !endReachedRef.current) {
      endReachedRef.current = true;
      onEndReached();
    } else if (scrollFromBottom >= endReachedThreshold) {
      endReachedRef.current = false;
    }
  }, [onEndReached, loading, endReachedThreshold]);

  useEffect(() => {
    const element = parentRef.current;
    if (!element) return;

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const totalSize = virtualizer.getTotalSize();

  if (items.length === 0 && !loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        {emptyComponent || <EmptyState message="No items found" />}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      style={{ contain: "strict" }}
    >
      <div
        style={{
          width: "100%",
          height: `${totalSize}px`,
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const index = virtualRow.index;
          const isLoading = loading && index === items.length;
          const item = items[index];

          if (isLoading) {
            return (
              <div
                key="loading"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {loadingComponent || <SkeletonItem />}
              </div>
            );
          }

          if (!item) return null;

          return (
            <div
              key={keyExtractor(item, index)}
              data-index={index}
              className={itemClassName}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center">
      <p className="text-sm text-neutral-500">{message}</p>
    </div>
  );
}

function SkeletonItem() {
  return (
    <div className="animate-pulse rounded-lg border border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}

export interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  estimateSize?: number;
  columns?: number | ((width: number) => number);
  gap?: number;
  overscan?: number;
  className?: string;
  itemClassName?: string;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

export function VirtualGrid<T>({
  items,
  renderItem,
  keyExtractor,
  estimateSize = 200,
  columns: columnsProp = 1,
  gap = 16,
  overscan = 5,
  className,
  itemClassName,
  loading,
  loadingComponent,
  emptyComponent,
  onEndReached,
  endReachedThreshold = 200,
}: VirtualGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const endReachedRef = useRef<boolean>(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const columns = useMemo(() => {
    if (typeof columnsProp === "function") {
      return columnsProp(containerWidth);
    }
    return columnsProp;
  }, [columnsProp, containerWidth]);

  const rowCount = Math.ceil(items.length / columns);
  const count = rowCount + (loading ? 1 : 0);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const handleScroll = useCallback(() => {
    if (!onEndReached || loading) return;

    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const scrollFromBottom = scrollHeight - (scrollTop + clientHeight);

    if (scrollFromBottom < endReachedThreshold && !endReachedRef.current) {
      endReachedRef.current = true;
      onEndReached();
    } else if (scrollFromBottom >= endReachedThreshold) {
      endReachedRef.current = false;
    }
  }, [onEndReached, loading, endReachedThreshold]);

  useEffect(() => {
    const element = parentRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const element = parentRef.current;
    if (!element) return;

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (items.length === 0 && !loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        {emptyComponent || <EmptyState message="No items found" />}
      </div>
    );
  }

  const itemWidth = Math.floor(
    (containerWidth - gap * (columns - 1)) / columns,
  );
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${totalSize}px`,
          position: "relative",
          width: "100%",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const rowIndex = virtualRow.index;
          const isLoading = loading && rowIndex === rowCount;

          if (isLoading) {
            return (
              <div
                key="loading"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {loadingComponent || <GridSkeleton count={columns} />}
              </div>
            );
          }

          const rowItems: React.ReactNode[] = [];
          const startIndex = rowIndex * columns;
          const endIndex = Math.min(startIndex + columns, items.length);

          for (let i = startIndex; i < endIndex; i++) {
            const item = items[i];
            if (item) {
              const leftPos = (i % columns) * (itemWidth + gap);
              rowItems.push(
                <div
                  key={keyExtractor(item, i)}
                  className={itemClassName}
                  style={{
                    position: "absolute",
                    left: `${leftPos}px`,
                    width: `${itemWidth}px`,
                  }}
                >
                  {renderItem(item, i)}
                </div>,
              );
            }
          }

          return (
            <div
              key={`row-${rowIndex}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowItems}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GridSkeleton({ count }: { count: number }) {
  return (
    <div className="flex gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex-1 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="aspect-square w-full rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-3 h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-2 h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      ))}
    </div>
  );
}

VirtualList.displayName = "VirtualList";
VirtualGrid.displayName = "VirtualGrid";
