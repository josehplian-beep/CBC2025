import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to generate signed URLs for private storage buckets
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket (can be a full URL or just the path)
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 */
export function useSignedUrl(
  bucket: string,
  path: string | null | undefined,
  expiresIn: number = 3600
) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setSignedUrl(null);
      return;
    }

    const generateSignedUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        // Extract the file path from a full URL if needed
        let filePath = path;
        
        // Check if it's a full Supabase storage URL
        if (path.includes('/storage/v1/object/public/')) {
          const parts = path.split(`/storage/v1/object/public/${bucket}/`);
          if (parts.length > 1) {
            filePath = parts[1];
          }
        } else if (path.includes('/storage/v1/object/')) {
          const parts = path.split(`/storage/v1/object/${bucket}/`);
          if (parts.length > 1) {
            filePath = parts[1];
          }
        }

        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, expiresIn);

        if (signError) {
          throw signError;
        }

        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error('Error generating signed URL:', err);
        setError(err instanceof Error ? err : new Error('Failed to generate signed URL'));
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    };

    generateSignedUrl();
  }, [bucket, path, expiresIn]);

  return { signedUrl, loading, error };
}

/**
 * Utility function to generate a signed URL (for non-hook contexts)
 */
export async function getSignedUrl(
  bucket: string,
  path: string | null | undefined,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!path) return null;

  try {
    // Extract the file path from a full URL if needed
    let filePath = path;
    
    if (path.includes('/storage/v1/object/public/')) {
      const parts = path.split(`/storage/v1/object/public/${bucket}/`);
      if (parts.length > 1) {
        filePath = parts[1];
      }
    } else if (path.includes('/storage/v1/object/')) {
      const parts = path.split(`/storage/v1/object/${bucket}/`);
      if (parts.length > 1) {
        filePath = parts[1];
      }
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Error generating signed URL:', err);
    return null;
  }
}
