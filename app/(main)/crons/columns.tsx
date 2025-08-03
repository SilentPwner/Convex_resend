// app/(main)/crons/columns.tsx
"use client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export type Task = {
  _id: string;
  _creationTime: number;
  name: string;
  type: string;
  status: string;
  nextRun?: number;
  lastRun?: number;
  interval?: string;
};

export const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "name",
    header: "اسم المهمة",
  },
  {
    accessorKey: "type",
    header: "النوع",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return <span className="capitalize">{type}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusMap: Record<string, string> = {
        pending: "في الانتظار",
        running: "جاري التنفيذ",
        completed: "مكتملة",
        failed: "فشلت",
      };
      return statusMap[status] || status;
    },
  },
  {
    accessorKey: "nextRun",
    header: "الموعد القادم",
    cell: ({ row }) => {
      const nextRun = row.getValue("nextRun") as number | undefined;
      return nextRun
        ? format(new Date(nextRun), "yyyy/MM/dd HH:mm", { locale: ar })
        : "-";
    },
  },
  {
    accessorKey: "lastRun",
    header: "آخر تنفيذ",
    cell: ({ row }) => {
      const lastRun = row.getValue("lastRun") as number | undefined;
      return lastRun
        ? format(new Date(lastRun), "yyyy/MM/dd HH:mm", { locale: ar })
        : "-";
    },
  },
  {
    accessorKey: "interval",
    header: "التكرار",
    cell: ({ row }) => {
      const interval = row.getValue("interval") as string | undefined;
      if (!interval) return "مرة واحدة";
      
      const intervalMap: Record<string, string> = {
        "1d": "يومي",
        "7d": "أسبوعي",
        "30d": "شهري",
      };
      return intervalMap[interval] || interval;
    },
  },
];