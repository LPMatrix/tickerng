CREATE TABLE `userSubscription` (
	`userId` text PRIMARY KEY NOT NULL,
	`paystackCustomerCode` text,
	`paystackSubscriptionCode` text,
	`paystackEmailToken` text,
	`status` text DEFAULT 'free' NOT NULL,
	`currentPeriodEnd` integer,
	`updatedAt` integer NOT NULL
);
