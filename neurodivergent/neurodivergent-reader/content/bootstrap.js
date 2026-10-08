'use strict';

/**
 * Content script entry point.
 * Creates MessageBus, instantiates all agents, wires them to the orchestrator.
 *
 * Guard: only runs once per page (prevents double-injection from service worker retries).
 */

(function () {
  if (window.__nrBootstrapped) return;
  window.__nrBootstrapped = true;

  const bus = new MessageBus();

  // Instantiate agents
  const styleAgent = new StyleAgent(bus);
  const rulerAgent = new RulerAgent(bus);
  const focusAgent = new FocusAgent(bus);
  const distractionAgent = new DistractionAgent(bus);
  const telemetryAgent = new TelemetryAgent(bus);

  // Orchestrator coordinates everything
  const orchestrator = new ContentOrchestrator(bus);
  orchestrator.registerAgent(styleAgent);
  orchestrator.registerAgent(rulerAgent);
  orchestrator.registerAgent(focusAgent);
  orchestrator.registerAgent(distractionAgent);
  orchestrator.registerAgent(telemetryAgent);

  // Start
  orchestrator.init();

  // Expose for debugging (console access)
  window.__nrTelemetry = () => telemetryAgent.report();
})();
