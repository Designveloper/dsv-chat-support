CREATE TABLE `refresh_token` (
    `user_id` integer NOT NULL,
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
    `id` uuid PRIMARY KEY,
    `name` varchar(255),
    `owner_id` integer NOT NULL,
    `selected_channel_id` varchar(255),
    `bot_token_slack` varchar(255),
    `service_type_slack` varchar(255),
    `service_slack_account_id` varchar(255),
    `entity_type_id` integer NOT NULL,
    `createdAt` timestamp
);

CREATE TABLE `chat_sessions` (
    `session_id` uuid PRIMARY KEY,
    `widget_id` varchar(255) NOT NULL,
    `channel_id` integer,
    `started_at` timestamp,
    `ended_at` timestamp,
    `status` enum(active, closed)
);

CREATE TABLE `eav_entity_type` (
    `type_id` integer PRIMARY KEY,
    `type_code` varchar(255) UNIQUE,
    `description` varchar(255),
    `created_at` timestamp,
    `updated_at` timestamp
);

CREATE TABLE `eav_attributes` (
    `att_id` integer PRIMARY KEY,
    `att_code` varchar(255) UNIQUE,
    `entity_type_id` integer NOT NULL,
    `backend_type` enum(
        varchar,
        int,
        boolean,
        datetime
    ),
    `created_at` timestamp,
    `updated_at` timestamp
);

CREATE TABLE `workspace_entity_varchar` (
    `value_id` integer PRIMARY KEY,
    `entity_id` uuid,
    `att_id` integer NOT NULL,
    `value` varchar(255),
    `created_at` timestamp,
    `updated_at` timestamp
);

CREATE TABLE `workspace_entity_boolean` (
    `value_id` integer PRIMARY KEY,
    `entity_id` uuid,
    `att_id` integer NOT NULL,
    `value` boolean,
    `created_at` timestamp,
    `updated_at` timestamp
);

CREATE TABLE `workspace_entity_integer` (
    `value_id` integer PRIMARY KEY,
    `entity_id` uuid,
    `att_id` integer NOT NULL,
    `value` integer,
    `created_at` timestamp,
    `updated_at` timestamp
);

ALTER TABLE `refresh_token`
ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `workspace`
ADD FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`);

ALTER TABLE `chat_sessions`
ADD FOREIGN KEY (`widget_id`) REFERENCES `workspace` (`id`);

ALTER TABLE `workspace`
ADD FOREIGN KEY (`entity_type_id`) REFERENCES `eav_entity_type` (`type_id`);

ALTER TABLE `eav_attributes`
ADD FOREIGN KEY (`entity_type_id`) REFERENCES `eav_entity_type` (`type_id`);

ALTER TABLE `workspace_entity_varchar`
ADD FOREIGN KEY (`att_id`) REFERENCES `eav_attributes` (`att_id`);

ALTER TABLE `workspace_entity_varchar`
ADD FOREIGN KEY (`entity_id`) REFERENCES `workspace` (`id`);

ALTER TABLE `workspace_entity_boolean`
ADD FOREIGN KEY (`att_id`) REFERENCES `eav_attributes` (`att_id`);

ALTER TABLE `workspace_entity_boolean`
ADD FOREIGN KEY (`entity_id`) REFERENCES `workspace` (`id`);

ALTER TABLE `workspace_entity_integer`
ADD FOREIGN KEY (`att_id`) REFERENCES `eav_attributes` (`att_id`);

ALTER TABLE `workspace_entity_integer`
ADD FOREIGN KEY (`entity_id`) REFERENCES `workspace` (`id`);