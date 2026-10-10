import random
import uuid
from threading import Lock

from missions import MISSIONS

SESSIONS = {}
SESSION_LOCK = Lock()

DIFFICULTIES = {
    "Easy": {
        "resources": 90,
        "action_cost": 4,
        "event_chance": 0.10
    },
    "Medium": {
        "resources": 75,
        "action_cost": 7,
        "event_chance": 0.25
    },
    "Hard": {
        "resources": 60,
        "action_cost": 10,
        "event_chance": 0.40
    }
}

RESOURCE_NAMES = (
    "power", "fuel", "oxygen", "integrity", "time"
)

# Each mission has a primary resource that is more
# affected by mission operations.
PRIMARY_RESOURCES = {
    1: "power",
    2: "oxygen",
    3: "integrity",
    4: "power",
    5: "fuel",
    6: "oxygen",
    7: "power",
    8: "fuel"
}


def find_scenario(mission_id, scenario_id):
    mission = next(
        (m for m in MISSIONS if m["id"] == mission_id),
        None
    )

    if not mission:
        raise ValueError("Mission not found")

    scenario = next(
        (
            s for s in mission["scenarios"]
            if s["id"] == scenario_id
        ),
        None
    )

    if not scenario:
        raise ValueError("Scenario not found")

    return mission, scenario


def clamp(value):
    return max(0, min(100, value))


def public_session(session):
    return {
        "session_id": session["session_id"],
        "mission_id": session["mission_id"],
        "scenario_id": session["scenario_id"],
        "mission_title": session["mission_title"],
        "scenario_name": session["scenario_name"],
        "problem": session["problem"],
        "difficulty": session["difficulty"],
        "resources": session["resources"].copy(),
        "step": session["step"],
        "max_steps": session["max_steps"],
        "status": session["status"],
        "clues": session["clues"][:session["step"] + 1],
        "actions": [
            action.copy() for action in session["actions"]
        ] if session["status"] == "ACTIVE" else [],
        "history": [
            entry.copy() for entry in session["history"]
        ]
    }


def create_session(mission_id, scenario_id, difficulty):
    if difficulty not in DIFFICULTIES:
        raise ValueError("Invalid difficulty")

    mission, scenario = find_scenario(
        mission_id, scenario_id
    )

    config = DIFFICULTIES[difficulty]

    resources = {
        name: clamp(
            config["resources"] + random.randint(-5, 5)
        )
        for name in RESOURCE_NAMES
    }

    # Preserve the original correct action privately.
    actions = [a.copy() for a in scenario["actions"]]
    correct_label = next(
        a["label"] for a in actions
        if a["id"] == scenario["correct_action"]
    )

    random.shuffle(actions)

    # Assign new visible action IDs after shuffling.
    for index, action in enumerate(actions):
        action["id"] = "ABC"[index]

    session = {
        "session_id": str(uuid.uuid4()),
        "mission_id": mission_id,
        "scenario_id": scenario_id,
        "mission_title": mission["title"],
        "scenario_name": scenario["name"],
        "problem": scenario["problem"],
        "difficulty": difficulty,
        "resources": resources,
        "step": 0,
        "max_steps": 3,
        "status": "ACTIVE",
        "clues": scenario["clues"].copy(),
        "actions": actions,
        "correct_label": correct_label,
        "correct_decisions": 0,
        "history": []
    }

    SESSIONS[session["session_id"]] = session
    return public_session(session)


def evaluate_action(session_id, action_id):
    with SESSION_LOCK:
        session = SESSIONS.get(session_id)

        if not session:
            raise ValueError("Session not found")

        if session["status"] != "ACTIVE":
            raise ValueError("Mission already finished")

        action = next(
            (
                a for a in session["actions"]
                if a["id"] == action_id
            ),
            None
        )

        if not action:
            raise ValueError("Invalid action")

        config = DIFFICULTIES[session["difficulty"]]
        cost = config["action_cost"]
        resources = session["resources"]

        correct = (
            action["label"] == session["correct_label"]
        )

        # Time and power are consumed by every decision.
        resources["time"] = clamp(
            resources["time"] - cost
        )
        resources["power"] = clamp(
            resources["power"] - max(1, cost // 2)
        )

        primary = PRIMARY_RESOURCES[session["mission_id"]]

        if correct:
            session["correct_decisions"] += 1
            resources["integrity"] = clamp(
                resources["integrity"] + 3
            )
            resources[primary] = clamp(
                resources[primary] - 2
            )
        else:
            resources["integrity"] = clamp(
                resources["integrity"] - cost * 2
            )
            resources[primary] = clamp(
                resources[primary] - cost
            )

        event = None

        if random.random() < config["event_chance"]:
            affected = random.choice(
                ["power", "fuel", "oxygen", "integrity"]
            )
            loss = random.randint(3, 8)
            resources[affected] = clamp(
                resources[affected] - loss
            )
            event = (
                f"Unexpected subsystem stress: "
                f"{affected} decreased by {loss}."
            )

        session["step"] += 1

        critical_failure = any(
            value <= 0 for value in resources.values()
        )

        if critical_failure:
            session["status"] = "FAILURE"
        elif session["step"] >= session["max_steps"]:
            session["status"] = (
                "SUCCESS"
                if session["correct_decisions"] >= 2
                else "FAILURE"
            )

        feedback = (
            "Action addresses the primary failure."
            if correct
            else "Action does not address the primary failure."
        )

        session["history"].append({
            "step": session["step"],
            "action": action["label"],
            "correct": correct,
            "feedback": feedback,
            "event": event
        })

        result = public_session(session)
        result["last_feedback"] = feedback
        result["random_event"] = event

        return result


def get_session(session_id):
    with SESSION_LOCK:
        session = SESSIONS.get(session_id)

        if not session:
            raise ValueError("Session not found")

        return public_session(session)