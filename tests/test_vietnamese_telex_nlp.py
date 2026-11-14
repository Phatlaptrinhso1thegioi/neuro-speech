"""
tests/test_vietnamese_telex_nlp.py
Table-driven tests for Vietnamese Telex engine and offline word suggester (M2b).
"""

import unicodedata
import pytest

from apps.api.app.ai.telex import VietnameseTelexParser, strip_all_diacritics
from apps.api.app.ai.word_suggester import WordSuggester, OptionalLLMAdapter


@pytest.mark.parametrize("raw_input,expected", [
    ("uoongs", "uống"),
    ("muoons", "muốn"),
    ("nuwowcs", "nước"),
    ("Vieetj", "Việt"),
    ("ddi", "đi"),
    ("hoaf", "hòa"),
    ("hoas", "hóa"),
    ("dddi", "ddi"),      # Undo case for dd
    ("aaa", "aa"),        # Undo case for aa
    ("eee", "ee"),        # Undo case for ee
    ("ooo", "oo"),        # Undo case for oo
    ("aww", "aw"),        # Undo case for aw
    ("ass", "as"),        # Undo case for tone s
    ("tojj", "toj"),      # Undo case for tone j
    ("Tooi muoons uoongs nuwowcs", "Tôi muốn uống nước"),
    ("Vieetj Nam", "Việt Nam"),
])
def test_telex_table_driven_cases(raw_input, expected):
    """Table-driven tests for required Telex transformations, tones, and undo cases."""
    parsed = VietnameseTelexParser.parse_text(raw_input)
    assert parsed == expected, f"Failed for '{raw_input}': got '{parsed}', expected '{expected}'"
    # Ensure Unicode NFC normalization
    assert unicodedata.is_normalized("NFC", parsed), f"Output '{parsed}' is not in Unicode NFC!"


def test_english_mode_bypasses_telex():
    """Principle: In English mode, Telex rules are bypassed completely."""
    english_text = "Tooi muoons uoongs nuwowcs"
    result = VietnameseTelexParser.parse_text(english_text, english_mode=True)
    assert result == english_text


def test_strip_all_diacritics():
    """Verifies diacritic stripping for prefix lookup."""
    assert strip_all_diacritics("uống") == "uong"
    assert strip_all_diacritics("muốn") == "muon"
    assert strip_all_diacritics("nước") == "nuoc"
    assert strip_all_diacritics("Việt") == "Viet"
    assert strip_all_diacritics("đi") == "di"


def test_word_suggester_prefix_matching():
    """Verifies offline prefix matching, diacritic tolerance, and max candidate limit."""
    suggester = WordSuggester()

    # Prefix >= 2 characters
    res_muon = suggester.suggest("muon")
    assert "muốn" in res_muon
    assert len(res_muon) <= 5

    res_uo = suggester.suggest("uo")
    assert "uống" in res_uo
    assert len(res_uo) <= 5

    res_nuoc = suggester.suggest("nuoc")
    assert "nước" in res_nuoc

    # Prefix < 2 characters must return empty list
    assert suggester.suggest("m") == []
    assert suggester.suggest("") == []


def test_word_suggester_bigram_boost():
    """Verifies that previous confirmed word boosts bigram transitions."""
    suggester = WordSuggester()

    # Without previous context
    standalone = suggester.suggest("uo")
    # With previous confirmed word "muốn" -> "uống" should be top candidate
    boosted = suggester.suggest("uo", previous_confirmed_word="muốn")

    assert boosted[0] == "uống"


def test_optional_llm_adapter_disabled():
    """Verifies that optional LLM adapter is off by default and labeled."""
    adapter = OptionalLLMAdapter()
    assert adapter.enabled is False
    assert adapter.label == "OFFLINE_BY_DEFAULT"
    assert adapter.complete("Xin chào") is None
