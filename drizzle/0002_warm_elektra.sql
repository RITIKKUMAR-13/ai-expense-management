CREATE TABLE `savingsContributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`ownerId` int NOT NULL,
	`amountPaise` int NOT NULL,
	`note` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savingsContributions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savingsGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(100) NOT NULL,
	`icon` enum('laptop','mobile','travel','home','other') NOT NULL,
	`targetPaise` int NOT NULL,
	`targetDate` timestamp,
	`status` enum('active','completed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savingsGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `savingsContributions` ADD CONSTRAINT `savingsContributions_goalId_savingsGoals_id_fk` FOREIGN KEY (`goalId`) REFERENCES `savingsGoals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `savings_contributions_goal_idx` ON `savingsContributions` (`goalId`);--> statement-breakpoint
CREATE INDEX `savings_contributions_owner_idx` ON `savingsContributions` (`ownerId`);--> statement-breakpoint
CREATE INDEX `savings_goals_owner_idx` ON `savingsGoals` (`ownerId`,`status`);