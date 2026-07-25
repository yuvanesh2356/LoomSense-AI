"""Phase 7: Festival Predictor — pure computed logic over the `festivals`
DB table (see database.py). Kept separate from ai_engine.py's private
FESTIVAL_CALENDAR dict, which existing forecast generation (Phases 0-6)
still relies on — not touched, to avoid regressing working functionality."""
from datetime import date, timedelta


def _approx_target_date(today: date, delta_months: int) -> date:
    """Same simple day-count approximation style used elsewhere in this
    codebase (avoids pulling in a calendar-arithmetic dependency)."""
    return today + timedelta(days=max(10, delta_months * 30 + 10))


def predict_festivals(weaver, festival_rows, unit_price: float) -> list:
    """For each festival row applicable to the weaver's region, compute an
    expected demand increase, a recommended production quantity, and an
    income estimate — sorted soonest-first."""
    today = date.today()
    results = []

    for f in festival_rows:
        delta_months = (f.month - today.month) % 12
        target_date = _approx_target_date(today, delta_months)
        days_until = (target_date - today).days

        expected_demand_increase_pct = round((f.lift_multiplier - 1) * 100)
        recommended_production = max(4, round(weaver.weekly_capacity * f.lift_multiplier * 1.6))
        income_estimation = round(recommended_production * unit_price)

        results.append({
            "festival_name": f.festival_name,
            "month": f.month,
            "target_date": target_date.isoformat(),
            "days_until": days_until,
            "expected_demand_increase_pct": expected_demand_increase_pct,
            "recommended_production": recommended_production,
            "income_estimation": income_estimation,
            "notes": f.notes,
        })

    results.sort(key=lambda r: r["days_until"])
    return results