// src/pages/api/markbook/load.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Set JSON content type header
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
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
    const { list } = await import('@vercel/blob');

    const { url } = req.query;

    if (url && typeof url === 'string') {
      // Load specific file by URL
      try {
        const response = await fetch(url);
        if (!response.ok) {
          return res.status(404).json({ error: 'File not found' });
        }
        const data = await response.json();
        return res.status(200).json({ success: true, data });
      } catch (error) {
        return res.status(500).json({ 
          error: 'Failed to load file',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      // List all markbook files
      const result = await list({
        prefix: 'markbook-data/',
        limit: 100, // Adjust as needed
      });

      const files = result.blobs
        .map(blob => ({
          pathname: blob.pathname,
          url: blob.url,
          downloadUrl: blob.downloadUrl,
          uploadedAt: blob.uploadedAt,
          size: blob.size,
          filename: blob.pathname.split('/').pop()?.replace('.json', '') || 'Unknown'
        }))
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()); // Most recent first

      res.status(200).json({
        success: true,
        files,
        hasMore: result.hasMore,
        cursor: result.cursor
      });
    }

  } catch (error) {
    console.error('Error loading from Vercel Blob:', error);
    res.status(500).json({ 
      error: 'Failed to load data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}