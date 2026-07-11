export type SessionItem = {
  id: string;
  title: string;
  description: string | null;
  session_type: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  credits_required: number;
  location: string | null;
  instructor_name: string | null;
  confirmed_count: number;
};

export type PackageItem = {
  id: string;
  credits_remaining: number | null;
  expires_at: string | null;
  package_name: string;
  class_type: string;
  package_type: string;
};
