'use strict';

(function () {
  if (window.__cozyBootstrapped) return;
  window.__cozyBootstrapped = true;

  const bus = new MessageBus();

  const agents = [
    new TypographyAgent(bus),
    new OverlayAgent(bus),
    new RulerAgent(bus),
    new BionicAgent(bus),
    new FocusAgent(bus),
    new SensoryAgent(bus),
    new DistractionAgent(bus),
    new TTSAgent(bus),
    new WritingAgent(bus),
    new ReadingModeAgent(bus),
    new TelemetryAgent(bus),
  ];

  const orchestrator = new ContentOrchestrator(bus);
  for (const agent of agents) {
    orchestrator.registerAgent(agent);
  }

  orchestrator.init();

  window.__cozyTelemetry = () => agents[agents.length - 1].report();
})();
