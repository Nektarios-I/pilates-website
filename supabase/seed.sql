-- Development seed data for Pilates studio
-- This file provides initial data for local development and testing
-- Run this after the initial migration

-- Insert sample packages
insert into public.packages (name, package_type, credits_total, validity_days, price, description) values
  ('Intro Offer', 'intro_offer', 3, 14, 45.00, 'Three classes to try the studio'),
  ('Single Class', 'credit_pack', 1, 30, 25.00, 'Drop-in rate for one class'),
  ('5-Class Pack', 'credit_pack', 5, 60, 110.00, 'Five classes to use within 60 days'),
  ('10-Class Pack', 'credit_pack', 10, 90, 200.00, 'Ten classes to use within 90 days'),
  ('Monthly Unlimited', 'unlimited', null, 30, 180.00, 'Unlimited classes for one month');

-- Note: User profiles and roles should be created through the admin interface
-- or via the auth.users table when implementing the invite/onboarding flow
