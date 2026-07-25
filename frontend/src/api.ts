import axios from "axios";

const API_BASE = "http://localhost:8000/api"; // keep your deployed URL here if different

export const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("ls_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Types -----------------------------------------------------------------
export interface WeaverProfile {
  id: number;
  name: string;
  cluster: string;
  product_category: string;
  region: string;
  weekly_capacity: number;
}

export interface MeResponse {
  user_id: number;
  username: string;
  weaver: WeaverProfile;
}

export interface Forecast {
  forecast_id: number;
  product: string;
  quantity: number;
  confidence: number;
  confidence_tier: "High" | "Medium" | "Emerging";
  target_date: string;
  reason: string;
}

export interface ExplanationFactor {
  factor: string;
  contribution: string;
}

export interface Explanation {
  prediction: string;
  confidence: number;
  confidence_tier: string;
  top_factors: ExplanationFactor[];
  explanation_text: string;
}

export interface IncomeMonth {
  month: string;
  projected: number;
  actual: number | null;
  below_safety: boolean;
}

export interface IncomeCalendarResponse {
  safety_threshold: number;
  months: IncomeMonth[];
}

export interface SimulationResult {
  baseline: { product: string; quantity: number; projected_income: number };
  scenario: { product: string; quantity: number; projected_income: number };
  income_delta: number;
  income_delta_pct: number;
  recommendation: string;
}

export interface StabilityScore {
  score: number;
  component_breakdown: {
    income_variance: number;
    product_diversity: number;
    payment_timeliness: number;
    cluster_volatility_exposure: number;
  };
}

export interface HeatmapStateSummary {
  state_code: string;
  state_name: string;
  demand_index: number;
  growth_pct: number;
}

export interface HeatmapStateDetail extends HeatmapStateSummary {
  top_products: string[];
  festivals: string[];
  price_trend: "rising" | "stable" | "falling";
}

export interface DashboardSummary {
  today_demand: { demand_index: number; label: string; driver: string };
  estimated_income: number | null;
  forecast_accuracy: { accuracy_pct: number; sample_size: number };
  market_trend: { growth_pct: number; state_name: string };
  recommended_product: string;
  inventory_status: string;
  production_capacity: number;
}

// --- Phase 5+6 types ---------------------------------------------------------
export interface ProductionPlanStep {
  step: number;
  title: string;
  value: string;
  detail: string;
}
export interface ProductionPlan {
  steps: ProductionPlanStep[];
  timeline_days: number;
  summary: string;
}
export interface ChatMessage {
  role: "user" | "assistant";
  message: string;
  language: string;
  created_at: string;
}
export interface ChatReply {
  reply_text: string;
  intent: string;
}

interface Envelope<T> {
  success: boolean;
  data: T;
  meta: { timestamp: string };
  error: { code?: string; message?: string } | null;
}

// --- API calls ---------------------------------------------------------------
export async function login(username: string, password: string) {
  const res = await client.post<Envelope<{ token: string; user: any }>>("/login", {
    username,
    password,
  });
  return res.data.data;
}

export async function getMe() {
  const res = await client.get<Envelope<MeResponse>>("/me");
  return res.data.data;
}

export async function getForecast(weaverId: number) {
  const res = await client.get<Envelope<Forecast>>(`/forecast/${weaverId}`);
  return res.data.data;
}

export async function getExplanation(forecastId: number) {
  const res = await client.get<Envelope<Explanation>>(`/forecast/${forecastId}/explain`);
  return res.data.data;
}

export async function getIncomeCalendar(weaverId: number) {
  const res = await client.get<Envelope<IncomeCalendarResponse>>(
    `/income-calendar/${weaverId}`
  );
  return res.data.data;
}

export async function simulateScenario(
  weaverId: number,
  altProductCategory: string,
  altQuantity: number
) {
  const res = await client.post<Envelope<SimulationResult>>("/simulate", {
    weaver_id: weaverId,
    alt_product_category: altProductCategory,
    alt_quantity: altQuantity,
  });
  return res.data.data;
}

export async function getStabilityScore(weaverId: number) {
  const res = await client.get<Envelope<StabilityScore>>(`/stability-score/${weaverId}`);
  return res.data.data;
}

export async function logOutcome(
  forecastId: number,
  soldQuantity: number,
  actualPrice: number,
  accepted = true
) {
  const res = await client.post<Envelope<{ outcome_id: number; logged: boolean }>>(
    "/outcomes",
    { forecast_id: forecastId, sold_quantity: soldQuantity, actual_price: actualPrice, accepted }
  );
  return res.data.data;
}

export async function getHeatmapStates() {
  const res = await client.get<Envelope<HeatmapStateSummary[]>>("/heatmap/states");
  return res.data.data;
}

export async function getHeatmapStateDetail(stateCode: string) {
  const res = await client.get<Envelope<HeatmapStateDetail>>(`/heatmap/states/${stateCode}`);
  return res.data.data;
}

export async function getDashboardSummary(weaverId: number) {
  const res = await client.get<Envelope<DashboardSummary>>(`/dashboard/summary/${weaverId}`);
  return res.data.data;
}

// --- Phase 5+6 API calls ------------------------------------------------------
export async function getProductionPlan(weaverId: number) {
  const res = await client.get<Envelope<ProductionPlan>>(`/planner/${weaverId}`);
  return res.data.data;
}

export async function getChatHistory(weaverId: number) {
  const res = await client.get<Envelope<ChatMessage[]>>(`/assistant/history/${weaverId}`);
  return res.data.data;
}

export async function sendChatMessage(weaverId: number, message: string, language: string) {
  const res = await client.post<Envelope<ChatReply>>("/assistant/chat", {
    weaver_id: weaverId, message, language,
  });
  return res.data.data;
}
// --- Phase 7+8 types ---------------------------------------------------------
export interface FestivalPrediction {
  festival_name: string;
  month: number;
  target_date: string;
  days_until: number;
  expected_demand_increase_pct: number;
  recommended_production: number;
  income_estimation: number;
  notes: string | null;
}

export interface MarketplaceChannelRecommendation {
  channel_name: string;
  channel_type: string;
  score: number;
  price_band_low: number;
  price_band_high: number;
  competition_level: "Low" | "Medium" | "High";
  reasoning: string;
  info_url: string | null;
}

export interface SchemeMatch {
  scheme_id: number;
  scheme_name: string;
  category: string;
  description: string;
  benefits: string;
  eligibility_notes: string;
  apply_link: string | null;
}

export interface SchemeMatchRequest {
  weaver_id?: number;
  age: number;
  state: string;
  occupation: string;
  income: number;
  gender: string;
  shg: boolean;
}

// --- Phase 7+8 API calls ------------------------------------------------------
export async function getFestivalPredictions(weaverId: number) {
  const res = await client.get<Envelope<FestivalPrediction[]>>(`/festivals/predict/${weaverId}`);
  return res.data.data;
}

export async function getMarketplaceRecommendations(weaverId: number) {
  const res = await client.get<Envelope<MarketplaceChannelRecommendation[]>>(
    `/marketplace/recommendations/${weaverId}`
  );
  return res.data.data;
}

export async function matchGovernmentSchemes(req: SchemeMatchRequest) {
  const res = await client.post<Envelope<SchemeMatch[]>>("/schemes/match", req);
  return res.data.data;
}