import { createServer, Server, IncomingMessage, ServerResponse } from 'http';

import { MergeCache } from './mergeCache.js';
import { Logger } from '../utils/logger.js';

export class HttpServer {
  private server: Server | null = null;
  private port: number;
  private projectName: string;
  private cache: MergeCache;

  constructor(port: number, projectName: string, cache: MergeCache) {
    this.port = port;
    this.projectName = projectName;
    this.cache = cache;
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

      this.server.listen(this.port, () => {
        resolve();
      });
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
      endpoint: `/${this.projectName}`,
      mergeReady: this.cache.get() !== null
    }));
  }

  private handleNotFound(res: ServerResponse): void {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      availableEndpoints: ['/', '/health', `/${this.projectName}`]
    }));
  }
}