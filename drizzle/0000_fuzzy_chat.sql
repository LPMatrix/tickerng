CREATE TABLE `report` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`mode` text NOT NULL,
	`query` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reportShare` (
	`id` text PRIMARY KEY NOT NULL,
	`reportId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` integer,
	`revoked` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`reportId`) REFERENCES `report`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reportShare_token_unique` ON `reportShare` (`token`);