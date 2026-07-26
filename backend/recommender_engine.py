"""Phase 10: 'What Should I Weave?' recommendation engine — rule-based,
grounded in planner_engine's real pricing/material/time constants plus
whatever regional demand data exists in states_demand. No ML."""
import planner_engine


def recommend_products(state_row, raw_material_kg: float, budget: float, time_days: float) -> list:
    candidates = []
    for category in planner_engine.UNIT_PRICE:
        unit_price = planner_engine.UNIT_PRICE[category]
        material_per_unit = planner_engine.RAW_MATERIAL_PER_UNIT_KG[category]
        days_per_unit = planner_engine.DAYS_PER_UNIT[category]

        by_budget = budget / unit_price if unit_price else 0
        by_time = time_days / days_per_unit if days_per_unit else 0
        by_material = raw_material_kg / material_per_unit if material_per_unit else 0

        quantity = int(min(by_budget, by_time, by_material))
        expected_income = round(quantity * unit_price)

        demand_index = state_row.demand_index if state_row else 50
        growth_pct = state_row.growth_pct if state_row else 0.0

        if quantity < 2:
            risk_level = "High"
        elif growth_pct < 5 or demand_index < 45:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        candidates.append({
            "category": category,
            "quantity": quantity,
            "expected_income": expected_income,
            "expected_demand_index": demand_index,
            "risk_level": risk_level,
            "market_note": (
                f"{state_row.state_name} demand index {demand_index}/100, {growth_pct:+g}% growth"
                if state_row else "Regional demand data unavailable for this state."
            ),
        })

    candidates.sort(key=lambda c: (-c["expected_income"], c["risk_level"]))
    return candidates