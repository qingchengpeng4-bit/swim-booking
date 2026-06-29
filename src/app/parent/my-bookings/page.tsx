import { PageHeader } from "@/components/common/PageHeader";
import { MyBookingsList } from "@/components/parent/MyBookingsList";
import { contactPhoneSchema } from "@/lib/validators";
import { getBookingsByContactPhone } from "@/services/booking.service";

export const dynamic = "force-dynamic";

type MyBookingsPageProps = {
  searchParams: Promise<{
    contactPhone?: string;
  }>;
};

export default async function MyBookingsPage({ searchParams }: MyBookingsPageProps) {
  const { contactPhone } = await searchParams;
  const parsed = contactPhone ? contactPhoneSchema.safeParse(contactPhone) : null;
  const bookings = parsed?.success ? await getBookingsByContactPhone(parsed.data) : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="我的预约" description="输入预约时填写的家长手机号，查询和取消自己的未来预约。" />

      <form className="rounded border border-gray-200 bg-white p-4" action="/parent/my-bookings">
        <label className="block">
          <span className="text-sm font-medium">家长手机号</span>
          <input
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            name="contactPhone"
            defaultValue={contactPhone ?? ""}
            inputMode="numeric"
            required
          />
        </label>
        {parsed && !parsed.success ? (
          <p className="mt-2 text-sm text-red-700">请填写正确的家长手机号。</p>
        ) : null}
        <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white" type="submit">
          查询
        </button>
      </form>

      <MyBookingsList initialBookings={bookings} />
    </main>
  );
}
