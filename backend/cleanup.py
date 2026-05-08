import os, logging
from datetime import datetime, timedelta
from supabase import create_client
SUPABASE = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
def run(dry: bool = False) -> dict:
    res = {"emergency": False, "err": []}
        try:
                cnt = SUPABASE.table("memories").select("id", count="exact").execute().count or 0
                        if cnt > 40000:
                                    res["emergency"] = True
                                                if not dry: SUPABASE.table("memories").delete().lt("created_at", (datetime.utcnow()-timedelta(days=14)).isoformat()).execute()
                                                        return res
                                                            except Exception as e: res["err"].append(str(e)); return res