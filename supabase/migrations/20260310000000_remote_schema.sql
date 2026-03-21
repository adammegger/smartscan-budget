


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."delete_user"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current authenticated user ID
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Delete user data from related tables 
    -- (Order matters due to potential foreign key constraints)
    
    -- 1. Delete items (they belong to user_id and reference receipts)
    DELETE FROM items WHERE user_id = current_user_id;
    
    -- 2. Delete receipts
    DELETE FROM receipts WHERE user_id = current_user_id;
    
    -- 3. Delete budgets
    DELETE FROM budgets WHERE user_id = current_user_id;
    
    -- 4. Delete achievements
    DELETE FROM achievements WHERE user_id = current_user_id;
    
    -- 5. Delete custom categories
    DELETE FROM categories WHERE user_id = current_user_id;
    
    -- 6. Delete profile (In profiles table, the user reference is the 'id' column)
    DELETE FROM profiles WHERE id = current_user_id;
    
    -- 7. Delete user from auth.users (this cascade-deletes their auth identity)
    DELETE FROM auth.users WHERE id = current_user_id;
    
    -- Log the deletion for audit purposes
    RAISE LOG 'User % and all their data have been successfully deleted', current_user_id;
END;
$$;


ALTER FUNCTION "public"."delete_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_data_summary"("user_id" "uuid") RETURNS TABLE("receipts_count" integer, "budgets_count" integer, "profile_exists" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
    SELECT 
        COALESCE((SELECT COUNT(*) FROM receipts WHERE user_id = $1), 0),
        COALESCE((SELECT COUNT(*) FROM budgets WHERE user_id = $1), 0),
        EXISTS(SELECT 1 FROM profiles WHERE user_id = $1)
$_$;


ALTER FUNCTION "public"."get_user_data_summary"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, green_leaves_count, onboarded, subscription_tier)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''), 
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    0,     
    false, 
    'free' -- Nowi userzy zawsze zaczynają jako 'free'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_user_green_leaves"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Znajdź user_id powiązane z tym paragonem (receipt_id)
    SELECT user_id INTO target_user_id 
    FROM public.receipts 
    WHERE id = COALESCE(NEW.receipt_id, OLD.receipt_id);

    -- Zaktualizuj licznik w tabeli profiles
    UPDATE public.profiles
    SET green_leaves_count = (
        SELECT COUNT(*)
        FROM public.items i
        JOIN public.receipts r ON i.receipt_id = r.id
        WHERE r.user_id = target_user_id AND i.is_bio = TRUE
    )
    WHERE id = target_user_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_user_green_leaves"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_profiles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_green_leaves"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Oblicz sumę is_bio z tabeli items dla właściciela paragonu (receipt_id -> user_id)
    UPDATE public.profiles
    SET green_leaves_count = (
        SELECT COUNT(*)
        FROM public.items i
        JOIN public.receipts r ON i.receipt_id = r.id
        WHERE r.user_id = public.profiles.id AND i.is_bio = TRUE
    )
    WHERE id = (SELECT user_id FROM public.receipts WHERE id = COALESCE(NEW.receipt_id, OLD.receipt_id));
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_green_leaves"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "awarded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "value" numeric
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budgets" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_name" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "period" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category_id" "uuid"
);


ALTER TABLE "public"."budgets" OWNER TO "postgres";


ALTER TABLE "public"."budgets" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."budgets_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text",
    "color" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "receipt_id" "uuid",
    "name" character varying(255) NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "category" character varying(100) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "unit" character varying(20) DEFAULT 'szt'::character varying,
    "quantity" numeric(10,3) DEFAULT 1.000,
    "brand" character varying(255),
    "category_id" "uuid",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "is_bio" boolean DEFAULT false,
    CONSTRAINT "chk_items_price_positive" CHECK (("price" > (0)::numeric)),
    CONSTRAINT "chk_items_quantity_positive" CHECK (("quantity" > (0)::numeric))
);


ALTER TABLE "public"."items" OWNER TO "postgres";


COMMENT ON COLUMN "public"."items"."unit" IS 'Jednostka miary produktu (np. kg, szt, l)';



COMMENT ON COLUMN "public"."items"."quantity" IS 'Ilość zakupionego produktu w danej jednostce';



COMMENT ON COLUMN "public"."items"."brand" IS 'Marka lub producent produktu';



COMMENT ON COLUMN "public"."items"."is_bio" IS 'Oznacza, czy produkt jest ekologiczny/BIO';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "avatar_url" "text",
    "updated_at" timestamp with time zone,
    "green_leaves_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'user'::"text",
    "locale" "text" DEFAULT 'pl-PL'::"text",
    "onboarded" boolean DEFAULT false,
    "subscription_tier" "text" DEFAULT 'free'::"text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receipts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "store_name" character varying(255) NOT NULL,
    "date" "date" NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "category" character varying(100) NOT NULL,
    "isvisible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "category_id" "uuid"
);


ALTER TABLE "public"."receipts" OWNER TO "postgres";


ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_user_id_type_key" UNIQUE ("user_id", "type");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "unique_user_category" UNIQUE ("user_id", "category_name");



CREATE INDEX "idx_achievements_user_id" ON "public"."achievements" USING "btree" ("user_id");



CREATE INDEX "idx_budgets_user_category" ON "public"."budgets" USING "btree" ("user_id", "category_name");



CREATE INDEX "idx_items_category" ON "public"."items" USING "btree" ("category");



CREATE INDEX "idx_items_receipt_id" ON "public"."items" USING "btree" ("receipt_id");



CREATE INDEX "idx_profiles_id" ON "public"."profiles" USING "btree" ("id");



CREATE INDEX "idx_receipts_category" ON "public"."receipts" USING "btree" ("category");



CREATE INDEX "idx_receipts_date" ON "public"."receipts" USING "btree" ("date");



CREATE OR REPLACE TRIGGER "trigger_sync_leaves" AFTER INSERT OR DELETE OR UPDATE ON "public"."items" FOR EACH ROW EXECUTE FUNCTION "public"."sync_user_green_leaves"();



CREATE OR REPLACE TRIGGER "trigger_update_leaves" AFTER INSERT OR DELETE OR UPDATE ON "public"."items" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_green_leaves"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_profiles_updated_at"();



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "fk_items_receipt_id" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Users can delete their own items" ON "public"."items" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own receipts" ON "public"."receipts" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own achievements" ON "public"."achievements" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own items" ON "public"."items" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own receipts" ON "public"."receipts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can see their own budgets" ON "public"."budgets" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own items" ON "public"."items" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own receipts" ON "public"."receipts" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view system and own categories" ON "public"."categories" FOR SELECT USING ((("user_id" IS NULL) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Users can view their own achievements" ON "public"."achievements" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own items" ON "public"."items" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own receipts" ON "public"."receipts" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Użytkownicy mogą aktualizować swój profil" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Użytkownicy mogą widzieć swój własny profil" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budgets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."receipts" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."delete_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_data_summary"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_data_summary"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_data_summary"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_user_green_leaves"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_user_green_leaves"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_user_green_leaves"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profiles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_green_leaves"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_green_leaves"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_green_leaves"() TO "service_role";


















GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";



GRANT ALL ON TABLE "public"."budgets" TO "anon";
GRANT ALL ON TABLE "public"."budgets" TO "authenticated";
GRANT ALL ON TABLE "public"."budgets" TO "service_role";



GRANT ALL ON SEQUENCE "public"."budgets_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."budgets_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."budgets_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."receipts" TO "anon";
GRANT ALL ON TABLE "public"."receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."receipts" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































