import type { McpContext, McpToolResult } from './types';
import { planTrip } from './tools/planTrip';
import { modifyPlan } from './tools/modifyPlan';
import { searchDestinations } from './tools/searchDestinations';
import { getRecommendations } from './tools/getRecommendations';
import { getTravelInfo } from './tools/getTravelInfo';
import { getWeather } from './tools/getWeather';
import { saveTrip } from './tools/saveTrip';
import { findNearest } from './tools/findNearest';
import { getUserInterests } from './tools/getUserInterests';
import { getAlternatives } from './tools/getAlternatives';
import { getDestinationDetails } from './tools/getDestinationDetails';

type ToolHandler = (input: any, ctx: McpContext) => McpToolResult | Promise<McpToolResult>;

export const mcpTools: Record<string, ToolHandler> = {
  plan_trip: planTrip,
  modify_plan: modifyPlan,
  search_destinations: searchDestinations,
  get_recommendations: getRecommendations,
  get_travel_info: getTravelInfo,
  get_weather: getWeather,
  save_trip: saveTrip,
  find_nearest: findNearest,
  get_user_interests: getUserInterests,
  get_alternatives: getAlternatives,
  get_destination_details: getDestinationDetails,
};

export async function executeTool(toolName: string, input: any, ctx: McpContext): Promise<McpToolResult> {
  const handler = mcpTools[toolName];
  if (!handler) return { error: `Unknown tool: ${toolName}` };
  return await handler(input, ctx);
}
