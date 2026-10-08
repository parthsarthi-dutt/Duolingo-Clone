"""Gem shop. Only the heart refill is real; the rest are mocked placeholders."""

from sqlalchemy.orm import Session

from .. import clock
from ..config import settings
from ..errors import api_error
from ..models import User
from ..schemas import PurchaseOut, ShopItemOut
from . import hearts, users

HEART_REFILL = "heart_refill"


def list_items(user: User) -> list[ShopItemOut]:
    now = clock.now_for(user)
    hearts.sync(user, now)
    full = user.hearts >= settings.max_hearts
    cost = settings.heart_refill_cost
    if full:
        refill_reason = "Your hearts are already full."
    elif user.gems < cost:
        refill_reason = "You don't have enough gems."
    else:
        refill_reason = None
    return [
        ShopItemOut(
            key=HEART_REFILL,
            title="Refill Hearts",
            description="Get full hearts so you can worry less about making mistakes in a lesson",
            icon="heart",
            price=cost,
            available=refill_reason is None,
            unavailable_reason=refill_reason,
        ),
        ShopItemOut(
            key="unlimited_hearts",
            title="Unlimited Hearts",
            description="Never run out of hearts with Super!",
            icon="infinity",
            price=None,
            available=False,
            unavailable_reason="Super subscriptions are coming soon.",
        ),
        ShopItemOut(
            key="streak_freeze",
            title="Streak Freeze",
            description="Streak Freeze allows your streak to remain in place for one full day of inactivity.",
            icon="freeze",
            price=200,
            available=False,
            unavailable_reason="Streak Freeze is coming soon.",
        ),
    ]


def purchase(db: Session, user: User, item_key: str) -> PurchaseOut:
    if item_key != HEART_REFILL:
        raise api_error(400, "item_unavailable", "This item is coming soon.")

    now = clock.now_for(user)
    hearts.sync(user, now)
    if user.hearts >= settings.max_hearts:
        raise api_error(409, "hearts_full", "Your hearts are already full.")
    if user.gems < settings.heart_refill_cost:
        raise api_error(409, "not_enough_gems", "You don't have enough gems.")

    user.gems -= settings.heart_refill_cost
    hearts.refill(user, now)
    db.flush()
    return PurchaseOut(message="Hearts refilled!", user=users.summary(db, user))
