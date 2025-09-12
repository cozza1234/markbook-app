// src/pages/api/markbook/delete.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Set JSON content type header
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if Vercel Blob token exists
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ 
        error: 'Vercel Blob not configured',
        details: 'BLOB_READ_WRITE_TOKEN environment variable is missing. Please set up Vercel Blob storage first.'
      });
    }

    // Dynamically import Vercel Blob
    const { del } = await import('@vercel/blob');

    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid URL' });
    }

    await del(url);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting from Vercel Blob:', error);
    res.status(500).json({ 
      error: 'Failed to delete file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
