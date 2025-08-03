// app/(main)/crons/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { AddTaskDialog } from "./add-task-dialog";

export default function CronJobsPage() {
  const tasks = useQuery(api.cronQueries.getTasks);
  const runTasks = useMutation(api.cronActions.runScheduledTasks);
  const [isDialogOpen, setDialogOpen] = useState(false);

  const handleRunTasks = async () => {
    await runTasks({ batchSize: 5 });
    // يمكنك إضافة إشعار بنجاح التنفيذ
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">المهام المجدولة</h1>
        <div className="space-x-2">
          <Button onClick={() => setDialogOpen(true)}>
            إضافة مهمة جديدة
          </Button>
          <Button variant="secondary" onClick={handleRunTasks}>
            تشغيل المهام الآن
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={tasks || []} />

      <AddTaskDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}