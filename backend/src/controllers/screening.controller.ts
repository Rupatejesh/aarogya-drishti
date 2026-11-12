import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import store from '../services/store.service.js';
import geminiService from '../services/gemini.service.js';

export const analyzeOralPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patientUidn,
      oralRegion = 'Right Buccal Mucosa',
      symptomsChecklist = [],
      habitExposure = {},
      imageBase64
    } = req.body;

    let imageUrl = req.body.imageUrl;
    let localFilePath: string | undefined;

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      localFilePath = req.file.path;
    }

    // Persist base64 image to uploads folder if provided
    if (imageBase64 && !localFilePath && typeof imageBase64 === 'string' && imageBase64.startsWith('data:image')) {
      try {
        const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const filename = `oral-scan-${Date.now()}.${ext}`;
          const filePath = path.resolve(process.cwd(), 'uploads', filename);
          fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
          imageUrl = `/uploads/${filename}`;
          localFilePath = filePath;
        }
      } catch (saveErr) {
        console.warn('[ScreeningController] Could not persist base64 to disk:', saveErr);
      }
    }

    if (!imageUrl && !imageBase64) {
      imageUrl = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600';
    }

    // Parse habits if stringified (from multipart form data)
    let parsedHabits = habitExposure;
    if (typeof habitExposure === 'string') {
      try {
        parsedHabits = JSON.parse(habitExposure);
      } catch {
        parsedHabits = {};
      }
    }

    // Parse symptoms if stringified
    let parsedSymptoms = symptomsChecklist;
    if (typeof symptomsChecklist === 'string') {
      try {
        parsedSymptoms = JSON.parse(symptomsChecklist);
      } catch {
        parsedSymptoms = [symptomsChecklist];
      }
    }

    // Run Gemini multi-modal / Clinical AI Analysis
    const aiAnalysis = await geminiService.analyzeOralPhoto({
      oralRegion,
      imagePath: localFilePath,
      imageBase64,
      imageUrl,
      symptomsChecklist: Array.isArray(parsedSymptoms) ? parsedSymptoms : [],
      habitExposure: parsedHabits
    });

    const screeningId = `SCR-ASR-2026-${Date.now().toString().slice(-4)}`;

    const newScreening = {
      screeningId,
      patientUidn: patientUidn || 'UIDN-ASR-2026-0001',
      oralRegion,
      imageUrl,
      symptomsChecklist: parsedSymptoms,
      habitExposure: parsedHabits,
      aiCondition: aiAnalysis.aiCondition,
      aiConfidenceScore: aiAnalysis.aiConfidenceScore,
      aiLesionType: aiAnalysis.aiLesionType,
      boundingBoxCoordinates: aiAnalysis.boundingBoxCoordinates,
      clinicalRemarks: aiAnalysis.clinicalRemarks,
      createdAt: new Date()
    };

    const saved = await store.saveScreening(newScreening);

    await store.logAction({
      actorId: patientUidn || 'ANONYMOUS_PATIENT',
      role: 'patient',
      action: 'ORAL_SCREENING_ANALYZED',
      targetUidn: patientUidn,
      details: {
        screeningId,
        condition: aiAnalysis.aiCondition,
        confidence: aiAnalysis.aiConfidenceScore,
        modelUsed: aiAnalysis.modelUsed
      }
    });

    res.status(200).json({
      success: true,
      message: 'Oral cavity photo analyzed successfully with high-confidence onco-triage.',
      screening: saved,
      analysis: aiAnalysis
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getScreeningsByPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uidn } = req.params;
    const screenings = await store.findScreenings(uidn ? { patientUidn: uidn } : {});
    res.status(200).json({
      success: true,
      screenings
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

