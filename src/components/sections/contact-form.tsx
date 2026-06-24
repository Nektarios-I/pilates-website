"use client";

export function ContactForm() {
  return (
    <form className="w-full">
      <div className="mb-6">
        <label
          className="block font-sans font-semibold text-[13px] uppercase tracking-widest leading-none text-[#2D3A1F] mb-2"
          htmlFor="contact-name"
        >
          Name
        </label>
        <input
          autoComplete="name"
          className="w-full bg-[#E8E2D0] rounded-xl p-4 font-sans text-[17px] text-[#2D3A1F] placeholder:text-[#2D3A1F]/50 focus:outline-none focus:ring-2 focus:ring-[#B8A678] transition-all duration-200"
          id="contact-name"
          name="name"
          placeholder="Your name"
          type="text"
        />
      </div>
      <div className="mb-6">
        <label
          className="block font-sans font-semibold text-[13px] uppercase tracking-widest leading-none text-[#2D3A1F] mb-2"
          htmlFor="contact-email"
        >
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full bg-[#E8E2D0] rounded-xl p-4 font-sans text-[17px] text-[#2D3A1F] placeholder:text-[#2D3A1F]/50 focus:outline-none focus:ring-2 focus:ring-[#B8A678] transition-all duration-200"
          id="contact-email"
          name="email"
          placeholder="you@example.com"
          type="email"
        />
      </div>
      <div className="mb-6">
        <label
          className="block font-sans font-semibold text-[13px] uppercase tracking-widest leading-none text-[#2D3A1F] mb-2"
          htmlFor="contact-message"
        >
          Message
        </label>
        <textarea
          className="w-full min-h-[160px] bg-[#E8E2D0] rounded-xl p-4 font-sans text-[17px] text-[#2D3A1F] placeholder:text-[#2D3A1F]/50 focus:outline-none focus:ring-2 focus:ring-[#B8A678] transition-all duration-200 resize-y"
          id="contact-message"
          name="message"
          placeholder="How can we help?"
        />
      </div>
      <button
        className="inline-flex min-h-11 w-full items-center justify-center border-0 bg-[#2D3A1F] text-[#F4F1E8] px-8 py-4 rounded-full font-sans font-semibold text-[13px] uppercase tracking-widest transition-all duration-200 hover:bg-[#B8A678] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8A678] cursor-pointer"
        type="submit"
      >
        Send message
      </button>
    </form>
  );
}
