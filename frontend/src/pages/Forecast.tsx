import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot,
} from "recharts";
import { useAuth } from "../App";
import { getForecast, getExplanation, logOutcome, Forecast, Explanation } from "../api";
import { Card, ConfidenceBadge, ChartCard, FactorRow, Button } from "../components/ui";

export default function ForecastPage() {
  const { me } = useAuth();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me) return;
    getForecast(me.weaver.id).then((f) => {
      setForecast(f);
      getExplanation(f.forecast_id).then((e) => {
        setExplanation(e);
        setLoading(false);
      });
    });
  }, [me]);

  if (loading || !forecast || !explanation) {
    return <div className="text-[#5B6B7A]">Loading forecast...</div>;
  }

  // Build an illustrative demand curve leading up to the target date
  const target = new Date(forecast.target_date);
  const curveData = Array.from({ length: 8 }).map((_, i) => {
    const d = new Date(target);
    d.setDate(d.getDate() - (7 - i) * 5);
    const progress = i / 7;
    const demandIndex = Math.round(
      40 + progress * progress * 60 + (i % 2 === 0 ? 3 : -2)
    );
    return {
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      demand: demandIndex,
    };
  });

  const handleAction = async (accepted: boolean) => {
    await logOutcome(forecast.forecast_id, accepted ? forecast.quantity : 0, 0, accepted);
    setActionMsg(
      accepted
        ? "Recommendation accepted — logged to your production plan."
        : "Noted — we'll factor this into your next forecast."
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2A2A2A]">Forecast Detail</h1>
        <p className="text-[#5B6B7A] mt-1">
          Full breakdown of your current AI-generated production recommendation.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#5B6B7A] font-semibold">
              Recommended product
            </p>
            <h2 className="text-2xl font-bold text-[#2A2A2A] mt-1">{forecast.product}</h2>
            <p className="text-[#5B6B7A] mt-2 max-w-xl">{forecast.reason}</p>
          </div>
          <ConfidenceBadge tier={forecast.confidence_tier} />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-[#FBF7F0] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#2B3A67]">{forecast.quantity}</p>
            <p className="text-xs text-[#5B6B7A] mt-1">Recommended units</p>
          </div>
          <div className="bg-[#FBF7F0] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#2B3A67]">
              {new Date(forecast.target_date).toLocaleDateString("en-IN", {
                day: "numeric", month: "short",
              })}
            </p>
            <p className="text-xs text-[#5B6B7A] mt-1">Target ready date</p>
          </div>
          <div className="bg-[#FBF7F0] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#2B3A67]">
              {Math.round(forecast.confidence * 100)}%
            </p>
            <p className="text-xs text-[#5B6B7A] mt-1">Model confidence</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={() => handleAction(true)}>Accept recommendation</Button>
          <Button variant="outline" onClick={() => handleAction(false)}>
            Not this time
          </Button>
          <Button variant="secondary" onClick={() => setShowWhy(!showWhy)}>
            {showWhy ? "Hide" : "Why this recommendation?"}
          </Button>
        </div>
        {actionMsg && (
          <p className="text-sm text-[#3E7C4A] mt-3 font-medium">{actionMsg}</p>
        )}
      </Card>

      {showWhy && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[#2A2A2A] mb-1">
            Why this forecast?
          </h3>
          <p className="text-sm text-[#5B6B7A] mb-4">{explanation.explanation_text}</p>
          <div>
            {explanation.top_factors.map((f, idx) => (
              <FactorRow key={idx} factor={f.factor} contribution={f.contribution} />
            ))}
          </div>
        </Card>
      )}

      <ChartCard
        title="Demand Trend Leading to Target Date"
        summary="Illustrative demand-index curve showing why the model expects rising demand as the target date approaches."
      >
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={curveData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE6" />
            <XAxis dataKey="label" stroke="#5B6B7A" fontSize={12} />
            <YAxis stroke="#5B6B7A" fontSize={12} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EDEBE6" }} />
            <Line
              type="monotone"
              dataKey="demand"
              stroke="#E8A33D"
              strokeWidth={3}
              dot={{ r: 4, fill: "#E8A33D" }}
            />
            <ReferenceDot
              x={curveData[curveData.length - 1].label}
              y={curveData[curveData.length - 1].demand}
              r={6}
              fill="#A63A50"
              stroke="white"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}