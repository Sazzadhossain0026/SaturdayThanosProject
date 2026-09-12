"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";

const inputClass =
  "mt-1 w-full rounded-xl border border-black/10 px-3.5 py-3 text-sm outline-none focus:border-brand-orange";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  eventDate: "",
  guests: "",
  location: "",
  budget: "",
  preferences: "",
  message: "",
};

export default function CateringPage() {
  const { addCateringLead } = useApp();
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof typeof initialForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addCateringLead(form);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <span className="text-5xl">🎉</span>
        <h1 className="font-display mt-4 text-2xl font-extrabold text-brand-ink">
          Thanks! Gapush Gupush will contact you shortly.
        </h1>
        <p className="mt-2 text-sm text-brand-ink/50">
          We&apos;ve saved your catering request and a member of our team will
          reach out to plan the details.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-2xl bg-brand-orange px-6 py-3 font-bold text-white active:scale-95"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 pt-8 pb-20">
      <div className="text-center">
        <span className="text-4xl">🎉</span>
        <h1 className="font-display mt-3 text-3xl font-extrabold text-brand-ink">
          Catering Request
        </h1>
        <p className="mt-1 text-sm text-brand-ink/50">
          Weddings, offices, community events — let Gapush Gupush cater your next
          gathering.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
      >
        <Field label="Name">
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Event Date">
            <input
              required
              type="date"
              value={form.eventDate}
              onChange={(e) => update("eventDate", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Number of Guests">
            <input
              required
              type="number"
              min={1}
              value={form.guests}
              onChange={(e) => update("guests", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Location">
          <input
            required
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="Venue / address / borough"
            className={inputClass}
          />
        </Field>
        <Field label="Estimated Budget">
          <input
            value={form.budget}
            onChange={(e) => update("budget", e.target.value)}
            placeholder="e.g. $1,000 – $1,500"
            className={inputClass}
          />
        </Field>
        <Field label="Food Preferences">
          <input
            value={form.preferences}
            onChange={(e) => update("preferences", e.target.value)}
            placeholder="e.g. Beef Chap, vegetarian options"
            className={inputClass}
          />
        </Field>
        <Field label="Message">
          <textarea
            rows={3}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </Field>

        <button
          type="submit"
          className="w-full rounded-2xl bg-brand-orange py-4 font-bold text-white shadow-md active:scale-[0.98]"
        >
          Submit Catering Request
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-brand-ink/50">{label}</span>
      {children}
    </label>
  );
}
