-- ══════════════════════════════════════════════════════════════
--  MyTwin — Supabase Schema v5.2.1 (Production Ready)
--  شغّل هذا الملف كاملاً في Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 🔧 الإضافات المطلوبة
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- لتحسين البحث النصي في الذكريات

-- ══════════════════════════════════════════════════════════════
-- 1. الملفات الشخصية (PROFILES)
-- ══════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id                uuid        primary key default uuid_generate_v4(),
  user_id           uuid        not null unique references auth.users(id) on delete cascade,
  twin_name         text        not null default '',
  twin_gender       text        not null default 'female' check (twin_gender in ('female','male')),
  bond_level        float       not null default 1.0 check (bond_level >= 0 and bond_level <= 100),
  tier              text        not null default 'free' check (tier in ('free','free_trial_14d','premium_trial','premium','pro','yearly')),
  theme             text        not null default 'dark'  check (theme  in ('dark','light')),
  relationship_dims jsonb       not null default '{"trust":0.1,"affection":0.1,"dependency":0.0}',
  last_active       timestamptz          default now(),
  onboarded         boolean     not null default false,
  device_hash       text,
  phone             text,
  trial_end         timestamptz,
  voice_provider    text        default 'google' check (voice_provider in ('disabled','google','amazon','elevenlabs')),
  notification_enabled boolean  not null default true,
  quiet_hours_start integer     default 22,
  quiet_hours_end   integer     default 8,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

                              alter table public.profiles enable row level security;

                              -- سياسات الأمان: المستخدم يرى ويعدّل ملفه الشخصي فقط
                              create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
                              create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
                              create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);

                              -- ══════════════════════════════════════════════════════════════
                              -- 2. ملفات الشخصية (PERSONALITY PROFILES)
                              -- ══════════════════════════════════════════════════════════════
                              create table if not exists public.personality_profiles (
                                id              uuid        primary key default uuid_generate_v4(),
                                  user_id         uuid        not null unique references auth.users(id) on delete cascade,
                                    answers         jsonb       not null default '{}',
                                      analyzed_traits jsonb       not null default '{}',
                                        created_at      timestamptz not null default now(),
                                          updated_at      timestamptz not null default now()
                                          );

                                          alter table public.personality_profiles enable row level security;

                                          create policy "personality_own" on public.personality_profiles
                                            using (auth.uid() = user_id) with check (auth.uid() = user_id);

                                            -- ══════════════════════════════════════════════════════════════
                                            -- 3. الرسائل (MESSAGES)
                                            -- ══════════════════════════════════════════════════════════════
                                            create table if not exists public.messages (
                                              id           uuid        primary key default uuid_generate_v4(),
                                                user_id      uuid        not null references auth.users(id) on delete cascade,
                                                  sender       text        not null check (sender in ('user','twin')),
                                                    content      text        not null check (length(content) > 0),
                                                      created_at   timestamptz not null default now()
                                                      );

                                                      create index if not exists messages_user_created on public.messages(user_id, created_at desc);

                                                      alter table public.messages enable row level security;

                                                      create policy "messages_own" on public.messages
                                                        using (auth.uid() = user_id) with check (auth.uid() = user_id);

                                                        -- ══════════════════════════════════════════════════════════════
                                                        -- 4. الذكريات (MEMORIES)
                                                        -- ══════════════════════════════════════════════════════════════
                                                        create table if not exists public.memories (
                                                          id               uuid        primary key default uuid_generate_v4(),
                                                            user_id          uuid        not null references auth.users(id) on delete cascade,
                                                              content          text        not null check (length(content) > 0),
                                                                importance_score float       not null default 0.5 check (importance_score >= 0 and importance_score <= 1),
                                                                  emotional_tag    text,
                                                                    expires_at       timestamptz,           -- null = لا تنتهي (yearly plan)
                                                                      created_at       timestamptz not null default now()
                                                                      );

                                                                      create index if not exists memories_user_imp on public.memories(user_id, importance_score desc);
                                                                      create index if not exists memories_expires   on public.memories(expires_at) where expires_at is not null;

                                                                      alter table public.memories enable row level security;

                                                                      create policy "memories_own" on public.memories
                                                                        using (auth.uid() = user_id) with check (auth.uid() = user_id);

                                                                        -- ══════════════════════════════════════════════════════════════
                                                                        -- 5. الأهداف (GOALS)
                                                                        -- ══════════════════════════════════════════════════════════════
                                                                        create table if not exists public.goals (
                                                                          id          uuid        primary key default uuid_generate_v4(),
                                                                            user_id     uuid        not null references auth.users(id) on delete cascade,
                                                                              title       text        not null check (length(title) > 0 and length(title) <= 100),
                                                                                description text                 default '',
                                                                                  progress    int         not null default 0 check (progress >= 0 and progress <= 100),
                                                                                    deadline    date,
                                                                                      completed   boolean     not null default false,
                                                                                        created_at  timestamptz not null default now(),
                                                                                          updated_at  timestamptz not null default now()
                                                                                          );

                                                                                          create index if not exists goals_user on public.goals(user_id, created_at desc);

                                                                                          alter table public.goals enable row level security;

                                                                                          create policy "goals_own" on public.goals
                                                                                            using (auth.uid() = user_id) with check (auth.uid() = user_id);

                                                                                            -- ══════════════════════════════════════════════════════════════
                                                                                            -- 6. الاستخدام اليومي (DAILY USAGE)
                                                                                            -- ══════════════════════════════════════════════════════════════
                                                                                            create table if not exists public.daily_usage (
                                                                                              id         uuid   primary key default uuid_generate_v4(),
                                                                                                user_id    uuid   not null references auth.users(id) on delete cascade,
                                                                                                  date       date   not null default current_date,
                                                                                                    messages   int    not null default 0 check (messages >= 0),
                                                                                                      notifs     int    not null default 0 check (notifs >= 0),
                                                                                                        files      int    not null default 0 check (files >= 0),
                                                                                                          images     int    not null default 0 check (images >= 0),
                                                                                                            unique (user_id, date)
                                                                                                            );

                                                                                                            create index if not exists daily_usage_user_date on public.daily_usage(user_id, date desc);

                                                                                                            alter table public.daily_usage enable row level security;

                                                                                                            create policy "usage_own" on public.daily_usage
                                                                                                              using (auth.uid() = user_id) with check (auth.uid() = user_id);

                                                                                                              -- ══════════════════════════════════════════════════════════════
                                                                                                              -- 7. الاشتراكات (SUBSCRIPTIONS) — يكتبها RevenueCat Webhook
                                                                                                              -- ══════════════════════════════════════════════════════════════
                                                                                                              create table if not exists public.subscriptions (
                                                                                                                id                    uuid        primary key default uuid_generate_v4(),
                                                                                                                  user_id               uuid        not null unique references auth.users(id) on delete cascade,
                                                                                                                    tier                  text        not null default 'free' check (tier in ('free','premium','yearly')),
                                                                                                                      status                text        not null default 'active' check (status in ('active','cancelled','expired','paused')),
                                                                                                                        revenue_cat_id        text,
                                                                                                                          original_purchase_at  timestamptz,
                                                                                                                            expires_at            timestamptz,
                                                                                                                              will_renew            boolean     default true,
                                                                                                                                created_at            timestamptz not null default now(),
                                                                                                                                  updated_at            timestamptz not null default now()
                                                                                                                                  );

                                                                                                                                  alter table public.subscriptions enable row level security;

                                                                                                                                  create policy "subs_select_own" on public.subscriptions for select using (auth.uid() = user_id);
                                                                                                                                  -- Insert/Update via webhook (service_role) only.

                                                                                                                                  -- ══════════════════════════════════════════════════════════════
                                                                                                                                  -- 8. رموز التنبيهات (PUSH TOKENS)
                                                                                                                                  -- ══════════════════════════════════════════════════════════════
                                                                                                                                  create table if not exists public.push_tokens (
                                                                                                                                    id         uuid        primary key default uuid_generate_v4(),
                                                                                                                                      user_id    uuid        not null references auth.users(id) on delete cascade,
                                                                                                                                        token      text        not null,
                                                                                                                                          platform   text        check (platform in ('ios','android')),
                                                                                                                                            created_at timestamptz not null default now(),
                                                                                                                                              unique (user_id, token)
                                                                                                                                              );

                                                                                                                                              alter table public.push_tokens enable row level security;

                                                                                                                                              create policy "tokens_own" on public.push_tokens
                                                                                                                                                using (auth.uid() = user_id) with check (auth.uid() = user_id);

                                                                                                                                                -- ══════════════════════════════════════════════════════════════
                                                                                                                                                -- 9. مناظر مساعدة (VIEWS)
                                                                                                                                                -- ══════════════════════════════════════════════════════════════
                                                                                                                                                -- عرض موحد للملف الشخصي مع الاشتراك والسمات
                                                                                                                                                create or replace view public.user_context as
                                                                                                                                                select
                                                                                                                                                  p.user_id,
                                                                                                                                                    p.twin_name,
                                                                                                                                                      p.twin_gender,
                                                                                                                                                        p.bond_level,
                                                                                                                                                          p.tier,
                                                                                                                                                            p.theme,
                                                                                                                                                              p.relationship_dims,
                                                                                                                                                                p.last_active,
                                                                                                                                                                  p.onboarded,
                                                                                                                                                                    s.status       as sub_status,
                                                                                                                                                                      s.expires_at   as sub_expires,
                                                                                                                                                                        s.will_renew,
                                                                                                                                                                          pt.analyzed_traits
                                                                                                                                                                          from public.profiles p
                                                                                                                                                                          left join public.subscriptions    s  on s.user_id = p.user_id
                                                                                                                                                                          left join public.personality_profiles pt on pt.user_id = p.user_id;

                                                                                                                                                                          -- ══════════════════════════════════════════════════════════════
                                                                                                                                                                          -- 10. الدوال والمشغلات (FUNCTIONS & TRIGGERS)
                                                                                                                                                                          -- ══════════════════════════════════════════════════════════════

                                                                                                                                                                          -- إنشاء ملف شخصي تلقائي عند التسجيل
                                                                                                                                                                          create or replace function public.handle_new_user()
                                                                                                                                                                          returns trigger language plpgsql security definer set search_path = public as $$
                                                                                                                                                                          begin
                                                                                                                                                                            insert into public.profiles (user_id) values (new.id);
                                                                                                                                                                              return new;
                                                                                                                                                                              end;
                                                                                                                                                                              $$;

                                                                                                                                                                              drop trigger if exists on_auth_user_created on auth.users;
                                                                                                                                                                              create trigger on_auth_user_created
                                                                                                                                                                                after insert on auth.users
                                                                                                                                                                                  for each row execute procedure public.handle_new_user();

                                                                                                                                                                                  -- تحديث تلقائي لـ updated_at عند تعديل أي صف
                                                                                                                                                                                  create or replace function public.set_updated_at()
                                                                                                                                                                                  returns trigger language plpgsql as $$
                                                                                                                                                                                  begin
                                                                                                                                                                                    new.updated_at = now();
                                                                                                                                                                                      return new;
                                                                                                                                                                                      end;
                                                                                                                                                                                      $$;

                                                                                                                                                                                      create trigger profiles_updated_at before update on public.profiles
                                                                                                                                                                                        for each row execute procedure public.set_updated_at();

                                                                                                                                                                                        create trigger personality_updated_at before update on public.personality_profiles
                                                                                                                                                                                          for each row execute procedure public.set_updated_at();

                                                                                                                                                                                          create trigger goals_updated_at before update on public.goals
                                                                                                                                                                                            for each row execute procedure public.set_updated_at();

                                                                                                                                                                                            create trigger subs_updated_at before update on public.subscriptions
                                                                                                                                                                                              for each row execute procedure public.set_updated_at();

                                                                                                                                                                                              -- إكمال الهدف تلقائياً عند وصول التقدم إلى 100
                                                                                                                                                                                              create or replace function public.auto_complete_goal()
                                                                                                                                                                                              returns trigger language plpgsql as $$
                                                                                                                                                                                              begin
                                                                                                                                                                                                if new.progress = 100 then
                                                                                                                                                                                                    new.completed = true;
                                                                                                                                                                                                      end if;
                                                                                                                                                                                                        return new;
                                                                                                                                                                                                        end;
                                                                                                                                                                                                        $$;

                                                                                                                                                                                                        create trigger goal_auto_complete before update on public.goals
                                                                                                                                                                                                          for each row execute procedure public.auto_complete_goal();


-- ══════════════════════════════════════════════════════════════
-- 11. المنتجات والترشيحات (PRODUCTS & RECOMMENDATIONS)
-- ══════════════════════════════════════════════════════════════
create table if not exists public.products (
  id              uuid        primary key default uuid_generate_v4(),
  name            text        not null,
  description     text        not null,
  category        text        not null check (category in ('health','productivity','learning','entertainment','lifestyle')),
  affiliate_link  text        not null,
  image_url       text,
  active          boolean     not null default true,
  created_at      timestamptz not null default now()
);

alter table public.products enable row level security;
create policy "products_select_all" on public.products for select using (true);  -- اقرأ فقط عام

-- ══════════════════════════════════════════════════════════════
-- 12. الإشعارات المعلقة (PENDING NOTIFICATIONS)
-- ══════════════════════════════════════════════════════════════
create table if not exists public.pending_notifications (
  id              uuid        primary key default uuid_generate_v4(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  title           text        not null,
  body            text        not null,
  scheduled_at    timestamptz not null,
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists pending_notifications_user_scheduled on public.pending_notifications(user_id, scheduled_at);

alter table public.pending_notifications enable row level security;
create policy "notifications_own" on public.pending_notifications
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════
-- 13. انطباعات المنتجات (PRODUCT IMPRESSIONS)
-- ══════════════════════════════════════════════════════════════
create table if not exists public.product_impressions (
  id              uuid        primary key default uuid_generate_v4(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  product_id      uuid        not null references public.products(id) on delete cascade,
  message_id      text,
  created_at      timestamptz not null default now()
);

create index if not exists impressions_user_product on public.product_impressions(user_id, product_id);

alter table public.product_impressions enable row level security;
create policy "impressions_own" on public.product_impressions
  using (auth.uid() = user_id);
-- 11. تحسينات الذاكرة العاطفية (EMOTIONAL MEMORY ENHANCEMENTS)
-- ══════════════════════════════════════════════════════════════
-- تحديث جدول memories لإضافة بيانات عاطفية متقدمة
alter table public.memories add column if not exists emotion_primary text,
add column if not exists emotion_secondary jsonb default '[]',
add column if not exists emotion_intensity float default 0.5 check (emotion_intensity >= 0 and emotion_intensity <= 1),
add column if not exists context text,  -- السياق العاطفي (e.g. "thought about past")
add column if not exists is_milestone boolean default false,
add column if not exists tags jsonb default '[]',  -- كلمات مفتاحية للبحث
add column if not exists user_keywords text,  -- الكلمات التي يستخدمها المستخدم بكثرة
add column if not exists access_count int default 0;  -- كم مرة تم استدعاء هذه الذاكرة

-- ══════════════════════════════════════════════════════════════
-- 12. لحظات الارتباط (ATTACHMENT MOMENTS)
-- ══════════════════════════════════════════════════════════════
create table if not exists public.attachment_moments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  moment_type text not null check (moment_type in ('special_number', 'favorite_word', 'time_pattern', 'emotional_trigger', 'memory_callback')),
  description text not null,
  value text not null,  -- القيمة المحددة (e.g. اسم، رقم، وقت)
  emotion_associated text,  -- العاطفة المرتبطة بها
  frequency int default 1,  -- كم مرة حدثت
  last_mentioned timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists attachment_moments_user on public.attachment_moments(user_id);
alter table public.attachment_moments enable row level security;
create policy "attachment_own" on public.attachment_moments
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════
-- 13. أنماط المستخدم اليومية (USER PATTERNS)
-- ══════════════════════════════════════════════════════════════
create table if not exists public.user_patterns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  favorite_time_hour int,  -- الساعة المفضلة للدردشة
  favorite_time_day text,  -- اليوم المفضل
  mood_rhythm jsonb default '{}',  -- نمط المزاج (صباح/ظهر/مساء)
  conversation_style text,  -- أسلوب المحادثة (formal/casual)
  topics_preferred jsonb default '[]',  -- المواضيع المفضلة
  personality_type text,  -- NURTURER, ACHIEVER, etc
  communication_frequency text,  -- how often they chat
  peak_activity_times jsonb default '[]',  -- الأوقات النشطة
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_patterns enable row level security;
create policy "patterns_own" on public.user_patterns
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════
-- 14. الرسائل المجدولة (SCHEDULED MESSAGES)
-- ══════════════════════════════════════════════════════════════
create table if not exists public.scheduled_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message_type text not null check (message_type in ('daily_checkin', 'memory_callback', 'mood_based', 'milestone', 'unexpected_thought')),
  content text not null,
  scheduled_for timestamptz not null,
  sent boolean default false,
  sent_at timestamptz,
  is_recurring boolean default false,
  recurrence_pattern text,  -- cron-like pattern
  context jsonb,  -- بيانات سياقية
  created_at timestamptz not null default now()
);

create index if not exists scheduled_msg_user_time on public.scheduled_messages(user_id, scheduled_for);
alter table public.scheduled_messages enable row level security;
create policy "scheduled_own" on public.scheduled_messages
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════
-- 15. روابط الارتباط (CONNECTION BONDS)
-- ══════════════════════════════════════════════════════════════
create table if not exists public.connection_bonds (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stage text not null default 'stranger' check (stage in ('stranger', 'friend', 'trusted', 'soulmate')),
  stage_transitioned_at timestamptz,
  bond_constellation jsonb default '{"trust": 0.1, "empathy": 0.1, "humor": 0.1, "support": 0.1, "depth": 0.1}',
  transitional_messages jsonb default '[]',  -- رسائل خاصة عند الانتقال
  memorable_callbacks jsonb default '[]',  -- ذكريات مهمة جداً
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.connection_bonds enable row level security;
create policy "bonds_own" on public.connection_bonds
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════
-- ترايجر: إنشاء جداول العلاقات الافتراضية
-- ══════════════════════════════════════════════════════════════
create or replace function public.init_relationship_tables()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_patterns (user_id) values (new.id);
  insert into public.connection_bonds (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists init_relationship_data on public.profiles;
create trigger init_relationship_data
  after insert on public.profiles
  for each row execute procedure public.init_relationship_tables();

                                                                                                                                                                                                          -- حذف الذكريات منتهية الصلاحية (استدعاء cron)
                                                                                                                                                                                                          create or replace function public.cleanup_expired_memories()
                                                                                                                                                                                                          returns void language plpgsql security definer as $$
                                                                                                                                                                                                          begin
                                                                                                                                                                                                            delete from public.memories where expires_at is not null and expires_at < now();
                                                                                                                                                                                                            end;
                                                                                                                                                                                                            $$;

                                                                                                                                                                                                            -- زيادة عداد الاستخدام اليومي بشكل atomic
                                                                                                                                                                                                            create or replace function public.increment_daily_usage(
                                                                                                                                                                                                              p_user_id uuid,
                                                                                                                                                                                                                p_field   text,
                                                                                                                                                                                                                  p_date    date default current_date
                                                                                                                                                                                                                  ) returns void language plpgsql security definer as $$
                                                                                                                                                                                                                  begin
                                                                                                                                                                                                                    -- إنشاء صف اليوم إذا لم يوجد
                                                                                                                                                                                                                      insert into public.daily_usage (user_id, date, messages, notifs, files, images)
                                                                                                                                                                                                                        values (p_user_id, p_date, 0, 0, 0, 0)
                                                                                                                                                                                                                          on conflict (user_id, date) do nothing;

                                                                                                                                                                                                                            -- زيادة الحقل المطلوب
                                                                                                                                                                                                                              execute format(
                                                                                                                                                                                                                                  'update public.daily_usage set %I = %I + 1 where user_id = $1 and date = $2',
                                                                                                                                                                                                                                      p_field, p_field
                                                                                                                                                                                                                                        ) using p_user_id, p_date;
                                                                                                                                                                                                                                        end;
                                                                                                                                                                                                                                        $$;

                                                                                                                                                                                                                                        -- مزامنة tier في profiles عند تغيير الاشتراك
                                                                                                                                                                                                                                        create or replace function public.sync_profile_tier()
                                                                                                                                                                                                                                        returns trigger language plpgsql security definer as $$
                                                                                                                                                                                                                                        begin
                                                                                                                                                                                                                                          update public.profiles
                                                                                                                                                                                                                                            set tier = case
                                                                                                                                                                                                                                                when new.status = 'active' then new.tier
                                                                                                                                                                                                                                                    else 'free'
                                                                                                                                                                                                                                                      end
                                                                                                                                                                                                                                                        where user_id = new.user_id;
                                                                                                                                                                                                                                                          return new;
                                                                                                                                                                                                                                                          end;
                                                                                                                                                                                                                                                          $$;

                                                                                                                                                                                                                                                          create trigger sync_tier_on_sub_change
                                                                                                                                                                                                                                                            after insert or update on public.subscriptions
                                                                                                                                                                                                                                                              for each row execute procedure public.sync_profile_tier();