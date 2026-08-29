/*
  Create contact_inquiries table

  Stores messages submitted through the "Контакти" (Contacts) page contact form.

  Security:
  - RLS enabled.
  - INSERT open to anon + authenticated: this is a public contact form on a
    catalog with no visitor sign-in, so the form must work for the anon role.
  - SELECT/UPDATE/DELETE restricted to authenticated: submissions contain
    personal contact details (email, phone) and must never be readable by
    anonymous visitors.
  - No user_id column: inquiries come from anonymous visitors, so there is no
    owner relationship to enforce.

  Rate limiting / spam protection is handled at the application layer.
*/

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_can_submit_inquiry" ON contact_inquiries;
CREATE POLICY "anon_can_submit_inquiry"
ON contact_inquiries FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "owner_can_read_inquiries" ON contact_inquiries;
CREATE POLICY "owner_can_read_inquiries"
ON contact_inquiries FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "owner_can_update_inquiries" ON contact_inquiries;
CREATE POLICY "owner_can_update_inquiries"
ON contact_inquiries FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "owner_can_delete_inquiries" ON contact_inquiries;
CREATE POLICY "owner_can_delete_inquiries"
ON contact_inquiries FOR DELETE
TO authenticated
USING (true);
