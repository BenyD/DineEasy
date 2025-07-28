CREATE TRIGGER create_profile_after_user_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_user_profile();


create policy "Allow authenticated users to delete avatar images"
on "storage"."objects"
as permissive
for delete
to authenticated
using ((bucket_id = 'avatars'::text));


create policy "Allow authenticated users to delete menu images"
on "storage"."objects"
as permissive
for delete
to authenticated
using ((bucket_id = 'menu-images'::text));


create policy "Allow authenticated users to delete restaurant images"
on "storage"."objects"
as permissive
for delete
to authenticated
using ((bucket_id = 'restaurant-images'::text));


create policy "Allow authenticated users to update avatar images"
on "storage"."objects"
as permissive
for update
to authenticated
using ((bucket_id = 'avatars'::text))
with check ((bucket_id = 'avatars'::text));


create policy "Allow authenticated users to update menu images"
on "storage"."objects"
as permissive
for update
to authenticated
using ((bucket_id = 'menu-images'::text))
with check ((bucket_id = 'menu-images'::text));


create policy "Allow authenticated users to update restaurant images"
on "storage"."objects"
as permissive
for update
to authenticated
using ((bucket_id = 'restaurant-images'::text))
with check ((bucket_id = 'restaurant-images'::text));


create policy "Allow authenticated users to upload avatar images"
on "storage"."objects"
as permissive
for insert
to authenticated
with check ((bucket_id = 'avatars'::text));


create policy "Allow authenticated users to upload menu images"
on "storage"."objects"
as permissive
for insert
to authenticated
with check ((bucket_id = 'menu-images'::text));


create policy "Allow authenticated users to upload restaurant images"
on "storage"."objects"
as permissive
for insert
to authenticated
with check ((bucket_id = 'restaurant-images'::text));


create policy "Public can view avatar images"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'avatars'::text));


create policy "Public can view menu images"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'menu-images'::text));


create policy "Public can view restaurant images"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'restaurant-images'::text));



