from fastapi import APIRouter

from ..deps import CurrentUser, DbSession
from ..schemas import LeaderboardOut, PurchaseIn, PurchaseOut, QuestsOut, ShopItemOut
from ..services import leaderboard, quests, shop

router = APIRouter(prefix="/api", tags=["gamification"])


@router.get("/leaderboard", response_model=LeaderboardOut)
def get_leaderboard(db: DbSession, user: CurrentUser):
    """This week's league standings, ranked by XP earned since Monday."""
    result = leaderboard.build(db, user)
    db.commit()  # persists back-filled rival activity
    return result


@router.get("/quests", response_model=QuestsOut)
def get_quests(db: DbSession, user: CurrentUser):
    """Today's quests and their progress (the first one is the daily XP goal)."""
    return quests.list_quests(db, user)


@router.get("/shop", response_model=list[ShopItemOut])
def get_shop(db: DbSession, user: CurrentUser):
    result = shop.list_items(user)
    db.commit()
    return result


@router.post("/shop/purchase", response_model=PurchaseOut)
def purchase_item(payload: PurchaseIn, db: DbSession, user: CurrentUser):
    """Spend gems. Currently only `heart_refill` can be bought."""
    result = shop.purchase(db, user, payload.item_key)
    db.commit()
    return result
