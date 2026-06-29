# 游泳课预约系统 v0.1

v0.1 只验证核心预约规则：课型锁定、容量判断、取消释放名额、当天不可预约/取消、多人课姓名展示和家长端脱敏。

## 技术栈

- Next.js
- TypeScript
- Prisma
- Neon PostgreSQL
- Tailwind CSS
- Vitest

## Neon 配置

1. 打开 https://neon.com/ 并创建项目。
2. 进入项目后点击 `Connect`。
3. 复制两条连接字符串：
   - `Pooled connection` 写入 `DATABASE_URL`，host 通常包含 `-pooler`。
   - `Direct connection` 写入 `DIRECT_URL`，host 通常不包含 `-pooler`。
4. 新建 `.env`，参考 `.env.example` 填写真实连接串。

## 本地运行

```bash
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

打开 http://localhost:3000。

## 常见连接问题

- 确认修改的是 `.env`，不是 `.env.example`。
- 确认连接串带有 `?sslmode=require`。
- `DATABASE_URL` 用 pooled URL，`DIRECT_URL` 用 direct URL。
- Neon serverless 数据库休眠后首次连接可能需要几秒，可重试 migration。
- 如果 seed 或 migration 报 prepared statement 错误，检查 `DIRECT_URL` 是否误用了带 `-pooler` 的 URL。

## 工程约定

- 预约规则集中在 `src/services/booking.service.ts` 和 `src/services/slot.service.ts`。
- Slot 展示状态集中在 `src/lib/slot-status.ts`。
- 当天判断集中在 `src/lib/dates.ts`，统一按 `Asia/Shanghai`。
- 预约记录不物理删除，只改状态。
- 家长端接口必须脱敏，不返回其他人的手机号、备注、报名时间。
