import { IncomingMessage, ServerResponse, createServer, Server } from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

import { FileUtils } from '../utils/fileUtils.js';
import { CodeMerger } from './codeMerger.js';
import { MergeCache } from './mergeCache.js';
import { Logger } from '../utils/logger.js';

import type { UpsertRequest, UpsertResult, SelectiveContentRequest, MergeOptions, CommandOutput, DeleteFilesRequest, DeleteFilesResult, CommitRequest } from '../types/merge.js';

const execAsync = promisify(exec);

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

  public setMerger = (merger: CodeMerger, options: MergeOptions): void => {
    this.merger = merger;
    this.mergeOptions = options;
  };

  public start = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      this.server = createServer(this.handleRequest);
      this.server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          Logger.error(`Port ${this.port} is already in use`);
          return reject(error);
        }
        Logger.error(`Server error: ${error.message}`);
        reject(error);
      });
      this.server.listen(this.port, () => resolve());
    });
  };

  public stop = (): void => {
    if (!this.server) return;
    this.server.close();
    this.server = null;
  };

  private handleRequest = (req: IncomingMessage, res: ServerResponse): void => {
    const url = req.url || '';
    const method = req.method || 'GET';

    if (url === '/upsert' && method === 'POST') return void this.handleUpsertEndpoint(req, res);
    if (url === '/delete-files' && method === 'POST') return void this.handleDeleteFilesEndpoint(req, res);
    if (url === '/commit' && method === 'POST') return void this.handleCommitEndpoint(req, res);
    if (url === '/selective-content' && method === 'POST') return void this.handleSelectiveContentEndpoint(req, res);
    if (url === '/content' || url === '/content/') return void this.handleMergeEndpoint(res);
    if (url === '/structure' || url === '/structure/') return void this.handleStructureEndpoint(res);
    if (url === '/command-output' || url === '/command-output/') return void this.handleCommandOutputEndpoint(res);
    if (url === '/health' || url === '/') return void this.handleHealthEndpoint(res);

    this.handleNotFound(res);
  };

  private handleStructureEndpoint = async (res: ServerResponse): Promise<void> => {
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
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate structure' }));
    }
  };

  private handleSelectiveContentEndpoint = (req: IncomingMessage, res: ServerResponse): void => {
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
          res.end(JSON.stringify({ error: 'Failed to generate content', details: result.errors }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(result.content);
        Logger.success(`Generated selective content with ${result.filesProcessed} files`);
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid request' }));
      }
    });
    req.on('error', error => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    });
  };

  private handleUpsertEndpoint = (req: IncomingMessage, res: ServerResponse): void => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = JSON.parse(body) as UpsertRequest;
        const result = this.processUpsert(data);
        res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        if (!result.success) return;

        Logger.success(`Upserted ${result.filesProcessed} files`);
        result.results.forEach(r => r.success ? Logger.plain(`  ${r.action}: ${r.path}`) : Logger.error(`  failed: ${r.path} - ${r.error}`));
        this.executeConfiguredCommand();
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Invalid request' }));
      }
    });
    req.on('error', error => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    });
  };

  private handleDeleteFilesEndpoint = (req: IncomingMessage, res: ServerResponse): void => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = JSON.parse(body) as DeleteFilesRequest;
        const result = this.processDeleteFiles(data);
        res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        if (!result.success) return;

        Logger.success(`Deleted ${result.filesProcessed} files`);
        result.results.forEach(r => r.success ? Logger.plain(`  deleted: ${r.path}`) : Logger.error(`  failed: ${r.path} - ${r.error}`));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Invalid request' }));
      }
    });
    req.on('error', error => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    });
  };

  private handleCommitEndpoint = (req: IncomingMessage, res: ServerResponse): void => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const data = JSON.parse(body) as CommitRequest;
        if (!data.message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Commit message is required' }));
          return;
        }

        const basePath = data.basePath ? resolve(data.basePath) : this.basePath;
        const cleanMessage = data.message.replace(/"/g, '\\"');

        await execAsync('git add .', { cwd: basePath });
        const { stdout, stderr } = await execAsync(`git commit -m "${cleanMessage}"`, { cwd: basePath });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, output: stdout.trim(), error: stderr ? stderr.trim() : undefined }));
        Logger.success(`Committed changes: ${cleanMessage}`);
      } catch (error: any) {
        const isNoChanges = error.stdout?.includes('nothing to commit') || error.message?.includes('nothing to commit');
        res.writeHead(isNoChanges ? 200 : 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: isNoChanges, output: error.stdout, error: isNoChanges ? 'No changes to commit' : error.message }));
        if (!isNoChanges) Logger.error(`Git commit failed: ${error.message}`);
      }
    });
  };

  private processUpsert = (data: UpsertRequest): UpsertResult => {
    if (!data.files || !Array.isArray(data.files)) {
      return { success: false, filesProcessed: 0, errors: ['Invalid request: files array is required'], results: [] };
    }

    const basePath = data.basePath ? resolve(data.basePath) : this.basePath;
    const results: UpsertResult['results'] = data.files.map(file => {
      if (!file.path || typeof file.content !== 'string') return { path: file.path || 'unknown', action: 'created', success: false, error: 'Invalid file entry' };
      const fullPath = resolve(basePath, file.path);
      if (!fullPath.startsWith(basePath)) return { path: file.path, action: 'created', success: false, error: 'Path outside base directory' };

      try {
        const action = FileUtils.upsert(fullPath, file.content);
        return { path: file.path, action, success: true };
      } catch (error) {
        return { path: file.path, action: 'created', success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const successCount = results.filter(r => r.success).length;
    const errors = results.filter(r => !r.success && r.error).map(r => `${r.path}: ${r.error!}`);
    return { success: successCount > 0, filesProcessed: successCount, errors, results };
  };

  private processDeleteFiles = (data: DeleteFilesRequest): DeleteFilesResult => {
    if (!data.files || !Array.isArray(data.files)) {
      return { success: false, filesProcessed: 0, errors: ['Invalid request: files array is required'], results: [] };
    }

    const basePath = data.basePath ? resolve(data.basePath) : this.basePath;
    const results: DeleteFilesResult['results'] = data.files.map(file => {
      if (!file || typeof file !== 'string') return { path: 'unknown', success: false, error: 'Invalid file path' };
      const fullPath = resolve(basePath, file);
      if (!fullPath.startsWith(basePath)) return { path: file, success: false, error: 'Path outside base directory' };

      try {
        const success = FileUtils.deleteFile(fullPath);
        return { path: file, success, error: success ? undefined : 'File not found' };
      } catch (error) {
        return { path: file, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const successCount = results.filter(r => r.success).length;
    const errors = results.filter(r => !r.success && r.error !== 'File not found').map(r => `${r.path}: ${r.error!}`);
    return { success: successCount > 0 || data.files.length === 0, filesProcessed: successCount, errors, results };
  };

  private executeConfiguredCommand = (): void => {
    const command = this.mergeOptions?.onUpsertCommand;
    if (!command) return;

    Logger.info(`Executing upsert command: ${command}`);
    exec(command, (error, stdout, stderr) => {
      const output = stdout + (stderr ? `\nSTDERR:\n${stderr}` : '');
      const success = !error;
      this.commandResult = { timestamp: new Date().toISOString(), command, output: output.trim(), error: error?.message, success };
      success ? Logger.success(`Command executed successfully`) : Logger.error(`Command execution failed: ${error?.message}`);
    });
  };

  private handleCommandOutputEndpoint = (res: ServerResponse): void => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.commandResult || { status: 'no_command_executed' }));
  };

  private handleMergeEndpoint = (res: ServerResponse): void => {
    const content = this.cache.get();
    if (!content) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Merge not ready yet' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(content);
  };

  private handleHealthEndpoint = (res: ServerResponse): void => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      project: this.projectName,
      endpoints: {
        merge: '/content',
        structure: '/structure',
        selectiveContent: '/selective-content',
        upsert: '/upsert',
        deleteFiles: '/delete-files',
        commit: '/commit',
        commandOutput: '/command-output',
        health: '/health'
      },
      mergeReady: this.cache.get() !== null
    }));
  };

  private handleNotFound = (res: ServerResponse): void => {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      availableEndpoints: ['/', '/health', '/content', '/structure', '/selective-content', '/upsert', '/delete-files', '/commit', '/command-output']
    }));
  };
}