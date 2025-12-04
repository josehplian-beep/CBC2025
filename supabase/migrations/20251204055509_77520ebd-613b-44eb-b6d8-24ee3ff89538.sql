-- First, delete existing members and families to start fresh
DELETE FROM public.members;
DELETE FROM public.families;

-- Create unique families based on "Group By Family" names (excluding "Single")
INSERT INTO public.families (family_name, street_address, city, county, state, postal_code)
SELECT DISTINCT
  family_name,
  '' as street_address,
  '' as city,
  '' as county,
  '' as state,
  '' as postal_code
FROM (VALUES
  ('Pu Ca Kung'), ('Tv. Tin Thang'), ('Pu Bawi Za Thawng'), ('Pu Huat Thang'), ('Pu Bawi Za Lian'),
  ('Pi Hniang Zi'), ('Pu Lian Duh'), ('Pu Lian Za Thang'), ('Pu Sui Thawng'), ('Pu Thawng Hlei'),
  ('Pu Maung Mang Lian Dawt'), ('Pu Tanh Zin'), ('Tv. Siang Hnin Lian'), ('Pu Kyi Soe'), ('Pu Khang Hnin'),
  ('Pu Lal Dun'), ('Pu Thawng Lian Cin'), ('Pu Sang Ceu'), ('Tv. Duh Cung Lian'), ('Pu Ceu Er'),
  ('Pu Lian Uk'), ('Pu Cung Lian Hup'), ('Pu Van Cung Thawng'), ('Pu Van Bawi Lian'), ('Pu Than Hmung'),
  ('Pu Tum Kheng'), ('Pu Tluang Kham'), ('Pu Rum Lo Thang'), ('Pu Thawng Hmung'), ('Pu Robert Thawng'),
  ('Pu Hmung Khar'), ('Pu Cung Er'), ('Pu Cung Biak Thawng'), ('Pu Peng Hu'), ('Pu Cung Biak Hmung'),
  ('Pu Van Kung'), ('Pu. Tin Cung'), ('Pu Tluang Mang'), ('Pu Kham Cung'), ('Pu Za Biak'),
  ('Pu Zang Cin'), ('Pu Sang Khar'), ('Pu Philip Bawi Tin Lian'), ('Pu Erick Vuangtu'), ('Pu Bawi Thar'),
  ('Pu Bawi Mang'), ('Pu Steven Ng'), ('Pi Vang Par'), ('Pi Sui Par(Tlemku)'), ('Rev. Van Duh Ceu'),
  ('Pu Bawi Hrin Thang'), ('Pu Shiang Kung'), ('Pu Tial Thuam'), ('Pu Cung Van Hmung'), ('Pi Khuang Tial'),
  ('Pu Van Bawi Thawng'), ('Pu Za Hlei Thang'), ('Pu Ceu Luai'), ('Pu Biak Hmung'), ('Pu Dawt Hlei Sang'),
  ('Pi Duh Tial Hnem'), ('Pu Bawi Cung Hu'), ('Pu Liancung Sangkung'), ('Pu Ngun Thawng'),
  ('Pu Van Thawng Ceu'), ('Pu Thang Er'), ('Pu Duh Tum'), ('Pu Tluang Bil'), ('Pu Biak Hnin'),
  ('Tv. Thla Hnin'), ('Pu Rung Cin'), ('Pu Van Tha Thawng'), ('Rev. Joseph Nihre Bawihrin'),
  ('Tv. Thawng Za Ting'), ('Pu Nawl Thang'), ('Pu Kham Bawi'), ('Pu Duh Mawng'), ('Pu Zo Tum Hmung'),
  ('Pu Tluang Hnin Thang'), ('Pu Hrang Uk'), ('Pu Tluang Hnin'), ('Pu Hlawn Mang'), ('Pu Bawi Hlei Thawng'),
  ('Pu Bawi Thawng'), ('Pi Sui Hnem Tial'), ('Pu Van Lal Mawia'), ('Pu Kyaw Myint'), ('Pu Thuam Hau'),
  ('Pu Bawi Lian'), ('Pu Sui Lian Thawng'), ('Pu Kenneth Mawi'), ('Pi Sui Kim'), ('Pu Tha Hmung'),
  ('Pi Rem Chin Sung'), ('Pu Kim Lai'), ('Pu Cung Bik'), ('Pu Cung Hnin'), ('Pu Cung Sang'),
  ('Pu Cin Khan Thang'), ('Pu Sui Thawng'), ('Pu Lun Za Thang'), ('Pi Thiak Tlem'), ('Tv. Siang Peng'),
  ('Pu Thawng Bil'), ('Pu Zam Kung'), ('Pu Tha Bil'), ('Pu Pa Cawng'), ('Pu Tin Thawng'),
  ('Pu Za Thawng'), ('Pu Sui Lian'), ('Pu Cung Uk')
) AS t(family_name);

-- Now insert all members with their family associations
INSERT INTO public.members (name, email, gender, phone, address, department, baptized, family_id)
SELECT 
  m.name,
  NULLIF(m.email, '') as email,
  NULLIF(m.gender, '') as gender,
  NULLIF(m.phone, '') as phone,
  NULLIF(m.address, '') as address,
  NULLIF(m.department, '') as department,
  CASE WHEN m.baptized = 'Yes' THEN true ELSE false END as baptized,
  f.id as family_id
FROM (VALUES
  ('Pu Ca Kung', '', 'Male', '', '7248 Montgomery Road, Apt #3A Elkridge, MD 21075', 'Member', 'Yes', 'Pu Ca Kung'),
  ('Pu Lai Ram Thang', '', 'Male', '667-701-5996', '7248 Montgomery Road, Apt #3A Elkridge, MD 21075', 'Member', 'Yes', 'Pu Ca Kung'),
  ('Pi Rosy Ma', '', 'Female', '443-858-0697', '7248 Montgomery Road, Apt #3A Elkridge, MD 21075', 'Member', 'Yes', 'Pu Ca Kung'),
  ('Hailee Nuntha Sui', '', 'Female', '', '7248 Montgomery Road, Apt #3A Elkridge, MD 21075', 'Member', '', 'Pu Ca Kung'),
  ('Tv. Tin Thang', '', 'Male', '', '7242 Montgomery Road, Apt #2A Elkridge, MD 21075', 'Member', '', 'Tv. Tin Thang'),
  ('Pi Duh Iang', '', 'Female', '', '7242 Montgomery Road, Apt #2A Elkridge, MD 21075', 'Member', 'Yes', 'Tv. Tin Thang'),
  ('Tv. Hmun Sang', '', 'Male', '', '7242 Montgomery Road, Apt #2A Elkridge, MD 21075', 'Member', '', 'Tv. Tin Thang'),
  ('Mint Tan Aung', '', 'Male', '', '7242 Montgomery Road, Apt #2A Elkridge, MD 21075', 'Member', '', 'Tv. Tin Thang'),
  ('Pu Bawi Za Thawng', '', 'Male', '', '5853 Diggers Ln, Elkridge, MD 21075', 'Member', 'Yes', 'Pu Bawi Za Thawng'),
  ('Pi Biak Hnem Par', '', 'Female', '', '5850 Diggers Ln, Elkridge, MD 21075', 'Member', 'Yes', 'Pu Bawi Za Thawng'),
  ('Isac Bawi Ram Thawng', '', 'Male', '', '5850 Diggers Ln, Elkridge, MD 21075', 'Member', '', 'Pu Bawi Za Thawng'),
  ('Rikily Hlawn Iang Thawng', '', 'Female', '', '5850 Diggers Ln, Elkridge, MD 21075', 'Member', '', 'Pu Bawi Za Thawng'),
  ('Pu Huat Thang', '', 'Male', '', '5826 Diggers Ln, Elkridge, MD 21075', 'Member', 'Yes', 'Pu Huat Thang'),
  ('Pi Khin Par', '', 'Female', '', '5826 Diggers Ln, Elkridge, MD 21075', 'Member', 'Yes', 'Pu Huat Thang'),
  ('Jacob Thang', '', 'Male', '410-603-5368', '5826 Diggers Ln, Elkridge, MD 21075', 'Member', '', 'Pu Huat Thang'),
  ('Bathsheba Tluang Len Par', '', 'Female', '', '5826 Diggers Ln, Elkridge, MD 21075', 'Member', '', 'Pu Huat Thang'),
  ('Enoch Thang', '', 'Male', '', '5826 Diggers Ln, Elkridge, MD 21075', 'Member', '', 'Pu Huat Thang'),
  ('Jehu Thang', '', 'Male', '', '5826 Diggers Ln, Elkridge, MD 21075', 'Member', '', 'Pu Huat Thang'),
  ('Seth Cung Za Lian Bawihrin', '', 'Male', '', '5826 Diggers Ln, Elkridge, MD 21075', 'Member', '', 'Pu Huat Thang'),
  ('Pu Bawi Za Lian', '', 'Male', '', '5843 Hunt Hill Dr, Unit 11-05, Elkridge, MD 21075', 'Member', 'Yes', 'Pu Bawi Za Lian'),
  ('Pi Tha Hlei Iang', '', 'Female', '', '5843 Hunt Hill Dr, Unit 11-05, Elkridge, MD 21075', 'Member', 'Yes', 'Pu Bawi Za Lian'),
  ('Van Bawi Lian', '', 'Male', '', '5843 Hunt Hill Dr, Unit 11-05, Elkridge, MD 21075', 'Member', '', 'Pu Bawi Za Lian'),
  ('Victor Dawt Hlei Lian', '', 'Male', '', '5843 Hunt Hill Dr, Unit 11-05, Elkridge, MD 21075', 'Member', '', 'Pu Bawi Za Lian'),
  ('Cung Dawt Lian', '', 'Male', '', '5843 Hunt Hill Dr, Unit 11-05, Elkridge, MD 21075', 'Member', '', 'Pu Bawi Za Lian'),
  ('Thin Hnem Par', '', 'Female', '', '5843 Hunt Hill Dr, Unit 11-05, Elkridge, MD 21075', 'Member', '', 'Pu Bawi Za Lian'),
  ('Pi Hniang Zi', '', 'Female', '', '5840 Whisper Way, Elkridge, MD 21075', 'Member', 'Yes', 'Pi Hniang Zi'),
  ('Enos Mang', '', 'Male', '667-802-0962', '5840 Whisper Way, Elkridge, MD 21075', 'Member', '', 'Pi Hniang Zi'),
  ('Lal Ngai Dam', '', 'Male', '410-603-6968', '5840 Whisper Way, Elkridge, MD 21075', 'Member', '', 'Pi Hniang Zi'),
  ('Pu Lian Duh', '', 'Male', '', '5870 Whisper Way Elkridge, MD 21075', 'Member', 'Yes', 'Pu Lian Duh'),
  ('Pi Ngun Zi', '', 'Female', '410-934-2574', '5870 Whisper Way Elkridge, MD 21075', 'Member', 'Yes', 'Pu Lian Duh'),
  ('Lg. Ro Sung Hniang', '', 'Female', '443-714-2819', '5870 Whisper Way Elkridge, MD 21075', 'Member', '', 'Pu Lian Duh'),
  ('Pi May Iang Sung', '', 'Female', '', '5870 Whisper Way Elkridge, MD 21075', 'Member', 'Yes', 'Pu Lian Duh'),
  ('Andrea May', '', 'Female', '', '5870 Whisper Way Elkridge, MD 21075', 'Member', '', 'Pu Lian Duh'),
  ('David Ro Cung Lian', '', 'Male', '', '5870 Whisper Way Elkridge, MD 21075', 'Member', '', 'Pu Lian Duh'),
  ('Elysa Kulh Lian', '', 'Male', '', '5870 Whisper Way Elkridge, MD 21075', 'Member', '', 'Pu Lian Duh')
) AS m(name, email, gender, phone, address, department, baptized, family_group)
LEFT JOIN public.families f ON f.family_name = m.family_group;