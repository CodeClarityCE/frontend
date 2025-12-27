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

export interface GradeThreshold {
  grade: Grade;
  minScore: number;
  label: string;
  color: string;
}

/**
 * Grade thresholds on a 0-100% scale
 * These thresholds are shared between frontend and should match backend
 */
export const GRADE_THRESHOLDS: GradeThreshold[] = [
  { grade: "A+", minScore: 95, label: "Excellent", color: "text-green-600" },
  { grade: "A", minScore: 90, label: "Excellent", color: "text-green-600" },
  { grade: "B+", minScore: 85, label: "Good", color: "text-blue-600" },
  { grade: "B", minScore: 75, label: "Good", color: "text-blue-600" },
  { grade: "C+", minScore: 65, label: "Fair", color: "text-yellow-600" },
  { grade: "C", minScore: 55, label: "Fair", color: "text-yellow-600" },
  { grade: "D+", minScore: 45, label: "Poor", color: "text-red-600" },
  { grade: "D", minScore: 0, label: "Poor", color: "text-red-600" },
];

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
 * Convert a 0-10 scale score to a letter grade
 * Useful for CVSS-based scores
 */
export function score10ToGrade(score: number): Grade {
  return scoreToGrade(score * 10);
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

/**
 * Get the color class for a grade
 */
export function getGradeColor(grade: Grade): string {
  const threshold = GRADE_THRESHOLDS.find((t) => t.grade === grade);
  return threshold?.color ?? "text-gray-600";
}

/**
 * Get the border color class based on score percentage
 */
export function getScoreBorderColor(score: number): string {
  if (score >= 80) return "border-l-green-500";
  if (score >= 60) return "border-l-[#1dce79]";
  return "border-l-red-500";
}
