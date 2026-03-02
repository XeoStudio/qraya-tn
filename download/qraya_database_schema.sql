-- =============================================
-- Qraya.tn - Database Schema for Supabase
-- Tunisian Study Assistant Platform
-- =============================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS "StudyTask" CASCADE;
DROP TABLE IF EXISTS "StudyPlan" CASCADE;
DROP TABLE IF EXISTS "Flashcard" CASCADE;
DROP TABLE IF EXISTS "FlashcardDeck" CASCADE;
DROP TABLE IF EXISTS "Referral" CASCADE;
DROP TABLE IF EXISTS "TicketMessage" CASCADE;
DROP TABLE IF EXISTS "SupportTicket" CASCADE;
DROP TABLE IF EXISTS "ErrorReport" CASCADE;
DROP TABLE IF EXISTS "StudyStat" CASCADE;
DROP TABLE IF EXISTS "Achievement" CASCADE;
DROP TABLE IF EXISTS "ActivityLog" CASCADE;
DROP TABLE IF EXISTS "ChatMessage" CASCADE;
DROP TABLE IF EXISTS "Chat" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "PromoCodeUsage" CASCADE;
DROP TABLE IF EXISTS "PromoCode" CASCADE;
DROP TABLE IF EXISTS "Subscription" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "SystemLog" CASCADE;
DROP TABLE IF EXISTS "Post" CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS "TicketPriority" CASCADE;
DROP TYPE IF EXISTS "TicketCategory" CASCADE;
DROP TYPE IF EXISTS "TicketStatus" CASCADE;
DROP TYPE IF EXISTS "SubscriptionStatus" CASCADE;
DROP TYPE IF EXISTS "UserStatus" CASCADE;
DROP TYPE IF EXISTS "PlanType" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;

-- ==================== ENUMS ====================

CREATE TYPE "Role" AS ENUM ('USER', 'PREMIUM', 'ADMIN');

CREATE TYPE "PlanType" AS ENUM ('FREE', 'BASIC', 'PREMIUM', 'BAC_PRO');

CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BANNED', 'INACTIVE');

CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED');

CREATE TYPE "TicketCategory" AS ENUM ('GENERAL', 'TECHNICAL', 'BILLING', 'SUGGESTION');

CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- ==================== USERS TABLE ====================

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    
    -- الملف الدراسي
    "level" TEXT,
    "levelName" TEXT,
    "year" TEXT,
    "section" TEXT,
    "subjects" TEXT,
    
    -- الولاية التونسية
    "governorate" TEXT,
    
    -- الدور والحالة
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    
    -- Gamification
    "points" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActive" TIMESTAMP(3),
    
    -- نظام الإحالة
    "referralCode" TEXT,
    "referredBy" TEXT,
    
    -- حقول الإدارة
    "bannedAt" TIMESTAMP(3),
    "bannedReason" TEXT,
    "notes" TEXT,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- ==================== SUBSCRIPTION TABLE ====================

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    
    -- صلاحيات الوصول
    "agentMode" BOOLEAN NOT NULL DEFAULT false,
    "advancedAI" BOOLEAN NOT NULL DEFAULT false,
    "unlimitedChat" BOOLEAN NOT NULL DEFAULT false,
    "priority" BOOLEAN NOT NULL DEFAULT false,
    "exportPDF" BOOLEAN NOT NULL DEFAULT false,
    "ocrUnlimited" BOOLEAN NOT NULL DEFAULT false,
    "customPlans" BOOLEAN NOT NULL DEFAULT false,
    
    -- حدود الاستخدام
    "chatsUsed" INTEGER NOT NULL DEFAULT 0,
    "ocrUsed" INTEGER NOT NULL DEFAULT 0,
    "quotaLimit" INTEGER NOT NULL DEFAULT 50,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- ==================== PROMO CODE TABLE ====================

CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "planType" "PlanType" NOT NULL,
    
    "duration" INTEGER,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    
    -- المميزات
    "agentMode" BOOLEAN NOT NULL DEFAULT false,
    "advancedAI" BOOLEAN NOT NULL DEFAULT false,
    "unlimitedChat" BOOLEAN NOT NULL DEFAULT false,
    "priority" BOOLEAN NOT NULL DEFAULT false,
    "exportPDF" BOOLEAN NOT NULL DEFAULT false,
    "ocrUnlimited" BOOLEAN NOT NULL DEFAULT false,
    "customPlans" BOOLEAN NOT NULL DEFAULT false,
    
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- ==================== PROMO CODE USAGE TABLE ====================

CREATE TABLE "PromoCodeUsage" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "PromoCodeUsage_pkey" PRIMARY KEY ("id")
);

-- ==================== SESSION TABLE ====================

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- ==================== CHAT TABLE ====================

CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- ==================== CHAT MESSAGE TABLE ====================

CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- ==================== ACTIVITY LOG TABLE ====================

CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- ==================== ACHIEVEMENT TABLE ====================

CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- ==================== STUDY STAT TABLE ====================

CREATE TABLE "StudyStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatsCount" INTEGER NOT NULL DEFAULT 0,
    "questionsAnswered" INTEGER NOT NULL DEFAULT 0,
    "studyTime" INTEGER NOT NULL DEFAULT 0,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT "StudyStat_pkey" PRIMARY KEY ("id")
);

-- ==================== ERROR REPORT TABLE ====================

CREATE TABLE "ErrorReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    
    CONSTRAINT "ErrorReport_pkey" PRIMARY KEY ("id")
);

-- ==================== SUPPORT TICKET TABLE ====================

CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL DEFAULT 'GENERAL',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    
    -- التقييم بعد الإغلاق
    "rating" INTEGER,
    "feedback" TEXT,
    
    -- طلب تدخل يدوي
    "needsHumanIntervention" BOOLEAN NOT NULL DEFAULT false,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- ==================== TICKET MESSAGE TABLE ====================

CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "isFromAI" BOOLEAN NOT NULL DEFAULT false,
    "isFromAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- ==================== REFERRAL TABLE ====================

CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    
    -- المكافأة
    "rewardPoints" INTEGER NOT NULL DEFAULT 50,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- ==================== FLASHCARD DECK TABLE ====================

CREATE TABLE "FlashcardDeck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT,
    "description" TEXT,
    
    -- التقدم
    "totalCards" INTEGER NOT NULL DEFAULT 0,
    "masteredCards" INTEGER NOT NULL DEFAULT 0,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "FlashcardDeck_pkey" PRIMARY KEY ("id")
);

-- ==================== FLASHCARD TABLE ====================

CREATE TABLE "Flashcard" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    
    -- التقدم الشخصي
    "difficulty" INTEGER NOT NULL DEFAULT 0,
    "timesReviewed" INTEGER NOT NULL DEFAULT 0,
    "nextReview" TIMESTAMP(3),
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- ==================== STUDY PLAN TABLE ====================

CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT,
    "description" TEXT,
    
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    
    -- التقدم
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

-- ==================== STUDY TASK TABLE ====================

CREATE TABLE "StudyTask" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    
    "dueDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    
    "order" INTEGER NOT NULL DEFAULT 0,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "StudyTask_pkey" PRIMARY KEY ("id")
);

-- ==================== SYSTEM LOG TABLE ====================

CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- ==================== POST TABLE ====================

CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- ==================== FOREIGN KEYS ====================

-- Subscription -> User
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PromoCodeUsage -> PromoCode
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_codeId_fkey" 
    FOREIGN KEY ("codeId") REFERENCES "PromoCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PromoCodeUsage -> User
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Session -> User
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Chat -> User
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ChatMessage -> Chat
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_fkey" 
    FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ActivityLog -> User
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Achievement -> User
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- StudyStat -> User
ALTER TABLE "StudyStat" ADD CONSTRAINT "StudyStat_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ErrorReport -> User
ALTER TABLE "ErrorReport" ADD CONSTRAINT "ErrorReport_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SupportTicket -> User
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TicketMessage -> SupportTicket
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" 
    FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TicketMessage -> User
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Referral -> User (referrer)
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" 
    FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Referral -> User (referred)
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" 
    FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FlashcardDeck -> User
ALTER TABLE "FlashcardDeck" ADD CONSTRAINT "FlashcardDeck_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Flashcard -> FlashcardDeck
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_deckId_fkey" 
    FOREIGN KEY ("deckId") REFERENCES "FlashcardDeck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- StudyPlan -> User
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- StudyTask -> StudyPlan
ALTER TABLE "StudyTask" ADD CONSTRAINT "StudyTask_planId_fkey" 
    FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==================== INDEXES FOR PERFORMANCE ====================

CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_token_idx" ON "Session"("token");
CREATE INDEX "Chat_userId_idx" ON "Chat"("userId");
CREATE INDEX "ChatMessage_chatId_idx" ON "ChatMessage"("chatId");
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");
CREATE INDEX "StudyStat_userId_idx" ON "StudyStat"("userId");
CREATE INDEX "ErrorReport_userId_idx" ON "ErrorReport"("userId");
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");
CREATE INDEX "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");
CREATE INDEX "Referral_referredUserId_idx" ON "Referral"("referredUserId");
CREATE INDEX "FlashcardDeck_userId_idx" ON "FlashcardDeck"("userId");
CREATE INDEX "Flashcard_deckId_idx" ON "Flashcard"("deckId");
CREATE INDEX "StudyPlan_userId_idx" ON "StudyPlan"("userId");
CREATE INDEX "StudyTask_planId_idx" ON "StudyTask"("planId");
CREATE INDEX "PromoCodeUsage_codeId_idx" ON "PromoCodeUsage"("codeId");
CREATE INDEX "PromoCodeUsage_userId_idx" ON "PromoCodeUsage"("userId");

-- ==================== SAMPLE DATA (Optional) ====================

-- Insert default admin user (password: admin123 - change this!)
-- INSERT INTO "User" ("id", "email", "name", "password", "role", "status", "isVerified", "referralCode")
-- VALUES ('admin_001', 'admin@qraya.tn', 'مدير النظام', '$2a$10$hash_here', 'ADMIN', 'ACTIVE', true, 'ADMIN2024');

-- Insert sample promo codes
-- INSERT INTO "PromoCode" ("id", "code", "planType", "duration", "maxUses", "agentMode", "advancedAI", "unlimitedChat")
-- VALUES ('promo_001', 'BAC2024', 'BAC_PRO', 90, 100, true, true, true);

-- Insert sample achievements
-- INSERT INTO "Achievement" ("id", "userId", "type", "title", "description")
-- VALUES ('ach_001', 'user_id_here', 'FIRST_CHAT', 'أول محادثة', 'أكملت أول محادثة مع المساعد الذكي');

-- ==================== DONE ====================
-- Database schema created successfully!
-- Run this SQL in Supabase SQL Editor
