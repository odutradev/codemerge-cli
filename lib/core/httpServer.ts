import { IncomingMessage, ServerResponse, createServer, Server } from 'http';
import { resolve } from 'path';
import { exec } from 'child_process';

import { MergeCache } from './mergeCache.js';
import { CodeMerger } from './codeMerger.js';
import { FileUtils } from '../utils/fileUtils.js';
import { Logger } from '../utils/logger.js';

import type { UpsertRequest, UpsertResult, SelectiveContentRequest, MergeOptions, CommandOutput } from '../types/merge.js';

export class HttpServer {
  private commandResult: CommandOutput | null = null;
  private mergeOptions: MergeOptions | null = null;
  private merger: CodeMerger | null = null;
  private server: Server | null = null;
  private projectName: string;
  private cache: MergeCache;
  private basePath: string;
  private port: number;

  constructor(port: number, projectName: string, cache: MergeCache, basePath: string = process.cwd()) {
    this.port = port;
    this.projectName = projectName;
    this.cache = cache;
    this.basePath = basePath;
  }

  public setMerger(merger: CodeMerger, options: MergeOptions): void {
    this.merger = merger;
    this.mergeOptions = options;
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

    if (url === '/content' || url === '/content/') {
      this.handleMergeEndpoint(res);
      return;
    }

    if (url === '/structure' || url === '/structure/') {
      this.handleStructureEndpoint(res);
      return;
    }

    if (url === '/selective-content' && method === 'POST') {
      this.handleSelectiveContentEndpoint(req, res);
      return;
    }

    if (url === '/command-output' || url === '/command-output/') {
      this.handleCommandOutputEndpoint(res);
      return;
    }

    if (url === '/health' || url === '/') {
      this.handleHealthEndpoint(res);
      return;
    }

    this.handleNotFound(res);
  }

  private async handleStructureEndpoint(res: ServerResponse): Promise<void> {
    if (!this.merger) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Merger not initialized' }));
      return;
    }

    try {
      const structure = await this.merger.getProjectStructure();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(structure));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to generate structure'
      }));
    }
  }

  private handleSelectiveContentEndpoint(req: IncomingMessage, res: ServerResponse): void {
    let body = '';

    req.on('data', chunk => body += chunk.toString());

    req.on('end', async () => {
      try {
        if (!this.merger) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Merger not initialized' }));
          return;
        }

        const data = JSON.parse(body) as SelectiveContentRequest;

        if (!data.selectedPaths || !Array.isArray(data.selectedPaths)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'selectedPaths array is required' }));
          return;
        }

        const result = await this.merger.getSelectiveContent(data.selectedPaths);

        if (!result.success) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Failed to generate content',
            details: result.errors
          }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(result.content);

        Logger.success(`Generated selective content with ${result.filesProcessed} files`);
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: error instanceof Error ? error.message : 'Invalid request'
        }));
      }
    });

    req.on('error', error => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    });
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
          this.executeConfiguredCommand();
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

  private executeConfiguredCommand(): void {
    const command = this.mergeOptions?.onUpsertCommand;
    if (!command) return;

    Logger.info(`Executing upsert command: ${command}`);

    exec(command, (error, stdout, stderr) => {
      const output = stdout + (stderr ? `\nSTDERR:\n${stderr}` : '');
      const success = !error;

      this.commandResult = {
        timestamp: new Date().toISOString(),
        command,
        output: output.trim(),
        error: error?.message,
        success
      };

      if (success) {
        Logger.success(`Command executed successfully`);
      } else {
        Logger.error(`Command execution failed: ${error?.message}`);
      }
    });
  }

  private handleCommandOutputEndpoint(res: ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.commandResult || { status: 'no_command_executed' }));
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
        merge: '/content',
        structure: '/structure',
        selectiveContent: '/selective-content',
        upsert: '/upsert',
        commandOutput: '/command-output',
        health: '/health'
      },
      mergeReady: this.cache.get() !== null
    }));
  }

  private handleNotFound(res: ServerResponse): void {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      availableEndpoints: ['/', '/health', '/content', '/structure', '/selective-content', '/upsert', '/command-output']
    }));
  }
}