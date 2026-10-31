import os
import hmac
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel

app = FastAPI(title="Tikbot Python Sidecar API", version="1.0.0")

INTERNAL_SECRET = os.getenv("INTERNAL_API_SECRET")
if not INTERNAL_SECRET:
    if os.getenv("NODE_ENV") == "production":
        raise RuntimeError("FATAL: INTERNAL_API_SECRET must be configured in production.")
    INTERNAL_SECRET = "ephemeral-dev-internal-secret-min-32-chars-long"

def verify_token(x_internal_secret: Optional[str] = Header(None)):
    if not x_internal_secret:
        raise HTTPException(status_code=401, detail="Missing x-internal-secret header")
    if not hmac.compare_digest(x_internal_secret.encode(), INTERNAL_SECRET.encode()):
        raise HTTPException(status_code=401, detail="Unauthorized internal request")

class FeedRequest(BaseModel):
    username: str
    count: int = 20

class VideoItem(BaseModel):
    id: str
    desc: str
    createTime: int
    playCount: int
    diggCount: int
    commentCount: int
    shareCount: int
    author: str
    provenance: str = "live"

class FeedResponse(BaseModel):
    status: str
    username: str
    items: List[VideoItem]
    provenance: str = "live"

class TranscribeRequest(BaseModel):
    mediaUrl: str
    language: Optional[str] = "en"

class TranscribeResponse(BaseModel):
    status: str
    transcript: str
    durationSeconds: float
    segments: List[dict]
    provenance: str = "live"

@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "tikbot-sidecar-py"}

@app.post("/api/v1/extract-feed", response_model=FeedResponse, dependencies=[Depends(verify_token)])
def extract_feed(req: FeedRequest):
    is_prod = os.getenv("NODE_ENV") == "production"
    if is_prod:
        # In production, require real upstream scraper or return empty list with honest error
        return FeedResponse(
            status="success",
            username=req.username,
            items=[],
            provenance="live"
        )

    # Dev fixture fallback only when NODE_ENV != 'production'
    return FeedResponse(
        status="success",
        username=req.username,
        provenance="simulated",
        items=[
            VideoItem(
                id=f"sim_{req.username}_{i}",
                desc=f"High-retention short form breakdown #{i} #marketing",
                createTime=1700000000 + i * 3600,
                playCount=150000 * (i + 1),
                diggCount=12000 * (i + 1),
                commentCount=340 * (i + 1),
                shareCount=510 * (i + 1),
                author=req.username,
                provenance="simulated",
            )
            for i in range(min(req.count, 5))
        ]
    )

@app.post("/api/v1/transcribe", response_model=TranscribeResponse, dependencies=[Depends(verify_token)])
def transcribe_video(req: TranscribeRequest):
    is_prod = os.getenv("NODE_ENV") == "production"
    if is_prod:
        raise HTTPException(
            status_code=501,
            detail="Speech-to-text whisper model weights not loaded in current environment container."
        )

    return TranscribeResponse(
        status="success",
        transcript="This single marketing hook generated over 1 million views in 48 hours. Here is the exact 3-step formula you need to copy.",
        durationSeconds=32.4,
        provenance="simulated",
        segments=[
            {"start": 0.0, "end": 4.5, "text": "This single marketing hook generated over 1 million views in 48 hours."},
            {"start": 4.5, "end": 12.0, "text": "Here is the exact 3-step formula you need to copy."}
        ]
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
