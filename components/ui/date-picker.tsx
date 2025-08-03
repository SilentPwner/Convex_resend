// app/(main)/crons/add-task-dialog.tsx
"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

const taskTypes = [
  { value: "email_reminder", label: "تذكير بالبريد" },
  { value: "data_cleanup", label: "تنظيف البيانات" },
  { value: "report_generation", label: "توليد تقارير" },
  { value: "donation_reminder", label: "تذكير بالتبرع" },
  { value: "backup", label: "نسخ احتياطي" },
];

const intervals = [
  { value: "", label: "مرة واحدة" },
  { value: "1d", label: "يومي" },
  { value: "7d", label: "أسبوعي" },
  { value: "30d", label: "شهري" },
];

export function AddTaskDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState<Date>();
  const [interval, setInterval] = useState("");
  const scheduleTask = useMutation(api.cronActions.scheduleTask);

  const handleSubmit = async () => {
    if (!name || !type || !date) return;

    await scheduleTask({
      name,
      type,
      scheduledTime: date.getTime(),
      interval: interval || undefined,
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setType("");
    setDate(undefined);
    setInterval("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة مهمة مجدولة</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              اسم المهمة
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              نوع المهمة
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر نوع المهمة" />
              </SelectTrigger>
              <SelectContent>
                {taskTypes.map((task) => (
                  <SelectItem key={task.value} value={task.value}>
                    {task.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              تاريخ التنفيذ
            </Label>
            <DatePicker
              selected={date}
              onSelect={setDate}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="interval" className="text-right">
              التكرار
            </Label>
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر التكرار" />
              </SelectTrigger>
              <SelectContent>
                {intervals.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            حفظ المهمة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}