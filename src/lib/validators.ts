import { CourseType } from "@prisma/client";
import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^1[3-9]\d{9}$/, "请填写正确的家长手机号");

export const createBookingSchema = z.object({
  slotId: z.string().uuid("时间段 ID 不正确"),
  studentName: z.string().trim().min(2, "请填写学员大名，至少 2 个字").max(30, "学员姓名过长"),
  contactPhone: phoneSchema,
  courseType: z.nativeEnum(CourseType),
  remark: z.string().trim().max(200, "备注不能超过 200 字").optional().or(z.literal("")),
});

export const createCoachBookingSchema = z.object({
  slotId: z.string().uuid("时间段 ID 不正确"),
  studentName: z.string().trim().min(1, "请填写学员姓名。").max(30, "学员姓名过长"),
  contactPhone: z.string().trim().max(30, "联系方式过长").optional().or(z.literal("")),
  courseType: z.nativeEnum(CourseType),
  remark: z.string().trim().max(200, "备注不能超过 200 字").optional().or(z.literal("")),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid("预约 ID 不正确"),
  contactPhone: phoneSchema,
});

export const contactPhoneSchema = phoneSchema;
