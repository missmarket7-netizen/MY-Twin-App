from datetime import datetime
from typing import List, Dict


class MemoryRanker:

    @staticmethod
    def calculate_recency_score(created_at: str) -> float:
        """
        درجة الحداثة — كلما كانت الذاكرة أحدث كانت الدرجة أعلى.
        تتراوح بين 0.0 و 1.0.
        """
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
        """
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
        """
        scored = []

        for m in memories:
            importance = float(m.get("importance_score", 0.5))
            recency = MemoryRanker.calculate_recency_score(
                m.get("created_at", "")
            )
            emotion = MemoryRanker.calculate_emotional_score(
                m.get("content", "")
            )

            final_score = (0.4 * importance) + (0.3 * recency) + (0.3 * emotion)
            scored.append((final_score, m.get("content", "")))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [content for _, content in scored[:limit]]
