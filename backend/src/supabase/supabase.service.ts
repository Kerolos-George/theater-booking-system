import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Service Key must be configured');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async uploadReceipt(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    try {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        console.error('File too large:', file.size);
        throw new Error('File size exceeds 10MB limit');
      }

      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/pdf',
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        console.error('Invalid file type:', file.mimetype);
        throw new Error(
          'File type not supported. Please use JPG, PNG, GIF, or PDF',
        );
      }

      const fileExt = file.originalname.split('.').pop();
      let fileName = `${userId}-${Date.now()}.${fileExt}`;
      let filePath = `receipts/${fileName}`;

      console.log(
        `Uploading file: ${filePath}, Size: ${file.size} bytes, Type: ${file.mimetype}`,
      );

      let uploadSuccess = false;
      let uploadData = null;
      let lastError = null;

      // Retry up to 3 times
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Upload attempt ${attempt}/3`);

          const { data, error } = await Promise.race([
            this.supabase.storage.from('booking').upload(filePath, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            }),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Upload timeout after 25 seconds')),
                25000,
              ),
            ),
          ]) as { data: any; error: any };

          if (error) {
            lastError = error;
            console.error(`Upload attempt ${attempt} failed:`, error);

            if (error.message?.includes('already exists')) {
              fileName = `${userId}-${Date.now()}-${attempt}.${fileExt}`;
              filePath = `receipts/${fileName}`;
              console.log(`File exists, trying new name: ${filePath}`);
              continue;
            }

            if (attempt < 3) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * attempt),
              );
            }
            continue;
          }

          uploadData = data;
          uploadSuccess = true;
          console.log(`Upload successful on attempt ${attempt}`);
          break;
        } catch (timeoutError: any) {
          lastError = timeoutError;
          console.error(`Upload attempt ${attempt} timed out:`, timeoutError);
          if (attempt < 3) {
            await new Promise((resolve) =>
              setTimeout(resolve, 2000 * attempt),
            );
          }
        }
      }

      if (!uploadSuccess) {
        console.error('All upload attempts failed. Last error:', lastError);
        throw new Error(
          `Upload failed after 3 attempts: ${lastError?.message || lastError}`,
        );
      }

      const { data: publicUrlData } = this.supabase.storage
        .from('booking')
        .getPublicUrl(filePath);

      console.log(
        'Upload completed successfully, URL:',
        publicUrlData.publicUrl,
      );
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const bucketName = bucket || 'booking';

    const { error } = await this.supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}

