# core/utils.py
import random
import string

def generate_custom_id(prefix):
    """Generates a custom ID like PAT-A1B2C3D4"""
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choice(chars) for _ in range(8))
    return f"{prefix}-{random_part}"