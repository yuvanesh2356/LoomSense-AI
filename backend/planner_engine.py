"""Phase 5+6: Production Planner — pure computed logic, no persistence.
Deliberately does not import ai_engine's private pricing helper; a small
constant table is duplicated here so this phase touches zero Phase 3+4
backend files."""

RAW_MATERIAL_PER_UNIT_KG = {
    "Cotton Saree": 0.45,
    "Silk-Cotton Saree": 0.55,
    "Silk Saree": 0.35,
}
UNIT_PRICE = {
    "Cotton Saree": 950,
    "Silk-Cotton Saree": 1800,
    "Silk Saree": 4200,
}
DAYS_PER_UNIT = {
    "Cotton Saree": 1.2,
    "Silk-Cotton Saree": 1.6,
    "Silk Saree": 2.5,
}
MATERIAL_COST_PER_KG = 380   # rough blended yarn cost assumption
LABOUR_COST_PER_DAY = 450


def generate_production_plan(weaver, forecast) -> dict:
    """`forecast` may be a Forecast ORM row or a plain dict — both expose
    `.quantity` / `["quantity"]` respectively."""
    category = weaver.product_category
    quantity = forecast["quantity"] if isinstance(forecast, dict) else forecast.quantity

    unit_price = UNIT_PRICE.get(category, 1200)
    material_per_unit = RAW_MATERIAL_PER_UNIT_KG.get(category, 0.45)
    days_per_unit = DAYS_PER_UNIT.get(category, 1.5)

    raw_material_kg = round(material_per_unit * quantity, 2)
    working_days = round(days_per_unit * quantity, 1)

    # Crude "current inventory" proxy since the Inventory module isn't
    # built yet — derived from weekly capacity, clearly labeled as such.
    current_inventory_units = max(0, round(weaver.weekly_capacity * 0.3))
    net_production_needed = max(0, quantity - current_inventory_units)
    labour_requirement = max(1, round(working_days / 6))  # 6 productive days/week/weaver

    expected_sales_value = round(quantity * unit_price)
    material_cost = round(raw_material_kg * MATERIAL_COST_PER_KG)
    labour_cost = round(working_days * LABOUR_COST_PER_DAY)
    expected_profit = expected_sales_value - material_cost - labour_cost
    timeline_days = round(working_days + 4)  # + procurement/finishing buffer

    steps = [
        {"step": 1, "title": "Current Inventory",
         "value": f"{current_inventory_units} units on hand",
         "detail": "Estimated from recent production pace (a dedicated Inventory module lands in a later phase)."},
        {"step": 2, "title": "Demand Forecast",
         "value": f"{quantity} units",
         "detail": f"From your current AI forecast for {category}."},
        {"step": 3, "title": "Raw Material Needed",
         "value": f"{raw_material_kg} kg yarn",
         "detail": f"Based on {material_per_unit} kg/unit for {category}."},
        {"step": 4, "title": "Working Days",
         "value": f"{working_days} days",
         "detail": f"{days_per_unit} days/unit at your skill level."},
        {"step": 5, "title": "Labour Requirement",
         "value": f"{labour_requirement} weaver(s)",
         "detail": "Assuming 6 productive working days per week per weaver."},
        {"step": 6, "title": "Production Quantity",
         "value": f"{net_production_needed} units to produce",
         "detail": f"After netting off {current_inventory_units} units already in hand."},
        {"step": 7, "title": "Expected Sales",
         "value": f"\u20b9{expected_sales_value:,}",
         "detail": f"{quantity} units \u00d7 \u20b9{unit_price}/unit estimated market price."},
        {"step": 8, "title": "Expected Profit",
         "value": f"\u20b9{expected_profit:,}",
         "detail": f"Sales minus material cost (\u20b9{material_cost:,}) and labour cost (\u20b9{labour_cost:,})."},
    ]

    return {
        "steps": steps,
        "timeline_days": timeline_days,
        "summary": (
            f"Producing {net_production_needed} more {category.lower()}s needs "
            f"{raw_material_kg}kg of yarn and about {working_days} working days, "
            f"finishing within {timeline_days} days for an estimated profit of "
            f"\u20b9{expected_profit:,}."
        ),
    }