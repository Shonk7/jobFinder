import { Request, Response, NextFunction } from 'express';
import { spawn } from 'child_process';
import path from 'path';

export const triggerScrape = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { source = 'all', query, limit = '100' } = req.body as {
      source?: string;
      query?: string;
      limit?: string;
    };

    const validSources = ['all', 'remotive', 'remoteok', 'arbeitnow'];
    const safeSource = validSources.includes(source) ? source : 'all';
    const safeLimit = Math.min(parseInt(limit, 10) || 100, 300);
    const safeQuery = query ? query.replace(/[^a-zA-Z0-9\s\-_.]/g, '').slice(0, 50) : null;

    const scriptPath = path.resolve(__dirname, '../../scripts/scrapeJobs.js');
    const args = [
      scriptPath,
      `--source=${safeSource}`,
      `--limit=${safeLimit}`,
    ];
    if (safeQuery) args.push(`--query=${safeQuery}`);

    const output: string[] = [];
    const child = spawn('node', args, { cwd: path.resolve(__dirname, '../..') });

    child.stdout?.on('data', (data: Buffer) => output.push(data.toString()));
    child.stderr?.on('data', (data: Buffer) => output.push(data.toString()));

    child.on('close', (code) => {
      if (code === 0) {
        const log = output.join('');
        const createdMatch = log.match(/Created\s*:\s*(\d+)/);
        const updatedMatch = log.match(/Updated\s*:\s*(\d+)/);
        const totalMatch = log.match(/DB total\s*:\s*(\d+)/);

        res.status(200).json({
          status: 'success',
          data: {
            created: createdMatch ? parseInt(createdMatch[1], 10) : 0,
            updated: updatedMatch ? parseInt(updatedMatch[1], 10) : 0,
            totalActive: totalMatch ? parseInt(totalMatch[1], 10) : null,
            source: safeSource,
          },
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Scrape failed — check backend logs',
        });
      }
    });

    child.on('error', (err) => next(err));
  } catch (err) {
    next(err);
  }
};
