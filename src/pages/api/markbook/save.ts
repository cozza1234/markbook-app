// src/pages/api/markbook/save.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Set JSON content type header
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
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

    // Dynamically import Vercel Blob (helps with potential import issues)
    const { put } = await import('@vercel/blob');

    const { data, filename } = req.body;

    if (!data || !filename) {
      return res.status(400).json({ error: 'Missing data or filename' });
    }

    // Convert data to JSON string
    const jsonData = JSON.stringify(data, null, 2);
    
    // Create a blob from the JSON data
    const blob = new Blob([jsonData], { type: 'application/json' });

    // Upload to Vercel Blob with timestamp to avoid conflicts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pathname = `markbook-data/${filename}-${timestamp}.json`;

    const result = await put(pathname, blob, {
      access: 'public',
      addRandomSuffix: false, // We're adding our own timestamp
    });

    res.status(200).json({
      success: true,
      url: result.url,
      downloadUrl: result.downloadUrl,
      pathname: result.pathname
    });

  } catch (error) {
    console.error('Error saving to Vercel Blob:', error);
    res.status(500).json({ 
      error: 'Failed to save data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}