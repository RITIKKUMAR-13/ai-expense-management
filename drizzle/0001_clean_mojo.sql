CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`category` enum('food','transport','shopping','bills','health','entertainment','other') NOT NULL,
	`periodKey` varchar(7) NOT NULL,
	`limitPaise` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`),
	CONSTRAINT `budgets_owner_period_category_unique` UNIQUE(`ownerId`,`periodKey`,`category`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`merchant` varchar(100) NOT NULL,
	`category` enum('food','transport','shopping','bills','health','entertainment','other') NOT NULL,
	`amountPaise` int NOT NULL,
	`spentAt` timestamp NOT NULL,
	`paymentMethod` varchar(36),
	`note` varchar(240),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `budgets_owner_period_idx` ON `budgets` (`ownerId`,`periodKey`);--> statement-breakpoint
CREATE INDEX `expenses_owner_spent_idx` ON `expenses` (`ownerId`,`spentAt`);--> statement-breakpoint
CREATE INDEX `expenses_owner_category_idx` ON `expenses` (`ownerId`,`category`);