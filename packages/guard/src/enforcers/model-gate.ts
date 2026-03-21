export class ModelGate {
  private allowed: string[];

  constructor(allowedModels: string[]) {
    this.allowed = allowedModels;
  }

  check(model: string): { allowed: boolean; reason?: string; suggestions?: string[] } {
    if (this.allowed.length === 0) {
      return { allowed: true };
    }

    const isAllowed = this.allowed.some((pattern) => this.matches(model, pattern));

    if (isAllowed) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Model "${model}" is not in the approved list`,
      suggestions: this.allowed.filter((m) => !m.includes('*')),
    };
  }

  private matches(model: string, pattern: string): boolean {
    if (pattern === model) return true;

    if (pattern.includes('*')) {
      const regexStr = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      return new RegExp(`^${regexStr}$`).test(model);
    }

    return model.includes(pattern) || pattern.includes(model);
  }
}
