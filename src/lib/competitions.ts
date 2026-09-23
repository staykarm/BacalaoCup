/** Longest Drive and Closest to Pin, played on these course-relative hole numbers. */
export interface CourseCompetitions {
  longestDrive: number[];
  closestToPin: number[];
}

/** Keyed by the exact `course` string stored on the `days` row, same as COURSE_HOLES. */
export const COMPETITIONS: Record<string, CourseCompetitions> = {
  Santana: { longestDrive: [9], closestToPin: [16] },
  Naranjos: { longestDrive: [5], closestToPin: [4, 12] },
  "Marbella Club Resort": { longestDrive: [7], closestToPin: [2] },
  "Mijas Los Lagos": { longestDrive: [7], closestToPin: [16] },
};
