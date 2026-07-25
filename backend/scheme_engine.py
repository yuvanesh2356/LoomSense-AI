"""Phase 8: Government Scheme Advisor — rule-based eligibility matching
against the `government_schemes` DB table. Deliberately rule-based (not
ML): eligibility rules are the actual point, and a judge asking "why did
you match this scheme" deserves an exact, auditable answer."""
import json


def match_schemes(scheme_rows, profile: dict) -> list:
    age = profile["age"]
    state = profile["state"]
    occupation = (profile.get("occupation") or "").lower()
    income = profile["income"]
    gender = profile["gender"]
    shg = bool(profile.get("shg"))

    matched = []
    for s in scheme_rows:
        states = json.loads(s.applicable_states_json)
        genders = json.loads(s.applicable_genders_json)
        occupations = json.loads(s.occupation_tags_json)

        if states != ["ALL"] and state not in states:
            continue
        if genders != ["ALL"] and gender not in genders:
            continue
        if occupations and not any(o.lower() in occupation or occupation in o.lower() for o in occupations):
            continue
        if s.min_age is not None and age < s.min_age:
            continue
        if s.max_age is not None and age > s.max_age:
            continue
        if s.max_income is not None and income > s.max_income:
            continue
        if s.requires_shg is True and not shg:
            continue

        matched.append({
            "scheme_id": s.id,
            "scheme_name": s.name,
            "category": s.category,
            "description": s.description,
            "benefits": s.benefits,
            "eligibility_notes": s.eligibility_notes,
            "apply_link": s.apply_link,
        })

    return matched