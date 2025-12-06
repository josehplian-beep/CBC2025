import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentAvatarProps {
  photoUrl: string | null | undefined;
  fullName: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * A specialized Avatar component for student photos that uses signed URLs
 * for secure access to the private student-photos bucket.
 */
export function StudentAvatar({ 
  photoUrl, 
  fullName, 
  className,
  fallbackClassName 
}: StudentAvatarProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!photoUrl) {
      setSignedUrl(null);
      return;
    }

    const generateSignedUrl = async () => {
      setLoading(true);
      try {
        // Extract the file path from a full URL if needed
        let filePath = photoUrl;
        
        // Check if it's a full Supabase storage URL
        if (photoUrl.includes('/storage/v1/object/public/student-photos/')) {
          const parts = photoUrl.split('/storage/v1/object/public/student-photos/');
          if (parts.length > 1) {
            filePath = parts[1];
          }
        } else if (photoUrl.includes('/storage/v1/object/student-photos/')) {
          const parts = photoUrl.split('/storage/v1/object/student-photos/');
          if (parts.length > 1) {
            filePath = parts[1];
          }
        }

        const { data, error } = await supabase.storage
          .from('student-photos')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) {
          console.error('Error generating signed URL for student photo:', error);
          setSignedUrl(null);
        } else {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error generating signed URL:', err);
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    };

    generateSignedUrl();
  }, [photoUrl]);

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <Avatar className={cn("border-2 border-primary/20", className)}>
      {loading ? (
        <AvatarFallback className={cn("animate-pulse bg-muted", fallbackClassName)}>
          {initials || <User className="h-1/2 w-1/2" />}
        </AvatarFallback>
      ) : signedUrl ? (
        <AvatarImage src={signedUrl} alt={fullName} />
      ) : null}
      <AvatarFallback className={cn("bg-gradient-to-br from-primary to-accent text-primary-foreground", fallbackClassName)}>
        {initials || <User className="h-1/2 w-1/2" />}
      </AvatarFallback>
    </Avatar>
  );
}
