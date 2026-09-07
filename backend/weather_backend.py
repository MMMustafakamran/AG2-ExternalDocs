# ─────────────────────────────────────────────────────────────────────────────
# HARNESS CODE — NOT PUBLISHED BY THE DOCS.
#
# `starter-backend.py` beside this file is the runnable reference the CopilotKit
# Quickstart links to, and it does not import under `ag2` 1.0.4 (see
# backend/README.md). But the Quickstart's *frontend* is published in full on the
# page, and it registers a render-only action for a tool named `get_weather` —
# so without a backend that serves that tool there is nothing to record.
#
# This file is that backend: the starter's weather agent, ported to the 1.0 API
# the doc page itself uses. The port is the finding made concrete — every line
# that had to change is one the starter would have to change too.
#
#   starter (AG2 0.x)                 here (AG2 1.0, as docs/user-guide/ag-ui/)
#   ────────────────────────────────  ────────────────────────────────────────
#   from autogen import ...           from ag2 import Agent
#   from autogen.ag_ui import ...     from ag2.ag_ui import AGUIStream
#   ConversableAgent(...)             Agent(...)
#   system_message=                   prompt=
#   llm_config=LLMConfig({...})       config=OpenAIConfig(model=...)
#   functions=[get_weather]           tools=[get_weather]
#   Annotated[str, "City name"]       Annotated[str, Field(description="City name")]
#
# That last row is the one nobody would predict, and it is the SECOND
# independent reason the starter does not run. Verified 2026-09-07 against
# ag2 1.0.4:
#
#   Annotated[str, "City name to get weather for"]
#     -> SyntaxError: Forward reference must be an expression
#        -- got 'City name to get weather for'
#
#   Annotated[str, Field(description="City name")]   -> accepted
#
# ag2 1.0 routes tool signatures through `fast_depends`, which treats a bare
# string in `Annotated` as a forward reference and tries to compile it. So
# fixing the starter's two `autogen` imports is not enough: it fails again on
# the very next thing, in a way whose error message names neither the tool nor
# the annotation. See FINDINGS.md finding 1.
#
# Everything else — the Open-Meteo lookup, the WMO code table, the response
# shape, the CORS block, `app.mount("/chat", ...)`, port 8008 — is the starter's,
# unchanged, because the frontend's WeatherCard reads those exact field names.
# ─────────────────────────────────────────────────────────────────────────────
"""Weather agent with AG-UI protocol — AG2 1.0 port of the linked starter."""

from __future__ import annotations

import os
from typing import Annotated

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import Field

from ag2 import Agent
from ag2.ag_ui import AGUIStream
from ag2.config import OpenAIConfig

# WMO weather interpretation codes, exactly as the starter maps them. The
# frontend renders whatever string comes back, so changing these changes the
# demo rather than fixing anything.
WEATHER_CONDITIONS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def get_weather_condition(code: int) -> str:
    """Map a WMO weather code to a human-readable condition."""
    return WEATHER_CONDITIONS.get(code, "Unknown")


async def get_weather(
    location: Annotated[str, Field(description="City name to get weather for")],
) -> dict[str, str | float]:
    """Get current weather for a location using the Open-Meteo API."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        geocoding = await client.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": location, "count": 1},
        )
        results = geocoding.json().get("results")
        if not results:
            return {"error": f"Location '{location}' not found"}

        place = results[0]
        forecast = await client.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": place["latitude"],
                "longitude": place["longitude"],
                "current": (
                    "temperature_2m,apparent_temperature,relative_humidity_2m,"
                    "wind_speed_10m,wind_gusts_10m,weather_code"
                ),
            },
        )
        current = forecast.json()["current"]

    # Field names are the frontend's contract — `WeatherCard` in the published
    # page/tsx destructures exactly these.
    return {
        "temperature": current["temperature_2m"],
        "feelsLike": current["apparent_temperature"],
        "humidity": current["relative_humidity_2m"],
        "windSpeed": current["wind_speed_10m"],
        "windGust": current["wind_gusts_10m"],
        "conditions": get_weather_condition(current["weather_code"]),
        "location": place["name"],
    }


agent = Agent(
    name="weather_agent",
    prompt=(
        "You are a helpful weather assistant. You can check the weather for any city "
        "using the get_weather tool. Be concise and friendly in your responses."
    ),
    config=OpenAIConfig(model=os.getenv("OPENAI_MODEL", "gpt-4o-mini")),
    tools=[get_weather],
)

stream = AGUIStream(agent)
app = FastAPI(title="AG2 Weather Agent — AG-UI")

# The Quickstart's "Production notes" say to allow the frontend origin on the
# AG-UI backend. `*` is the starter's value and is fine for a local harness;
# it is called out on the page as something to narrow in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# The "Simpler way" note on the AG-UI index page: mount the ASGI endpoint
# directly when the route needs no extra logic.
app.mount("/chat", stream.build_asgi())

if __name__ == "__main__":
    import uvicorn

    # 8008 is the Quickstart's own port: "The starter backend mounts the AG-UI
    # endpoint at /chat and runs on port 8008."
    uvicorn.run(app, host="127.0.0.1", port=int(os.getenv("AG2_PORT", "8008")))
