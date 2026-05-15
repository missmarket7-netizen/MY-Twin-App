import sys
from datetime import datetime, timedelta
sys.path.insert(0, '.')
from backend.token_limits import check_tok, check_images, check_notifications

def test_check_tok_free_tier():
    ok, _ = check_tok("test_user", "free", 100, datetime.utcnow().isoformat())
    assert ok

def test_check_tok_free_trial():
    ok, _ = check_tok(
        "test_user2",
        "free",
        100,
        (datetime.utcnow() - timedelta(days=1)).isoformat(),
    )
    assert ok

def test_check_images_limit():
    allowed, remaining = check_images("img_user", "free_trial_14d")
    assert allowed
    assert remaining == 2

    allowed_free, _ = check_images("img_user_free", "free")
    assert not allowed_free

def test_check_notifications_limit():
    allowed, _ = check_notifications("notif_user", "premium")
    assert allowed
    allowed_free, _ = check_notifications("notif_user_free", "free")
    assert not allowed_free
