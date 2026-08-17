# Contexto de negocio

Este documento es el contexto fijo que se inyecta en el prompt del AI Analyst — el equivalente MVP
del "Business Knowledge" de la propuesta de arquitectura original, sin RAG ni vector DB: es texto
plano versionado en el repo, corto a propósito para no inflar el costo de cada llamada al LLM.

## Negocio

`decision-engine` analiza el catálogo y las ventas de **OrderFlow**, un e-commerce de tecnología y
accesorios (cómputo, pantallas, periféricos, audio, conectividad, móvil, oficina).

## Objetivo

Aumentar ventas mediante recomendaciones automáticas, sin bajar la confianza del negocio en el
sistema — por eso todo pasa primero por modo SHADOW antes de ejecutarse en LIVE.

## KPIs primarios

- Unidades vendidas por producto (dato real, de OrderFlow)
- Tasa de abandono de carrito (dato **simulado** — ver catálogo)
- Cantidad de recomendaciones generadas y ejecutadas por modo (SHADOW vs LIVE)

## Constraints

- Ninguna recomendación se ejecuta en modo LIVE por encima del guardrail configurado
  (`LIVE_MODE_MAX_PER_HOUR`) — si se excede, cae a SHADOW en vez de bloquear la operación.
- Las métricas de marketing (vistas, abandono de carrito, tiempos de decisión) son **simuladas**:
  OrderFlow solo trackea pedidos confirmados, no comportamiento de navegación. Cualquier insight
  basado en esas métricas debe tratarse como una demostración del patrón, no como un dato real de
  negocio.
