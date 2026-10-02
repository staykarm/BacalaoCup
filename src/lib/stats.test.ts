import { describe, expect, it } from "vitest";
import { rankByValue } from "./stats";

describe("rankByValue", () => {
  it("gives every item a distinct rank when there are no ties", () => {
    expect(rankByValue([5, 4, 3], (n) => n)).toEqual([1, 2, 3]);
  });

  it("gives tied items the same rank and skips ranks for the next distinct value", () => {
    // 1st, 1st, 3rd, 4th, 4th, 6th — standard "1224" competition ranking.
    expect(rankByValue([5, 5, 4, 3, 3, 2], (n) => n)).toEqual([1, 1, 3, 4, 4, 6]);
  });

  it("treats values equal after rounding to one decimal as tied", () => {
    // 0.1 + 0.2 === 0.30000000000000004 in floating point, but both round to 0.3.
    expect(rankByValue([0.1 + 0.2, 0.3, 0.1], (n) => n)).toEqual([1, 1, 3]);
  });

  it("ranks everyone 1st when all values are equal", () => {
    expect(rankByValue([1, 1, 1], (n) => n)).toEqual([1, 1, 1]);
  });

  it("returns an empty array for an empty input", () => {
    expect(rankByValue([] as number[], (n) => n)).toEqual([]);
  });
});
