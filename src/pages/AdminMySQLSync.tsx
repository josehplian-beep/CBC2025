import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/AdminLayout";
import { toast } from "sonner";
import { Database, RefreshCw, ArrowLeftRight } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function AdminMySQLSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncDirection, setSyncDirection] = useState<'bidirectional' | 'supabase-to-mysql' | 'mysql-to-supabase'>('bidirectional');

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('mysql-sync', {
        body: { direction: syncDirection }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">MySQL Database Sync</h1>
          <p className="text-muted-foreground">
            Synchronize member directory data between Supabase and MySQL
          </p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sync Configuration
              </CardTitle>
              <CardDescription>
                Choose the sync direction for your member data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={syncDirection} onValueChange={(value: any) => setSyncDirection(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bidirectional" id="bidirectional" />
                  <Label htmlFor="bidirectional" className="flex items-center gap-2 cursor-pointer">
                    <ArrowLeftRight className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Bidirectional Sync</div>
                      <div className="text-sm text-muted-foreground">
                        Sync data both ways (Supabase ↔ MySQL)
                      </div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="supabase-to-mysql" id="supabase-to-mysql" />
                  <Label htmlFor="supabase-to-mysql" className="flex items-center gap-2 cursor-pointer">
                    <div>
                      <div className="font-medium">Supabase → MySQL</div>
                      <div className="text-sm text-muted-foreground">
                        Push data from Supabase to MySQL only
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mysql-to-supabase" id="mysql-to-supabase" />
                  <Label htmlFor="mysql-to-supabase" className="flex items-center gap-2 cursor-pointer">
                    <div>
                      <div className="font-medium">MySQL → Supabase</div>
                      <div className="text-sm text-muted-foreground">
                        Pull data from MySQL to Supabase only
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              <Button 
                onClick={handleSync} 
                disabled={syncing}
                className="w-full"
                size="lg"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Start Sync
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About This Sync</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                This tool synchronizes member directory data between your Supabase PostgreSQL database 
                and your Hostinger MySQL database.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Bidirectional: Syncs changes in both directions</li>
                <li>Supabase → MySQL: Updates MySQL with Supabase data</li>
                <li>MySQL → Supabase: Updates Supabase with MySQL data</li>
              </ul>
              <p className="pt-2">
                The sync uses upsert operations, so existing records will be updated and new records will be created.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}