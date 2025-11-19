import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const departmentMembers = [
  // Deacons
  { name: 'Upa Biak Hmung', role: 'Chairman', department: 'deacons', display_order: 1 },
  { name: 'Upa Thang Er', role: 'Vice Chairman', department: 'deacons', display_order: 2 },
  { name: 'Upa Cung Biak Thawng', role: 'Secretary', department: 'deacons', display_order: 3 },
  { name: 'Upa Ngunzacung', role: 'Assistant Secretary', department: 'deacons', display_order: 4 },
  { name: 'Upa Dawt Hlei Sang', role: 'Treasurer', department: 'deacons', display_order: 5 },
  { name: 'Upa Biak Hlun', role: 'Assistant Treasurer', department: 'deacons', display_order: 6 },
  { name: 'Upa Rung Cin', role: 'Member', department: 'deacons', display_order: 7 },
  { name: 'Upa Zang Kung', role: 'Member', department: 'deacons', display_order: 8 },
  { name: 'Upa Cung Van Hmung', role: 'Member', department: 'deacons', display_order: 9 },
  { name: 'Upa Tial Thluam', role: 'Member', department: 'deacons', display_order: 10 },
  // Women
  { name: 'Pi Sui Men', role: 'President', department: 'women', display_order: 1 },
  { name: 'Pi Zai Hlei Par', role: 'Vice President', department: 'women', display_order: 2 },
  { name: 'Pi Lalremruati', role: 'Secretary', department: 'women', display_order: 3 },
  { name: 'Pi Siang Hnem Par', role: 'Assistant Secretary', department: 'women', display_order: 4 },
  { name: 'Pi Ruth Dawt Hlei', role: 'Treasurer', department: 'women', display_order: 5 },
  { name: 'Pi Hniang Hlei Par', role: 'Assistant Treasurer', department: 'women', display_order: 6 },
  { name: 'Pi Sui Par', role: 'Member', department: 'women', display_order: 7 },
  { name: 'Pi Hniang Sui Tial', role: 'Member', department: 'women', display_order: 8 },
  { name: 'Pi Tin Hnem', role: 'Member', department: 'women', display_order: 9 },
  { name: 'Pi Hniang Zi Tial', role: 'Member', department: 'women', display_order: 10 },
  { name: 'Pi Ngun Tlem', role: 'Member', department: 'women', display_order: 11 },
  { name: 'Pi Thin Hnem', role: 'Member', department: 'women', display_order: 12 },
  // Youth
  { name: 'Val. Tluang Lian', role: 'President', department: 'youth', display_order: 1 },
  { name: 'Pu Bawi Za Ceu Lian', role: 'Vice President', department: 'youth', display_order: 2 },
  { name: 'Val. Bawi Min Sang', role: 'Secretary', department: 'youth', display_order: 3 },
  { name: 'Lg. Jairus Biak Tha Cin Par', role: 'Assistant Secretary', department: 'youth', display_order: 4 },
  { name: 'Lg. Bawi Chin Tial', role: 'Treasurer', department: 'youth', display_order: 5 },
  { name: 'Pi Nawmi Zinghlawng', role: 'Assistant Treasurer', department: 'youth', display_order: 6 },
  { name: 'Val. Bawi Lian Thawng', role: 'Member', department: 'youth', display_order: 7 },
  { name: 'Val. Za Hnin Thang', role: 'Member', department: 'youth', display_order: 8 },
  { name: 'Lg. Linda Sui Pen', role: 'Member', department: 'youth', display_order: 9 },
  { name: 'Lg. Zing Chin Par', role: 'Member', department: 'youth', display_order: 10 },
  { name: 'Pu Tha Lian Sang', role: 'Member', department: 'youth', display_order: 11 },
  { name: 'Pu Henry Khang Za Tin', role: 'Member', department: 'youth', display_order: 12 },
  // Children
  { name: 'Sayamah Sung Caan Tial', role: 'President (Pre-K)', department: 'children', display_order: 1 },
  { name: 'Lg. Sui Bor Iang', role: 'Vice President', department: 'children', display_order: 2 },
  { name: 'Val. Sang Awr', role: 'Secretary (Pre-K)', department: 'children', display_order: 3 },
  { name: 'Lg. Jairus Biak Tha Chin Par', role: 'Assistant Secretary (Seniors)', department: 'children', display_order: 4 },
  { name: 'Lg. Mang Hlawn Tial', role: 'Treasurer', department: 'children', display_order: 5 },
  { name: 'Lg. Sui Len Par', role: 'Assistant Treasurer', department: 'children', display_order: 6 },
  { name: 'Lg. Bawi Chin Tial', role: 'Teacher', department: 'children', display_order: 7 },
  { name: 'Pi Biak Par Iang Bawihrin', role: 'Teacher (Intermediate)', department: 'children', display_order: 8 },
  { name: 'Pi Rachel Sui Chin Par', role: 'Teacher (Intermediate)', department: 'children', display_order: 9 },
  { name: 'Pu Bawi Za Ceu Lian', role: 'Teacher (Junior)', department: 'children', display_order: 10 },
  { name: 'Pi Par Tin Tial', role: 'Teacher (Junior)', department: 'children', display_order: 11 },
  { name: 'Val. Bawi Lian Thawng', role: 'Teacher (Senior)', department: 'children', display_order: 12 },
  // Mission
  { name: 'Rev. Van Duh Ceu', role: 'Director', department: 'mission', display_order: 1 },
  { name: 'Rev. Joseph Nihre Bawihrin', role: 'Member', department: 'mission', display_order: 2 },
  { name: 'Pi Mang Hniang Sung', role: 'Treasurer', department: 'mission', display_order: 3 },
  { name: 'Pi May Iang Sung', role: 'Secretary', department: 'mission', display_order: 4 },
  { name: 'Pu Peng Hu', role: 'Member', department: 'mission', display_order: 5 },
  { name: 'Pi Van Tha Hlei Par', role: 'Member', department: 'mission', display_order: 6 },
  { name: 'Pi Hlei Sung', role: 'Member', department: 'mission', display_order: 7 },
  { name: 'Pi Sarah Thang', role: 'Member', department: 'mission', display_order: 8 },
  { name: 'Pu Siang Kung Thang', role: 'Member', department: 'mission', display_order: 9 },
  // Building
  { name: 'Pu Maung Maung Lian Dawt', role: 'Chairman', department: 'building', display_order: 1 },
  { name: 'Pu Khamh Cung', role: 'Secretary', department: 'building', display_order: 2 },
  { name: 'Pu Kyi Soe', role: 'Treasurer', department: 'building', display_order: 3 },
  { name: 'Pu Lai Ram Thang', role: 'Member', department: 'building', display_order: 4 },
  { name: 'Pu Lian Za Thang', role: 'Member', department: 'building', display_order: 5 },
  { name: 'Pu Sui Thawng', role: 'Member', department: 'building', display_order: 6 },
  { name: 'Pu Bawi Za Lian', role: 'Member', department: 'building', display_order: 7 },
  { name: 'Pu Cung Lian Hup', role: 'Member', department: 'building', display_order: 8 },
  { name: 'Pu Sang Ceu', role: 'Member', department: 'building', display_order: 9 },
  { name: 'Pu Thawng Hmung', role: 'Member', department: 'building', display_order: 10 },
  { name: 'Val. Thla Hnin', role: 'Member', department: 'building', display_order: 11 },
  { name: 'Val. Siang Hnin Lian', role: 'Member', department: 'building', display_order: 12 },
  // Culture
  { name: 'Pu Van Tha Thawng', role: 'President', department: 'culture', display_order: 1 },
  { name: 'Pu Lung Kung', role: 'Member', department: 'culture', display_order: 2 },
  { name: 'Lg. Sui Len Par', role: 'Member', department: 'culture', display_order: 3 },
  { name: 'Val. Bawi Lian Thawng', role: 'Member', department: 'culture', display_order: 4 },
  { name: 'Pi Rachel Sui Chin Par', role: 'Member', department: 'culture', display_order: 5 },
  // Media
  { name: 'Casey Tluangi', role: 'Admin', department: 'media', display_order: 1 },
  { name: 'Lg. Dawt Chin Tial', role: 'Member (PowerPoint)', department: 'media', display_order: 2 },
  { name: 'Lg. Ram Za Len', role: 'Member (Photographer)', department: 'media', display_order: 3 },
  { name: 'Nu Jessica Lian', role: 'Member (PowerPoint)', department: 'media', display_order: 4 },
  { name: 'Pa Bawi Pek Lian', role: 'Member (Live)', department: 'media', display_order: 5 },
  { name: 'Tv. Za Hning Thang', role: 'Member (Live)', department: 'media', display_order: 6 },
  // Auditors
  { name: 'Pu Henry Tin', role: 'Auditor', department: 'auditors', display_order: 1 },
  { name: 'Pu Lung Kung', role: 'Auditor', department: 'auditors', display_order: 2 },
];

export const MigrateDepartments = () => {
  const [loading, setLoading] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const [showMigration, setShowMigration] = useState(false);

  useEffect(() => {
    checkIfMigrationNeeded();
  }, []);

  const checkIfMigrationNeeded = async () => {
    try {
      const { count, error } = await supabase
        .from("department_members")
        .select("*", { count: 'exact', head: true });

      if (error) throw error;

      // Only show migration if there are no members in the database
      setShowMigration((count || 0) === 0);
    } catch (error) {
      // Silently handle check failure
    }
  };

  const handleMigrate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("department_members")
        .insert(departmentMembers)
        .select();

      if (error) throw error;

      toast.success(`Successfully migrated ${data?.length} department members!`);
      setMigrated(true);
      setTimeout(() => setShowMigration(false), 2000);
    } catch (error: any) {
      toast.error(`Migration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!showMigration) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-card border rounded-lg shadow-lg">
      <h3 className="font-semibold mb-2">Department Data Migration</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Click to migrate {departmentMembers.length} members to the database
      </p>
      <Button 
        onClick={handleMigrate} 
        disabled={loading || migrated}
        className="w-full"
      >
        {loading ? "Migrating..." : migrated ? "✓ Migrated" : "Migrate Now"}
      </Button>
    </div>
  );
};
