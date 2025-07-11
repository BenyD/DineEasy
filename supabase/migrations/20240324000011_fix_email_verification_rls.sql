-- Drop existing policies
drop policy if exists "Service role has full access to email verifications" on public.email_verifications;
drop policy if exists "Users can read their own email verifications" on public.email_verifications;

-- Create new policies that allow service role to insert
create policy "Service role has full access to email verifications"
  on public.email_verifications
  for all
  to service_role
  using (true)
  with check (true);

-- Allow authenticated users to read their own verifications
create policy "Users can read their own email verifications"
  on public.email_verifications
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow service role to insert verifications (needed during signup)
create policy "Service role can insert email verifications"
  on public.email_verifications
  for insert
  to service_role
  with check (true);

-- Allow service role to update verifications
create policy "Service role can update email verifications"
  on public.email_verifications
  for update
  to service_role
  using (true)
  with check (true); 