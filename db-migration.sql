-- MySQL dump 10.13  Distrib 9.3.0, for macos15.2 (arm64)
--
-- Host: 127.0.0.1    Database: chat-support
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `chat_sessions`
--

DROP TABLE IF EXISTS `chat_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_sessions` (
  `session_id` varchar(255) NOT NULL,
  `workspace_id` varchar(255) NOT NULL,
  `channel_id` varchar(255) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` timestamp NULL DEFAULT NULL,
  `status` enum('active','closed','offline') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`session_id`),
  KEY `FK_1f621bc2ae7adb3fbd75750016e` (`workspace_id`),
  CONSTRAINT `FK_1f621bc2ae7adb3fbd75750016e` FOREIGN KEY (`workspace_id`) REFERENCES `workspace` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `eav_attributes`
--

DROP TABLE IF EXISTS `eav_attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eav_attributes` (
  `att_id` int NOT NULL AUTO_INCREMENT,
  `att_code` varchar(255) NOT NULL,
  `entity_type_id` int NOT NULL,
  `backend_type` enum('varchar','int','boolean','text') NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`att_id`),
  UNIQUE KEY `IDX_00456fd95f463afadf58f52b4d` (`att_code`),
  KEY `FK_073805affeef6f75dafd70345f1` (`entity_type_id`),
  CONSTRAINT `FK_073805affeef6f75dafd70345f1` FOREIGN KEY (`entity_type_id`) REFERENCES `eav_entity_type` (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `eav_entity_type`
--

DROP TABLE IF EXISTS `eav_entity_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eav_entity_type` (
  `type_id` int NOT NULL AUTO_INCREMENT,
  `type_code` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`type_id`),
  UNIQUE KEY `IDX_7bb7d4e04b6b01a634d051bc2f` (`type_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `refresh_token`
--

DROP TABLE IF EXISTS `refresh_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_token` (
  `refresh_token` varchar(255) NOT NULL,
  `user_id` int NOT NULL,
  `expires_time` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`refresh_token`),
  KEY `FK_6bbe63d2fe75e7f0ba1710351d4` (`user_id`),
  CONSTRAINT `FK_6bbe63d2fe75e7f0ba1710351d4` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `confirmationCode` varchar(255) DEFAULT NULL,
  `isEmailConfirmed` tinyint NOT NULL DEFAULT '0',
  `resetCode` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workspace`
--

DROP TABLE IF EXISTS `workspace`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workspace` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `owner_id` int NOT NULL,
  `entity_type_id` int NOT NULL,
  `selected_channel_id` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `service_type` varchar(255) DEFAULT NULL,
  `service_username` varchar(255) DEFAULT NULL,
  `service_password` varchar(255) DEFAULT NULL,
  `server_url` varchar(255) DEFAULT NULL,
  `service_token` varchar(255) DEFAULT NULL,
  `service_team_id` varchar(255) DEFAULT NULL,
  `bot_token` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_988cf8ee530a5f8a2d56269955b` (`owner_id`),
  KEY `FK_1c5e37fc03007393d95dfc04add` (`entity_type_id`),
  CONSTRAINT `FK_1c5e37fc03007393d95dfc04add` FOREIGN KEY (`entity_type_id`) REFERENCES `eav_entity_type` (`type_id`),
  CONSTRAINT `FK_988cf8ee530a5f8a2d56269955b` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workspace_entity_boolean`
--

DROP TABLE IF EXISTS `workspace_entity_boolean`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workspace_entity_boolean` (
  `value_id` int NOT NULL AUTO_INCREMENT,
  `entity_id` varchar(255) NOT NULL,
  `att_id` int NOT NULL,
  `value` tinyint NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`value_id`),
  UNIQUE KEY `IDX_3eb82074f91651f80dfc9c83bb` (`entity_id`,`att_id`),
  KEY `FK_930d54493aeffa66f71b35660fd` (`att_id`),
  CONSTRAINT `FK_455db2866513033101fa83dc366` FOREIGN KEY (`entity_id`) REFERENCES `workspace` (`id`),
  CONSTRAINT `FK_930d54493aeffa66f71b35660fd` FOREIGN KEY (`att_id`) REFERENCES `eav_attributes` (`att_id`)
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workspace_entity_integer`
--

DROP TABLE IF EXISTS `workspace_entity_integer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workspace_entity_integer` (
  `value_id` int NOT NULL AUTO_INCREMENT,
  `entity_id` varchar(255) NOT NULL,
  `att_id` int NOT NULL,
  `value` int NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`value_id`),
  UNIQUE KEY `IDX_17bee64d6dceb70e9707b2e11d` (`entity_id`,`att_id`),
  KEY `FK_31e8e705cd7b1e49e5dfb6fc405` (`att_id`),
  CONSTRAINT `FK_1a1c5bd6b3114ef2533a6af8bc2` FOREIGN KEY (`entity_id`) REFERENCES `workspace` (`id`),
  CONSTRAINT `FK_31e8e705cd7b1e49e5dfb6fc405` FOREIGN KEY (`att_id`) REFERENCES `eav_attributes` (`att_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workspace_entity_text`
--

DROP TABLE IF EXISTS `workspace_entity_text`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workspace_entity_text` (
  `value_id` int NOT NULL AUTO_INCREMENT,
  `entity_id` varchar(255) NOT NULL,
  `att_id` int NOT NULL,
  `value` text NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`value_id`),
  UNIQUE KEY `IDX_77149a7d0aee0a1c1fec95f722` (`entity_id`,`att_id`),
  KEY `FK_52beb1588cffe6ad43c76265e7b` (`att_id`),
  CONSTRAINT `FK_52beb1588cffe6ad43c76265e7b` FOREIGN KEY (`att_id`) REFERENCES `eav_attributes` (`att_id`),
  CONSTRAINT `FK_e86798825ef386649c3fb7f8a95` FOREIGN KEY (`entity_id`) REFERENCES `workspace` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workspace_entity_varchar`
--

DROP TABLE IF EXISTS `workspace_entity_varchar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workspace_entity_varchar` (
  `value_id` int NOT NULL AUTO_INCREMENT,
  `entity_id` varchar(255) NOT NULL,
  `att_id` int NOT NULL,
  `value` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`value_id`),
  UNIQUE KEY `IDX_5aa33a1849038645198d4aa740` (`entity_id`,`att_id`),
  KEY `FK_3e526a9054e6ed8a337c3d02430` (`att_id`),
  CONSTRAINT `FK_00ce0bc347fcbfe890f335a822c` FOREIGN KEY (`entity_id`) REFERENCES `workspace` (`id`),
  CONSTRAINT `FK_3e526a9054e6ed8a337c3d02430` FOREIGN KEY (`att_id`) REFERENCES `eav_attributes` (`att_id`)
) ENGINE=InnoDB AUTO_INCREMENT=205 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'chat-support'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-23 17:42:23
