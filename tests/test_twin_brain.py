import sys
sys.path.insert(0, '.')
from backend.twin_brain import TwinBrain

def test_emotion_analysis():
    brain = TwinBrain()
    res = brain.analyze_emotion("أنا حزين جداً اليوم")
    assert res["primary"] == "sad"
    assert res["needs_support"] == True
    print("✅ test_emotion_analysis passed")

def test_daily_companion_template():
    brain = TwinBrain()
    # استخدم رسالة عاطفية قوية لتشغيل build_prompt
    prompt = brain.build_prompt("أحمد", "male", 85.0, "NURTURER", [], "أنا حزين جداً جداً جداً!", "أستيقظ مبكراً", "سابق: مرحبا")
    assert "daily_companion" in prompt or "أنت أحمد، رفيق يومي" in prompt  # تحقق من النص
    assert "أستيقظ مبكراً" in prompt
    assert "سابق: مرحبا" in prompt
    print("✅ test_daily_companion_template passed")

def test_random_touch():
    brain = TwinBrain()
    prompt1 = brain.build_prompt("أحمد", "male", 85.0, "NURTURER", [], "كيف حالك؟")
    prompt2 = brain.build_prompt("أحمد", "male", 85.0, "NURTURER", [], "كيف حالك؟")
    print("✅ test_random_touch completed")

if __name__ == "__main__":
    test_emotion_analysis()
    test_daily_companion_template()
    test_random_touch()
    print("جميع الاختبارات نجحت!")
