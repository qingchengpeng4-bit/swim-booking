"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CoachLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/coach/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: formData.get("password"),
      }),
    });
    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "登录失败");
      return;
    }

    router.push("/coach/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-4 rounded border border-gray-200 bg-white p-4" onSubmit={onSubmit}>
      {error ? <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <label className="block">
        <span className="text-sm font-medium">教练密码</span>
        <input className="mt-1 w-full rounded border border-gray-300 px-3 py-2" name="password" type="password" required />
      </label>
      <button className="w-full rounded bg-blue-600 px-4 py-3 text-white disabled:bg-gray-400" disabled={submitting} type="submit">
        {submitting ? "登录中..." : "登录"}
      </button>
    </form>
  );
}
