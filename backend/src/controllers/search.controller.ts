import { Request, Response } from 'express';
import store from '../services/store.service.js';

export const omnibarSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = String(req.query.q || '').trim();

    if (!query) {
      res.status(200).json({
        success: true,
        query: '',
        results: {
          patients: [],
          doctors: [],
          hospitals: [],
          prescriptions: []
        },
        totalMatches: 0
      });
      return;
    }

    const results = await store.searchOmnibar(query);
    const totalMatches =
      results.patients.length +
      results.doctors.length +
      results.hospitals.length +
      results.prescriptions.length;

    res.status(200).json({
      success: true,
      query,
      results,
      totalMatches
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

