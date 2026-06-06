---
name: expo-notifications version lock
description: Must stay at 0.29.14 on Expo SDK 54; newer versions crash Metro.
---
expo-notifications MUST stay at 0.29.14. v0.32.x creates a _tmp_NNNN/src directory during postinstall that Metro watches then loses → ENOENT crash.

**Why:** Expo SDK 54 has an incompatibility with the newer expo-notifications postinstall script.
**How to apply:** Ignore the "expected ~0.32.17" warning in Metro output. Do not upgrade this package.
