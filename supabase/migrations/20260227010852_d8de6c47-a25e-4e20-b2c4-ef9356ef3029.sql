-- Fix deacons missing "Upa" prefix (and double spaces)
UPDATE department_members SET name = 'Upa Biak Hnin' WHERE id = '4a00478e-3648-4033-a0e9-fadfd7d2f317';
UPDATE department_members SET name = 'Upa Cung Lian Hup' WHERE id = 'a97dd623-9f52-46fe-8ec6-208f8acc1d81';
UPDATE department_members SET name = 'Upa Tum Kheng' WHERE id = '16c805eb-f0b0-4ca2-a53a-057b2b72c848';
UPDATE department_members SET name = 'Upa Dawt Hlei Sang' WHERE id = '40f1a59f-11c1-43b1-9c93-e5787a8fe3e1';
UPDATE department_members SET name = 'Upa Ceu Er' WHERE id = '4f0e0053-56f8-42ec-ae7f-0b121cbcc16e';
UPDATE department_members SET name = 'Upa Cung Van Hmung' WHERE id = 'aef0232b-d577-46ce-84aa-462218355fa9';
UPDATE department_members SET name = 'Upa Rung Cin' WHERE id = '99f1b3a0-8300-4099-87e4-e6fc45d416ba';
UPDATE department_members SET name = 'Upa Duh Mawng' WHERE id = 'c2785ab3-195b-4a44-ab0e-3bdae4cf2041';
UPDATE department_members SET name = 'Upa Van Cung Thawng' WHERE id = '36b34a63-ed47-4354-bd5b-6679f3e53ea1';
UPDATE department_members SET name = 'Upa Hrang Uk' WHERE id = '74934395-ec76-481d-a9ae-1e0bcd40888d';
UPDATE department_members SET name = 'Upa Tluang Bil' WHERE id = '0349ef76-4e32-40ab-9fef-802c74d11e31';

-- Fix trailing space
UPDATE department_members SET name = 'Pi Sung Caan Tial' WHERE id = 'ba1298f1-03e6-4a90-9556-7854d2876ac7';