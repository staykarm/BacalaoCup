export interface HoleInfo {
  /** The course's own hole number, 1–18. */
  number: number;
  par: number | null;
  /** Length in meters, Yellow tee. */
  meters: number | null;
  /** Stroke index / handicap index, 1 (hardest) – 18 (easiest). */
  index: number | null;
}

function hole(number: number, par: number | null, meters: number | null, index: number | null): HoleInfo {
  return { number, par, meters, index };
}

/**
 * Full 18-hole reference data, Yellow tee, transcribed from each course's own
 * scorecard. Keyed by the exact `course` string stored on the `days` row, same
 * as COURSE_INFO. Purely informational — match/flight results are entered and
 * calculated independently of this data, so a missing course here just means
 * blank hole info in the UI until it's filled in.
 *
 * Marbella Club Resort holes 13/14/16/17: the source scorecard's PAR row didn't
 * line up with its yardages column-for-column (e.g. a "par 5" at 373m and a
 * "par 3" at 348m) for those four holes specifically. The par values below were
 * re-paired with their yardages by plausibility so the numbers make physical
 * sense — worth double-checking against the card if you have it handy.
 */
export const COURSE_HOLES: Record<string, HoleInfo[]> = {
  Santana: [
    hole(1, 4, 285, 13),
    hole(2, 3, 145, 9),
    hole(3, 4, 347, 7),
    hole(4, 5, 524, 3),
    hole(5, 4, 296, 11),
    hole(6, 4, 321, 17),
    hole(7, 3, 165, 5),
    hole(8, 5, 541, 1),
    hole(9, 4, 334, 15),
    hole(10, 5, 425, 4),
    hole(11, 4, 265, 8),
    hole(12, 3, 153, 10),
    hole(13, 4, 314, 14),
    hole(14, 4, 265, 18),
    hole(15, 5, 489, 6),
    hole(16, 3, 122, 16),
    hole(17, 4, 307, 12),
    hole(18, 4, 356, 2),
  ],
  Naranjos: [
    hole(1, 4, 307, 16),
    hole(2, 5, 517, 4),
    hole(3, 4, 327, 14),
    hole(4, 3, 168, 10),
    hole(5, 5, 438, 8),
    hole(6, 4, 364, 2),
    hole(7, 4, 325, 18),
    hole(8, 3, 180, 12),
    hole(9, 4, 378, 6),
    hole(10, 4, 379, 1),
    hole(11, 4, 344, 9),
    hole(12, 3, 150, 13),
    hole(13, 4, 347, 17),
    hole(14, 5, 493, 3),
    hole(15, 4, 311, 15),
    hole(16, 4, 348, 7),
    hole(17, 3, 158, 11),
    hole(18, 5, 504, 5),
  ],
  "Marbella Club Resort": [
    hole(1, 4, 311, 10),
    hole(2, 3, 112, 17),
    hole(3, 4, 338, 1),
    hole(4, 3, 167, 14),
    hole(5, 4, 351, 8),
    hole(6, 5, 498, 3),
    hole(7, 5, 456, 15),
    hole(8, 5, 457, 11),
    hole(9, 3, 164, 6),
    hole(10, 4, 302, 7),
    hole(11, 4, 333, 2),
    hole(12, 3, 138, 18),
    hole(13, 5, 468, 9),
    hole(14, 4, 293, 13),
    hole(15, 3, 166, 16),
    hole(16, 4, 338, 4),
    hole(17, 4, 372, 5),
    hole(18, 5, 460, 12),
  ],
  "Mijas Los Lagos": [
    hole(1, 5, 499, 9),
    hole(2, 3, 148, 17),
    hole(3, 4, 323, 15),
    hole(4, 4, 374, 7),
    hole(5, 5, 536, 3),
    hole(6, 4, 415, 1),
    hole(7, 4, 379, 13),
    hole(8, 3, 210, 5),
    hole(9, 4, 341, 11),
    hole(10, 4, 408, 2),
    hole(11, 3, 160, 8),
    hole(12, 4, 359, 10),
    hole(13, 5, 520, 4),
    hole(14, 4, 353, 6),
    hole(15, 5, 466, 16),
    hole(16, 3, 142, 18),
    hole(17, 4, 342, 14),
    hole(18, 4, 332, 12),
  ],
};

/** Looks up one hole's reference info, falling back to all-null when the course or hole is unknown. */
export function getHoleInfo(course: string | null, holeNumber: number): HoleInfo {
  const holes = course ? COURSE_HOLES[course] : undefined;
  return holes?.[holeNumber - 1] ?? { number: holeNumber, par: null, meters: null, index: null };
}
