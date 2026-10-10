from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from missions import MISSIONS
import httpx
from nasa_data import get_solar_flare_events
import logging
from copilot import get_copilot_hint
import json
from io import BytesIO
from fastapi.responses import StreamingResponse
from debrief_engine import generate_debrief
from report_generator import generate_pdf_report

app = FastAPI(title="PARADOX Game API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class DecisionRequest(BaseModel):
    mission_id: int
    scenario_id: int
    action_id: str


def find_mission(mission_id):
    return next(
        (m for m in MISSIONS if m["id"] == mission_id),
        None
    )


def public_mission(mission):
    # Never expose correct_action to the player
    return {
        "id": mission["id"],
        "title": mission["title"],
        "category": mission["category"],
        "scenarios": [
            {
                "id": s["id"],
                "name": s["name"],
                "problem": s["problem"],
                "clues": s["clues"],
                "actions": s["actions"]
            }
            for s in mission["scenarios"]
        ]
    }


@app.get("/")
def home():
    return {"message": "PARADOX Backend Running"}


@app.get("/api/game")
def game_info():
    return {
        "name": "PARADOX",
        "total_missions": len(MISSIONS),
        "scenarios_per_mission": 3,
        "difficulty_levels": ["Easy", "Medium", "Hard"]
    }


@app.get("/api/missions")
def get_missions():
    return [public_mission(m) for m in MISSIONS]


@app.get("/api/missions/{mission_id}")
def get_mission(mission_id: int):
    mission = find_mission(mission_id)

    if not mission:
        raise HTTPException(404, "Mission not found")

    return public_mission(mission)


@app.post("/api/decision")
def evaluate_decision(request: DecisionRequest):
    mission = find_mission(request.mission_id)

    if not mission:
        raise HTTPException(404, "Mission not found")

    scenario = next(
        (
            s for s in mission["scenarios"]
            if s["id"] == request.scenario_id
        ),
        None
    )

    if not scenario:
        raise HTTPException(404, "Scenario not found")

    action = next(
        (
            a for a in scenario["actions"]
            if a["id"] == request.action_id
        ),
        None
    )

    if not action:
        raise HTTPException(400, "Invalid action")

    success = (
        request.action_id == scenario["correct_action"]
    )

    return {
        "success": success,
        "status": "SUCCESS" if success else "FAILURE",
        "message": (
            "Your decision resolved the primary mission problem."
            if success
            else "Your decision did not resolve the primary problem."
        ),
        "selected_action": action["label"],
        "explanation": (
            "This action addresses the failure indicated by the clues."
            if success
            else "Review the telemetry and try a different solution."
        )
    }
    
from simulation import (
    create_session,
    evaluate_action,
    get_session
)


class StartMissionRequest(BaseModel):
    mission_id: int
    scenario_id: int
    difficulty: str


class MissionActionRequest(BaseModel):
    session_id: str
    action_id: str


@app.post("/api/session/start")
def start_mission(request: StartMissionRequest):
    try:
        return create_session(
            request.mission_id,
            request.scenario_id,
            request.difficulty
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@app.post("/api/session/action")
def submit_mission_action(request: MissionActionRequest):
    try:
        return evaluate_action(
            request.session_id,
            request.action_id
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@app.get("/api/session/{session_id}")
def read_mission_session(session_id: str):
    try:
        return get_session(session_id)
    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        )


logger = logging.getLogger(__name__)


@app.get("/api/nasa/solar-flares")
async def solar_flare_data():
    try:
        events = await get_solar_flare_events()

        return {
            "source": "NASA DONKI",
            "count": len(events),
            "events": events
        }

    except httpx.HTTPStatusError as error:
        logger.error(
            "NASA HTTP error: %s %s",
            error.response.status_code,
            error.response.text[:500]
        )

        raise HTTPException(
            status_code=503,
            detail="NASA API returned an HTTP error"
        )

    except httpx.RequestError as error:
        logger.error("NASA connection error: %s", error)

        raise HTTPException(
            status_code=503,
            detail="NASA API connection failed"
        )

    except ValueError as error:
        logger.error("NASA data error: %s", error)

        raise HTTPException(
            status_code=503,
            detail="NASA API returned invalid data"
        )

from advanced_engine import (
    start_advanced_session,
    execute_advanced_action
)


@app.post("/api/advanced/start")
def advanced_start(request: StartMissionRequest):
    try:
        return start_advanced_session(
            request.mission_id,
            request.scenario_id,
            request.difficulty
        )
    except ValueError as error:
        raise HTTPException(400, str(error))


@app.post("/api/advanced/action")
def advanced_action(request: MissionActionRequest):
    try:
        return execute_advanced_action(
            request.session_id,
            request.action_id
        )
    except ValueError as error:
        raise HTTPException(400, str(error))
    


from solar_storm import (
    start_solar_storm,
    execute_solar_action
)


class SolarStartRequest(BaseModel):
    difficulty: str
    event_id: str


class SolarActionRequest(BaseModel):
    session_id: str
    action_id: str


@app.post("/api/solar-storm/start")
async def solar_storm_start(request: SolarStartRequest):
    try:
        return await start_solar_storm(
            request.difficulty,
            request.event_id
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except (httpx.HTTPError, httpx.DecodingError):
        raise HTTPException(
            status_code=503,
            detail="NASA DONKI service is unavailable"
        )


@app.post("/api/solar-storm/action")
def solar_storm_action(request: SolarActionRequest):
    try:
        return execute_solar_action(
            request.session_id,
            request.action_id
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


from branching_engine import (
    start_branching_session,
    execute_branching_action,
    get_branching_session
)


class BranchingStartRequest(BaseModel):
    difficulty: str
    event_id: str


class BranchingActionRequest(BaseModel):
    session_id: str
    action_id: str


@app.post("/api/branching/start")
async def branching_start(request: BranchingStartRequest):
    try:
        return await start_branching_session(
            request.difficulty,
            request.event_id
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except httpx.HTTPError:
        raise HTTPException(
            status_code=503,
            detail="NASA DONKI service unavailable"
        )


@app.post("/api/branching/action")
def branching_action(request: BranchingActionRequest):
    try:
        return execute_branching_action(
            request.session_id,
            request.action_id
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@app.get("/api/branching/session/{session_id}")
def branching_session_status(session_id: str):
    try:
        return get_branching_session(session_id)

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        )


class CopilotHintRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=100)
    question: str = Field(default="", max_length=500)


@app.post("/api/copilot/hint")
async def copilot_hint(request: CopilotHintRequest):
    try:
        return await get_copilot_hint(
            session_id=request.session_id,
            question=request.question
        )

    except ValueError as error:
        message = str(error)

        status = (
            429 if message == "Hint limit reached"
            else 400
        )

        raise HTTPException(
            status_code=status,
            detail=message
        )


@app.get("/api/debrief/{session_id}")
def get_mission_debrief(session_id: str):
    try:
        return generate_debrief(session_id)

    except ValueError as error:
        message = str(error)

        status = (
            404 if message == "Session not found"
            else 409
        )

        raise HTTPException(
            status_code=status,
            detail=message
        )


@app.get("/api/debrief/{session_id}/pdf")
def download_mission_pdf(session_id: str):
    try:
        debrief = generate_debrief(session_id)
        pdf_bytes = generate_pdf_report(debrief)

        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    'attachment; filename="'
                    'PARADOX_Mission_Report.pdf"'
                ),
                "Cache-Control": "no-store"
            }
        )

    except ValueError as error:
        message = str(error)

        raise HTTPException(
            status_code=(
                404 if message == "Session not found"
                else 409
            ),
            detail=message
        )


@app.get("/api/debrief/{session_id}/json")
def download_mission_json(session_id: str):
    try:
        debrief = generate_debrief(session_id)

        json_bytes = json.dumps(
            debrief,
            indent=2,
            ensure_ascii=False
        ).encode("utf-8")

        return StreamingResponse(
            BytesIO(json_bytes),
            media_type="application/json",
            headers={
                "Content-Disposition": (
                    'attachment; filename="'
                    'PARADOX_Mission_Report.json"'
                ),
                "Cache-Control": "no-store"
            }
        )

    except ValueError as error:
        message = str(error)

        raise HTTPException(
            status_code=(
                404 if message == "Session not found"
                else 409
            ),
            detail=message
        )
