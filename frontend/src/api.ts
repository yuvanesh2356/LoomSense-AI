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
// --- Phase 9+10 types ---------------------------------------------------------
export interface InventoryItem {
  id: number; item_type: string; name: string; unit: string;
  available_stock: number; predicted_stock: number; required_stock: number;
  low_stock_threshold: number; status: "Adequate" | "Low" | "Critical";
  stock_gap: number; expiry_date: string | null; storage_location: string | null;
}
export interface AlertItem {
  id: number; alert_type: string; severity: "info" | "warning" | "critical";
  title: string; message: string; read: boolean; created_at: string;
}
export interface LearningResource {
  id: number; title: string; resource_type: "video" | "pdf" | "article";
  category: string; description: string; url: string | null; duration_minutes: number | null;
}
export interface CommunityProfile {
  id: number; name: string; profile_type: string; region: string; cluster: string;
  bio: string; contact_info: string | null;
}
export interface CommunityEvent {
  id: number; title: string; description: string; event_date: string;
  region: string; event_type: string;
}
export interface AnalyticsSummary {
  forecast_accuracy_series: { month: string; accuracy_pct: number }[];
  profit_trend: { month: string; projected_profit: number; actual_profit: number | null }[];
  demand_curve: { month: string; demand_index: number }[];
  state_comparison: { state_code: string; state_name: string; demand_index: number; growth_pct: number; is_your_state: boolean }[];
  product_comparison: { category: string; unit_price: number; material_per_unit_kg: number; days_per_unit: number }[];
  risk_analysis: {
    overall_risk_score: number;
    component_breakdown: { income_volatility_risk: number; market_risk: number; inventory_risk: number };
  };
}
export interface FabricRecognitionResult {
  avg_color_hex: string; hue_bucket: string; detected_pattern: string;
  predicted_category: string; estimated_price: number; similar_products: string[];
}
export interface WeaveRecommendation {
  category: string; quantity: number; expected_income: number;
  expected_demand_index: number; risk_level: "Low" | "Medium" | "High"; market_note: string;
}

// --- Phase 9+10 API calls -------------------------------------------------------
export async function getInventory(weaverId: number) {
  const res = await client.get<Envelope<InventoryItem[]>>(`/inventory/${weaverId}`);
  return res.data.data;
}

export async function getAlerts(weaverId: number) {
  const res = await client.get<Envelope<AlertItem[]>>(`/alerts/${weaverId}`);
  return res.data.data;
}

export async function markAlertRead(alertId: number) {
  const res = await client.patch<Envelope<{ id: number; read: boolean }>>(`/alerts/${alertId}/read`);
  return res.data.data;
}

export async function getLearningResources(category?: string) {
  const res = await client.get<Envelope<LearningResource[]>>("/learning/resources", { params: category ? { category } : {} });
  return res.data.data;
}

export async function getNearbyCommunity(weaverId: number) {
  const res = await client.get<Envelope<CommunityProfile[]>>(`/community/nearby/${weaverId}`);
  return res.data.data;
}

export async function getCommunityEvents(region?: string) {
  const res = await client.get<Envelope<CommunityEvent[]>>("/community/events", { params: region ? { region } : {} });
  return res.data.data;
}

export async function getAnalyticsSummary(weaverId: number) {
  const res = await client.get<Envelope<AnalyticsSummary>>(`/analytics/summary/${weaverId}`);
  return res.data.data;
}

export async function recognizeFabric(weaverId: number, file: File) {
  const formData = new FormData();
  formData.append("weaver_id", String(weaverId));
  formData.append("file", file);
  const res = await client.post<Envelope<FabricRecognitionResult>>("/fabric/recognize", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function recommendWhatToWeave(req: {
  weaver_id?: number; region: string; raw_material_kg: number; budget: number; time_available_days: number;
}) {
  const res = await client.post<Envelope<WeaveRecommendation[]>>("/recommend/what-to-weave", req);
  return res.data.data;
}