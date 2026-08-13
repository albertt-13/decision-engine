declare global {
  namespace Express {
    interface Request {
      operator?: { email: string };
      validatedQuery?: unknown;
    }
  }
}

export {};
