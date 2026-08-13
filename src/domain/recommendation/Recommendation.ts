export type RecommendationMode = "SHADOW" | "LIVE";

export interface RecommendationProps {
  id: string;
  targetRef: string;
  ruleTriggered: string;
  reason: string;
  mode: RecommendationMode;
  executedAt: Date | null;
  createdAt: Date;
}

/**
 * Entidad de dominio: una recomendación generada por el motor de reglas.
 * `markExecuted` es la única transición de estado real — mismo espíritu que
 * `OrderAggregate.transitionTo` en OrderFlow: la regla de negocio
 * ("solo se ejecuta una recomendación en modo LIVE, y una sola vez") vive
 * ACÁ, no en el caso de uso ni en el repositorio.
 */
export class Recommendation {
  private constructor(private readonly props: RecommendationProps) {}

  static create(params: {
    id: string;
    targetRef: string;
    ruleTriggered: string;
    reason: string;
    mode: RecommendationMode;
  }): Recommendation {
    return new Recommendation({ ...params, executedAt: null, createdAt: new Date() });
  }

  static fromPersisted(props: RecommendationProps): Recommendation {
    return new Recommendation(props);
  }

  get id(): string {
    return this.props.id;
  }

  get targetRef(): string {
    return this.props.targetRef;
  }

  get ruleTriggered(): string {
    return this.props.ruleTriggered;
  }

  get reason(): string {
    return this.props.reason;
  }

  get mode(): RecommendationMode {
    return this.props.mode;
  }

  get executedAt(): Date | null {
    return this.props.executedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  markExecuted(): void {
    if (this.props.mode !== "LIVE") {
      throw new Error("Solo se puede ejecutar una recomendación en modo LIVE");
    }
    if (this.props.executedAt) {
      throw new Error("Esta recomendación ya fue ejecutada");
    }
    this.props.executedAt = new Date();
  }

  toProps(): RecommendationProps {
    return { ...this.props };
  }
}
