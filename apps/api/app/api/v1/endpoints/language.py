"""
apps/api/app/api/v1/endpoints/language.py
REST endpoints for Vietnamese Telex and Word Suggestions (M2b).
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

from apps.api.app.ai.telex import VietnameseTelexParser, strip_all_diacritics
from apps.api.app.ai.word_suggester import WordSuggester, OptionalLLMAdapter

router = APIRouter(prefix="/language", tags=["language"])

suggester = WordSuggester()
llm_adapter = OptionalLLMAdapter(enabled=False)


class TelexRequest(BaseModel):
    text: str = Field(description="Raw text or key sequence to parse via Telex rules")
    english_mode: bool = Field(default=False, description="When true, bypasses Telex parsing")


class TelexResponse(BaseModel):
    raw_input: str
    parsed_text: str
    is_nfc: bool
    english_mode: bool


class SuggestionRequest(BaseModel):
    prefix: str = Field(description="Current word prefix typed by user (>= 2 characters)")
    previous_word: Optional[str] = Field(default=None, description="Previous confirmed word for bigram boost")
    max_candidates: int = Field(default=5, ge=1, le=10, description="Max suggestions to return (capped at 5)")


class SuggestionResponse(BaseModel):
    prefix: str
    previous_word: Optional[str]
    candidates: List[str]
    count: int
    adapter: str


@router.post("/telex", response_model=TelexResponse)
def parse_telex(req: TelexRequest) -> TelexResponse:
    """
    Parses a raw character stream or sentence into NFC-normalized Vietnamese text using Telex rules.
    Respects traditional tone placement (e.g., 'hòa', 'hóa') and modifier undo (e.g., 'aaa' -> 'aa', 'ass' -> 'as').
    """
    parsed = VietnameseTelexParser.parse_text(req.text, english_mode=req.english_mode)
    import unicodedata
    is_nfc = unicodedata.is_normalized("NFC", parsed)
    return TelexResponse(
        raw_input=req.text,
        parsed_text=parsed,
        is_nfc=is_nfc,
        english_mode=req.english_mode
    )


@router.post("/suggest", response_model=SuggestionResponse)
def get_suggestions(req: SuggestionRequest) -> SuggestionResponse:
    """
    Returns offline unigram and bigram word suggestions matching the prefix.
    Matches on diacritic-stripped text so suggestions appear before tone marks are spelled.
    Requires prefix length >= 2 characters.
    """
    candidates = suggester.suggest(
        current_word_prefix=req.prefix,
        previous_confirmed_word=req.previous_word,
        max_candidates=req.max_candidates
    )
    return SuggestionResponse(
        prefix=req.prefix,
        previous_word=req.previous_word,
        candidates=candidates,
        count=len(candidates),
        adapter=llm_adapter.label
    )
