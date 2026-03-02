-- ============================================
-- مساعد دراسة تونسي - تهيئة قاعدة البيانات
-- Tunisian Study Assistant - Database Setup
-- ============================================

-- إنشاء الـ Enums
CREATE TYPE "Role" AS ENUM ('USER', 'PREMIUM', 'ADMIN');
CREATE TYPE "PlanType" AS ENUM ('FREE', 'BASIC', 'PREMIUM', 'LIFETIME');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BANNED', 'INACTIVE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- ============================================
-- جدول المستخدمين (Users)
-- ============================================
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "level" TEXT,
    "levelName" TEXT,
    "year" TEXT,
    "section" TEXT,
    "subjects" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActive" TIMESTAMP(3),
    "bannedAt" TIMESTAMP(3),
    "bannedReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- ============================================
-- جدول الاشتراكات (Subscriptions)
-- ============================================
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "agentMode" BOOLEAN NOT NULL DEFAULT false,
    "advancedAI" BOOLEAN NOT NULL DEFAULT false,
    "unlimitedChat" BOOLEAN NOT NULL DEFAULT false,
    "priority" BOOLEAN NOT NULL DEFAULT false,
    "exportPDF" BOOLEAN NOT NULL DEFAULT false,
    "ocrUnlimited" BOOLEAN NOT NULL DEFAULT false,
    "customPlans" BOOLEAN NOT NULL DEFAULT false,
    "chatsUsed" INTEGER NOT NULL DEFAULT 0,
    "ocrUsed" INTEGER NOT NULL DEFAULT 0,
    "quotaLimit" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- ============================================
-- جدول أكواد الخصم (PromoCodes)
-- ============================================
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "planType" "PlanType" NOT NULL,
    "duration" INTEGER,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- ============================================
-- جدول استخدام أكواد الخصم (PromoCodeUsage)
-- ============================================
CREATE TABLE "PromoCodeUsage" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCodeUsage_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- جدول الجلسات (Sessions)
-- ============================================
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- ============================================
-- جدول المحادثات (Chats)
-- ============================================
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- جدول رسائل المحادثات (ChatMessages)
-- ============================================
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- جدول سجل النشاط (ActivityLog)
-- ============================================
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- جدول الإنجازات (Achievements)
-- ============================================
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- جدول إحصائيات الدراسة (StudyStats)
-- ============================================
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

-- ============================================
-- جدول تقارير الأخطاء (ErrorReports)
-- ============================================
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

-- ============================================
-- جدول المنشورات (Posts)
-- ============================================
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- العلاقات (Foreign Keys)
-- ============================================

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

-- ============================================
-- إنشاء الفهارس لتحسين الأداء
-- ============================================
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "PromoCode_code_idx" ON "PromoCode"("code");
CREATE INDEX "PromoCodeUsage_codeId_idx" ON "PromoCodeUsage"("codeId");
CREATE INDEX "PromoCodeUsage_userId_idx" ON "PromoCodeUsage"("userId");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_token_idx" ON "Session"("token");
CREATE INDEX "Chat_userId_idx" ON "Chat"("userId");
CREATE INDEX "ChatMessage_chatId_idx" ON "ChatMessage"("chatId");
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");
CREATE INDEX "StudyStat_userId_idx" ON "StudyStat"("userId");
CREATE INDEX "StudyStat_date_idx" ON "StudyStat"("date");
CREATE INDEX "ErrorReport_status_idx" ON "ErrorReport"("status");

-- ============================================
-- إنشاء مستخدم مدير افتراضي
-- ============================================
-- كلمة المرور: admin123 (مشفرة بـ bcrypt)
INSERT INTO "User" (
    "id", "email", "name", "password", "role", "status", "isVerified", "createdAt", "updatedAt"
) VALUES (
    'admin_001',
    'admin@qraya.tn',
    'مدير النظام',
    '$2a$10$rQZ9QxZQxZQxZQxZQxZQxOZQxZQxZQxZQxZQxZQxZQxZQxZQxZQ',
    'ADMIN',
    'ACTIVE',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- إنشاء اشتراك افتراضي للمدير
INSERT INTO "Subscription" (
    "id", "userId", "plan", "status", "agentMode", "advancedAI", "unlimitedChat", 
    "priority", "exportPDF", "ocrUnlimited", "customPlans", "createdAt", "updatedAt"
) VALUES (
    'sub_admin_001',
    'admin_001',
    'LIFETIME',
    'ACTIVE',
    true, true, true, true, true, true, true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ============================================
-- انتهى الإعداد ✓
-- ============================================
