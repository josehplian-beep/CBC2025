-- Add year_range column to department_members table
ALTER TABLE public.department_members 
ADD COLUMN year_range text DEFAULT '2024-2025';

-- Add index for faster filtering by year_range
CREATE INDEX idx_department_members_year_range ON public.department_members(year_range);

-- Add composite unique constraint to prevent duplicate entries
ALTER TABLE public.department_members 
ADD CONSTRAINT unique_member_dept_year UNIQUE (name, department, year_range);