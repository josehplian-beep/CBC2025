-- Create storage bucket for department member photos
insert into storage.buckets (id, name, public)
values ('department-photos', 'department-photos', true);

-- Allow admins to upload department member photos
create policy "Admins can upload department photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'department-photos' 
  and has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update department member photos
create policy "Admins can update department photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'department-photos' 
  and has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete department member photos
create policy "Admins can delete department photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'department-photos' 
  and has_role(auth.uid(), 'admin'::app_role)
);

-- Allow public read access to department photos
create policy "Anyone can view department photos"
on storage.objects
for select
to public
using (bucket_id = 'department-photos');