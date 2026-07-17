"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Send,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventBySlug } from "@/services/event-service";
import {
  getFormByEventId,
  getFormFields,
  submitRegistration,
} from "@/services/registration-service";
import type { Event, RegistrationForm, RegistrationField } from "@/lib/types";
import { cn } from "@/lib/utils";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export default function RegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);

  const [event, setEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const ev = await getEventBySlug(slug);
      if (!ev) {
        setLoading(false);
        return;
      }
      setEvent(ev);

      const f = await getFormByEventId(ev.id);
      if (f) {
        setForm(f);
        const flds = await getFormFields(f.id);
        setFields(flds);
      }
    } catch {
      setError("Failed to load registration form.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updateField(fieldId: string, value: string) {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors["__name"] = "Name is required.";
    if (!email.trim()) errors["__email"] = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors["__email"] = "Invalid email address.";

    for (const field of fields) {
      if (field.required) {
        const val = formData[field.id];
        if (!val || !val.trim()) {
          errors[field.id] = `${field.label} is required.`;
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !form) return;
    if (!validate()) return;

    setSubmitting(true);
    setError(null);

    try {
      await submitRegistration({
        event_id: event.id,
        form_id: form.id,
        respondent_name: name.trim(),
        respondent_email: email.trim(),
        data: formData,
        status: "pending",
        notes: "",
        submitted_at: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch {
      setError("Failed to submit registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <PageWrapper>
          {loading ? (
            <RegisterSkeleton />
          ) : !event ? (
            <NotFoundState slug={slug} />
          ) : submitted ? (
            <SuccessState eventTitle={event.title} slug={slug} />
          ) : !form ? (
            <NoFormState />
          ) : (
            <RegisterFormContent
              event={event}
              form={form}
              fields={fields}
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              formData={formData}
              updateField={updateField}
              validationErrors={validationErrors}
              error={error}
              submitting={submitting}
              handleSubmit={handleSubmit}
            />
          )}
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}

function RegisterSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-6 w-32 mb-8" />
      <Skeleton className="h-10 w-3/4 mb-2" />
      <Skeleton className="h-6 w-1/2 mb-8" />
      <Card className="p-8 space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-xl" />
      </Card>
    </div>
  );
}

function NotFoundState({ slug }: { slug: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-32 text-center">
      <motion.div
        variants={fadeUp}
        custom={0}
        initial="hidden"
        animate="visible"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          <AlertCircle className="h-10 w-10 text-zinc-600" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Event Not Found</h1>
        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
          The event &ldquo;{slug}&rdquo; doesn&apos;t exist or has been removed.
        </p>
        <Link href="/events">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

function SuccessState({ eventTitle, slug }: { eventTitle: string; slug: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-32 text-center">
      <motion.div
        variants={fadeUp}
        custom={0}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20"
        >
          <CheckCircle className="h-10 w-10 text-green-400" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white mb-3">Registration Submitted!</h1>
        <p className="text-zinc-400 mb-2 max-w-md mx-auto">
          Your registration for <span className="text-white font-medium">{eventTitle}</span> has been received.
        </p>
        <p className="text-sm text-zinc-500 mb-8 max-w-md mx-auto">
          You will be notified once your registration is reviewed. Check your email for updates.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href={`/events/${slug}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Event
            </Button>
          </Link>
          <Link href="/events">
            <Button variant="ghost" className="gap-2 text-zinc-400">
              All Events
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function NoFormState() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-32 text-center">
      <motion.div
        variants={fadeUp}
        custom={0}
        initial="hidden"
        animate="visible"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          <AlertCircle className="h-10 w-10 text-zinc-600" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">No Registration Form</h1>
        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
          Registration is not available for this event at the moment.
        </p>
        <Link href="/events">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

interface RegisterFormContentProps {
  event: Event;
  form: RegistrationForm;
  fields: RegistrationField[];
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  formData: Record<string, string>;
  updateField: (fieldId: string, value: string) => void;
  validationErrors: Record<string, string>;
  error: string | null;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

function RegisterFormContent({
  event,
  form,
  fields,
  name,
  setName,
  email,
  setEmail,
  formData,
  updateField,
  validationErrors,
  error,
  submitting,
  handleSubmit,
}: RegisterFormContentProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-orange-400 transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {event.title}
        </Link>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={fadeUp} custom={1} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Register for {event.title}
          </h1>
          <p className="mt-2 text-zinc-400 text-sm">
            {form.title} &middot; Fields marked with <span className="text-red-400">*</span> are required
          </p>
        </motion.div>

        {/* Form */}
        <motion.div variants={fadeUp} custom={2}>
          <Card className="p-6 sm:p-8 bg-white/[0.03] border-white/[0.06]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                    validationErrors["__name"] && "border-red-500/50 focus-visible:ring-red-500/40"
                  )}
                />
                {validationErrors["__name"] && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors["__name"]}
                  </p>
                )}
              </div>

              {/* Email field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">
                  Email <span className="text-red-400">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    validationErrors["__email"] && "border-red-500/50 focus-visible:ring-red-500/40"
                  )}
                />
                {validationErrors["__email"] && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors["__email"]}
                  </p>
                )}
              </div>

              {/* Dynamic fields */}
              {fields.map((field) => (
                <DynamicField
                  key={field.id}
                  field={field}
                  value={formData[field.id] || ""}
                  onChange={(v) => updateField(field.id, v)}
                  error={validationErrors[field.id]}
                />
              ))}

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                className="w-full gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Registration
                  </>
                )}
              </Button>
            </form>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

function DynamicField({
  field,
  value,
  onChange,
  error,
}: {
  field: RegistrationField;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const baseInputClass = cn(
    "flex h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-zinc-600 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:border-orange-500/30 focus-visible:bg-white/[0.06]",
    error && "border-red-500/50 focus-visible:ring-red-500/40"
  );

  function renderInput() {
    switch (field.field_type) {
      case "text":
      case "discord":
      case "telegram":
      case "kick_username":
      case "ml_id":
      case "server_id":
      case "custom":
        return (
          <input
            type="text"
            className={baseInputClass}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "long_text":
      case "textarea":
        return (
          <textarea
            className={cn(baseInputClass, "min-h-[100px] resize-y py-3")}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "email":
        return (
          <input
            type="email"
            className={baseInputClass}
            placeholder={field.placeholder || "you@example.com"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "phone":
        return (
          <input
            type="tel"
            className={baseInputClass}
            placeholder={field.placeholder || "+62 xxx-xxxx-xxxx"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "number":
        return (
          <input
            type="number"
            className={baseInputClass}
            placeholder={field.placeholder || "0"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "date":
        return (
          <input
            type="date"
            className={cn(baseInputClass, "color-scheme-dark")}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "dropdown":
        return (
          <select
            className={cn(
              baseInputClass,
              "appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat pr-10"
            )}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="" className="bg-[#09090B] text-zinc-500">
              {field.placeholder || "Select an option"}
            </option>
            {field.options.map((opt) => (
              <option key={opt} value={opt} className="bg-[#09090B] text-white">
                {opt}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="flex flex-wrap gap-2">
            {field.options.map((opt) => (
              <label
                key={opt}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium cursor-pointer transition-all duration-200",
                  value === opt
                    ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                    : "border-white/[0.07] bg-white/[0.03] text-zinc-400 hover:border-white/[0.12] hover:text-zinc-300"
                )}
              >
                <input
                  type="radio"
                  name={`field-${field.id}`}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => onChange(e.target.value)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                    value === opt
                      ? "border-orange-500"
                      : "border-zinc-600"
                  )}
                >
                  {value === opt && (
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </span>
                {opt}
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="flex flex-wrap gap-2">
            {field.options.map((opt) => {
              const checked = value.split(",").includes(opt);
              return (
                <label
                  key={opt}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium cursor-pointer transition-all duration-200",
                    checked
                      ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                      : "border-white/[0.07] bg-white/[0.03] text-zinc-400 hover:border-white/[0.12] hover:text-zinc-300"
                  )}
                >
                  <input
                    type="checkbox"
                    value={opt}
                    checked={checked}
                    onChange={(e) => {
                      const current = value ? value.split(",") : [];
                      const next = e.target.checked
                        ? [...current, opt]
                        : current.filter((v) => v !== opt);
                      onChange(next.join(","));
                    }}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0",
                      checked
                        ? "border-orange-500 bg-orange-500"
                        : "border-zinc-600"
                    )}
                  >
                    {checked && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {opt}
                </label>
              );
            })}
          </div>
        );

      case "upload":
        return (
          <div className="flex items-center gap-3">
            <input
              type="text"
              className={baseInputClass}
              placeholder={field.placeholder || "Paste file URL or link"}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        );

      default:
        return (
          <input
            type="text"
            className={baseInputClass}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-300">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
