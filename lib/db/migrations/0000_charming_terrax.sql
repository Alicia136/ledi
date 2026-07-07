CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"navn" text NOT NULL,
	"epost" text NOT NULL,
	"passord_hash" text NOT NULL,
	"rolle" text DEFAULT 'leietaker' NOT NULL,
	"bankid_verifisert" boolean DEFAULT false NOT NULL,
	"rask_svar" boolean DEFAULT false NOT NULL,
	"vipps_nummer" text,
	"email_verifisert" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"reset_token" text,
	"reset_token_expiry" timestamp with time zone,
	"personnummer" text,
	"kontonummer" text,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_epost_unique" UNIQUE("epost")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"plass_id" integer NOT NULL,
	"periode" text NOT NULL,
	"belop" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"eier_id" integer NOT NULL,
	"tittel" text NOT NULL,
	"type" text NOT NULL,
	"adresse" text NOT NULL,
	"by" text NOT NULL,
	"postnummer" text NOT NULL,
	"breddegrad" real NOT NULL,
	"lengdegrad" real NOT NULL,
	"beskrivelse" text,
	"fasiliteter" text[] DEFAULT '{}' NOT NULL,
	"er_aktiv" boolean DEFAULT true NOT NULL,
	"er_godkjent" boolean DEFAULT false NOT NULL,
	"pris_modell" text DEFAULT 'fri' NOT NULL,
	"smart_pris_bydel" text,
	"tilbyr_abonnement" boolean DEFAULT false NOT NULL,
	"abonnements_pris" real,
	"min_bindingstid" integer,
	"bilde_sti" text,
	"current_status" text DEFAULT 'available' NOT NULL,
	"auto_approval" boolean DEFAULT true NOT NULL,
	"antall_plasser" integer,
	"maks_lengde" text,
	"strom_amp" text,
	"vann_tilkobling" boolean DEFAULT false NOT NULL,
	"tommestasjon" boolean DEFAULT false NOT NULL,
	"overnatting_tillatt" boolean DEFAULT false NOT NULL,
	"lavseson_pris" real,
	"hoyseson_pris" real,
	"antall_bilder" integer DEFAULT 0 NOT NULL,
	"har_unloc" boolean DEFAULT false NOT NULL,
	"unloc_lock_id" text,
	"har_telemetrics" boolean DEFAULT false NOT NULL,
	"telemetrics_port_id" text,
	"borettslag_id" integer,
	"kun_beboere" boolean DEFAULT false NOT NULL,
	"er_natteparkering" boolean DEFAULT false NOT NULL,
	"natt_pris_helg_tillegg" real,
	"helge_mode" boolean DEFAULT false NOT NULL,
	"helge_pris" real,
	"arrangement_modus" boolean DEFAULT false NOT NULL,
	"arrangement_pris" real,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"plass_id" integer NOT NULL,
	"leietaker_id" integer NOT NULL,
	"start_dato" timestamp with time zone NOT NULL,
	"slutt_dato" timestamp with time zone NOT NULL,
	"periode_type" text NOT NULL,
	"total_pris" real NOT NULL,
	"utleier_belop" real NOT NULL,
	"spaceli_gebyr" real NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"locked_until" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"vipps_betaling_id" text,
	"betalt_av_leietaker" real,
	"utbetalt_til_utleier" real,
	"ledi_inntekt" real,
	"utbetalt_dato" timestamp with time zone,
	"payout_status" text,
	"payout_reference" text,
	"payout_feil_count" integer DEFAULT 0 NOT NULL,
	"payout_neste_forsok" timestamp with time zone,
	"utbetaling_tidspunkt" timestamp with time zone,
	"unloc_tilgang_granted" boolean DEFAULT false NOT NULL,
	"tilgangskode" text,
	"telemetrics_tilgang_granted" boolean DEFAULT false NOT NULL,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"rangering" integer NOT NULL,
	"kommentar" text,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "availability_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"plass_id" integer NOT NULL,
	"dag_i_nummer" integer NOT NULL,
	"fra_tid" text DEFAULT '08:00' NOT NULL,
	"til_tid" text DEFAULT '16:00' NOT NULL,
	"er_tilgjengelig" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blocked_dates" (
	"id" serial PRIMARY KEY NOT NULL,
	"plass_id" integer NOT NULL,
	"dato" text NOT NULL,
	"grunn" text,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"plass_id" integer NOT NULL,
	"leietaker_id" integer NOT NULL,
	"start_dato" timestamp with time zone NOT NULL,
	"bindingstid" integer NOT NULL,
	"maaneds_pris" real NOT NULL,
	"neste_betaling" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'aktiv' NOT NULL,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"plass_id" integer NOT NULL,
	"leietaker_id" integer NOT NULL,
	"periode_type" varchar(20) NOT NULL,
	"onsket_dato" varchar(10) NOT NULL,
	"onsket_slutt_dato" varchar(10),
	"maks_pris" integer,
	"registrert_dato" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'venter' NOT NULL,
	"varslet_dato" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alarmer" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"bydel" text NOT NULL,
	"type" text,
	"max_pris" real,
	"periode" text,
	"aktiv" boolean DEFAULT true NOT NULL,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "varsler" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"alarm_id" integer,
	"plass_id" integer,
	"tittel" text NOT NULL,
	"melding" text NOT NULL,
	"lest" boolean DEFAULT false NOT NULL,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "borettslag_medlemmer" (
	"id" serial PRIMARY KEY NOT NULL,
	"borettslag_id" integer NOT NULL,
	"user_id" integer,
	"epost" text NOT NULL,
	"leilighetsnummer" text,
	"er_aktiv" boolean DEFAULT true NOT NULL,
	"lagt_til_dato" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "borettslag" (
	"id" serial PRIMARY KEY NOT NULL,
	"navn" text NOT NULL,
	"orgnummer" text,
	"kontakt_epost" text NOT NULL,
	"bankkontonummer" text,
	"adresse" text NOT NULL,
	"postnummer" text NOT NULL,
	"by" text NOT NULL,
	"styreleder_user_id" integer NOT NULL,
	"antall_leiligheter" integer,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gavekorter" (
	"id" serial PRIMARY KEY NOT NULL,
	"kode" text NOT NULL,
	"belop" integer NOT NULL,
	"avsender_navn" text NOT NULL,
	"avsender_epost" text NOT NULL,
	"mottaker_navn" text NOT NULL,
	"mottaker_epost" text NOT NULL,
	"melding" text,
	"status" text DEFAULT 'aktiv' NOT NULL,
	"brukt_av_booking_id" integer,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL,
	"brukt_dato" timestamp with time zone,
	CONSTRAINT "gavekorter_kode_unique" UNIQUE("kode")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bytte_foresporsel" (
	"id" serial PRIMARY KEY NOT NULL,
	"fra_user_id" integer NOT NULL,
	"til_user_id" integer NOT NULL,
	"status" text DEFAULT 'venter' NOT NULL,
	"melding" text,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL,
	"behandlet_dato" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bytteprofiler" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"navarende_bydel" text NOT NULL,
	"onsket_bydel" text NOT NULL,
	"type" text DEFAULT 'parkering' NOT NULL,
	"beskrivelse" text,
	"aktiv" boolean DEFAULT true NOT NULL,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partnere" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" text NOT NULL,
	"navn" text NOT NULL,
	"type" text DEFAULT 'restaurant' NOT NULL,
	"kontakt_epost" text,
	"nettside" text,
	"provision_prosent" real DEFAULT 2 NOT NULL,
	"er_aktiv" boolean DEFAULT false NOT NULL,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partnere_partner_id_unique" UNIQUE("partner_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "widget_klikk" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" text NOT NULL,
	"booking_id" integer,
	"user_agent" text,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kalender_integrasjoner" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plass_id" integer,
	"provider" text NOT NULL,
	"account_email" text,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
	"sist_synkronisert" timestamp with time zone,
	"status" text DEFAULT 'aktiv' NOT NULL,
	"demo_modus" boolean DEFAULT true NOT NULL,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "arrangement_aktiveringer" (
	"id" serial PRIMARY KEY NOT NULL,
	"arrangement_id" integer NOT NULL,
	"plass_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"event_pris" real NOT NULL,
	"aktivert_dato" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "arrangementer" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"navn" text NOT NULL,
	"sted" text NOT NULL,
	"by" text NOT NULL,
	"dato" text NOT NULL,
	"klokkeslett" text DEFAULT '20:00' NOT NULL,
	"breddegrad" real NOT NULL,
	"lengdegrad" real NOT NULL,
	"antall_billetter" integer DEFAULT 5000 NOT NULL,
	"kategori" text DEFAULT 'konsert' NOT NULL,
	"emoji" text DEFAULT '🎵' NOT NULL,
	"kilde" text DEFAULT 'ticketmaster' NOT NULL,
	"bilde_url" text,
	"estimert_parkeringssokere" integer DEFAULT 1200 NOT NULL,
	"aktiv" boolean DEFAULT true NOT NULL,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "arrangementer_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lanseringsliste" (
	"id" serial PRIMARY KEY NOT NULL,
	"epost" varchar(255) NOT NULL,
	"opprettet_dato" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lanseringsliste_epost_unique" UNIQUE("epost")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dac7_rapporter" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"antall_utleiere" integer NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dac7_rapporter_year_unique" UNIQUE("year")
);
