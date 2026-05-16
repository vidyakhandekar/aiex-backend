-- ════════════════════════════════════════════
-- TABLE: tenants
-- ════════════════════════════════════════════
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,                       -- "Allen Pune"
  slug        TEXT NOT NULL UNIQUE,                -- "allen-pune" (URL key)
  plan        TEXT NOT NULL DEFAULT 'free',        -- free | pro | enterprise
  is_active   BOOLEAN NOT NULL DEFAULT true,
  settings    JSONB DEFAULT '{}',                  -- flexible tenant config
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════
-- TABLE: users
-- Links to Supabase Auth (auth.users)
-- ════════════════════════════════════════════
CREATE TABLE users (
  id          UUID PRIMARY KEY,                    -- SAME as auth.users.id
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'student',     -- super_admin | tenant_admin | student
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_auth_user FOREIGN KEY (id)
    REFERENCES auth.users (id) ON DELETE CASCADE
);

-- ════════════════════════════════════════════
-- TABLE: tenant_members
-- Junction: which user belongs to which tenant, with what role
-- ════════════════════════════════════════════
CREATE TABLE tenant_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'student',     -- tenant_admin | student
  is_active   BOOLEAN NOT NULL DEFAULT true,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_tenant_user UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user   ON tenant_members(user_id);

-- ════════════════════════════════════════════
-- TABLE: exams
-- ════════════════════════════════════════════
CREATE TABLE exams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES users(id),
  title           TEXT NOT NULL,
  description     TEXT,
  subject         TEXT,                            -- NEET | JEE | CAT
  duration_mins   INTEGER NOT NULL DEFAULT 60,
  total_marks     INTEGER NOT NULL DEFAULT 100,
  passing_marks   INTEGER,
  is_published    BOOLEAN NOT NULL DEFAULT false,
  scheduled_at    TIMESTAMPTZ,                     -- NULL = available immediately
  expires_at      TIMESTAMPTZ,
  ai_generated    BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exams_tenant ON exams(tenant_id);

-- ════════════════════════════════════════════
-- TABLE: questions
-- ════════════════════════════════════════════
CREATE TABLE questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  exam_id         UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text   TEXT NOT NULL,
  question_type   TEXT NOT NULL DEFAULT 'mcq',     -- mcq | true_false | short_answer
  options         JSONB,                            -- [{ "key": "A", "text": "..." }]
  correct_answer  TEXT NOT NULL,                   -- "A" or "True" or exact text
  marks           INTEGER NOT NULL DEFAULT 1,
  negative_marks  NUMERIC(3,1) NOT NULL DEFAULT 0,
  order_index     INTEGER NOT NULL DEFAULT 0,
  explanation     TEXT,                            -- AI-generated explanation
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_exam   ON questions(exam_id);
CREATE INDEX idx_questions_tenant ON questions(tenant_id);

-- ════════════════════════════════════════════
-- TABLE: exam_attempts
-- One row per student-exam sitting
-- ════════════════════════════════════════════
CREATE TABLE exam_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  exam_id         UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'in_progress', -- in_progress | submitted | abandoned
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at    TIMESTAMPTZ,
  score           NUMERIC(6,2),                    -- calculated on submission
  total_marks     INTEGER,                         -- snapshot at attempt time
  ai_feedback     TEXT,                            -- AI summary after submission
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_student_exam UNIQUE (exam_id, student_id)  -- one attempt per student per exam
);

CREATE INDEX idx_attempts_tenant  ON exam_attempts(tenant_id);
CREATE INDEX idx_attempts_exam    ON exam_attempts(exam_id);
CREATE INDEX idx_attempts_student ON exam_attempts(student_id);

-- ════════════════════════════════════════════
-- TABLE: submission_answers
-- One row per question answered in an attempt
-- ════════════════════════════════════════════
CREATE TABLE submission_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id      UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  given_answer    TEXT,                            -- NULL = unanswered
  is_correct      BOOLEAN,                         -- NULL until graded
  marks_earned    NUMERIC(4,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_answers_attempt ON submission_answers(attempt_id);

-- ════════════════════════════════════════════
-- FUNCTION: Handle New User Trigger
-- Auto-creates a row in our public.users table when a new auth.user is created
-- ════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
