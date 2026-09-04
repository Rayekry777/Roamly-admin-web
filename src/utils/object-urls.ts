export class ObjectUrlRegistry {
  private generation = 0;
  private readonly urls = new Map<string, string>();

  begin(): number {
    this.clear();
    return this.generation;
  }

  add(generation: number, id: string, blob: Blob): string | null {
    const url = URL.createObjectURL(blob);
    if (generation !== this.generation) {
      URL.revokeObjectURL(url);
      return null;
    }
    const previous = this.urls.get(id);
    if (previous) URL.revokeObjectURL(previous);
    this.urls.set(id, url);
    return url;
  }

  isCurrent(generation: number): boolean {
    return generation === this.generation;
  }

  clear(): void {
    this.generation += 1;
    this.urls.forEach((url) => URL.revokeObjectURL(url));
    this.urls.clear();
  }
}
