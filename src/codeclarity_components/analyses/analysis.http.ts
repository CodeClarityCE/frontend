export interface CreateAnalysis {
  analyzer_id: string;
  branch: string;
  commit_hash: string;
  config: object;
  schedule_type?: "once" | "daily" | "weekly";
  next_scheduled_run?: string;
  is_active?: boolean;
}

export interface UpdateSchedule {
  schedule_type: "once" | "daily" | "weekly";
  next_scheduled_run: string;
  is_active: boolean;
}
