export type ScheduleType = "once" | "daily" | "weekly";

export interface ScheduleData {
  schedule_type: ScheduleType;
  // When a recurring analysis first runs
  next_scheduled_run?: Date;
  is_active: boolean;
}
