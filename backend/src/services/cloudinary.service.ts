import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface CloudinaryUploadResult {
  success: boolean;
  url: string;
  secure_url: string;
  public_id: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  resource_type?: string;
  error?: string;
}

export class CloudinaryService {
  private static instance: CloudinaryService;
  private configured: boolean = false;

  private constructor() {
    this.init();
  }

  public static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService();
    }
    return CloudinaryService.instance;
  }

  /**
   * Initialize Cloudinary configuration from environment variables
   */
  public init(): void {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudinaryUrl) {
      cloudinary.config({
        cloudinary_url: cloudinaryUrl,
        secure: true
      });
      this.configured = true;
      console.log('☁️ [CloudinaryService] Initialized with CLOUDINARY_URL');
    } else if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });
      this.configured = true;
      console.log(`☁️ [CloudinaryService] Initialized for cloud: ${cloudName}`);
    } else {
      // Configure with cloud name if available (e.g. unsigned / client side preset ready)
      if (cloudName) {
        cloudinary.config({
          cloud_name: cloudName,
          secure: true
        });
      }
      this.configured = false;
      console.log('ℹ️ [CloudinaryService] Cloudinary credentials not fully supplied. Local fallback storage enabled.');
    }
  }

  /**
   * Check if Cloudinary is configured with valid credentials
   */
  public isConfigured(): boolean {
    if (!this.configured) {
      this.init();
    }
    return this.configured;
  }

  /**
   * Upload an image file, base64 data string, or remote URL to Cloudinary
   */
  public async uploadFile(
    fileSource: string,
    options: {
      folder?: string;
      public_id?: string;
      tags?: string[];
      overwrite?: boolean;
    } = {}
  ): Promise<CloudinaryUploadResult> {
    const folder = options.folder || 'aarogya_drishti/oral_scans';
    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: 'auto',
      overwrite: options.overwrite ?? true,
      tags: options.tags || ['aarogya_drishti', 'oral_cancer']
    };

    if (options.public_id) {
      uploadOptions.public_id = options.public_id;
    }

    if (!this.configured) {
      this.init();
    }

    if (this.configured) {
      try {
        console.log(`☁️ [CloudinaryService] Uploading file to Cloudinary (${folder})...`);
        const result: UploadApiResponse = await cloudinary.uploader.upload(fileSource, uploadOptions);
        console.log(`✅ [CloudinaryService] Successfully uploaded: ${result.secure_url} (Public ID: ${result.public_id})`);

        return {
          success: true,
          url: result.url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          resource_type: result.resource_type
        };
      } catch (err: any) {
        console.error('⚠️ [CloudinaryService] Cloudinary upload error:', err?.message || err);
        // Fallback gracefully below
      }
    }

    // Graceful fallback for local or offline operation
    const fallbackId = `local-${Date.now()}`;
    let fallbackUrl = fileSource;

    // If source is a local file path, translate to local URL
    if (typeof fileSource === 'string' && !fileSource.startsWith('http') && !fileSource.startsWith('data:')) {
      const filename = path.basename(fileSource);
      fallbackUrl = `/uploads/${filename}`;
    }

    return {
      success: false,
      url: fallbackUrl,
      secure_url: fallbackUrl,
      public_id: fallbackId,
      format: 'jpg',
      error: this.configured ? 'Upload failed, fell back to local' : 'Cloudinary credentials not configured'
    };
  }

  /**
   * Upload a Buffer directly using upload_stream
   */
  public async uploadBuffer(
    buffer: Buffer,
    options: {
      folder?: string;
      public_id?: string;
      tags?: string[];
    } = {}
  ): Promise<CloudinaryUploadResult> {
    if (!this.configured) {
      return this.uploadFile(`data:image/jpeg;base64,${buffer.toString('base64')}`, options);
    }

    return new Promise((resolve) => {
      const folder = options.folder || 'aarogya_drishti/oral_scans';
      const uploadOptions: UploadApiOptions = {
        folder,
        resource_type: 'auto',
        tags: options.tags || ['aarogya_drishti', 'oral_cancer']
      };

      if (options.public_id) {
        uploadOptions.public_id = options.public_id;
      }

      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error || !result) {
          console.error('⚠️ [CloudinaryService] Stream upload error:', error);
          resolve({
            success: false,
            url: '',
            secure_url: '',
            public_id: `stream-${Date.now()}`,
            error: error?.message || 'Stream upload failed'
          });
        } else {
          console.log(`✅ [CloudinaryService] Stream upload success: ${result.secure_url}`);
          resolve({
            success: true,
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            resource_type: result.resource_type
          });
        }
      });

      stream.end(buffer);
    });
  }

  /**
   * Specialized helper for patient oral scans
   */
  public async uploadOralScan(
    imageSource: string,
    patientUidn: string
  ): Promise<CloudinaryUploadResult> {
    const cleanUidn = (patientUidn || 'ANONYMOUS').replace(/[^a-zA-Z0-9_-]/g, '_');
    const publicId = `scan_${cleanUidn}_${Date.now()}`;

    return this.uploadFile(imageSource, {
      folder: 'aarogya_drishti/oral_scans',
      public_id: publicId,
      tags: ['oral_scan', cleanUidn, 'aarogya_drishti', 'tele_oncology']
    });
  }

  /**
   * Specialized helper for patient identity/profile photos
   */
  public async uploadPatientPhoto(
    imageSource: string,
    patientUidn: string
  ): Promise<CloudinaryUploadResult> {
    const cleanUidn = (patientUidn || 'PATIENT').replace(/[^a-zA-Z0-9_-]/g, '_');
    const publicId = `profile_${cleanUidn}_${Date.now()}`;

    return this.uploadFile(imageSource, {
      folder: 'aarogya_drishti/patient_profiles',
      public_id: publicId,
      tags: ['patient_profile', cleanUidn, 'aarogya_drishti']
    });
  }

  /**
   * Delete an asset from Cloudinary
   */
  public async deleteFile(publicId: string): Promise<boolean> {
    if (!this.configured) return true;
    try {
      const res = await cloudinary.uploader.destroy(publicId);
      return res.result === 'ok';
    } catch (err) {
      console.warn('⚠️ [CloudinaryService] Delete file failed:', err);
      return false;
    }
  }

  /**
   * Get service diagnostics and status
   */
  public getStatus(): {
    configured: boolean;
    cloudName: string;
    folder: string;
    driver: string;
  } {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || (process.env.CLOUDINARY_URL ? 'Configured via CLOUDINARY_URL' : 'Pending configuration in backend/.env');
    return {
      configured: this.configured,
      cloudName,
      folder: 'aarogya_drishti',
      driver: 'cloudinary-v2'
    };
  }
}

export default CloudinaryService.getInstance();

