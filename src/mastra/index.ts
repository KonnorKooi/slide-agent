import { Mastra } from "@mastra/core/mastra";
import { SlideAgent } from './agents/agent';

export const mastra = new Mastra({
  // ...
  agents: { SlideAgent },
});