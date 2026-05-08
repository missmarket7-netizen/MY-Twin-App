import sys
sys.path.insert(0, '.')
from backend.usage_limits import check_tok, BASE_TOK

def test_check_tok_free_tier():
    ok, _ = check_tok("test_user", "free", 100)
    assert ok

def test_check_tok_exceed():
    ok, rem = check_tok("test_user2", "free", 4000)
    assert not ok
