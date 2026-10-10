from simulation import (
    create_session,
    evaluate_action,
    SESSIONS
)

def test_all_scenarios():
    total = 0

    for mission_id in range(1, 9):
        for scenario_id in range(1, 4):
            session = create_session(
                mission_id, scenario_id, "Easy"
            )

            assert session["status"] == "ACTIVE"
            assert len(session["actions"]) == 3
            assert len(session["resources"]) == 5

            # Find the correct action in this test only.
            private = SESSIONS[session["session_id"]]
            correct_label = private["correct_label"]

            action = next(
                a for a in session["actions"]
                if a["label"] == correct_label
            )

            for step in range(3):
                session = evaluate_action(
                    session["session_id"],
                    action["id"]
                )

            assert session["status"] == "SUCCESS"
            assert session["step"] == 3

            total += 1

    assert total == 24
    print(f"PASSED: {total} scenarios")


if __name__ == "__main__":
    test_all_scenarios()