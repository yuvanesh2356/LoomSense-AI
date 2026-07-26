"""Phase 9: Smart Alerts — generated on-read (no background worker/queue),
deduped per weaver via a `source_key` so repeated GET calls never create
duplicate rows. Every signal here is derived from real data already
computed elsewhere in the app (inventory, state demand, festivals, income
calendar, production plan) — nothing is fabricated for the demo."""
from datetime import date
from database import Alert


def generate_alerts(weaver, inventory_items, state_row, festival_rows, income_records, plan, db):
    today = date.today()
    candidates = []

    # 1. Low / critical stock
    for item in inventory_items:
        if item.available_stock <= item.low_stock_threshold:
            candidates.append({
                "alert_type": "low_stock", "severity": "critical",
                "title": f"Low stock: {item.name}",
                "message": f"Only {item.available_stock}{item.unit} of {item.name} left, below your {item.low_stock_threshold}{item.unit} threshold.",
                "source_key": f"low_stock:{item.id}",
            })

    # 2. Price trend
    if state_row:
        if state_row.price_trend == "falling":
            candidates.append({
                "alert_type": "price_change", "severity": "warning",
                "title": f"{weaver.product_category} prices falling in {state_row.state_name}",
                "message": "Consider timing your next sale carefully or exploring alternate channels.",
                "source_key": f"price_falling:{state_row.state_code}",
            })
        elif state_row.price_trend == "rising":
            candidates.append({
                "alert_type": "price_change", "severity": "info",
                "title": f"{weaver.product_category} prices rising in {state_row.state_name}",
                "message": "A good window to negotiate better rates for your next batch.",
                "source_key": f"price_rising:{state_row.state_code}",
            })

    # 3. Festival approaching (within ~30 days)
    for f in festival_rows:
        delta_months = (f.month - today.month) % 12
        if delta_months * 30 <= 30:
            candidates.append({
                "alert_type": "festival_approaching", "severity": "info",
                "title": f"{f.festival_name} approaching",
                "message": f.notes or f"Demand typically rises around {f.festival_name}.",
                "source_key": f"festival:{weaver.region}:{f.festival_name}",
            })

    # 4. Low-income month approaching (next 2 upcoming months)
    projected_values = [r.projected for r in income_records]
    safety_threshold = sum(projected_values) / len(projected_values) * 0.6 if projected_values else None
    upcoming = [r for r in income_records if r.month_label >= today.strftime("%Y-%m")][:2]
    for r in upcoming:
        if safety_threshold and r.projected < safety_threshold:
            candidates.append({
                "alert_type": "low_income_month", "severity": "warning",
                "title": f"Low-income month ahead: {r.month_label}",
                "message": "Projected income is below your safety threshold. Consider adjusting production mix.",
                "source_key": f"low_income:{r.month_label}",
            })

    # 5. Production risk (from the current planner output)
    if plan:
        net_units_str = plan["steps"][5]["value"].split(" ")[0]
        if net_units_str.isdigit():
            net_units = int(net_units_str)
            if net_units > weaver.weekly_capacity * 2:
                candidates.append({
                    "alert_type": "production_risk", "severity": "warning",
                    "title": "Production plan may be tight",
                    "message": f"Your current plan needs {net_units} units, more than double your weekly capacity of {weaver.weekly_capacity}.",
                    "source_key": f"production_risk:{weaver.id}:{net_units}",
                })

    for c in candidates:
        exists = db.query(Alert).filter(
            Alert.weaver_id == weaver.id, Alert.source_key == c["source_key"]
        ).first()
        if not exists:
            db.add(Alert(weaver_id=weaver.id, read=False, **c))
    db.commit()
