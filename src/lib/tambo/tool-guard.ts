type AnyToolInput = Record<string, unknown>;

type GuardOptions = {
  toolName: string;
  defaultMessage?: string;
};

export function withTamboToolGuard<TInput extends AnyToolInput, TResult>(
  handler: (input: TInput) => Promise<TResult>,
  options: GuardOptions
) {
  return async (input: TInput): Promise<TResult> => {
    try {
      return await handler(input);
    } catch (error) {
      console.error(`[Tambo tool:${options.toolName}]`, error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(options.defaultMessage ?? "Tool execution failed.");
    }
  };
}

