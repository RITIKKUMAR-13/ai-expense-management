CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`patientId` int NOT NULL,
	`department` varchar(72) NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`status` enum('scheduled','checkedIn','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`note` varchar(240),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`displayName` varchar(96) NOT NULL,
	`patientCode` varchar(32) NOT NULL,
	`age` int NOT NULL,
	`phone` varchar(24),
	`status` enum('waiting','checkedIn','withDoctor','completed') NOT NULL DEFAULT 'waiting',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_patientId_patients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `appointments_owner_idx` ON `appointments` (`ownerId`);--> statement-breakpoint
CREATE INDEX `appointments_owner_schedule_idx` ON `appointments` (`ownerId`,`scheduledAt`);--> statement-breakpoint
CREATE INDEX `patients_owner_idx` ON `patients` (`ownerId`);--> statement-breakpoint
CREATE INDEX `patients_owner_status_idx` ON `patients` (`ownerId`,`status`);