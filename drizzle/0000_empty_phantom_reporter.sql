CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`category` text NOT NULL,
	`point` integer DEFAULT 0 NOT NULL,
	`estimate_time` integer NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`status` text NOT NULL,
	`proceed_time` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL
);
