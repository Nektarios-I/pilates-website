export type ContactFormInput = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export type ContactFormValues = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d\s.-]{6,32}$/;

export function normalize_contact_input(input: ContactFormInput): ContactFormValues {
  return {
    name: input.name.trim().replace(/\s+/g, ' '),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim().replace(/\s+/g, ' '),
    message: input.message.trim(),
  };
}

export function validate_contact_input(input: ContactFormInput): string | null {
  const values = normalize_contact_input(input);

  if (!values.name) {
    return 'Name is required.';
  }
  if (values.name.length < 2 || values.name.length > 120) {
    return 'Name must be between 2 and 120 characters.';
  }

  if (!values.email) {
    return 'Email is required.';
  }
  if (!EMAIL_PATTERN.test(values.email) || values.email.length > 254) {
    return 'Enter a valid email address.';
  }

  if (!values.phone) {
    return 'Phone is required.';
  }
  if (!PHONE_PATTERN.test(values.phone)) {
    return 'Enter a valid phone number (at least 6 digits; +, spaces, and dashes are allowed).';
  }

  if (!values.message) {
    return 'Message is required.';
  }
  if (values.message.length < 10) {
    return 'Message must be at least 10 characters.';
  }
  if (values.message.length > 5000) {
    return 'Message must be 5000 characters or fewer.';
  }

  return null;
}
