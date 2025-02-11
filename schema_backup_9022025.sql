

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


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."user_role" AS ENUM (
    'customer',
    'driver',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_restaurant_for_admin"("admin_id" "uuid", "restaurant_name" "text", "restaurant_description" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO restaurants (name, description, admin_id)
  VALUES (restaurant_name, restaurant_description, admin_id);
END;
$$;


ALTER FUNCTION "public"."create_restaurant_for_admin"("admin_id" "uuid", "restaurant_name" "text", "restaurant_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_profile_and_restaurant"("user_id" "uuid", "user_role" "text", "rest_name" "text" DEFAULT NULL::"text", "rest_description" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Start a transaction
  BEGIN
    -- Insert or update the user profile
    INSERT INTO profiles (id, role)
    VALUES (user_id, user_role)
    ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role;

    -- If the user is an admin and restaurant details are provided, create the restaurant
    IF user_role = 'admin' AND rest_name IS NOT NULL THEN
      INSERT INTO restaurants (name, description, admin_id)
      VALUES (rest_name, rest_description, user_id);
    END IF;

    -- If we reach this point without errors, commit the transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- If there is any error, roll back the transaction
      ROLLBACK;
      RAISE;
  END;
END;
$$;


ALTER FUNCTION "public"."create_user_profile_and_restaurant"("user_id" "uuid", "user_role" "text", "rest_name" "text", "rest_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    default_role text;
BEGIN
    -- Get role from metadata or use default
    default_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::text,
        'customer'
    );

    -- Insert into profiles with error handling
    BEGIN
        INSERT INTO public.profiles (id, role, created_at, updated_at)
        VALUES (
            NEW.id,
            default_role,
            NOW(),
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
    END;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.profiles
  SET updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_user_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_admin_and_create_restaurant"("admin_user_id" "uuid", "rest_name" "text", "rest_description" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- First ensure the profile exists and is an admin
    INSERT INTO public.profiles (id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin'
    WHERE profiles.id = admin_user_id;

    -- Then create the restaurant
    INSERT INTO public.restaurants (
        name,
        description,
        admin_id
    ) VALUES (
        rest_name,
        rest_description,
        admin_user_id
    );
END;
$$;


ALTER FUNCTION "public"."register_admin_and_create_restaurant"("admin_user_id" "uuid", "rest_name" "text", "rest_description" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."menu_items" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "category" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "image_url" "text",
    "restaurant_id" integer
);


ALTER TABLE "public"."menu_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."menu_items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."menu_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."menu_items_id_seq" OWNED BY "public"."menu_items"."id";



CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" integer NOT NULL,
    "order_id" integer,
    "menu_item_id" integer,
    "quantity" integer NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "restaurant_id" integer
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."order_items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."order_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."order_items_id_seq" OWNED BY "public"."order_items"."id";



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" integer NOT NULL,
    "user_id" "uuid",
    "total_price" numeric(10,2) NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "restaurant_id" integer,
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."orders_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."orders_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."orders_id_seq" OWNED BY "public"."orders"."id";



CREATE TABLE IF NOT EXISTS "public"."partnership_inquiries" (
    "id" bigint NOT NULL,
    "school_name" "text" NOT NULL,
    "contact_name" "text" NOT NULL,
    "position" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "student_count" integer NOT NULL,
    "message" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."partnership_inquiries" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."partnership_inquiries_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."partnership_inquiries_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."partnership_inquiries_id_seq" OWNED BY "public"."partnership_inquiries"."id";



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "restaurant_id" integer
);

ALTER TABLE ONLY "public"."profiles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restaurants" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "admin_id" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "stripe_account_id" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "phone" "text",
    "address" "text",
    CONSTRAINT "restaurants_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'suspended'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."restaurants" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."restaurants_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."restaurants_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."restaurants_id_seq" OWNED BY "public"."restaurants"."id";



CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "restaurant_id" integer,
    "menu_item_id" integer,
    "rating" integer NOT NULL,
    "comment" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "reviews_user_profile_match" CHECK (("user_id" = "profile_id"))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."reviews" IS 'Stores user feedback for restaurants and menu items';



ALTER TABLE "public"."reviews" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."reviews_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."menu_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."menu_items_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."order_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."order_items_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."orders" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."orders_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."partnership_inquiries" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."partnership_inquiries_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."restaurants" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."restaurants_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partnership_inquiries"
    ADD CONSTRAINT "partnership_inquiries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_restaurants_stripe_account_id" ON "public"."restaurants" USING "btree" ("stripe_account_id");



CREATE OR REPLACE TRIGGER "handle_partnership_inquiries_updated_at" BEFORE UPDATE ON "public"."partnership_inquiries" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete their restaurant's menu items" ON "public"."menu_items" FOR DELETE USING (("auth"."uid"() IN ( SELECT "restaurants"."admin_id"
   FROM "public"."restaurants"
  WHERE ("restaurants"."id" = "menu_items"."restaurant_id"))));



CREATE POLICY "Admins can insert and update restaurants" ON "public"."restaurants" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can insert menu items for their restaurant" ON "public"."menu_items" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "restaurants"."admin_id"
   FROM "public"."restaurants"
  WHERE ("restaurants"."id" = "menu_items"."restaurant_id"))));



CREATE POLICY "Admins can insert restaurants" ON "public"."restaurants" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can update orders for their restaurant" ON "public"."orders" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "restaurants"."admin_id"
   FROM "public"."restaurants"
  WHERE ("restaurants"."id" = "orders"."restaurant_id"))));



CREATE POLICY "Admins can update partnership inquiries" ON "public"."partnership_inquiries" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update their own restaurant" ON "public"."restaurants" FOR UPDATE USING (("auth"."uid"() = "admin_id"));



CREATE POLICY "Admins can update their restaurant's menu items" ON "public"."menu_items" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "restaurants"."admin_id"
   FROM "public"."restaurants"
  WHERE ("restaurants"."id" = "menu_items"."restaurant_id"))));



CREATE POLICY "Admins can view all reviews" ON "public"."reviews" FOR SELECT USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can view order items for their restaurant" ON "public"."order_items" FOR SELECT USING (("auth"."uid"() IN ( SELECT "restaurants"."admin_id"
   FROM "public"."restaurants"
  WHERE ("restaurants"."id" = ( SELECT "orders"."restaurant_id"
           FROM "public"."orders"
          WHERE ("orders"."id" = "order_items"."order_id"))))));



CREATE POLICY "Admins can view orders for their restaurant" ON "public"."orders" FOR SELECT USING (("auth"."uid"() IN ( SELECT "restaurants"."admin_id"
   FROM "public"."restaurants"
  WHERE ("restaurants"."id" = "orders"."restaurant_id"))));



CREATE POLICY "Admins can view partnership inquiries" ON "public"."partnership_inquiries" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view their own restaurant" ON "public"."restaurants" FOR SELECT USING (("auth"."uid"() = "admin_id"));



CREATE POLICY "Admins can view their restaurant's menu items" ON "public"."menu_items" FOR SELECT USING (("auth"."uid"() IN ( SELECT "restaurants"."admin_id"
   FROM "public"."restaurants"
  WHERE ("restaurants"."id" = "menu_items"."restaurant_id"))));



CREATE POLICY "Allow admin access to menu items" ON "public"."menu_items" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = 'admin'::"text"))));



CREATE POLICY "Allow inserting restaurants during registration" ON "public"."restaurants" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow profile creation" ON "public"."profiles" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow profile viewing" ON "public"."profiles" FOR SELECT;



CREATE POLICY "Allow public read access to menu items" ON "public"."menu_items" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Allow restaurant admin access to menu items" ON "public"."menu_items" USING (("auth"."uid"() IN ( SELECT "restaurants"."admin_id"
   FROM "public"."restaurants"
  WHERE ("restaurants"."id" = "menu_items"."restaurant_id"))));



CREATE POLICY "Anyone can submit partnership inquiry" ON "public"."partnership_inquiries" FOR INSERT WITH CHECK (true);



CREATE POLICY "Authenticated users can view all profiles" ON "public"."profiles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."restaurants" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Enable update for users based on id" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Public read access to menu items" ON "public"."menu_items" FOR SELECT USING (true);



CREATE POLICY "Public read access to restaurants" ON "public"."restaurants" FOR SELECT USING (true);



CREATE POLICY "Restaurant admins can manage menu items" ON "public"."menu_items" USING (("auth"."uid"() IN ( SELECT "restaurants"."admin_id"
   FROM "public"."restaurants"
  WHERE ("restaurants"."id" = "menu_items"."restaurant_id"))));



CREATE POLICY "Restaurant admins can update their own restaurant" ON "public"."restaurants" FOR UPDATE USING (("auth"."uid"() = "admin_id"));



CREATE POLICY "Restaurant admins can view and update orders for their restaura" ON "public"."orders" USING (("auth"."uid"() IN ( SELECT "restaurants"."admin_id"
   FROM "public"."restaurants"
  WHERE ("restaurants"."id" = "orders"."restaurant_id"))));



CREATE POLICY "Restaurant admins can view and update their own restaurant" ON "public"."restaurants" USING (("auth"."uid"() = "admin_id"));



CREATE POLICY "Restaurant admins can view order items for their restaurant" ON "public"."order_items" FOR SELECT USING (("auth"."uid"() IN ( SELECT "restaurants"."admin_id"
   FROM "public"."restaurants"
  WHERE ("restaurants"."id" IN ( SELECT "orders"."restaurant_id"
           FROM "public"."orders"
          WHERE ("orders"."id" = "order_items"."order_id"))))));



CREATE POLICY "Restaurant admins can view reviews for their restaurant" ON "public"."reviews" FOR SELECT USING (("auth"."uid"() IN ( SELECT "restaurants"."admin_id"
   FROM "public"."restaurants"
  WHERE (("restaurants"."id" = "reviews"."restaurant_id") OR ("restaurants"."id" = ( SELECT "menu_items"."restaurant_id"
           FROM "public"."menu_items"
          WHERE ("menu_items"."id" = "reviews"."menu_item_id")))))));



CREATE POLICY "Service role bypass on public.profiles" ON "public"."profiles" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Service role can manage restaurants" ON "public"."restaurants" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can insert their own order items" ON "public"."order_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own orders" ON "public"."orders" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own reviews" ON "public"."reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view and update their own profile" ON "public"."profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own restaurant" ON "public"."restaurants" FOR SELECT TO "authenticated" USING (("admin_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own order items" ON "public"."order_items" FOR SELECT USING (("auth"."uid"() IN ( SELECT "orders"."user_id"
   FROM "public"."orders"
  WHERE ("orders"."id" = "order_items"."order_id"))));



CREATE POLICY "Users can view their own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own reviews" ON "public"."reviews" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."menu_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partnership_inquiries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restaurants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."create_restaurant_for_admin"("admin_id" "uuid", "restaurant_name" "text", "restaurant_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_restaurant_for_admin"("admin_id" "uuid", "restaurant_name" "text", "restaurant_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_restaurant_for_admin"("admin_id" "uuid", "restaurant_name" "text", "restaurant_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_profile_and_restaurant"("user_id" "uuid", "user_role" "text", "rest_name" "text", "rest_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_profile_and_restaurant"("user_id" "uuid", "user_role" "text", "rest_name" "text", "rest_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_profile_and_restaurant"("user_id" "uuid", "user_role" "text", "rest_name" "text", "rest_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."register_admin_and_create_restaurant"("admin_user_id" "uuid", "rest_name" "text", "rest_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."register_admin_and_create_restaurant"("admin_user_id" "uuid", "rest_name" "text", "rest_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_admin_and_create_restaurant"("admin_user_id" "uuid", "rest_name" "text", "rest_description" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."menu_items" TO "anon";
GRANT ALL ON TABLE "public"."menu_items" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."menu_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."menu_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."menu_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."partnership_inquiries" TO "anon";
GRANT ALL ON TABLE "public"."partnership_inquiries" TO "authenticated";
GRANT ALL ON TABLE "public"."partnership_inquiries" TO "service_role";



GRANT ALL ON SEQUENCE "public"."partnership_inquiries_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."partnership_inquiries_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."partnership_inquiries_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."restaurants" TO "anon";
GRANT ALL ON TABLE "public"."restaurants" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurants" TO "service_role";



GRANT ALL ON SEQUENCE "public"."restaurants_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."restaurants_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."restaurants_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
