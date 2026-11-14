"""
apps/api/app/ai/word_suggester.py
Offline Vietnamese Word Suggestions Engine.
Uses unigram frequency lexicon + bigram context transitions.
Matches prefixes on diacritic-stripped text so suggestions appear before tone marks are spelled.
Requires >= 2 characters prefix; returns at most 5 candidates.
Documented in docs/WORDLIST_LICENSE.md (MIT / CC-BY-SA 3.0 / CC0).
"""

from typing import List, Dict, Tuple, Optional
import unicodedata
from apps.api.app.ai.telex import strip_all_diacritics

# Seeded frequency lexicon (word: unigram_frequency_weight)
# Words tailored for assistive communication, daily needs, and standard Vietnamese.
VIETNAMESE_LEXICON: Dict[str, float] = {
    # Pronouns & Common Words
    "tôi": 1000.0, "bạn": 850.0, "anh": 800.0, "chị": 800.0, "em": 820.0,
    "bác": 700.0, "chú": 680.0, "cô": 690.0, "ông": 710.0, "bà": 710.0,
    "chúng": 600.0, "mình": 750.0, "người": 880.0, "nhà": 720.0,

    # Verbs of Need, Action, Communication
    "muốn": 980.0, "cần": 950.0, "xin": 820.0, "hỏi": 700.0, "nói": 780.0,
    "uống": 920.0, "ăn": 930.0, "đi": 940.0, "ngủ": 800.0, "nghỉ": 790.0,
    "ngồi": 760.0, "nằm": 770.0, "dậy": 740.0, "đứng": 730.0, "lại": 710.0,
    "giúp": 910.0, "gọi": 840.0, "tìm": 720.0, "xem": 710.0, "nghe": 730.0,
    "biết": 850.0, "hiểu": 800.0, "thấy": 820.0, "làm": 860.0, "có": 990.0,
    "không": 995.0, "được": 960.0, "phải": 890.0, "là": 980.0, "ở": 870.0,

    # Daily Care & Medical Terms
    "nước": 940.0, "cơm": 880.0, "cháo": 820.0, "thuốc": 890.0, "sữa": 830.0,
    "bánh": 780.0, "canh": 760.0, "trà": 750.0, "khăn": 710.0, "áo": 700.0,
    "vệ": 860.0, "sinh": 850.0, "phòng": 780.0, "giường": 790.0, "ghế": 720.0,
    "khẩn": 890.0, "cấp": 890.0, "trợ": 880.0, "bác": 850.0, "sĩ": 840.0,
    "y": 820.0, "tá": 810.0, "bệnh": 860.0, "viện": 850.0, "đau": 930.0,
    "mệt": 910.0, "lạnh": 870.0, "nóng": 880.0, "ngứa": 840.0, "khó": 890.0,
    "thở": 880.0, "chóng": 820.0, "mặt": 830.0, "đầu": 840.0, "bụng": 850.0,
    "lưng": 810.0, "chân": 820.0, "tay": 830.0, "mắt": 810.0, "tai": 790.0,

    # Survival & Courtesy Phrases
    "cảm": 920.0, "ơn": 920.0, "chào": 890.0, "tạm": 800.0, "biệt": 800.0,
    "đồng": 810.0, "ý": 820.0, "đúng": 880.0, "sai": 810.0, "rồi": 860.0,
    "chưa": 850.0, "nhanh": 810.0, "chậm": 800.0, "rất": 870.0, "quá": 840.0,
    "nhiều": 830.0, "ít": 810.0, "tốt": 850.0, "xấu": 780.0, "khỏe": 820.0,
    "yếu": 810.0, "an": 800.0, "toàn": 800.0, "nguy": 820.0, "hiểm": 820.0,

    # Vietnamese Vocabulary
    "việt": 900.0, "nam": 900.0, "hòa": 750.0, "bình": 740.0, "ngày": 820.0,
    "đêm": 790.0, "hôm": 840.0, "nay": 840.0, "mai": 810.0, "giờ": 830.0
}

# Bigram context transitions (prev_word, current_word) -> transition_weight
VIETNAMESE_BIGRAMS: Dict[Tuple[str, str], float] = {
    ("tôi", "muốn"): 500.0,
    ("tôi", "cần"): 480.0,
    ("tôi", "bị"): 400.0,
    ("tôi", "thấy"): 380.0,
    ("tôi", "không"): 350.0,
    ("muốn", "uống"): 450.0,
    ("muốn", "ăn"): 440.0,
    ("muốn", "đi"): 420.0,
    ("muốn", "nghỉ"): 390.0,
    ("muốn", "ngủ"): 380.0,
    ("uống", "nước"): 480.0,
    ("uống", "thuốc"): 440.0,
    ("uống", "sữa"): 400.0,
    ("uống", "trà"): 350.0,
    ("ăn", "cơm"): 450.0,
    ("ăn", "cháo"): 440.0,
    ("ăn", "bánh"): 390.0,
    ("đi", "vệ"): 480.0,
    ("vệ", "sinh"): 490.0,
    ("cần", "trợ"): 470.0,
    ("trợ", "giúp"): 490.0,
    ("giúp", "khẩn"): 460.0,
    ("khẩn", "cấp"): 490.0,
    ("cần", "gọi"): 420.0,
    ("gọi", "bác"): 430.0,
    ("bác", "sĩ"): 480.0,
    ("gọi", "y"): 400.0,
    ("y", "tá"): 450.0,
    ("cảm", "ơn"): 490.0,
    ("xin", "chào"): 460.0,
    ("tạm", "biệt"): 450.0,
    ("đau", "đầu"): 440.0,
    ("đau", "bụng"): 430.0,
    ("đau", "lưng"): 410.0,
    ("khó", "thở"): 470.0,
    ("chóng", "mặt"): 450.0,
    ("đồng", "ý"): 460.0,
    ("không", "sao"): 440.0,
    ("việt", "nam"): 480.0
}


class WordSuggester:
    """
    Offline Vietnamese word completion and suggestion engine.
    Matches prefixes on the diacritic-stripped form so suggestions appear before tone marks are entered.
    """

    def __init__(self, lexicon: Optional[Dict[str, float]] = None, bigrams: Optional[Dict[Tuple[str, str], float]] = None):
        self.lexicon = lexicon or VIETNAMESE_LEXICON
        self.bigrams = bigrams or VIETNAMESE_BIGRAMS

        # Precompute stripped form for efficient lookup
        self._stripped_lookup: List[Tuple[str, str, float]] = []
        for word, freq in self.lexicon.items():
            norm_word = unicodedata.normalize('NFC', word.lower())
            stripped = strip_all_diacritics(norm_word)
            self._stripped_lookup.append((norm_word, stripped, freq))

    def suggest(
        self,
        current_word_prefix: str,
        previous_confirmed_word: Optional[str] = None,
        max_candidates: int = 5
    ) -> List[str]:
        """
        Suggests up to max_candidates (at most 5) words matching the current prefix.
        Requires prefix length >= 2 characters.
        """
        if not current_word_prefix or len(current_word_prefix.strip()) < 2:
            return []

        clean_prefix = unicodedata.normalize('NFC', current_word_prefix.strip().lower())
        stripped_prefix = strip_all_diacritics(clean_prefix)

        prev_norm = unicodedata.normalize('NFC', previous_confirmed_word.strip().lower()) if previous_confirmed_word else None

        candidates_scored = []
        for word, stripped, unigram_weight in self._stripped_lookup:
            # Check prefix match on both stripped form and composed form
            if stripped.startswith(stripped_prefix) or word.startswith(clean_prefix):
                score = unigram_weight

                # Add bigram transition boost if previous confirmed word exists
                if prev_norm:
                    bigram_key = (prev_norm, word)
                    if bigram_key in self.bigrams:
                        score += self.bigrams[bigram_key] * 2.0

                # Prefer exact prefix matches over longer completions
                length_penalty = len(word) - len(clean_prefix)
                score -= length_penalty * 2.0

                candidates_scored.append((score, word))

        # Sort descending by combined score
        candidates_scored.sort(key=lambda x: x[0], reverse=True)

        # Unique candidates, at most max_candidates (max 5)
        results = []
        seen = set()
        for _, w in candidates_scored:
            if w not in seen:
                seen.add(w)
                results.append(w)
                if len(results) >= min(5, max_candidates):
                    break

        return results


class OptionalLLMAdapter:
    """
    Optional LLM Adapter (off by default, clearly labeled).
    Never required for tests or offline baseline operation.
    """
    def __init__(self, enabled: bool = False):
        self.enabled = enabled
        self.label = "OFFLINE_BY_DEFAULT"

    def complete(self, prompt: str) -> Optional[str]:
        if not self.enabled:
            return None
        return None
