CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`cell` text,
	`sector` text,
	`person` text,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_email_unique` ON `accounts` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_user_id_unique` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_person_unique` ON `accounts` (`person`);--> statement-breakpoint
CREATE TABLE `devotions` (
	`id` text PRIMARY KEY NOT NULL,
	`author` text NOT NULL,
	`person` text NOT NULL,
	`cell` text NOT NULL,
	`book` text NOT NULL,
	`chapter` integer NOT NULL,
	`reflection` text NOT NULL,
	`application` text DEFAULT '' NOT NULL,
	`date` text NOT NULL,
	`reviewed_by` text,
	`feedback` text DEFAULT '' NOT NULL,
	`reviewed_at` text
);
--> statement-breakpoint
CREATE TABLE `study` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
