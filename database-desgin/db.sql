CREATE TABLE `refresh_token` (
    `user_id` integer,
    `refresh_token` varchar(255) PRIMARY KEY,
    `expires_time` timestamp,
    `created_at` timestamp
);

CREATE TABLE `users` (
    `id` integer PRIMARY KEY,
    `email` varchar(255) UNIQUE,
    `password` varchar(255),
    `confirmationCode` varchar(255),
    `isConfirmed` varchar(255),
    `resetCode` varchar(255),
    `created_at` timestamp,
    `updated_at` timestamp
);

CREATE TABLE `workspace` (
    `id` varchar(255) PRIMARY KEY,
    `name` varchar(255),
    `owner_id` integer,
    `selected_channel_id` integer,
    `bot_token_slack` varchar(255),
    `service_type_slack` varchar(255),
    `service_slack_account_id` varchar(255),
    `createdAt` timestamp
);

CREATE TABLE `chat_sessions` (
    `session_id` uuid PRIMARY KEY,
    `widget_id` varchar(255),
    `channel_id` integer,
    `started_at` timestamp,
    `ended_at` timestamp,
    `status` enum(active, closed, offline)
);

ALTER TABLE `refresh_token`
ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `workspace`
ADD FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`);

ALTER TABLE `chat_sessions`
ADD FOREIGN KEY (`widget_id`) REFERENCES `workspace` (`id`);