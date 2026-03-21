drop policy "Użytkownicy mogą aktualizować swój profil" on "public"."profiles";

drop policy "Użytkownicy mogą widzieć swój własny profil" on "public"."profiles";


  create policy "User can create own profile"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = id));



  create policy "Użytkownicy mogą aktualizować swój profil"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((auth.uid() = id));



  create policy "Użytkownicy mogą widzieć swój własny profil"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((auth.uid() = id));



