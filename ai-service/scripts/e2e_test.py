"""
Script kiểm tra end-to-end luồng chính của AI Service.

Chạy thủ công để verify toàn bộ pipeline hoạt động với DB thật:
    python scripts/e2e_test.py

Yêu cầu: DB PostgreSQL đang chạy và đã có data trong inventory_transactions.
"""

import asyncio
import sys
from pathlib import Path

# Thêm root vào path để import app.*
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text

from app.core.database import AsyncSessionLocal
from app.services import data_service, predict_service, train_service
from app.utils import model_io


async def main() -> None:
    print("=== SmartF&B AI E2E Test ===\n")

    async with AsyncSessionLocal() as db:

        # 1. Kiểm tra data_service
        print("--- [1] data_service ---")
        tenants = await data_service.get_all_active_tenants(db)
        print(f"✓ Active tenants: {len(tenants)}")
        if not tenants:
            print("⚠ Không có tenant nào — một số test sẽ bị skip")

        # 2. Kiểm tra train (nếu có tenant)
        print("\n--- [2] train_service ---")
        if tenants:
            tenant_id = tenants[0]
            print(f"  → Train cho tenant: {tenant_id}")
            result = await train_service.run_train_for_tenant(
                db, tenant_id, trigger_type="manual"
            )
            status = result.get("status")
            mae = result.get("mae")
            icon = "✓" if status == "success" else ("⚠" if status == "skipped" else "✗")
            print(f"{icon} Train: {status} | MAE={mae} | series={result.get('series_count')}")
            if result.get("error_message"):
                print(f"  Error: {result['error_message']}")
        else:
            print("  (skip — không có tenant)")

        # 3. Kiểm tra predict
        print("\n--- [3] predict_service ---")
        try:
            await predict_service.predict_all_branches(db)
            print("✓ predict_all_branches hoàn thành")
        except Exception as exc:
            print(f"✗ predict_all_branches lỗi: {exc}")

        # 4. Đếm forecast rows
        print("\n--- [4] forecast_results ---")
        try:
            row = await db.execute(text("SELECT COUNT(*) FROM forecast_results"))
            count = row.scalar()
            print(f"✓ Forecast rows trong DB: {count}")
        except Exception as exc:
            print(f"✗ Không đọc được forecast_results: {exc}")

        # 5. Kiểm tra model files
        print("\n--- [5] model_io ---")
        models = model_io.list_all_models()
        print(f"✓ Models đã train: {len(models)} branch(es)")

        for m in models:
            meta = model_io.get_train_metadata(m["tenant_id"], m["branch_id"])
            if meta:
                print(
                    f"  tenant={m['tenant_id']} branch={m['branch_id']}: "
                    f"trained_at={meta.get('trained_at')} | "
                    f"series={meta.get('series_count')} | "
                    f"mae={meta.get('mae')} | mape={meta.get('mape')}"
                )

    print("\n=== E2E Test XONG ===")


if __name__ == "__main__":
    asyncio.run(main())
