# Vietnamese Orthography & Telex Tone Placement Convention

## Convention Selected: Traditional Standard (`hòa`, not `hoà`)

NEURO-SPEECH adheres to the standard Vietnamese orthographic convention specifying tone mark placement on diphthongs and triphthongs as follows:

### 1. Open Syllables (No Final Consonant)
- For the vowel clusters `oa` and `oe`, the tone mark is placed on the first vowel `o`:
  - `hòa` (not `hoà`)
  - `hóa` (not `hoá`)
  - `hòe` (not `hoè`)
- For `uy`, the tone mark is placed on `y` (`thủy`, `thúy`).
- For `ua`, `ia`, `ưa`, the tone mark is placed on the first vowel (`múa`, `mía`, `mứa`).

### 2. Closed Syllables (With Final Consonant)
- When a final consonant follows the vowel cluster, the tone mark is placed on the second/principal accented vowel:
  - `uoongs` → `uống` (tone on `ô`)
  - `muoons` → `muốn` (tone on `ô`)
  - `nuwowcs` → `nước` (tone on `ơ`)
  - `Vieetj` → `Việt` (tone on `ê`)
  - `toanf` → `toàn` (tone on `a`)

### 3. Undo Modifiers
- Re-typing the modifier key immediately undoes the transformation:
  - `dd` → `đ`, `ddd` → `dd`
  - `aa` → `â`, `aaa` → `aa`
  - `ee` → `ê`, `eee` → `ee`
  - `oo` → `ô`, `ooo` → `oo`
  - `aw` → `ă`, `aww` → `aw`
  - `ow` → `ơ`, `oww` → `ow`
  - `uw` → `ư`, `uww` → `uw`
  - `as` → `á`, `ass` → `as`

### 4. Unicode Normalization
All outputs are strictly normalized to Unicode NFC (`unicodedata.normalize('NFC', text)`).
