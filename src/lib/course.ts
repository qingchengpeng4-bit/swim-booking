import { CourseType } from "@prisma/client";

export const COURSE_LABELS: Record<CourseType, string> = {
  ONE_TO_ONE: "1v1",
  ONE_TO_TWO: "1v2",
  ONE_TO_THREE: "1v3",
};

export function getCourseCapacity(courseType: CourseType) {
  switch (courseType) {
    case CourseType.ONE_TO_ONE:
      return 1;
    case CourseType.ONE_TO_TWO:
      return 2;
    case CourseType.ONE_TO_THREE:
      return 3;
  }
}

export function isGroupCourse(courseType: CourseType | null | undefined) {
  return courseType === CourseType.ONE_TO_TWO || courseType === CourseType.ONE_TO_THREE;
}
