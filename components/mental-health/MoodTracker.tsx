// components/mental-health/MoodTracker.tsx
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Icons } from '../ui/icons';

type MoodEntry = {
  id: string;
  mood: MoodType;
  date: Date;
  notes?: string;
};

type MoodType = 'excited' | 'happy' | 'neutral' | 'sad' | 'angry' | 'anxious';

const moodOptions: {
  value: MoodType;
  label: string;
  icon: keyof typeof Icons;
  color: string;
}[] = [
  { value: 'excited', label: 'Excited', icon: 'Sparkles', color: 'text-purple-500' },
  { value: 'happy', label: 'Happy', icon: 'Smile', color: 'text-yellow-500' },
  { value: 'neutral', label: 'Neutral', icon: 'Meh', color: 'text-gray-500' },
  { value: 'sad', label: 'Sad', icon: 'Frown', color: 'text-blue-500' },
  { value: 'angry', label: 'Angry', icon: 'Angry', color: 'text-red-500' },
  { value: 'anxious', label: 'Anxious', icon: 'HeartCrack', color: 'text-amber-500' },
];

interface MoodTrackerProps {
  initialEntries?: MoodEntry[];
  onSave?: (entry: Omit<MoodEntry, 'id'>) => void;
  className?: string;
}

const MoodTracker: React.FC<MoodTrackerProps> = ({
  initialEntries = [],
  onSave,
  className,
}) => {
  const [entries, setEntries] = useState<MoodEntry[]>(initialEntries);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) return;

    setIsSubmitting(true);
    try {
      const newEntry = {
        mood: selectedMood,
        date: new Date(),
        notes: notes.trim() || undefined,
      };

      if (onSave) {
        await onSave(newEntry);
      }

      setEntries(prev => [...prev, { ...newEntry, id: Date.now().toString() }]);
      setSelectedMood(null);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group entries by date for display
  const entriesByDate = entries.reduce((acc, entry) => {
    const dateStr = entry.date.toLocaleDateString();
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(entry);
    return acc;
  }, {} as Record<string, MoodEntry[]>);

  return (
    <div className={cn('space-y-6', className)}>
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <h3 className="font-semibold text-lg mb-4">How are you feeling today?</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {moodOptions.map((option) => {
              const Icon = Icons[option.icon];
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={selectedMood === option.value ? 'default' : 'outline'}
                  className={cn(
                    'flex flex-col items-center h-24 w-24 p-2',
                    selectedMood === option.value ? option.color : 'text-gray-700'
                  )}
                  onClick={() => setSelectedMood(option.value)}
                >
                  <Icon className="h-8 w-8 mb-1" />
                  <span className="text-xs">{option.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label htmlFor="mood-notes" className="block text-sm font-medium text-gray-700">
              Add notes (optional)
            </label>
            <textarea
              id="mood-notes"
              rows={3}
              className="w-full border rounded-md p-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's affecting your mood today?"
            />
          </div>

          <Button
            type="submit"
            disabled={!selectedMood || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <Icons.Spinner className="h-4 w-4 animate-spin" />
            ) : (
              'Record Mood'
            )}
          </Button>
        </form>
      </div>

      {entries.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="font-semibold text-lg mb-4">Your Mood History</h3>
          <div className="space-y-4">
            {Object.entries(entriesByDate).map(([date, dateEntries]) => (
              <div key={date} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">{date}</h4>
                <div className="space-y-2">
                  {dateEntries.map((entry) => {
                    const moodConfig = moodOptions.find(m => m.value === entry.mood)!;
                    const Icon = Icons[moodConfig.icon];
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <Icon className={cn('h-5 w-5', moodConfig.color)} />
                        <div className="flex-1">
                          <p className="font-medium">{moodConfig.label}</p>
                          {entry.notes && (
                            <p className="text-sm text-gray-600">{entry.notes}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(entry.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodTracker;