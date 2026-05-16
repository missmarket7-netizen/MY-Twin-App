"""
MyTwin – Memory Ranker
ترتيب الذكريات حسب الأهمية والحداثة والقيمة العاطفية.
يُستخدم داخل TwinBrain لاختيار أكثر الذكريات صلة بالسياق.
"""
from datetime import datetime
from typing import List, Dict, Optional


class MemoryRanker:
    """
    محرك ترتيب ذكريات المستخدم.
    يجمع بين ثلاث إشارات: الأهمية، الحداثة، والعاطفة.
    """

    @staticmethod
    def calculate_recency_score(created_at: str) -> float:
        """
        درجة الحداثة — كلما كانت الذاكرة أحدث كانت الدرجة أعلى.
        تتراوح بين 0.0 و 1.0. الذكريات الأقدم من 90 يوماً تحصل على 0.0.
        """
        if not created_at:
            return 0.5
        try:
            dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            days_old = (datetime.utcnow() - dt.replace(tzinfo=None)).days
            return max(0.0, 1.0 - (days_old / 90))
        except Exception:
            return 0.5

    @staticmethod
    def calculate_emotional_score(content: str) -> float:
        """
        درجة الأهمية العاطفية بناءً على الكلمات المفتاحية.
        كلمات قوية (حب، حلم، خوف) = 0.9
        كلمات متوسطة (سعيد، حزين، مهم) = 0.6
        غير ذلك = 0.3
        """
        if not content:
            return 0.3

        high_words = [
            "أحب", "أكره", "حلم", "خوف", "هدف",
            "love", "hate", "dream", "fear", "goal",
        ]
        medium_words = [
            "سعيد", "حزين", "مهم", "قلق",
            "happy", "sad", "important", "worried",
        ]

        c = content.lower()
        if any(w in c for w in high_words):
            return 0.9
        if any(w in c for w in medium_words):
            return 0.6
        return 0.3

    @staticmethod
    def rank(memories: List[Dict], limit: int = 10) -> List[str]:
        """
        ترتيب الذكريات بناءً على:
        - 40% أهمية (importance_score)
        - 30% حداثة (recency)
        - 30% قيمة عاطفية (emotional score)

        تُرجع قائمة بمحتوى الذكريات المُرتبة (الأعلى أولاً).
        """
        if not memories:
            return []

        scored: List[tuple] = []

        for m in memories:
            if not m or not isinstance(m, dict):
                continue

            importance = float(m.get("importance_score", 0.5))
            recency = MemoryRanker.calculate_recency_score(
                m.get("created_at", "")
            )
            emotion = MemoryRanker.calculate_emotional_score(
                m.get("content", "")
            )

            final_score = (0.4 * importance) + (0.3 * recency) + (0.3 * emotion)
            content = m.get("content", "")
            if content:  # نتجاهل الذكريات الفارغة
                scored.append((final_score, content))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [content for _, content in scored[:limit]]
