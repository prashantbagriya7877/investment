import { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { ScheduledTask } from '../types';

export interface OverdueAlert {
  id: string;
  title: string;
  dueDate: Date;
  triggeredAt: Date;
}

/**
 * Custom React client hook that maintains a real-time Firestore synchronization with
 * the tasks database. It automatically raises in-app alarms and notifications the moment
 * a pending task crosses its due date on the client.
 */
export function useTaskReminder(userId: string | undefined, onTaskOverdueTrigger?: (task: ScheduledTask) => void) {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const warnedTasksRef = useRef<Set<string>>(new Set<string>());

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    if (userId.startsWith('guest_offline_')) {
      const loadTasks = () => {
        const raw = localStorage.getItem(`tasks_${userId}`) || '[]';
        try {
          const parsed = JSON.parse(raw);
          const fetched = parsed.map((t: any) => ({
            ...t,
            dueDate: {
              toDate: () => new Date(t.dueDate)
            }
          }));
          setTasks(fetched);
        } catch (e) {
          console.error(e);
        }
        setLoading(false);
      };
      loadTasks();

      const localInterval = setInterval(loadTasks, 1500);
      return () => clearInterval(localInterval);
    }

    setLoading(true);

    // Secure Firestore onSnapshot listener as mandated by the eight pillars
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const syncedTasks: ScheduledTask[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          syncedTasks.push({
            id: doc.id,
            ...data,
          } as ScheduledTask);
        });

        // Initialize notified refs to avoid spamming alerts for historical overdue tasks on load
        syncedTasks.forEach((t) => {
          if (t.status === 'completed') {
            warnedTasksRef.current.delete(t.id);
          } else {
            // If it is already overdue on first load, mark it as warned to prevent dual prompting
            const dueTime = t.dueDate?.toDate ? t.dueDate.toDate().getTime() : new Date(t.dueDate).getTime();
            if (dueTime <= Date.now() && !t.notified) {
              // Add to warned list, but if it was not marked verified in Firestore, we let the Cloud Function handle FCM
              warnedTasksRef.current.add(t.id);
            }
          }
        });

        setTasks(syncedTasks);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'tasks');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // High-performance interval ticking to check deadlines on the client-side in real time
  useEffect(() => {
    if (!userId || tasks.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      
      tasks.forEach((task) => {
        if (task.status !== 'pending') return;

        const dueTime = task.dueDate?.toDate 
          ? task.dueDate.toDate().getTime() 
          : new Date(task.dueDate).getTime();

        // If task has just crossed the deadline and we haven't warned about it client-side yet
        if (dueTime <= now && !warnedTasksRef.current.has(task.id)) {
          warnedTasksRef.current.add(task.id);
          
          if (onTaskOverdueTrigger) {
            onTaskOverdueTrigger(task);
          }
        }
      });
    }, 1000); // 1-second ticks for precise alarms

    return () => clearInterval(interval);
  }, [tasks, userId, onTaskOverdueTrigger]);

  return { tasks, loading };
}
