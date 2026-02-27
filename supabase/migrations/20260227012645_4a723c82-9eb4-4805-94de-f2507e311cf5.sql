-- Fix 2024-2025 deacons missing Upa prefix
UPDATE department_members SET name = 'Upa Cung Biak Thawng' WHERE id = '89101599-b474-4d32-a7a9-b37851026a97';
UPDATE department_members SET name = 'Upa Dawt Hlei Sang' WHERE id = '6a8d5875-ae1d-4062-bf7f-c9dd77440bcf';
UPDATE department_members SET name = 'Upa Biak Hnin' WHERE id = 'a1073f48-38e6-42b3-b1e6-73cb23056d54';
UPDATE department_members SET name = 'Upa Rung Cin' WHERE id = '71f88c31-0c84-4508-83f7-8982ab2cbde2';
UPDATE department_members SET name = 'Upa Cung Van Hmung' WHERE id = '0aa0249d-fbe2-4150-8535-4ba2711f26f5';
UPDATE department_members SET name = 'Upa Duh Mawng' WHERE id = '39980be1-eae6-4235-8e0d-469b5a995fb5';
UPDATE department_members SET name = 'Upa Van Cung Thawng' WHERE id = '7fcf8b4e-022a-4576-b1be-877647b39425';

-- Fix 2024-2025 deacons with Pu prefix to Upa
UPDATE department_members SET name = 'Upa Biak Hmung' WHERE id = '515ccad3-c10f-487e-bab9-435e632ac7b8';
UPDATE department_members SET name = 'Upa Thang Er' WHERE id = '22ff7574-f38f-41c0-819e-9d8088dd8b29';
UPDATE department_members SET name = 'Upa Ngun Za Cung' WHERE id = 'f3b6d51f-8a54-4af3-b5ee-3b798b4f783e';
UPDATE department_members SET name = 'Upa Zang Kung' WHERE id = '390a4140-f445-4841-988d-39be7275d0d6';
UPDATE department_members SET name = 'Upa Tial Thuam' WHERE id = '692e4342-9464-4626-9a57-68c889891778';

-- Fix lone 2022-2023 deacon record
UPDATE department_members SET name = 'Upa Biak Hmung' WHERE id = '52ccd767-a4d2-4a07-9c7a-da7e410b8369';