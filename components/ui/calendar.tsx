"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = ptBR,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={locale}
      showOutsideDays={showOutsideDays}
      weekStartsOn={0}
      className={cn("p-3", className)}
      classNames={{
        root: "flex flex-col gap-4",
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center min-h-[2rem]",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute left-1 inline-flex items-center justify-center rounded-md h-7 w-7",
          "border border-[hsl(var(--border))] bg-transparent",
          "opacity-70 hover:opacity-100 hover:bg-[hsl(var(--muted))]",
          "transition-colors"
        ),
        button_next: cn(
          "absolute right-1 inline-flex items-center justify-center rounded-md h-7 w-7",
          "border border-[hsl(var(--border))] bg-transparent",
          "opacity-70 hover:opacity-100 hover:bg-[hsl(var(--muted))]",
          "transition-colors"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 rounded-md text-[0.8rem] font-normal text-[hsl(var(--muted-foreground))]",
        weeks: "flex flex-col gap-1 mt-2",
        week: "flex w-full",
        day: "h-9 w-9 text-center text-sm p-0 relative",
        day_button: cn(
          "h-9 w-9 p-0 font-normal rounded-md",
          "hover:bg-[hsl(var(--muted))] focus:bg-[hsl(var(--muted))]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
          "aria-selected:opacity-100"
        ),
        selected:
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]",
        today: "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]",
        outside:
          "text-[hsl(var(--muted-foreground))] opacity-50 aria-selected:opacity-30",
        disabled: "text-[hsl(var(--muted-foreground))] opacity-50 cursor-not-allowed",
        hidden: "invisible",
        range_start: "rounded-l-md",
        range_end: "rounded-r-md",
        range_middle: "rounded-none",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
