-- 建立任務優先級列舉
CREATE TYPE task_priority AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- 建立任務狀態列舉
CREATE TYPE task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- 建立 tasks 資料表
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  priority task_priority NOT NULL DEFAULT 'MEDIUM',
  status task_status NOT NULL DEFAULT 'PENDING',
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  assigned_to UUID,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 建立索引以提升查詢效能
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_vendor_id ON tasks(vendor_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
