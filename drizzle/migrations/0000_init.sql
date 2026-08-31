CREATE TABLE IF NOT EXISTS "barang" (
	"id" serial PRIMARY KEY NOT NULL,
	"kode" varchar(100) NOT NULL,
	"nama" varchar(255) NOT NULL,
	"kategori" varchar(100) NOT NULL,
	"jumlah" integer DEFAULT 0 NOT NULL,
	"kondisi" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "barang_kode_unique" UNIQUE("kode")
);
