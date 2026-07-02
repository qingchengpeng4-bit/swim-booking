export const APP_ERRORS = {
  SLOT_NOT_FOUND: {
    code: "SLOT_NOT_FOUND",
    message: "时间段不存在",
    status: 404,
  },
  SLOT_CLOSED: {
    code: "SLOT_CLOSED",
    message: "该时间段暂不可预约",
    status: 400,
  },
  SLOT_ALREADY_FULL: {
    code: "SLOT_ALREADY_FULL",
    message: "该时间段已满员，不能继续预约",
    status: 400,
  },
  SLOT_JUST_FILLED: {
    code: "SLOT_JUST_FILLED",
    message: "该时间段刚刚被其他人约满，请选择其他时间。",
    status: 409,
  },
  SLOT_ALREADY_STARTED: {
    code: "SLOT_ALREADY_STARTED",
    message: "课程已开始或已过期，无法预约。",
    status: 400,
  },
  SLOT_NOT_RELEASED: {
    code: "SLOT_NOT_RELEASED",
    message: "该时间段暂未开放预约，请等待教练开放。",
    status: 400,
  },
  COURSE_TYPE_MISMATCH: {
    code: "COURSE_TYPE_MISMATCH",
    message: "该时间段已锁定其他课程类型，不能选择不同课型",
    status: 400,
  },
  TODAY_BOOKING_NOT_ALLOWED: {
    code: "TODAY_BOOKING_NOT_ALLOWED",
    message: "今日课程不可在线预约，请联系教练",
    status: 400,
  },
  TODAY_PARENT_CANCEL_NOT_ALLOWED: {
    code: "TODAY_PARENT_CANCEL_NOT_ALLOWED",
    message: "当天课程不可在线取消，请联系教练。",
    status: 400,
  },
  BOOKING_NOT_FOUND: {
    code: "BOOKING_NOT_FOUND",
    message: "预约不存在",
    status: 404,
  },
  BOOKING_PHONE_MISMATCH: {
    code: "BOOKING_PHONE_MISMATCH",
    message: "手机号不匹配，不能取消该预约",
    status: 403,
  },
  BOOKING_ALREADY_CANCELLED: {
    code: "BOOKING_ALREADY_CANCELLED",
    message: "该预约已取消，不能重复取消",
    status: 400,
  },
  BOOKING_CONFLICT_RETRY_LATER: {
    code: "BOOKING_CONFLICT_RETRY_LATER",
    message: "当前预约人数较多，请稍后重试。",
    status: 409,
  },
  DUPLICATE_BOOKING: {
    code: "DUPLICATE_BOOKING",
    message: "该手机号已预约此时间段，不能重复预约",
    status: 400,
  },
  DATABASE_UNAVAILABLE: {
    code: "DATABASE_UNAVAILABLE",
    message: "系统暂时繁忙，请稍后再试。",
    status: 503,
  },
  STUDENT_NAME_REQUIRED: {
    code: "STUDENT_NAME_REQUIRED",
    message: "请填写学员姓名。",
    status: 400,
  },
} as const;

export type AppErrorCode = keyof typeof APP_ERRORS;
export type AppErrorDefinition = (typeof APP_ERRORS)[AppErrorCode];
