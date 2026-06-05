---
name: expo-notifications version constraint
description: Which expo-notifications version works on Expo SDK 54 in this Replit environment
---

# expo-notifications version for Expo SDK 54

**Rule:** Use `expo-notifications@0.29.14` — NOT `~0.32.x`.

**Why:** v0.32.x has a broken postinstall script that creates a `_tmp_NNNN/src` directory that Metro's FallbackWatcher tries to watch but is deleted before it can, causing an ENOENT crash that kills the entire Metro bundler. v0.29.14 loads and resolves correctly on SDK 54 despite Expo's compatibility warning.

**How to apply:** Any time expo-notifications is installed or upgraded in this project, pin it to `0.29.14`. Ignore the "expected version: ~0.32.17" warning in the Metro output — the app still bundles and runs correctly.
