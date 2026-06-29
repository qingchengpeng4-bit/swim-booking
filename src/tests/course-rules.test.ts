import { describe, expect, it } from "vitest";
import { CourseType } from "@prisma/client";
import { getCourseCapacity, isGroupCourse } from "../lib/course";

describe("course rules", () => {
  it("maps course types to capacity", () => {
    expect(getCourseCapacity(CourseType.ONE_TO_ONE)).toBe(1);
    expect(getCourseCapacity(CourseType.ONE_TO_TWO)).toBe(2);
    expect(getCourseCapacity(CourseType.ONE_TO_THREE)).toBe(3);
  });

  it("identifies fixed group course types", () => {
    expect(isGroupCourse(CourseType.ONE_TO_ONE)).toBe(false);
    expect(isGroupCourse(CourseType.ONE_TO_TWO)).toBe(true);
    expect(isGroupCourse(CourseType.ONE_TO_THREE)).toBe(true);
  });
});
