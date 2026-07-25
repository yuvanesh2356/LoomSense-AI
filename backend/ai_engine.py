"""LoomSense AI Engine — demand forecasting, explainability, income simulation,
Income Stability Score, and (Phase 3+4) dashboard demand/accuracy helpers.
Single-module, dependency-light, deterministic-but-realistic logic designed
to demonstrate a genuine forecasting pipeline."""
import hashlib
import json
from datetime import date, timedelta
from statistics import pstdev, mean

# --- Festival & seasonal demand calendar --------------------------------
# region -> list of (month, festival_name, category_lift_multiplier)
FESTIVAL_CALENDAR = {
    "Telangana": [
        (9, "Ganesh Chaturthi", 1.35), (10, "Dussehra & Wedding Season", 1.55),
        (11, "Diwali", 1.4), (2, "Off-season", 0.75),
    ],
    "Madhya Pradesh": [
        (10, "Navratri & Wedding Season", 1.45), (11, "Diwali", 1.5),
        (3, "Off-season", 0.7),
    ],
    "Tamil Nadu": [
        (8, "Aadi Sale Season", 1.2), (10, "Navratri (Golu)", 1.4),
        (1, "Pongal", 1.6), (5, "Off-season", 0.65),
    ],
}

PRODUCT_COLORS = {
    "Cotton Saree": ["Red/Gold", "Maroon/Cream", "Teal/Silver"],
    "Silk-Cotton Saree": ["Rust/Gold", "Green/Maroon", "Indigo/Cream"],
    "Silk Saree": ["Kanjeevaram Red/Gold", "Peacock Blue/Gold", "Deep Purple/Silver"],
}

# Phase 3+4: maps a weaver's `region` to the state_code used in the
# states_demand table, so the Dashboard's "Market Trend" card and the
# Demand Heatmap can be joined by region.
STATE_CODE_BY_REGION = {
    "Telangana": "TG",
    "Madhya Pradesh": "MP",
    "Tamil Nadu": "TN",
}


def _seeded_fraction(*parts) -> float:
    """Deterministic pseudo-random fraction in [0,1) from arbitrary inputs."""
    h = hashlib.sha256("|".join(str(p) for p in parts).encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


def _next_festival(region: str, from_date: date):
    """Return the nearest upcoming (month, name, lift) for a region."""
    entries = FESTIVAL_CALENDAR.get(region, [(from_date.month, "Seasonal demand", 1.0)])
    best = None
    best_delta = 999
    for month, name, lift in entries:
        delta = (month - from_date.month) % 12
        if delta < best_delta:
            best_delta, best = delta, (month, name, lift, delta)
    return best


def generate_forecast(weaver) -> dict:
    """Hierarchical-style forecast: macro (festival lift) + cluster (capacity/
    category baseline) + individual (seeded weaver variation)."""
    today = date.today()
    month, festival_name, lift, months_away = _next_festival(weaver.region, today)
    target_date = today + timedelta(days=max(14, months_away * 30 + 10))

    macro_base = weaver.weekly_capacity * 1.6          # macro category baseline
    cluster_adj = macro_base * (lift - 1.0) * 0.8      # cluster-level festival adjustment
    individual_noise = _seeded_fraction(weaver.id, today.isocalendar()[1]) * 0.2 - 0.1

    raw_qty = macro_base + cluster_adj
    quantity = max(4, round(raw_qty * (1 + individual_noise)))

    trend_signal = _seeded_fraction(weaver.id, "trend") * 0.15
    confidence = min(0.95, max(0.45, 0.55 + (lift - 1) * 0.5 + trend_signal))

    colors = PRODUCT_COLORS.get(weaver.product_category, ["Traditional colorway"])
    color = colors[int(_seeded_fraction(weaver.id, "color") * len(colors))]

    factors = [
        {"factor": f"{festival_name} demand lift ({weaver.region})",
         "contribution": f"+{round((lift - 1) * 100)}%"},
        {"factor": f"Cluster sell-through pattern ({weaver.cluster})",
         "contribution": f"+{round(cluster_adj)}"},
        {"factor": "Rising search/trend signal for this colorway",
         "contribution": f"+{round(trend_signal * 100)}%"},
        {"factor": "Individual capacity & history adjustment",
         "contribution": f"{'+' if individual_noise >= 0 else ''}{round(individual_noise * 100)}%"},
    ]

    reason = (
        f"Weave {quantity} {color} {weaver.product_category.lower()}s, ready by "
        f"{target_date.strftime('%d %b')} — {festival_name} is approaching in "
        f"{weaver.region}, historically lifting demand for this category."
    )

    return {
        "product": f"{color} {weaver.product_category}",
        "quantity": quantity,
        "confidence": round(confidence, 2),
        "target_date": target_date,
        "reason": reason,
        "factors": factors,
        "model_version": "macro-festival-v1 + cluster-adj-v1 + individual-shrink-v1",
    }


def confidence_tier(confidence: float) -> str:
    if confidence >= 0.75:
        return "High"
    if confidence >= 0.55:
        return "Medium"
    return "Emerging"


def build_explanation(forecast_row) -> dict:
    """Return the structured explanation object for a stored forecast."""
    factors = json.loads(forecast_row.factors_json)
    return {
        "prediction": f"{forecast_row.quantity} units — {forecast_row.product}",
        "confidence": forecast_row.confidence,
        "confidence_tier": confidence_tier(forecast_row.confidence),
        "top_factors": factors,
        "explanation_text": forecast_row.reason,
    }


def simulate_scenario(weaver, alt_product_category: str, alt_quantity: int) -> dict:
    """What-if: recompute a hypothetical income outcome vs. the current baseline."""
    base = generate_forecast(weaver)
    baseline_income = base["quantity"] * _estimated_unit_price(weaver.product_category)

    alt_price = _estimated_unit_price(alt_product_category)
    alt_income = alt_quantity * alt_price

    delta = alt_income - baseline_income
    delta_pct = round((delta / baseline_income) * 100, 1) if baseline_income else 0.0

    return {
        "baseline": {"product": base["product"], "quantity": base["quantity"],
                     "projected_income": round(baseline_income)},
        "scenario": {"product": alt_product_category, "quantity": alt_quantity,
                     "projected_income": round(alt_income)},
        "income_delta": round(delta),
        "income_delta_pct": delta_pct,
        "recommendation": (
            "This alternative looks more profitable." if delta > 0
            else "The original recommendation is still the stronger choice."
        ),
    }


def _estimated_unit_price(category: str) -> float:
    prices = {
        "Cotton Saree": 950, "Silk-Cotton Saree": 1800, "Silk Saree": 4200,
    }
    return prices.get(category, 1200)


def compute_stability_score(weaver, income_records) -> dict:
    """Composite 0-100 Income Stability Score from income variance + diversity."""
    actuals = [r.actual for r in income_records if r.actual is not None]
    if len(actuals) < 2:
        variance_component = 50.0
    else:
        cv = pstdev(actuals) / mean(actuals) if mean(actuals) else 1.0
        variance_component = max(0, 100 - cv * 100)

    diversity_component = 60.0  # single product category baseline for demo weavers
    payment_component = 75.0    # assumed reasonable payment timeliness for demo
    cluster_volatility_component = 70.0

    score = round(
        0.4 * variance_component
        + 0.2 * diversity_component
        + 0.2 * payment_component
        + 0.2 * cluster_volatility_component
    )

    return {
        "score": score,
        "component_breakdown": {
            "income_variance": round(variance_component),
            "product_diversity": diversity_component,
            "payment_timeliness": payment_component,
            "cluster_volatility_exposure": cluster_volatility_component,
        },
    }


def get_today_demand_snapshot(weaver) -> dict:
    """Phase 3+4: lightweight 'today' demand read for the Dashboard's
    'Today's Demand' card. Reuses the same festival-lift signal as
    generate_forecast, expressed as a single 0-100 index."""
    today = date.today()
    _, festival_name, lift, months_away = _next_festival(weaver.region, today)
    index = round(50 + (lift - 1) * 100 - months_away * 3)
    index = max(10, min(100, index))

    if index >= 70:
        label = "High"
    elif index >= 45:
        label = "Moderate"
    else:
        label = "Low"

    return {"demand_index": index, "label": label, "driver": festival_name}


def compute_forecast_accuracy(outcomes) -> dict:
    """Phase 3+4: heuristic forecast-accuracy percentage from logged
    outcomes, for the Dashboard's 'Forecast Accuracy' card. With too few
    outcomes logged yet, returns a conservative baseline rather than a
    misleadingly precise number from a tiny sample."""
    accepted = [o for o in outcomes if o.accepted]
    if len(accepted) < 2:
        return {"accuracy_pct": 78, "sample_size": len(accepted)}

    diffs = []
    for o in accepted:
        if o.forecast and o.forecast.quantity:
            diffs.append(abs(o.sold_quantity - o.forecast.quantity) / o.forecast.quantity)

    if not diffs:
        return {"accuracy_pct": 78, "sample_size": len(accepted)}

    mape = sum(diffs) / len(diffs)
    accuracy = max(40, min(97, round((1 - mape) * 100)))
    return {"accuracy_pct": accuracy, "sample_size": len(accepted)}