import type { SystemConfigRepository } from "../ports/SystemConfigRepository.js";
import { isValidExecutionMode, type ExecutionMode } from "../domain/executionMode/ExecutionMode.js";
import { BadRequestError } from "../shared/errors/AppError.js";

const EXECUTION_MODE_KEY = "execution_mode";
const DEFAULT_MODE: ExecutionMode = "SHADOW";

export class ToggleExecutionMode {
  constructor(private readonly systemConfigRepo: SystemConfigRepository) {}

  async current(): Promise<ExecutionMode> {
    const value = await this.systemConfigRepo.get(EXECUTION_MODE_KEY);
    return isValidExecutionMode(value ?? "") ? (value as ExecutionMode) : DEFAULT_MODE;
  }

  async switchTo(requestedMode: string): Promise<ExecutionMode> {
    if (!isValidExecutionMode(requestedMode)) {
      throw new BadRequestError(`Modo inválido: "${requestedMode}" (esperado SHADOW o LIVE)`);
    }
    await this.systemConfigRepo.set(EXECUTION_MODE_KEY, requestedMode);
    return requestedMode;
  }
}
