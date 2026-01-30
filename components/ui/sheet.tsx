"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SheetContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

export function Sheet({
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    if (controlledOpen === undefined) setUncontrolledOpen(v);
  };

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement;
}) {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error("SheetTrigger must be used within Sheet");
  const child = React.Children.only(children) as React.ReactElement<{ onClick?: React.MouseEventHandler }>;
  const props = {
    onClick: (e: React.MouseEvent) => {
      child.props.onClick?.(e);
      ctx.setOpen(true);
    },
  };
  return asChild ? React.cloneElement(child, props) : React.cloneElement(child, props);
}

export function SheetContent({
  side = "left",
  className,
  children,
}: {
  side?: "left" | "right";
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error("SheetContent must be used within Sheet");
  if (!ctx.open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Fechar"
        className="absolute inset-0 bg-black/60"
        onClick={() => ctx.setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute top-0 h-full w-[18rem] max-w-[85vw] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-xl",
          side === "left" ? "left-0" : "right-0",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 border-b border-[hsl(var(--border))]", className)} {...props} />;
}

export function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-sm font-semibold", className)} {...props} />;
}

export function SheetClose({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement;
}) {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error("SheetClose must be used within Sheet");
  const child = React.Children.only(children) as React.ReactElement<{ onClick?: React.MouseEventHandler }>;
  const props = {
    onClick: (e: React.MouseEvent) => {
      child.props.onClick?.(e);
      ctx.setOpen(false);
    },
  };
  return asChild ? React.cloneElement(child, props) : React.cloneElement(child, props);
}

