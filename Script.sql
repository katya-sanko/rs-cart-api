-- carts:
--    id - uuid (Primary key)
--    user_id - uuid, not null (It's not Foreign key, because there is no user entity in DB)
--    created_at - date, not null
--    updated_at - date, not null
--    status - enum ("OPEN", "ORDERED") 

CREATE TYPE "status_enum" AS ENUM('OPEN', 'ORDERED');
CREATE TABLE IF NOT EXISTS "carts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp NOT NULL default now(),
	"updated_at" timestamp NOT NULL default now(),
	"status" status_enum NOT NULL default 'OPEN'
);
INSERT INTO "carts" ("id", "user_id", "created_at", "updated_at") 
	VALUES 
	('ab6139fb-6606-4be3-9288-0583d9a237de', '262c2a26-559a-41c5-9341-2e7893fce8a3', current_timestamp, current_timestamp), 
	('03f3ffa3-0b6a-45f8-bf61-eeef64409782', 'd2a4f291-d016-4c65-b260-752a73499996', current_timestamp, current_timestamp); 

-- cart_items:
--    cart_id - uuid (Foreign key from carts.id)
--    product_id - uuid
--    count - integer (Number of items in a cart)
CREATE TABLE IF NOT EXISTS "cart_items" (
	"cart_id" uuid REFERENCES "carts" ("id") NOT NULL,
	"product_id" uuid NOT NULL,
	"count" integer NOT NULL
);
INSERT INTO "cart_items" ("cart_id", "product_id", "count") 
	VALUES 
	('ab6139fb-6606-4be3-9288-0583d9a237de', '596ccfb0-975e-40fb-8c6d-1d33d682dd18', 12), 
	('03f3ffa3-0b6a-45f8-bf61-eeef64409782', '87c2b716-cc81-42ad-a8af-2b0b30300e12', 8);
	
select * from carts;
select * from cart_items;