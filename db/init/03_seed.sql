-- Minimal seed data
INSERT INTO roles(key) VALUES
  ('admin'), ('project_manager'), ('foreman'), ('worker')
ON CONFLICT (key) DO NOTHING;

-- Users
INSERT INTO users(full_name, phone, email, status) VALUES
 ('ผู้ดูแลระบบ', '0863125891', 'admin@example.com', 'active'),
 ('วิชัย ลิ้มเจริญ', '+66853334444', 'pm@example.com', 'active'),
 ('สมิทธิ์ ไม่มีนี่', '+66861234567', 'foreman@example.com', 'active'),
 ('โสภา ไพบูลย์', '+66869876543', 'worker@example.com', 'active')
RETURNING id, phone;

-- Assign roles
WITH r AS (
  SELECT id, key FROM roles
), u AS (
  SELECT id, phone FROM users
)
INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id FROM u
JOIN r ON (r.key = CASE u.phone
  WHEN '0863125891' THEN 'admin'
  WHEN '+66853334444' THEN 'project_manager'
  WHEN '+66861234567' THEN 'foreman'
  WHEN '+66869876543' THEN 'worker'
END)
ON CONFLICT DO NOTHING;

-- Project + membership
WITH pm AS (
  SELECT id AS user_id FROM users WHERE phone = '+66853334444'
), fm AS (
  SELECT id AS user_id FROM users WHERE phone = '+66861234567'
), wk AS (
  SELECT id AS user_id FROM users WHERE phone = '+66869876543'
), new_project AS (
  INSERT INTO projects(name, owner_user_id)
  SELECT 'โครงการตัวอย่าง', pm.user_id FROM pm
  RETURNING id
)
INSERT INTO project_members(project_id, user_id, role_in_project)
SELECT np.id, (SELECT user_id FROM pm), 'PM' FROM new_project np;
INSERT INTO project_members(project_id, user_id, role_in_project)
SELECT np.id, (SELECT user_id FROM fm), 'Foreman' FROM new_project np;
INSERT INTO project_members(project_id, user_id, role_in_project)
SELECT np.id, (SELECT user_id FROM wk), 'Worker' FROM new_project np;

-- Site + tasks
WITH np AS (SELECT id FROM projects ORDER BY created_at DESC LIMIT 1),
     fm AS (SELECT id FROM users WHERE phone = '+66861234567'),
     wk AS (SELECT id FROM users WHERE phone = '+66869876543'),
     new_site AS (
       INSERT INTO sites(project_id, name, location)
       SELECT np.id, 'ไซต์ A', 'กรุงเทพฯ' FROM np
       RETURNING id, project_id
     )
INSERT INTO tasks(project_id, site_id, title, priority, status, assignee_user_id, due_date)
SELECT ns.project_id, ns.id, 'ติดตั้งแผ่นยิปซัม', 'high', 'todo', (SELECT id FROM fm), CURRENT_DATE + 7 FROM new_site ns;
INSERT INTO tasks(project_id, site_id, title, priority, status, assignee_user_id, due_date)
SELECT ns.project_id, ns.id, 'ตรวจความปลอดภัย', 'medium', 'in-progress', (SELECT id FROM wk), CURRENT_DATE + 10 FROM new_site ns;

-- Questions
INSERT INTO questions(text, category, difficulty, version, active) VALUES
 ('ใครควรสวมอุปกรณ์ป้องกันส่วนบุคคล (PPE) หน้างาน?', 'safety', 'easy', '1.0', true),
 ('เบรกเกอร์ทำหน้าที่อะไร?', 'electrical', 'easy', '1.0', true);

-- Options
WITH q1 AS (SELECT id FROM questions WHERE text LIKE 'ใครควรสวม%'),
     q2 AS (SELECT id FROM questions WHERE text LIKE 'เบรกเกอร์ทำหน้าที่%')
INSERT INTO question_options(question_id, text, is_correct)
SELECT (SELECT id FROM q1), 'ทุกคนที่อยู่ในพื้นที่ก่อสร้าง', true
UNION ALL SELECT (SELECT id FROM q1), 'เฉพาะผู้จัดการโครงการ', false
UNION ALL SELECT (SELECT id FROM q2), 'ป้องกันกระแสเกินและลัดวงจร', true
UNION ALL SELECT (SELECT id FROM q2), 'เพิ่มแรงดันไฟฟ้า', false;
