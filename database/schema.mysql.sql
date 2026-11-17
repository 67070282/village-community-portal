-- MySQL 8.0+ / InnoDB / utf8mb4
-- Run in a fresh village_portal database, or use npm run db:init.
CREATE DATABASE IF NOT EXISTS village_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE village_portal;

CREATE TABLE IF NOT EXISTS users (users_id VARCHAR(36) PRIMARY KEY, full_name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, house_number VARCHAR(20) NOT NULL, phone VARCHAR(15) NOT NULL, role ENUM('resident','juristic','admin') NOT NULL DEFAULT 'resident', active INTEGER NOT NULL DEFAULT 1, created_at DATETIME(3) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (categories_id INTEGER PRIMARY KEY AUTO_INCREMENT, name VARCHAR(50) NOT NULL, type ENUM('issue','lost','equipment') NOT NULL, description TEXT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS community_posts (community_posts_id VARCHAR(36) PRIMARY KEY, users_id VARCHAR(36) NOT NULL, categories_id INTEGER NOT NULL, title VARCHAR(150) NOT NULL, description TEXT NOT NULL, location_note VARCHAR(255) NOT NULL, status ENUM('pending','in_progress','resolved') NOT NULL DEFAULT 'pending', priority VARCHAR(10) NOT NULL DEFAULT 'normal', metadata JSON, created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL, FOREIGN KEY(users_id) REFERENCES users(users_id), FOREIGN KEY(categories_id) REFERENCES categories(categories_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (id VARCHAR(36) PRIMARY KEY, post_id VARCHAR(36) NOT NULL, users_id VARCHAR(36) NOT NULL, body TEXT NOT NULL, created_at DATETIME(3) NOT NULL, FOREIGN KEY(post_id) REFERENCES community_posts(community_posts_id) ON DELETE CASCADE, FOREIGN KEY(users_id) REFERENCES users(users_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_history (id VARCHAR(36) PRIMARY KEY, post_id VARCHAR(36) NOT NULL, users_id VARCHAR(36) NOT NULL, status ENUM('pending','in_progress','resolved') NOT NULL, note TEXT NOT NULL, created_at DATETIME(3) NOT NULL, FOREIGN KEY(post_id) REFERENCES community_posts(community_posts_id) ON DELETE CASCADE, FOREIGN KEY(users_id) REFERENCES users(users_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS equipment (id VARCHAR(36) PRIMARY KEY, name VARCHAR(100) NOT NULL, description TEXT NOT NULL, total INTEGER NOT NULL, available INTEGER NOT NULL, icon VARCHAR(30) NOT NULL, active INTEGER NOT NULL DEFAULT 1) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loans (id VARCHAR(36) PRIMARY KEY, equipment_id VARCHAR(36) NOT NULL, users_id VARCHAR(36) NOT NULL, quantity INTEGER NOT NULL, due_date DATE NOT NULL, purpose VARCHAR(255) NOT NULL, status ENUM('borrowed','returned') NOT NULL, returned_at DATETIME(3), created_at DATETIME(3) NOT NULL, FOREIGN KEY(equipment_id) REFERENCES equipment(id), FOREIGN KEY(users_id) REFERENCES users(users_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcements (id VARCHAR(36) PRIMARY KEY, users_id VARCHAR(36) NOT NULL, title VARCHAR(150) NOT NULL, body TEXT NOT NULL, pinned INTEGER NOT NULL DEFAULT 0, created_at DATETIME(3) NOT NULL, FOREIGN KEY(users_id) REFERENCES users(users_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (id VARCHAR(36) PRIMARY KEY, title VARCHAR(150) NOT NULL, description TEXT NOT NULL, location VARCHAR(150) NOT NULL, starts_at DATETIME(3) NOT NULL, capacity INTEGER NOT NULL, users_id VARCHAR(36) NOT NULL, FOREIGN KEY(users_id) REFERENCES users(users_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_attendees (event_id VARCHAR(36) NOT NULL, users_id VARCHAR(36) NOT NULL, created_at DATETIME(3) NOT NULL, PRIMARY KEY(event_id,users_id), FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE, FOREIGN KEY(users_id) REFERENCES users(users_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (id VARCHAR(36) PRIMARY KEY, users_id VARCHAR(36) NOT NULL, title VARCHAR(150) NOT NULL, body TEXT NOT NULL, link VARCHAR(100) NOT NULL, is_read INTEGER NOT NULL DEFAULT 0, created_at DATETIME(3) NOT NULL, FOREIGN KEY(users_id) REFERENCES users(users_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(36) PRIMARY KEY, users_id VARCHAR(36) NOT NULL, expires_at BIGINT NOT NULL, FOREIGN KEY(users_id) REFERENCES users(users_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (id VARCHAR(36) PRIMARY KEY, users_id VARCHAR(36), action VARCHAR(100) NOT NULL, resource_id VARCHAR(36), created_at DATETIME(3) NOT NULL, FOREIGN KEY(users_id) REFERENCES users(users_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_posts_created ON community_posts(created_at);
CREATE INDEX idx_posts_filter ON community_posts(categories_id,status);
CREATE INDEX idx_loans_owner ON loans(users_id,status);
CREATE INDEX idx_notifications_owner ON notifications(users_id,is_read);
CREATE INDEX idx_history_post ON post_history(post_id,created_at);
