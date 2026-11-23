/**
 * Shared Grade Utility
 *
 * Provides consistent grade calculation across all components.
 * Grade thresholds are standardized on a 0-100% scale.
 *
 * Usage:
 *   import { scoreToGrade, getGradeSubtitle, GRADE_THRESHOLDS } from '@/utils/gradeUtils';
 *   const grade = scoreToGrade(85); // Returns "B+"
 *   const subtitle = getGradeSubtitle(grade); // Returns "Good"
 */

export type Grade = "A+" | "A" | "B+" | "B" | "C+" | "C" | "D+" | "D";

/**
 * Tooltip display ranges for each grade tier
 */
export const GRADE_DISPLAY_RANGES = {
  excellent: "90-100%",
  good: "75-89%",
  fair: "55-74%",
  poor: "0-54%",
};

/**
 * Convert a percentage score (0-100) to a letter grade
 */
export function scoreToGrade(score: number): Grade {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 75) return "B";
  if (score >= 65) return "C+";
  if (score >= 55) return "C";
  if (score >= 45) return "D+";
  return "D";
}

/**
 * Get a descriptive subtitle for a grade
 */
export function getGradeSubtitle(
  grade: Grade,
  context: "security" | "health" = "security",
): string {
  const contextWord = context === "security" ? "security posture" : "health";

  if (grade === "A+" || grade === "A") {
    return `Excellent ${contextWord}`;
  }
  if (grade === "B+" || grade === "B") {
    return `Good ${contextWord}`;
  }
  if (grade === "C+" || grade === "C") {
    return "Needs attention";
  }
  return "Critical - immediate action required";
}
