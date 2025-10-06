import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { resolve, join } from 'path';

import { MergeCache } from './mergeCache.js';
import { FileUtils } from '../utils/fileUtils.js';
import { Logger } from '../utils/logger.js';

import type { UpsertRequest, UpsertResult } from '../types/merge.js';

export class HttpServer {
  private server: Server | null = null;
  private port: number;
  private projectName: string;
  private cache: MergeCache;
  private basePath: string;

  constructor(port: number, projectName: string, cache: MergeCache, basePath: string = process.cwd()) {
    this.port = port;
    this.projectName = projectName;
    this.cache = cache;
    this.basePath = basePath;
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer(this.handleRequest.bind(this));
      
      this.server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          Logger.error(`Port ${this.port} is already in use`);
          reject(error);
        } else {
          Logger.error('Server error: ' + error.message);
          reject(error);
        }
      });

      this.server.listen(this.port, () => resolve());
    });
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url || '';
    const method = req.method || 'GET';
    
    if (url === '/upsert' && method === 'POST') {
      this.handleUpsertEndpoint(req, res);
      return;
    }
    
    if (url === `/${this.projectName}` || url === `/${this.projectName}/`) {
      this.handleMergeEndpoint(res);
      return;
    }
    
    if (url === '/health' || url === '/') {
      this.handleHealthEndpoint(res);
      return;
    }
    
    this.handleNotFound(res);
  }

  private handleUpsertEndpoint(req: IncomingMessage, res: ServerResponse): void {
    let body = '';
    
    req.on('data', chunk => body += chunk.toString());
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body) as UpsertRequest;
        const result = this.processUpsert(data);
        
        res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        
        if (result.success) {
          Logger.success(`Upserted ${result.filesProcessed} files`);
          result.results.forEach(r => {
            if (r.success) Logger.plain(`  ${r.action}: ${r.path}`);
            else Logger.error(`  failed: ${r.path} - ${r.error}`);
          });
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Invalid request' 
        }));
      }
    });

    req.on('error', error => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    });
  }

  private processUpsert(data: UpsertRequest): UpsertResult {
    if (!data.files || !Array.isArray(data.files)) {
      return {
        success: false,
        filesProcessed: 0,
        errors: ['Invalid request: files array is required'],
        results: []
      };
    }

    const basePath = data.basePath ? resolve(data.basePath) : this.basePath;
    const results: UpsertResult['results'] = [];
    const errors: string[] = [];

    for (const file of data.files) {
      try {
        if (!file.path || typeof file.content !== 'string') {
          errors.push(`Invalid file entry: missing path or content`);
          results.push({
            path: file.path || 'unknown',
            action: 'created',
            success: false,
            error: 'Invalid file entry'
          });
          continue;
        }

        const fullPath = resolve(basePath, file.path);
        
        if (!fullPath.startsWith(basePath)) {
          errors.push(`Security error: path outside base directory - ${file.path}`);
          results.push({
            path: file.path,
            action: 'created',
            success: false,
            error: 'Path outside base directory'
          });
          continue;
        }

        const action = FileUtils.upsert(fullPath, file.content);
        results.push({
          path: file.path,
          action,
          success: true
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to process ${file.path}: ${errorMsg}`);
        results.push({
          path: file.path,
          action: 'created',
          success: false,
          error: errorMsg
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount > 0,
      filesProcessed: successCount,
      errors,
      results
    };
  }

  private handleMergeEndpoint(res: ServerResponse): void {
    const content = this.cache.get();
    
    if (!content) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Merge not ready yet' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(content);
  }

  private handleHealthEndpoint(res: ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      project: this.projectName,
      endpoints: {
        merge: `/${this.projectName}`,
        upsert: '/upsert',
        health: '/health'
      },
      mergeReady: this.cache.get() !== null
    }));
  }

  private handleNotFound(res: ServerResponse): void {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      availableEndpoints: ['/', '/health', `/${this.projectName}`, '/upsert']
    }));
  }
}