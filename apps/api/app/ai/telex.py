"""
apps/api/app/ai/telex.py
Vietnamese Telex Engine for NEURO-SPEECH.
Implements standard Vietnamese Telex rules, modern tone placement orthography,
undo on modifier re-typing, and Unicode NFC normalization.
"""

import unicodedata
from typing import Tuple, Optional, Dict, List

# Vowel tables for base letters and diacritics
# Tone mapping: 0=none, 1=sắc (s), 2=huyền (f), 3=hỏi (r), 4=ngã (x), 5=nặng (j)
TONE_MAP = {
    's': 1,  # Sắc
    'f': 2,  # Huyền
    'r': 3,  # Hỏi
    'x': 4,  # Ngã
    'j': 5,  # Nặng
    'z': 0   # Bỏ dấu
}

# Diacritic base forms
# Format: (char, tone_index) -> composed character
VOWEL_VARIANTS = {
    'a': ['a', 'á', 'à', 'ả', 'ã', 'ạ'],
    'ă': ['ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'],
    'â': ['â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ'],
    'e': ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'],
    'ê': ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'],
    'i': ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
    'o': ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'],
    'ô': ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ'],
    'ơ': ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
    'u': ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'],
    'ư': ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'],
    'y': ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ'],
}

UPPER_VOWEL_VARIANTS = {
    base.upper(): [v.upper() for v in variants]
    for base, variants in VOWEL_VARIANTS.items()
}

ALL_VOWEL_VARIANTS = {**VOWEL_VARIANTS, **UPPER_VOWEL_VARIANTS}

# Mapping back from composed vowel to (base_vowel, tone_index)
COMPOSED_TO_BASE_TONE: Dict[str, Tuple[str, int]] = {}
for base, variants in ALL_VOWEL_VARIANTS.items():
    for tone_idx, comp in enumerate(variants):
        COMPOSED_TO_BASE_TONE[comp] = (base, tone_idx)


def strip_tone_from_char(ch: str) -> Tuple[str, int]:
    """Returns (base_char_without_tone, tone_index)."""
    norm = unicodedata.normalize('NFC', ch)
    if norm in COMPOSED_TO_BASE_TONE:
        return COMPOSED_TO_BASE_TONE[norm]
    return ch, 0


def apply_tone_to_char(base_vowel: str, tone_idx: int) -> str:
    """Applies tone (0..5) to a vowel."""
    base_norm = unicodedata.normalize('NFC', base_vowel)
    if base_norm in ALL_VOWEL_VARIANTS:
        return ALL_VOWEL_VARIANTS[base_norm][tone_idx]
    return base_vowel


def strip_all_diacritics(text: str) -> str:
    """
    Removes all Vietnamese diacritics and tones (e.g. 'nước' -> 'nuoc', 'Việt' -> 'Viet').
    Useful for diacritic-insensitive prefix matching in word suggestions.
    """
    text_nfc = unicodedata.normalize('NFC', text)
    res = []
    for c in text_nfc:
        base, _ = strip_tone_from_char(c)
        # Map modified vowels to ASCII
        mapping = {
            'ă': 'a', 'â': 'a', 'đ': 'd', 'ê': 'e', 'ô': 'o', 'ơ': 'o', 'ư': 'u',
            'Ă': 'A', 'Â': 'A', 'Đ': 'D', 'Ê': 'E', 'Ô': 'O', 'Ơ': 'O', 'Ư': 'U'
        }
        res.append(mapping.get(base, base))
    return ''.join(res)


class VietnameseTelexParser:
    """
    Streaming and batch Vietnamese Telex processor.
    Implements modern tone placement convention: 'hòa', 'thúy', 'toàn', 'muốn', 'uống', 'nước'.
    """

    @staticmethod
    def _find_tone_vowel_position(vowels_indices: List[int], chars: List[str]) -> int:
        """
        Determines the vowel position that receives the tone mark according to modern orthography:
        1. If final consonants follow the vowel cluster (e.g. 'uống', 'muốn', 'nước', 'Việt'):
           - Tone goes to the principal vowel (e.g., 'ô' in 'uông', 'ê' in 'iê', 'ơ' in 'ươ').
        2. If no final consonant:
           - In 'oa', 'oe', 'uy': tone goes to the second vowel ('hòa', 'hòe', 'thúy').
           - In 'ua', 'ia', 'ưa': tone goes to the first vowel ('múa', 'mía', 'mứa').
           - Otherwise, tone goes to the penultimate or single vowel.
        """
        n_vowels = len(vowels_indices)
        if n_vowels == 1:
            return vowels_indices[0]

        has_final_consonant = vowels_indices[-1] < len(chars) - 1
        vowel_chars = [strip_tone_from_char(chars[i])[0].lower() for i in vowels_indices]
        cluster = "".join(vowel_chars)

        if has_final_consonant:
            # When consonants follow:
            # uông -> ô, muốn -> uô -> ô, nước -> ươ -> ơ, việt -> iê -> ê
            if cluster in ("ie", "iê", "ye", "yê"):
                return vowels_indices[1]
            if cluster in ("uo", "uô", "ươ", "ưo"):
                return vowels_indices[1]
            if cluster in ("oa", "oă", "oe"):
                return vowels_indices[1]
            # Default to last vowel before consonant
            return vowels_indices[-1]
        else:
            # Open syllables (no final consonant):
            # Traditional standard (hòa, not hoà; hòe; thủy):
            if cluster in ("oa", "oe"):
                return vowels_indices[0]
            if cluster == "uy":
                return vowels_indices[1]
            if cluster in ("ua", "ia", "ưa"):
                # múa, mía, mứa
                return vowels_indices[0]
            if cluster in ("ươ", "uô", "iê"):
                return vowels_indices[1]
            # Default to first vowel in diphthong
            return vowels_indices[0]

    @classmethod
    def parse_word(cls, raw_word: str) -> str:
        """
        Parses a single word containing Telex keystrokes into modern Vietnamese NFC unicode.
        Handles undo modifiers (e.g. 'aaa' -> 'aa', 'ddd' -> 'dd').
        """
        if not raw_word:
            return ""

        chars = []
        i = 0
        n = len(raw_word)

        # Track applied tone (tone_idx, tone_trigger_char)
        current_tone = 0
        last_tone_key = None

        while i < n:
            ch = raw_word[i]
            ch_lower = ch.lower()
            is_upper = ch.isupper()

            # 1. Check double-letter transformations (aa->â, ee->ê, oo->ô, dd->đ)
            if i + 1 < n and ch_lower == raw_word[i + 1].lower():
                next_ch_lower = raw_word[i + 1].lower()
                pair = ch_lower + next_ch_lower

                # Check if third identical letter exists -> undo!
                # e.g. 'aaa' -> 'aa' (transforms first, then third undid to 'aa')
                has_undo = (i + 2 < n and raw_word[i + 2].lower() == ch_lower)

                if pair == "aa":
                    chars.append("Â" if is_upper else "â")
                    i += 2
                    if has_undo:
                        chars.pop()
                        chars.extend(["A" if is_upper else "a", "A" if raw_word[i].isupper() else "a"])
                        i += 1
                    continue
                elif pair == "ee":
                    chars.append("Ê" if is_upper else "ê")
                    i += 2
                    if has_undo:
                        chars.pop()
                        chars.extend(["E" if is_upper else "e", "E" if raw_word[i].isupper() else "e"])
                        i += 1
                    continue
                elif pair == "oo":
                    chars.append("Ô" if is_upper else "ô")
                    i += 2
                    if has_undo:
                        chars.pop()
                        chars.extend(["O" if is_upper else "o", "O" if raw_word[i].isupper() else "o"])
                        i += 1
                    continue
                elif pair == "dd":
                    chars.append("Đ" if is_upper else "đ")
                    i += 2
                    if has_undo:
                        chars.pop()
                        chars.extend(["D" if is_upper else "d", "D" if raw_word[i].isupper() else "d"])
                        i += 1
                    continue

            # 2. Check horn/breve transformations with 'w' (aw->ă, ow->ơ, uw->ư)
            if ch_lower == 'w' and chars:
                # Modifies previous letter
                prev = chars[-1]
                prev_base, prev_tone = strip_tone_from_char(prev)
                prev_lower = prev_base.lower()
                prev_upper = prev_base.isupper()

                # Check if typing 'w' again undid transformation
                # e.g. 'aww' -> 'aw'
                if prev_lower in ('ă', 'ơ', 'ư'):
                    # Undo back to base + 'w'
                    undo_map = {'ă': 'a', 'ơ': 'o', 'ư': 'u'}
                    base_restore = undo_map.get(prev_lower, prev_lower)
                    chars[-1] = base_restore.upper() if prev_upper else base_restore
                    chars.append('W' if is_upper else 'w')
                    i += 1
                    continue

                if prev_lower == 'a':
                    new_char = 'Ă' if prev_upper else 'ă'
                    chars[-1] = apply_tone_to_char(new_char, prev_tone)
                    i += 1
                    continue
                elif prev_lower == 'o':
                    new_char = 'Ơ' if prev_upper else 'ơ'
                    chars[-1] = apply_tone_to_char(new_char, prev_tone)
                    i += 1
                    continue
                elif prev_lower == 'u':
                    new_char = 'Ư' if prev_upper else 'ư'
                    chars[-1] = apply_tone_to_char(new_char, prev_tone)
                    i += 1
                    continue
                else:
                    # 'w' standalone or at start (e.g. 'wa' -> 'qua' or 'w')
                    chars.append(ch)
                    i += 1
                    continue

            # 3. Check tone marks (s, f, r, x, j, z)
            # Only treat as tone if we already have at least one vowel in word
            has_vowels_so_far = any(strip_tone_from_char(c)[0].lower() in VOWEL_VARIANTS for c in chars)
            if ch_lower in TONE_MAP and has_vowels_so_far:
                tone_val = TONE_MAP[ch_lower]

                # Check if typing tone key again undid it
                if last_tone_key == ch_lower:
                    # Undo tone!
                    current_tone = 0
                    last_tone_key = None
                    chars.append(ch)
                    i += 1
                    continue

                current_tone = tone_val
                last_tone_key = ch_lower
                i += 1
                continue

            # Standard letter
            chars.append(ch)
            i += 1

        # Now place the tone on the appropriate vowel
        if current_tone > 0:
            # Find all vowel indices in chars
            vowel_indices = []
            for idx, c in enumerate(chars):
                base_c, _ = strip_tone_from_char(c)
                if base_c.lower() in VOWEL_VARIANTS:
                    vowel_indices.append(idx)

            if vowel_indices:
                target_idx = cls._find_tone_vowel_position(vowel_indices, chars)
                base_vowel, _ = strip_tone_from_char(chars[target_idx])
                chars[target_idx] = apply_tone_to_char(base_vowel, current_tone)

        result = "".join(chars)
        return unicodedata.normalize('NFC', result)

    @classmethod
    def parse_text(cls, text: str, english_mode: bool = False) -> str:
        """
        Parses continuous text, preserving spaces, punctuation, and casing.
        If english_mode is True, bypasses Telex transformation (Principle).
        """
        if english_mode or not text:
            return text

        words = []
        current_word = []

        for ch in text:
            if ch.isalnum() or ch in ("_", "-"):
                current_word.append(ch)
            else:
                if current_word:
                    words.append(cls.parse_word("".join(current_word)))
                    current_word = []
                words.append(ch)

        if current_word:
            words.append(cls.parse_word("".join(current_word)))

        return unicodedata.normalize('NFC', "".join(words))
