import os
import sys
from pathlib import Path

# Add apps/backend to sys.path so app module is discoverable by pytest
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
