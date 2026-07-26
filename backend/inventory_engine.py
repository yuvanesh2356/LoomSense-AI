"""Phase 9: Smart Inventory — status computation over the `inventory_items`
table. Pure functions; no persistence logic here."""


def compute_status(item) -> dict:
    if item.available_stock <= item.low_stock_threshold:
        status = "Critical"
    elif item.available_stock < item.required_stock:
        status = "Low"
    else:
        status = "Adequate"

    return {
        "id": item.id,
        "item_type": item.item_type,
        "name": item.name,
        "unit": item.unit,
        "available_stock": item.available_stock,
        "predicted_stock": item.predicted_stock,
        "required_stock": item.required_stock,
        "low_stock_threshold": item.low_stock_threshold,
        "status": status,
        "stock_gap": round(item.required_stock - item.available_stock, 2),
        "expiry_date": item.expiry_date.isoformat() if item.expiry_date else None,
        "storage_location": item.storage_location,
    }