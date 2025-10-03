export class MergeCache {
  private content: string | null = null;
  private lastUpdate: Date | null = null;

  public set(content: string): void {
    this.content = content;
    this.lastUpdate = new Date();
  }

  public get(): string | null {
    return this.content;
  }

  public getLastUpdate(): Date | null {
    return this.lastUpdate;
  }

  public clear(): void {
    this.content = null;
    this.lastUpdate = null;
  }

  public hasContent(): boolean {
    return this.content !== null;
  }
}