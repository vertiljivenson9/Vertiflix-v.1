-- CreateTable
CREATE TABLE "telegram_movies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "video_url" TEXT,
    "file_id" TEXT,
    "thumbnail_file_id" TEXT,
    "category" TEXT NOT NULL DEFAULT 'otros',
    "year" INTEGER NOT NULL DEFAULT 2024,
    "duration" INTEGER NOT NULL DEFAULT 120,
    "rating" REAL NOT NULL DEFAULT 7.0,
    "language" TEXT NOT NULL DEFAULT 'Español',
    "file_name" TEXT,
    "file_size" REAL,
    "channel_message_id" REAL,
    "channel_username" TEXT DEFAULT 'VertiflixVideos',
    "telegram_link" TEXT,
    "added_by" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "movies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "video_url" TEXT,
    "category" TEXT NOT NULL DEFAULT 'otros',
    "year" INTEGER NOT NULL DEFAULT 2024,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'Español',
    "channel_username" TEXT,
    "channel_message_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bot_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chat_id" REAL NOT NULL,
    "step" TEXT NOT NULL DEFAULT 'idle',
    "video_file_id" TEXT,
    "video_message_id" REAL,
    "channel_message_id" REAL,
    "image_file_id" TEXT,
    "image_url" TEXT,
    "title" TEXT,
    "year" INTEGER,
    "category" TEXT,
    "duration" INTEGER,
    "file_name" TEXT,
    "file_size" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegram_id" REAL NOT NULL,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "favorites" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" DATETIME
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "bot_sessions_chat_id_key" ON "bot_sessions"("chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
