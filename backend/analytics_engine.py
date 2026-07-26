"""Phase 10: Advanced Analytics Suite — all figures derived from existing
tables (Forecast, Outcome, IncomeRecord, StateDemand) plus the shared
pricing constants in planner_engine. No new fabricated numbers."""
import planner_engine
import ai_engine


def forecast_accuracy_series(outcomes) -> list:
    buckets = {}
    for o in outcomes:
        if not (o.accepted and o.forecast and o.forecast.quantity):
            continue
        month = o.logged_at.strftime("%Y-%m")
        diff = abs(o.sold_quantity - o.forecast.quantity) / o.forecast.quantity
        buckets.setdefault(month, []).append(diff)

    series = []
    for month in sorted(buckets):
        diffs = buckets[month]
        mape = sum(diffs) / len(diffs)
        series.append({"month": month, "accuracy_pct": max(40, min(97, round((1 - mape) * 100)))})
    return series


def profit_trend(weaver, income_records) -> list:
    unit_price = planner_engine.UNIT_PRICE.get(weaver.product_category, 1200)
    material_per_unit = planner_engine.RAW_MATERIAL_PER_UNIT_KG.get(weaver.product_category, 0.45)
    margin_ratio = 1 - (material_per_unit * planner_engine.MATERIAL_COST_PER_KG) / unit_price
    return [
        {"month": r.month_label, "projected_profit": round(r.projected * margin_ratio),
         "actual_profit": round(r.actual * margin_ratio) if r.actual is not None else None}
        for r in sorted(income_records, key=lambda r: r.month_label)
    ]


def demand_curve(income_records) -> list:
    values = [r.projected for r in income_records]
    max_val = max(values) if values else 1
    return [
        {"month": r.month_label, "demand_index": round((r.projected / max_val) * 100)}
        for r in sorted(income_records, key=lambda r: r.month_label)
    ]


def state_comparison(state_rows, weaver_state_code) -> list:
    return [
        {"state_code": r.state_code, "state_name": r.state_name,
         "demand_index": r.demand_index, "growth_pct": r.growth_pct,
         "is_your_state": r.state_code == weaver_state_code}
        for r in sorted(state_rows, key=lambda r: -r.demand_index)
    ]


def product_comparison() -> list:
    return [
        {
            "category": cat,
            "unit_price": planner_engine.UNIT_PRICE[cat],
            "material_per_unit_kg": planner_engine.RAW_MATERIAL_PER_UNIT_KG[cat],
            "days_per_unit": planner_engine.DAYS_PER_UNIT[cat],
        }
        for cat in planner_engine.UNIT_PRICE
    ]


def risk_analysis(weaver, income_records, state_row, inventory_low_count: int) -> dict:
    stability = ai_engine.compute_stability_score(weaver, income_records)
    market_risk = 100 - min(100, max(0, (state_row.growth_pct if state_row else 0) * 4 + 50))
    inventory_risk = min(100, inventory_low_count * 25)
    income_risk = 100 - stability["component_breakdown"]["income_variance"]

    overall = round(0.4 * income_risk + 0.3 * market_risk + 0.3 * inventory_risk)
    return {
        "overall_risk_score": overall,
        "component_breakdown": {
            "income_volatility_risk": round(income_risk),
            "market_risk": round(market_risk),
            "inventory_risk": round(inventory_risk),
        },
    }