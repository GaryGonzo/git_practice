import { useState, type FormEvent } from "react";
import { Section, SectionHeading, Card } from "../components/ui";

const COURSE_TYPES = ["Public", "Municipal", "Semi-private", "Private", "Resort"];

export function Apply() {
  const [submitted, setSubmitted] = useState(false);

  // NOTE: this form is presentational only. Wire `onSubmit` to a real form
  // backend before launch (e.g. a hosted form endpoint, or a lightweight
  // serverless function that emails/logs the lead) — there is no backend in
  // this package to receive submissions yet.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <Section className="pb-6">
        <SectionHeading
          eyebrow="Apply for a call"
          title="Tell us about your course."
          subtitle="We review every application before booking a call — this isn't a mass-market service, and we want the first conversation to be worth your time. Expect a reply within 1–2 business days."
        />
      </Section>

      <Section className="pt-0">
        <Card className="max-w-2xl bg-white p-8">
          {submitted ? (
            <div className="py-8 text-center">
              <div className="font-display text-2xl text-fairway-dark">Thanks — got it.</div>
              <p className="mt-3 text-[15px] text-ink/70">
                We'll review your application and follow up within 1–2 business days to schedule a
                15-minute discovery call.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Course name" name="courseName" required />
                <Field label="Your name" name="contactName" required />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Email" name="email" type="email" required />
                <Field label="Phone" name="phone" type="tel" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Role" name="role" placeholder="GM, Owner, Director of Golf..." />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink/70">Course type</label>
                  <select
                    name="courseType"
                    className="w-full rounded-sm border border-sand bg-cream px-3 py-2.5 text-[15px] focus:border-fairway focus:outline-none"
                  >
                    {COURSE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/70">
                  What's the biggest revenue leak you'd want us to look at first?
                </label>
                <textarea
                  name="notes"
                  rows={4}
                  className="w-full rounded-sm border border-sand bg-cream px-3 py-2.5 text-[15px] focus:border-fairway focus:outline-none"
                  placeholder="e.g. slow weekday tee times, a database we haven't emailed in a year, membership renewals falling through the cracks..."
                />
              </div>
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-sm bg-gold px-6 py-3 text-[15px] font-semibold text-fairway-dark hover:bg-gold-light"
              >
                Submit Application
              </button>
            </form>
          )}
        </Card>
      </Section>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink/70">
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-sm border border-sand bg-cream px-3 py-2.5 text-[15px] focus:border-fairway focus:outline-none"
      />
    </div>
  );
}
