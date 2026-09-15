import React, { useEffect, useState } from 'react';
import { DueMedicationAlert, MedicationScheduler, logMedicationAdherence, chimePlayer } from './medicationReminder';
import { MedicationSchedule } from './memoryDatabase';

/**
 * MedicationReminderUI
 *
 * Renders active medication alerts, plays gentle chimes while alerts are pending,
 * and allows the user or caregiver to confirm dose intake. Alerts that have been
 * pending for >1 hour are escalated to the caregiver (visual cue). When an alert
 * is confirmed we log adherence and dismiss the alert.
 */
export default function MedicationReminderUI() {
  const [alerts, setAlerts] = useState<DueMedicationAlert[]>([]);
  const [scheduler] = useState(() => new MedicationScheduler());

  // Start scheduler on mount and listen for alert changes
  useEffect(() => {
    scheduler.start((active) => setAlerts(active));
    return () => {
      scheduler.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle confirmation of a dose
  const handleConfirm = async (alert: DueMedicationAlert) => {
    try {
      await logMedicationAdherence(alert.schedule, alert.scheduledTimeToday, 'Patient');
      // Remove the confirmed alert from UI
      setAlerts((prev) => prev.filter((a) => a !== alert));
    } catch (e) {
      console.error('Error logging medication adherence:', e);
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="p-4 text-center text-dim">
        No medication reminders at this time.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {alerts.map((alert) => (
        <div
          key={`${alert.schedule.id}-${alert.scheduledTimeToday}`}
          className={`card card-enhanced backdrop-blur-xl border border-border bg-glass transition-all ${
            alert.isEscalatedToCaregiver ? 'ring-2 ring-red-500/60' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-white">{alert.schedule.name}</h3>
              <p className="text-sm text-dim">
                {alert.schedule.dosage} – due {alert.timeLabel}{' '}
                {alert.isEscalatedToCaregiver && (
                  <span className="ml-2 px-2 py-0.5 bg-red-600/20 text-red-300 text-xs rounded">Escalated</span>
                )}
              </p>
            </div>
            <button
              onClick={() => handleConfirm(alert)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
            >
              Taken
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
