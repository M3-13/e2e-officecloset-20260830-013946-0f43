"""Pytest bootstrap for the backend suite.

Sets the environment BEFORE any app module is imported so that the global
engine and the cached settings are bound to an isolated test database and a
known JWT secret. This runs at conftest import time, which pytest performs
before collecting any test module.
"""

import os
import tempfile
from pathlib import Path

_TEST_DB_PATH = Path(tempfile.gettempdir()) / "officecloset_tests" / "test.db"
_TEST_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

if _TEST_DB_PATH.exists():
    _TEST_DB_PATH.unlink()

os.environ["SECRET_KEY"] = "test-secret-key-for-tests-only"
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH.as_posix()}"
