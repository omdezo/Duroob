import type { McpContext, McpToolResult } from './types';
import { planTrip } from './tools/planTrip';
import { modifyPlan } from './tools/modifyPlan';
import { searchDestinations } from './tools/searchDestinations';
import { getRecommendations } from './tools/getRecommendations';
import { getTravelInfo } from './tools/getTravelInfo';

export const mcpTools: Record<string, (input: any, ctx: McpContext) => McpToolResult> = {
  plan_trip: planTrip,
  modify_plan: modifyPlan,
  search_destinations: searchDestinations,
  get_recommendations: getRecommendations,
  get_travel_info: getTravelInfo,
};

export function executeTool(toolName: string, input: any, ctx: McpContext): McpToolResult {
  const handler = mcpTools[toolName];
  if (!handler) return { error: `Unknown tool: ${toolName}` };
  return handler(input, ctx);
}
