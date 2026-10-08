"""Weekly league. Ranks everyone by XP earned since Monday.

Rivals are seeded bot users. Their daily XP is generated deterministically
from (bot id, date) the first time a day is seen, so the board keeps moving
from day to day without a scheduler.
"""

import random
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import clock
from ..config import settings
from ..models import DailyActivity, User
from ..schemas import LeaderboardEntryOut, LeaderboardOut

LEAGUES = [
    "bronze",
    "silver",
    "gold",
    "sapphire",
    "ruby",
    "emerald",
    "amethyst",
    "pearl",
    "obsidian",
    "diamond",
]


def _bot_daily_xp(bot: User, day: date) -> int:
    rng = random.Random(f"{bot.id}:{day.isoformat()}")
    pace = 10 + (bot.id * 37 % 5) * 5  # each bot has a steady personal pace
    return int(pace * rng.choice([0, 0.5, 1, 1, 1.5, 2]))


def ensure_bot_activity(db: Session, today: date) -> None:
    """Back-fill this week's activity rows for bots up to `today`."""
    bots = db.scalars(select(User).where(User.is_bot.is_(True))).all()
    if not bots:
        return
    monday = clock.week_start(today)
    existing = set(
        db.execute(
            select(DailyActivity.user_id, DailyActivity.activity_date).where(
                DailyActivity.user_id.in_([bot.id for bot in bots]),
                DailyActivity.activity_date >= monday,
                DailyActivity.activity_date <= today,
            )
        ).all()
    )
    for bot in bots:
        for offset in range((today - monday).days + 1):
            day = monday + timedelta(days=offset)
            if (bot.id, day) in existing:
                continue
            xp = _bot_daily_xp(bot, day)
            db.add(
                DailyActivity(
                    user_id=bot.id,
                    activity_date=day,
                    xp_earned=xp,
                    lessons_completed=xp // 10,
                    perfect_lessons=0,
                )
            )
            bot.total_xp += xp
    db.flush()


def build(db: Session, user: User) -> LeaderboardOut:
    today = clock.today_for(user)
    monday = clock.week_start(today)
    ensure_bot_activity(db, today)

    weekly_xp = dict(
        db.execute(
            select(DailyActivity.user_id, func.sum(DailyActivity.xp_earned))
            .where(DailyActivity.activity_date >= monday, DailyActivity.activity_date <= today)
            .group_by(DailyActivity.user_id)
        ).all()
    )
    rivals = db.scalars(select(User).where(User.is_bot.is_(True))).all()
    # Ties are broken in the learner's favour, then by id for a stable order.
    ranked = sorted(
        [*rivals, user],
        key=lambda member: (-int(weekly_xp.get(member.id, 0)), member.is_bot, member.id),
    )
    entries = [
        LeaderboardEntryOut(
            rank=position,
            user_id=member.id,
            display_name=member.display_name,
            avatar_color=member.avatar_color,
            weekly_xp=int(weekly_xp.get(member.id, 0)),
            is_me=member.id == user.id,
        )
        for position, member in enumerate(ranked, start=1)
    ]
    me = next(entry for entry in entries if entry.is_me)
    return LeaderboardOut(
        league=user.league,
        leagues=LEAGUES,
        days_left=7 - today.weekday(),
        promotion_slots=settings.league_promotion_slots,
        my_rank=me.rank,
        my_weekly_xp=me.weekly_xp,
        entries=entries,
    )
