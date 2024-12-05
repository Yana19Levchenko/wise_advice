CREATE DATABASE IF NOT EXISTS qa_platform;
CREATE USER IF NOT EXISTS 'yana'@'localhost' IDENTIFIED BY 'securepass';
GRANT ALL PRIVILEGES ON qa_platform.* TO 'yana'@'localhost';
FLUSH PRIVILEGES;

USE qa_platform;
CREATE TABLE IF NOT EXISTS users(
   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
   login VARCHAR(255) NOT NULL UNIQUE,
   password VARCHAR(255) NOT NULL,
   full_name VARCHAR(100),
   email VARCHAR(255) NOT NULL UNIQUE,
   is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
   profile_picture VARCHAR(255) NOT NULL DEFAULT 'default-avatar.png',
   rating INT NOT NULL DEFAULT 0,
   role ENUM('admin', 'user') NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS posts(
   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
   author INT NOT NULL,
   title VARCHAR(255) NOT NULL,
   publish_date DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
   content TEXT NOT NULL,
   locked BOOLEAN NOT NULL DEFAULT FALSE,
   FOREIGN KEY (author) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories(
   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
   title VARCHAR(255) NOT NULL,
   description TEXT
);

CREATE TABLE IF NOT EXISTS posts_categories(
   post_id INT NOT NULL,
   category_id INT NOT NULL,
   PRIMARY KEY (post_id, category_id),
   FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
   FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments(
   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
   author INT NOT NULL,
   publish_date DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   content TEXT NOT NULL,
   status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
   locked BOOLEAN NOT NULL DEFAULT FALSE,
   is_best BOOLEAN NOT NULL DEFAULT FALSE,
   parent_id INT DEFAULT NULL,
   FOREIGN KEY (author) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS posts_comments(
   post_id INT NOT NULL,
   comment_id INT NOT NULL,
   PRIMARY KEY (post_id, comment_id),
   FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
   FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likes(
   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
   author INT NOT NULL,
   publish_date DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   post_id INT,
   comment_id INT,
   type ENUM('like', 'dislike') NOT NULL,
   FOREIGN KEY (author) REFERENCES users(id) ON DELETE CASCADE,
   FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
   FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites(
   user INT NOT NULL,
   post_id INT NOT NULL,
   PRIMARY KEY (user, post_id),
   FOREIGN KEY (user) REFERENCES users(id) ON DELETE CASCADE,
   FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_subscriptions(
    user INT NOT NULL,
    post_id INT NOT NULL,
    PRIMARY KEY (user, post_id),
    FOREIGN KEY (user) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT,
    comment_id INT,
    message TEXT NOT NULL,
    created_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME(0),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

