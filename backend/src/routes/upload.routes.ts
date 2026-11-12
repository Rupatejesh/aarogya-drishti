import { Router, Request, Response } from 'express';
import { uploadOralPhoto } from '../middleware/upload.middleware.js';
import cloudinaryService from '../services/cloudinary.service.js';

const router = Router();

/**
 * GET /api/v1/upload/status
 * Check Cloudinary connection status
 */
router.get('/status', (_req: Request, res: Response) => {
  const status = cloudinaryService.getStatus();
  res.json({
    success: true,
    ...status,
    message: status.configured
      ? `Cloudinary CDN active for cloud: ${status.cloudName}`
      : 'Cloudinary driver loaded with local storage fallback active'
  });
});

/**
 * POST /api/v1/upload/image
 * Upload image (multipart file or base64 JSON) to Cloudinary
 */
router.post(
  '/image',
  uploadOralPhoto.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { imageBase64, folder, patientUidn, tag } = req.body;
      let sourceToUpload: string | undefined;

      if (req.file) {
        sourceToUpload = req.file.path;
      } else if (imageBase64) {
        sourceToUpload = imageBase64;
      } else if (req.body.imageUrl) {
        sourceToUpload = req.body.imageUrl;
      }

      if (!sourceToUpload) {
        res.status(400).json({
          success: false,
          error: 'No image provided. Provide a multipart file or imageBase64 string.'
        });
        return;
      }

      const tags = ['aarogya_drishti'];
      if (tag) tags.push(tag);
      if (patientUidn) tags.push(patientUidn);

      const result = await cloudinaryService.uploadFile(sourceToUpload, {
        folder: folder || 'aarogya_drishti/uploads',
        tags
      });

      res.status(200).json({
        success: true,
        message: 'File processed and uploaded successfully',
        url: result.secure_url || result.url,
        secure_url: result.secure_url || result.url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
        cloudinary: {
          public_id: result.public_id,
          secure_url: result.secure_url,
          configured: cloudinaryService.isConfigured()
        }
      });
    } catch (err: any) {
      console.error('[UploadRoute] Upload error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to upload image'
      });
    }
  }
);

export default router;

