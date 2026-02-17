
-- Create a table to store editable page content (paragraphs for Our Story section)
CREATE TABLE public.page_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key text NOT NULL,
  section_key text NOT NULL,
  content text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_bold boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(page_key, section_key, display_order)
);

-- Enable RLS
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view page content (public-facing)
CREATE POLICY "Anyone can view page content"
ON public.page_content
FOR SELECT
USING (true);

-- Administrators can manage page content
CREATE POLICY "Administrators can manage page content"
ON public.page_content
FOR ALL
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Editors can manage page content
CREATE POLICY "Editors can manage page content"
ON public.page_content
FOR ALL
USING (has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_page_content_updated_at
BEFORE UPDATE ON public.page_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the existing Our Story paragraphs
INSERT INTO public.page_content (page_key, section_key, content, display_order) VALUES
('about', 'our_story', 'Kan ram uknak a ṭhatlo ruangah Chinmi tampi cu kan ram chuahtak in ramdangah kan pem cio hna. A bikin kum 2006-2009 karlak ahhin Chinmi tampi Washington DC-Maryland Area ah kan phan cio hna.', 1),
('about', 'our_story', 'Kan rak phanhka ahcun Chin Baptist Mission Church ah chungtel kan rak la cio hna. Khrihfabu chungtel sinak an lak ko nain um kalnak motor kan rak ngeihlo caah le pumhnak hmun a rak hlat caah umkal aa harhmi tamtuk um a rak si ruangah Zophei (Chin) mifa hna cu an rak i pum kho tuk hna lo.', 2),
('about', 'our_story', 'Cucaah, DC-Maryland Area ah a phanmi Zophei (Chin) nu le pa hna cu meeting an rak ngei i kanmah tein khrihfabu dirh a ṭha ko lai tiah biachahnak an rak ngei. Cu biachahnak an rak ngeihmi cu Chin Baptist Mission Church ṭuanvo ngeitu nupa hna sin ah an theihter hna i, **March 07, 2010** ah Chin Baptist Mission Church nupa hna nih lungtlinnak an rak kan ngeihpi.', 3),
('about', 'our_story', 'Kanmah tein aa pum ding kan si cang caah khrihfabu min te zong ngeih kan hau cang. Cucaah, Chinmi kan pa asimi Pu Lian Uk nih khrihfabu min **"Chin Bethel Church"** tiah a rak kan sakpiak. Chin Bethel Church khrihfabu min in a voikhatnak pumhnak cu **March 10, 2010** ah Chin Baptist Mission Church khrihfabu thluachuah peknak in rak dirh/thawk asi.', 4),
('about', 'our_story', 'A voikhatnak kan rak i pumhlio ahhin chungtel kan dihlak 220 kan si. A tu ahcun Pathian nih fanu fapa thluachuah tampi a kan pek i chungtel kan dihlak 400 cung kan si ve cang.', 5),
('about', 'our_story', 'Chin Baptist Mission Church ah Pastor a ṭuan liomi Rev. Philip Hrengling cu kanmah nan kan pek ko lai tiah kan rak hal hna i CBMC nu le pa nih lunglawm tein an rak kan pek. Rev. Philip Hrengling nih **June 20, 2010** in a rak kan hruai i chungtel zong kan vun karhdeuh caah Rev. Joseph Nihre Bawihrin le Rev. Van Duh Ceu cu an pahnih tein **October 2013** ah caantling rianṭuantu nih rak lak an si.', 6);
