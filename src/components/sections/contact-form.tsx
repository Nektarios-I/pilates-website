"use client";

import { useState, useTransition } from "react";

import { submit_contact_message } from "@/app/(marketing)/contact/actions";

const input_class =
  "w-full bg-surface rounded-xl p-4 font-sans text-[17px] text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200";

const label_class =
  "block font-sans font-semibold text-[13px] uppercase tracking-widest leading-none text-foreground mb-2";

export function ContactForm() {
  const [name, set_name] = useState("");
  const [email, set_email] = useState("");
  const [phone, set_phone] = useState("");
  const [message, set_message] = useState("");
  const [form_error, set_form_error] = useState<string | null>(null);
  const [success, set_success] = useState(false);
  const [is_pending, start_transition] = useTransition();

  function clear_form_error() {
    set_form_error(null);
  }

  function handle_submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (is_pending) return;

    set_form_error(null);
    set_success(false);

    start_transition(async () => {
      const result = await submit_contact_message({ name, email, phone, message });

      if (result.success) {
        set_name("");
        set_email("");
        set_phone("");
        set_message("");
        set_form_error(null);
        set_success(true);
        return;
      }

      set_form_error(result.error);
    });
  }

  return (
    <form className="w-full" noValidate onSubmit={handle_submit}>
      {success ? (
        <div
          className="mb-6 rounded-xl bg-surface p-4 font-sans text-[17px] leading-relaxed text-foreground"
          role="status"
        >
          Thank you — your message was sent. We will get back to you soon.
        </div>
      ) : null}

      {form_error ? (
        <p className="mb-6 font-sans text-sm text-destructive" role="alert">
          {form_error}
        </p>
      ) : null}

      <div className="mb-6">
        <label className={label_class} htmlFor="contact-name">
          Name
        </label>
        <input
          autoComplete="name"
          className={input_class}
          id="contact-name"
          name="name"
          placeholder="Your name"
          required
          type="text"
          value={name}
          onChange={(event) => {
            set_name(event.target.value);
            clear_form_error();
          }}
        />
      </div>

      <div className="mb-6">
        <label className={label_class} htmlFor="contact-email">
          Email
        </label>
        <input
          autoComplete="email"
          className={input_class}
          id="contact-email"
          inputMode="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
          value={email}
          onChange={(event) => {
            set_email(event.target.value);
            clear_form_error();
          }}
        />
      </div>

      <div className="mb-6">
        <label className={label_class} htmlFor="contact-phone">
          Phone
        </label>
        <input
          autoComplete="tel"
          className={input_class}
          id="contact-phone"
          inputMode="tel"
          name="phone"
          placeholder="+357 99 000000"
          required
          type="tel"
          value={phone}
          onChange={(event) => {
            set_phone(event.target.value);
            clear_form_error();
          }}
        />
      </div>

      <div className="mb-6">
        <label className={label_class} htmlFor="contact-message">
          Message
        </label>
        <textarea
          className={`${input_class} min-h-[160px] resize-y`}
          id="contact-message"
          name="message"
          placeholder="How can we help?"
          required
          value={message}
          onChange={(event) => {
            set_message(event.target.value);
            clear_form_error();
          }}
        />
      </div>

      <button
        className="inline-flex min-h-11 w-full items-center justify-center border-0 bg-primary text-primary-foreground px-8 py-4 rounded-full font-sans font-semibold text-[13px] uppercase tracking-widest transition-all duration-200 hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        disabled={is_pending}
        type="submit"
      >
        {is_pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
