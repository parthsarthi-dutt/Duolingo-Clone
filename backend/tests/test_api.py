"""End-to-end tests of the lesson loop and gamification through the HTTP API."""

from app.config import settings

from .conftest import (
    correct_submission,
    current_skill,
    play_perfectly,
    start,
    wrong_submission,
)

# ---- seeded state ----------------------------------------------------------


def test_seeded_learner_is_ready_to_play(client):
    me = client.get("/api/me").json()
    assert me["hearts"]["current"] == settings.max_hearts
    assert me["gems"] == 505
    assert me["total_xp"] == 45
    assert me["streak"]["count"] == 2
    assert me["streak"]["active_today"] is False
    assert me["course"]["title"] == "Spanish"


def test_path_is_linear_completed_then_current_then_locked(client):
    units = client.get("/api/path").json()["units"]
    assert len(units) == 3
    statuses = [s["status"] for u in units for s in u["skills"]]
    assert statuses[0] == "completed"
    assert statuses[1] == "current"
    assert set(statuses[2:]) == {"locked"}
    second = units[0]["skills"][1]
    assert (second["lessons_completed"], second["lessons_total"]) == (1, 3)


def test_course_covers_every_exercise_type(client):
    seen = set()
    for _ in range(2):  # the two remaining lessons of the current skill
        summary_session = start(client, skill_id=current_skill(client)["id"])
        seen.update(e["type"] for e in summary_session["exercises"])
        play_perfectly(client, summary_session)
    assert seen == {"multiple_choice", "word_bank", "match_pairs", "fill_blank", "type_answer"}


def test_exercises_never_leak_the_answer_key(client):
    session = start(client, skill_id=current_skill(client)["id"])
    for exercise in session["exercises"]:
        assert "answers" not in exercise
        for choice in exercise["choices"]:
            assert "is_correct" not in choice
            if exercise["type"] != "match_pairs":
                assert choice["pair_key"] is None


# ---- the lesson loop -------------------------------------------------------


def test_perfect_lesson_awards_xp_bonus_progress_and_streak(client):
    skill = current_skill(client)
    summary = play_perfectly(client, start(client, skill_id=skill["id"]))

    assert summary["perfect"] is True and summary["accuracy"] == 100
    assert summary["xp_earned"] == 10 + settings.perfect_lesson_bonus_xp
    assert summary["lessons_completed"] == 2
    assert summary["skill_completed"] is False
    assert summary["streak_extended"] is True
    assert summary["user"]["streak"]["count"] == 3
    assert summary["user"]["streak"]["active_today"] is True
    assert summary["user"]["total_xp"] == 45 + 15
    assert summary["user"]["daily_goal"]["earned"] == 15
    assert "wildfire" in [a["key"] for a in summary["unlocked_achievements"]]


def test_finishing_every_lesson_completes_the_skill_and_unlocks_the_next(client):
    skill = current_skill(client)
    play_perfectly(client, start(client, skill_id=skill["id"]))
    summary = play_perfectly(client, start(client, skill_id=skill["id"]))
    assert summary["skill_completed"] is True
    assert summary["streak_extended"] is False  # already counted today
    assert summary["daily_goal_reached"] is True  # 15 + 15 XP crosses the 20 XP goal
    assert current_skill(client)["id"] != skill["id"]


def test_wrong_answer_costs_a_heart_and_blocks_completion(client):
    session = start(client, skill_id=current_skill(client)["id"])
    first = session["exercises"][0]["id"]

    result = client.post(f"/api/sessions/{session['id']}/answers", json=wrong_submission(first))
    body = result.json()
    assert body["correct"] is False
    assert body["correct_answer"]
    assert body["hearts"]["current"] == settings.max_hearts - 1
    assert body["hearts"]["seconds_to_next"] is not None

    incomplete = client.post(f"/api/sessions/{session['id']}/complete")
    assert incomplete.status_code == 409
    assert incomplete.json()["detail"]["code"] == "session_incomplete"


def test_mistakes_lower_accuracy_and_remove_the_perfect_bonus(client):
    session = start(client, skill_id=current_skill(client)["id"])
    client.post(
        f"/api/sessions/{session['id']}/answers",
        json=wrong_submission(session["exercises"][0]["id"]),
    )
    summary = play_perfectly(client, session)
    assert summary["perfect"] is False
    assert summary["xp_earned"] == 10
    assert summary["accuracy"] == round(100 * 8 / 9)


def test_running_out_of_hearts_stops_the_lesson_until_refilled(client):
    session = start(client, skill_id=current_skill(client)["id"])
    exercise_id = session["exercises"][0]["id"]
    for _ in range(settings.max_hearts):
        client.post(f"/api/sessions/{session['id']}/answers", json=wrong_submission(exercise_id))
    assert client.get("/api/me").json()["hearts"]["current"] == 0

    blocked = client.post(
        f"/api/sessions/{session['id']}/answers", json=correct_submission(exercise_id)
    )
    assert blocked.status_code == 409 and blocked.json()["detail"]["code"] == "no_hearts"
    new_lesson = client.post("/api/sessions", json={"skill_id": current_skill(client)["id"]})
    assert new_lesson.status_code == 409

    purchase = client.post("/api/shop/purchase", json={"item_key": "heart_refill"})
    assert purchase.status_code == 200
    assert purchase.json()["user"]["hearts"]["current"] == settings.max_hearts
    assert purchase.json()["user"]["gems"] == 505 - settings.heart_refill_cost
    # the same session can now be finished
    assert play_perfectly(client, session)["xp_earned"] == 10


def test_practice_is_free_of_heart_loss_and_earns_a_heart_back(client):
    lesson = start(client, skill_id=current_skill(client)["id"])
    client.post(
        f"/api/sessions/{lesson['id']}/answers",
        json=wrong_submission(lesson["exercises"][0]["id"]),
    )
    client.post(f"/api/sessions/{lesson['id']}/abandon")

    practice = start(client, mode="practice")
    assert practice["mode"] == "practice"
    miss = client.post(
        f"/api/sessions/{practice['id']}/answers",
        json=wrong_submission(practice["exercises"][0]["id"]),
    ).json()
    assert miss["hearts"]["current"] == settings.max_hearts - 1  # unchanged by the miss

    summary = play_perfectly(client, practice)
    assert summary["hearts_awarded"] == 1
    assert summary["xp_earned"] == settings.practice_xp
    assert summary["user"]["hearts"]["current"] == settings.max_hearts


def test_locked_skills_cannot_be_started(client):
    path = client.get("/api/path").json()
    locked = next(
        s
        for u in path["units"]
        for s in u["skills"]
        if s["status"] == "locked" and s["kind"] == "lesson"
    )
    response = client.post("/api/sessions", json={"skill_id": locked["id"]})
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "skill_locked"


def test_a_session_cannot_be_completed_twice(client):
    session = start(client, skill_id=current_skill(client)["id"])
    play_perfectly(client, session)
    again = client.post(f"/api/sessions/{session['id']}/complete")
    assert again.status_code == 409 and again.json()["detail"]["code"] == "session_closed"


def test_typed_answers_accept_alternatives_and_single_typos(client):
    skill = current_skill(client)
    play_perfectly(client, start(client, skill_id=skill["id"]))  # lesson 2 has a typed answer
    session = start(client, skill_id=skill["id"])
    typed = next(e for e in session["exercises"] if e["type"] == "type_answer")
    answer = correct_submission(typed["id"])["text"]

    shouted = client.post(
        f"/api/sessions/{session['id']}/answers",
        json={"exercise_id": typed["id"], "text": answer.upper().replace(".", "")},
    ).json()
    assert shouted["correct"] is True and shouted["typo"] is False

    with_typo = client.post(
        f"/api/sessions/{session['id']}/answers",
        json={"exercise_id": typed["id"], "text": answer[:-3] + answer[-2:]},
    ).json()
    assert with_typo["correct"] is True and with_typo["typo"] is True

    nonsense = client.post(
        f"/api/sessions/{session['id']}/answers",
        json={"exercise_id": typed["id"], "text": "completely wrong"},
    ).json()
    assert nonsense["correct"] is False


# ---- chests, quests, leaderboard, profile, time -----------------------------


def play_until_chest(client) -> dict:
    while True:
        skill = current_skill(client)
        if skill["kind"] == "chest":
            return skill
        play_perfectly(client, start(client, skill_id=skill["id"]))


def test_chest_pays_gems_once_and_unlocks_the_next_node(client):
    locked_chest = client.get("/api/path").json()["units"][0]["skills"][3]
    early = client.post(f"/api/skills/{locked_chest['id']}/claim")
    assert early.status_code == 403

    chest = play_until_chest(client)
    gems_before = client.get("/api/me").json()["gems"]
    claimed = client.post(f"/api/skills/{chest['id']}/claim").json()
    assert claimed["gems_awarded"] == chest["reward_gems"] == 20
    assert claimed["user"]["gems"] == gems_before + 20
    assert client.post(f"/api/skills/{chest['id']}/claim").status_code == 409
    assert current_skill(client)["kind"] == "lesson"


def test_daily_quests_track_progress_and_pay_gems_once(client):
    quests = {q["key"]: q for q in client.get("/api/quests").json()["quests"]}
    assert quests["daily_xp"]["target"] == 20 and quests["daily_xp"]["progress"] == 0
    assert not any(q["completed"] for q in quests.values())

    skill = current_skill(client)
    first = play_perfectly(client, start(client, skill_id=skill["id"]))
    assert [q["title"] for q in first["completed_quests"]] == ["Finish a lesson with no mistakes"]
    assert first["user"]["gems"] == 505 + 15

    second = play_perfectly(client, start(client, skill_id=skill["id"]))
    assert {q["title"] for q in second["completed_quests"]} == {
        "Earn 20 XP",
        "Complete 2 lessons",
    }
    assert second["user"]["gems"] == 505 + 15 + 10 + 10

    quests = client.get("/api/quests").json()["quests"]
    assert all(q["completed"] for q in quests)


def test_daily_goal_can_be_changed_and_drives_the_xp_quest(client):
    me = client.patch("/api/me", json={"daily_goal_xp": 50}).json()
    assert me["daily_goal"]["target"] == 50
    xp_quest = client.get("/api/quests").json()["quests"][0]
    assert xp_quest["title"] == "Earn 50 XP"
    assert client.patch("/api/me", json={"daily_goal_xp": 7}).status_code == 422


def test_leaderboard_ranks_by_weekly_xp_and_includes_the_learner(client):
    board = client.get("/api/leaderboard").json()
    xp = [entry["weekly_xp"] for entry in board["entries"]]
    assert xp == sorted(xp, reverse=True)
    assert [entry["rank"] for entry in board["entries"]] == list(range(1, len(xp) + 1))
    assert sum(entry["is_me"] for entry in board["entries"]) == 1
    assert len(board["entries"]) == 13
    assert 1 <= board["days_left"] <= 7

    before = board["my_weekly_xp"]
    play_perfectly(client, start(client, skill_id=current_skill(client)["id"]))
    assert client.get("/api/leaderboard").json()["my_weekly_xp"] == before + 15


def test_profile_reports_stats_and_achievement_progress(client):
    profile = client.get("/api/profile").json()
    assert profile["stats"]["lessons_completed"] == 4
    assert profile["stats"]["skills_completed"] == 1
    wildfire = next(a for a in profile["achievements"] if a["key"] == "wildfire")
    assert (wildfire["progress"], wildfire["target"], wildfire["level"]) == (2, 3, 0)
    assert wildfire["description"] == "Reach a 3 day streak"


def test_advancing_one_day_keeps_the_streak_and_two_days_breaks_it(client):
    play_perfectly(client, start(client, skill_id=current_skill(client)["id"]))
    assert client.get("/api/me").json()["streak"]["count"] == 3

    next_day = client.post("/api/dev/advance-day", json={"days": 1}).json()
    assert next_day["streak"]["count"] == 3
    assert next_day["streak"]["active_today"] is False
    assert next_day["daily_goal"]["earned"] == 0  # a new day starts from zero

    skipped = client.post("/api/dev/advance-day", json={"days": 2}).json()
    assert skipped["streak"]["count"] == 0
    assert skipped["streak"]["longest"] == 3

    summary = play_perfectly(client, start(client, skill_id=current_skill(client)["id"]))
    assert summary["streak_extended"] is True
    assert summary["user"]["streak"]["count"] == 1


def test_hearts_regenerate_as_time_passes(client):
    session = start(client, skill_id=current_skill(client)["id"])
    for _ in range(3):
        client.post(
            f"/api/sessions/{session['id']}/answers",
            json=wrong_submission(session["exercises"][0]["id"]),
        )
    assert client.get("/api/me").json()["hearts"]["current"] == 2
    tomorrow = client.post("/api/dev/advance-day", json={"days": 1}).json()
    assert tomorrow["hearts"]["current"] == settings.max_hearts
    assert tomorrow["hearts"]["seconds_to_next"] is None


def test_reset_restores_the_seeded_state(client):
    play_perfectly(client, start(client, skill_id=current_skill(client)["id"]))
    reset = client.post("/api/dev/reset").json()
    assert reset["total_xp"] == 45 and reset["streak"]["count"] == 2
