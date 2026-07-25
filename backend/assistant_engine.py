"""Phase 5+6: AI Weaver Consultant — grounded, template-based response engine.

NOTE ON GEMINI: the brief calls for Gemini-backed responses. Wiring a live
LLM call here needs an API key this environment doesn't have, and would tie
the assistant's reliability to network access + quota during a live demo.
Instead this answers from the weaver's own real data (forecast, planner,
market trend) via intent matching + localized templates — deterministic,
offline-safe, demo-proof.

TO SWAP IN REAL GEMINI LATER: replace the body of `generate_reply()` with a
call to `google.generativeai`, passing the same `context` dict as grounding.
The function signature and return shape don't need to change.
"""
import ai_engine
import planner_engine

INTENTS = {
    "demand": ["demand", "sell", "market", "trend", "popular"],
    "production": ["produce", "production", "weave", "plan", "planner"],
    "raw_material": ["material", "yarn", "silk", "cotton", "thread"],
    "price": ["price", "cost", "rate", "sell for", "worth"],
    "inventory": ["inventory", "stock", "leftover", "unsold"],
    "not_yet_available": ["scheme", "loan", "subsidy", "training", "course", "mudra", "vishwakarma"],
}

RESPONSES = {
    "en": {
        "demand": "Demand for {product} in {region} is currently {demand_label} ({demand_index}/100), mainly driven by {driver}. Your {state_name} cluster is showing {growth_pct}% growth.",
        "production": "Your current plan: produce {net_units} more {category} over about {working_days} working days, needing {labour} weaver(s) and {raw_material_kg}kg of yarn.",
        "raw_material": "For your next batch of {category}, you'll need roughly {raw_material_kg}kg of yarn based on {quantity} units.",
        "price": "A fair estimated price for {category} right now is around \u20b9{unit_price} per unit, based on current market data.",
        "inventory": "Based on your recent pace, you likely have about {current_inventory} units on hand \u2014 a dedicated Inventory tracker is arriving in a later phase.",
        "not_yet_available": "That's part of the Government Schemes module, arriving in a later phase. I can help with demand, production planning, raw materials, and pricing today.",
        "fallback": "I can help with demand, production planning, raw materials, pricing, and inventory questions. Try asking, for example, \u201cWhat's the demand like right now?\u201d",
    },
    "hi": {
        "demand": "{region} \u092e\u0947\u0902 {product} \u0915\u0940 \u092e\u093e\u0902\u0917 \u0905\u092d\u0940 {demand_label} \u0939\u0948 ({demand_index}/100), \u092e\u0941\u0916\u094d\u092f \u0915\u093e\u0930\u0923: {driver}\u0964 \u0906\u092a\u0915\u0947 {state_name} \u0915\u094d\u0932\u0938\u094d\u091f\u0930 \u092e\u0947\u0902 {growth_pct}% \u0935\u0943\u0926\u094d\u0927\u093f \u0926\u093f\u0916 \u0930\u0939\u0940 \u0939\u0948\u0964",
        "production": "\u0906\u092a\u0915\u0940 \u092f\u094b\u091c\u0928\u093e: \u0932\u0917\u092d\u0917 {working_days} \u0915\u093e\u0930\u094d\u092f \u0926\u093f\u0935\u0938\u094b\u0902 \u092e\u0947\u0902 {net_units} \u0905\u0927\u093f\u0915 {category} \u092c\u0928\u093e\u090f\u0902, \u091c\u093f\u0938\u0915\u0947 \u0932\u093f\u090f {labour} \u092c\u0941\u0928\u0915\u0930 \u0914\u0930 {raw_material_kg} \u0915\u093f\u0932\u094b \u0927\u093e\u0917\u0947 \u0915\u0940 \u0906\u0935\u0936\u094d\u092f\u0915\u0924\u093e \u0939\u094b\u0917\u0940\u0964",
        "raw_material": "\u0905\u092a\u0928\u0947 \u0905\u0917\u0932\u0947 {category} \u092c\u0948\u091a \u0915\u0947 \u0932\u093f\u090f, {quantity} \u0907\u0915\u093e\u0907\u092f\u094b\u0902 \u0915\u0947 \u0906\u0927\u093e\u0930 \u092a\u0930 \u0932\u0917\u092d\u0917 {raw_material_kg} \u0915\u093f\u0932\u094b \u0927\u093e\u0917\u093e \u091a\u093e\u0939\u093f\u090f\u0964",
        "price": "\u0905\u092d\u0940 {category} \u0915\u0940 \u0909\u091a\u093f\u0924 \u0905\u0928\u0941\u092e\u093e\u0928\u093f\u0924 \u0915\u0940\u092e\u0924 \u0932\u0917\u092d\u0917 \u20b9{unit_price} \u092a\u094d\u0930\u0924\u093f \u0907\u0915\u093e\u0908 \u0939\u0948\u0964",
        "inventory": "\u0939\u093e\u0932 \u0915\u0940 \u0917\u0924\u093f \u0915\u0947 \u0906\u0927\u093e\u0930 \u092a\u0930, \u0906\u092a\u0915\u0947 \u092a\u093e\u0938 \u0932\u0917\u092d\u0917 {current_inventory} \u0907\u0915\u093e\u0907\u092f\u093e\u0902 \u0939\u094b\u0902\u0917\u0940 \u2014 \u0907\u0928\u094d\u0935\u0947\u0902\u091f\u0930\u0940 \u091f\u094d\u0930\u0948\u0915\u0930 \u092c\u093e\u0926 \u0915\u0947 \u091a\u0930\u0923 \u092e\u0947\u0902 \u0906\u090f\u0917\u093e\u0964",
        "not_yet_available": "\u092f\u0939 \u0938\u0930\u0915\u093e\u0930\u0940 \u092f\u094b\u091c\u0928\u093e \u092e\u0949\u0921\u094d\u092f\u0942\u0932 \u0915\u093e \u0939\u093f\u0938\u094d\u0938\u093e \u0939\u0948, \u091c\u094b \u092c\u093e\u0926 \u0915\u0947 \u091a\u0930\u0923 \u092e\u0947\u0902 \u0906\u090f\u0917\u093e\u0964",
        "fallback": "\u092e\u0948\u0902 \u092e\u093e\u0902\u0917, \u0909\u0924\u094d\u092a\u093e\u0926\u0928 \u092f\u094b\u091c\u0928\u093e, \u0915\u091a\u094d\u091a\u093e \u092e\u093e\u0932, \u0915\u0940\u092e\u0924 \u0914\u0930 \u0907\u0928\u094d\u0935\u0947\u0902\u091f\u0930\u0940 \u092e\u0947\u0902 \u092e\u0926\u0926 \u0915\u0930 \u0938\u0915\u0924\u093e \u0939\u0942\u0902\u0964",
    },
    "ta": {
        "demand": "{region} \u0b87\u0bb2\u0bcd {product} \u0b95\u0bcd\u0b95\u0bbe\u0ba9 \u0ba4\u0bc7\u0bb5\u0bc8 \u0ba4\u0bb1\u0bcd\u0baa\u0bcb\u0ba4\u0bc1 {demand_label} \u0b86\u0b95 \u0b89\u0bb3\u0bcd\u0bb3\u0ba4\u0bc1 ({demand_index}/100), \u0bae\u0bc1\u0b95\u0bcd\u0b95\u0bbf\u0baf \u0b95\u0bbe\u0bb0\u0ba3\u0bae\u0bcd: {driver}. {state_name} \u0b95\u0bcd\u0bb2\u0bb8\u0bcd\u0b9f\u0bb0\u0bbf\u0bb2\u0bcd {growth_pct}% \u0bb5\u0bb3\u0bb0\u0bcd\u0b9a\u0bcd\u0b9a\u0bbf \u0b95\u0bbe\u0ba3\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0b95\u0bbf\u0bb1\u0ba4\u0bc1.",
        "production": "\u0b89\u0bb3\u0bcd\u0bb3 \u0ba4\u0bbf\u0b9f\u0bcd\u0b9f\u0bae\u0bcd: \u0b8f\u0bb1\u0b95\u0bcd\u0b95\u0bc1\u0bb1\u0bc8\u0baf {working_days} \u0bb5\u0bc7\u0bb2\u0bc8 \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bb3\u0bbf\u0bb2\u0bcd {net_units} \u0b95\u0bc2\u0b9f\u0bc1\u0ba4\u0bb2\u0bcd {category} \u0ba8\u0bc6\u0bb8\u0bb5\u0bc1, {labour} \u0ba8\u0bc6\u0bb8\u0bb5\u0bbe\u0bb3\u0bb0\u0bcd(\u0b95\u0bb3\u0bcd) \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd {raw_material_kg} \u0b95\u0bbf\u0bb2\u0bcb \u0ba8\u0bc2\u0bb2\u0bcd \u0ba4\u0bc7\u0bb5\u0bc8.",
        "raw_material": "\u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0b85\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4 {category} \u0baa\u0bc7\u0b9a\u0bcd\u0b9a\u0bc1\u0b95\u0bcd\u0b95\u0bc1, {quantity} \u0baf\u0bc2\u0ba9\u0bbf\u0b9f\u0bcd\u0b95\u0bb3\u0bc8 \u0b85\u0b9f\u0bbf\u0baa\u0bcd\u0baa\u0b9f\u0bc8\u0baf\u0bbe\u0b95 \u0b8f\u0bb1\u0bcd\u0b95\u0bc1\u0bb1\u0bc8\u0baf {raw_material_kg} \u0b95\u0bbf\u0bb2\u0bcb \u0ba8\u0bc2\u0bb2\u0bcd \u0ba4\u0bc7\u0bb5\u0bc8.",
        "price": "\u0ba4\u0bb1\u0bcd\u0baa\u0bcb\u0ba4\u0bc1 {category}\u0b95\u0bcd\u0b95\u0bc1 \u0baa\u0bc1\u0ba4\u0bcd\u0ba4\u0bbf\u0bb8\u0bbe\u0bb2\u0bbe\u0ba9 \u0bae\u0ba4\u0bbf\u0baa\u0bcd\u0baa\u0bc1 \u0b92\u0bb0\u0bc1 \u0baf\u0bc2\u0ba9\u0bbf\u0b9f\u0bcd\u0b95\u0bc1 \u0b8f\u0bb1\u0bcd\u0b95\u0bc1\u0bb1\u0bc8\u0baf \u20b9{unit_price}.",
        "inventory": "\u0b9a\u0bae\u0bc0\u0baa \u0bb5\u0bc7\u0b95\u0ba4\u0bcd\u0ba4\u0bbf\u0ba9\u0bcd \u0baa\u0b9f\u0bbf, \u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bbf\u0b9f\u0bae\u0bcd \u0b8f\u0bb1\u0bcd\u0b95\u0bc1\u0bb1\u0bc8\u0baf {current_inventory} \u0baf\u0bc2\u0ba9\u0bbf\u0b9f\u0bcd\u0b95\u0bb3\u0bcd \u0b87\u0bb0\u0bc1\u0b95\u0bcd\u0b95\u0bb2\u0bbe\u0bae\u0bcd \u2014 \u0b87\u0ba8\u0bcd\u0bb5\u0bc6\u0ba9\u0bcd\u0b9f\u0bb0\u0bbf \u0ba4\u0bcd\u0bb0\u0bc7\u0b95\u0bcd\u0b95\u0bb0\u0bcd \u0baa\u0bbf\u0ba9\u0bcd\u0ba9\u0bb0\u0bcd \u0b95\u0b9f\u0bcd\u0b9f\u0ba4\u0bcd\u0ba4\u0bbf\u0bb2\u0bcd \u0bb5\u0bb0\u0bc1\u0bae\u0bcd.",
        "not_yet_available": "\u0b87\u0ba4\u0bc1 \u0b85\u0bb0\u0b9a\u0bc1 \u0ba4\u0bbf\u0b9f\u0bcd\u0b9f \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bbf\u0ba9\u0bcd \u0bb5\u0bb0\u0bc1\u0b99\u0bcd\u0b95\u0bbe\u0bb2\u0bae\u0bcd, \u0baa\u0bbf\u0ba9\u0bcd\u0ba9\u0bb0\u0bcd \u0b95\u0b9f\u0bcd\u0b9f\u0ba4\u0bcd\u0ba4\u0bbf\u0bb2\u0bcd \u0bb5\u0bb0\u0bc1\u0bae\u0bcd.",
        "fallback": "\u0ba8\u0bbe\u0ba9\u0bcd \u0ba4\u0bc7\u0bb5\u0bc8, \u0b89\u0ba4\u0bcd\u0baa\u0ba4\u0bcd\u0ba4\u0bbf \u0ba4\u0bbf\u0b9f\u0bcd\u0b9f\u0bae\u0bbf\u0b9f\u0bb2\u0bcd, \u0bae\u0bc2\u0bb2\u0baa\u0bcd\u0baa\u0bca\u0bb0\u0bc1\u0bb3\u0bcd, \u0bb5\u0bbf\u0bb2\u0bc8 \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0b87\u0ba8\u0bcd\u0bb5\u0bc6\u0ba9\u0bcd\u0bb0\u0bbf \u0b95\u0bc7\u0bb3\u0bcd\u0bb5\u0bbf\u0b95\u0bb3\u0bc1\u0b95\u0bcd\u0b95\u0bc1 \u0b89\u0ba4\u0bb5 \u0bae\u0bc1\u0b9f\u0bbf\u0baf\u0bc1\u0bae\u0bcd.",
    },
}


def detect_intent(message: str) -> str:
    lowered = message.lower()
    for intent, keywords in INTENTS.items():
        if any(kw in lowered for kw in keywords):
            return intent
    return "fallback"


def generate_reply(message: str, weaver, forecast_result: dict, market_trend: dict, language: str = "en") -> dict:
    lang = language if language in RESPONSES else "en"
    intent = detect_intent(message)
    template = RESPONSES[lang].get(intent, RESPONSES[lang]["fallback"])

    plan = planner_engine.generate_production_plan(weaver, forecast_result)
    today_demand = ai_engine.get_today_demand_snapshot(weaver)

    context = {
        "product": forecast_result["product"],
        "category": weaver.product_category,
        "region": weaver.region,
        "quantity": forecast_result["quantity"],
        "unit_price": planner_engine.UNIT_PRICE.get(weaver.product_category, 1200),
        "demand_label": today_demand["label"],
        "demand_index": today_demand["demand_index"],
        "driver": today_demand["driver"],
        "state_name": market_trend.get("state_name", weaver.region),
        "growth_pct": market_trend.get("growth_pct", 0),
        "net_units": plan["steps"][5]["value"].split(" ")[0],
        "working_days": plan["steps"][3]["value"].split(" ")[0],
        "labour": plan["steps"][4]["value"].split(" ")[0],
        "raw_material_kg": plan["steps"][2]["value"].split(" ")[0],
        "current_inventory": plan["steps"][0]["value"].split(" ")[0],
    }

    try:
        text = template.format(**context)
    except KeyError:
        text = RESPONSES[lang]["fallback"]

    return {"intent": intent, "reply_text": text}