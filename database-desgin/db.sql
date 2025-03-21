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
  `isConfirmed` boolean,
  `created_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `chat_widgets` (
  `widget_id` varchar(255) PRIMARY KEY,
  `owner_id` integer,
  `createdAt` timestamp
);

ALTER TABLE `refresh_token` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `chat_widgets` ADD FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`);
