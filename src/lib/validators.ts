import { CourseType } from "@prisma/client";
import { z } from "zod";

export const createBookingSchema = z.object({
  slotId: z.string().uuid("时间段 ID 不正确"),
  studentName: z.string().trim().min(2, "请填写学员大名，至少 2 个字").max(30, "学员姓名过长"),
  contactPhone: z
    .string()
    .trim()
    .regex(/^1[3-9]\d{9}$/, "请填写正确的家长手机号"),
  courseType: z.nativeEnum(CourseType),
  remark: z.string().trim().max(200, "备注不能超过 200 字").optional().or(z.literal("")),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid("预约 ID 不正确"),
  contactPhone: z
    .string()
    .trim()
    .regex(/^1[3-9]\d{9}$/, "请填写正确的家长手机号"),
});

export const contactPhoneSchema = z
  .string()
  .trim()
  .regex(/^1[3-9]\d{9}$/, "请填写正确的家长手机号");
