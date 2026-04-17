"""
Script đánh giá model NeuralProphet offline.

Dùng để kiểm tra chất lượng model sau khi train:
- Tách train/test theo thời gian (80/20) — KHÔNG random
- Tính MAE, MAPE
- Kiểm tra overfit qua tỉ lệ MAEval / MAE_train
- Vẽ Loss Curve và Forecast vs Actual, lưu PNG

Chạy:
    python scripts/evaluate_model.py --tenant-id <id>
    python scripts/evaluate_model.py --tenant-id <id> --series-id s42
"""

import argparse
import asyncio
import sys
from datetime import date
from pathlib import Path

# Thêm root vào sys.path để import app.*
sys.path.insert(0, str(Path(__file__).parent.parent))

# Dùng Agg backend — không cần display, lưu thẳng ra file PNG
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

import numpy as np
import pandas as pd
import torch

from app.core.database import AsyncSessionLocal
from app.services.data_service import get_all_consumption_for_tenant


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _pick_series(df: pd.DataFrame, series_id: str | None) -> tuple[str, pd.DataFrame]:
    """
    Chọn 1 series để đánh giá.

    Nếu series_id được truyền vào → dùng series đó.
    Nếu không → chọn series có nhiều ngày data nhất.

    Args:
        df: DataFrame toàn tenant với cột [ds, y, ID]
        series_id: ID series muốn evaluate (None = tự chọn)

    Returns:
        Tuple (series_id_chọn, df_của_series)
    """
    if series_id:
        if series_id not in df["ID"].unique():
            available = sorted(df["ID"].unique())
            print(f"[LỖI] series_id '{series_id}' không tồn tại.")
            print(f"      Series có sẵn: {available}")
            sys.exit(1)
        selected_id = series_id
    else:
        # Chọn series có nhiều ngày data nhất
        series_days = df.groupby("ID")["ds"].nunique()
        selected_id = series_days.idxmax()

    series_df = df[df["ID"] == selected_id].copy().sort_values("ds").reset_index(drop=True)
    return selected_id, series_df


def _split_train_test(df: pd.DataFrame, ratio: float = 0.8) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Tách train/test theo thời gian — KHÔNG random.

    80% đầu (chronological) = train, 20% cuối = test.

    Args:
        df: DataFrame 1 series đã sort theo ds ASC
        ratio: Tỉ lệ train (mặc định 0.8)

    Returns:
        (df_train, df_test)
    """
    split_idx = int(len(df) * ratio)
    df_train = df.iloc[:split_idx].copy()
    df_test = df.iloc[split_idx:].copy()
    return df_train, df_test


def _build_model() -> object:
    """
    Tạo NeuralProphet với config chuẩn cho evaluate.

    Seed phải đặt trước khi khởi tạo để weight init ổn định.

    Returns:
        NeuralProphet instance chưa train
    """
    try:
        from neuralprophet import NeuralProphet  # type: ignore[import]
    except ImportError:
        print("[LỖI] NeuralProphet chưa cài. Chạy: pip install neuralprophet")
        sys.exit(1)

    # Fix seed trước khi khởi tạo model — đảm bảo weight init ổn định
    torch.manual_seed(42)
    np.random.seed(42)

    model = NeuralProphet(
        n_forecasts=7,
        n_lags=14,
        weekly_seasonality=True,
        daily_seasonality=False,
        yearly_seasonality=False,
        epochs=100,
        batch_size=32,
        learning_rate=0.001,
    )
    model.add_country_holidays("VN")
    return model


def _compute_mape(actual: pd.Series, predicted: pd.Series) -> float:
    """
    Tính MAPE — Mean Absolute Percentage Error.

    Công thức: mean(|actual - predicted| / (actual + 1)) × 100
    Cộng 1 vào mẫu số để tránh chia 0 khi actual = 0.

    Args:
        actual: Series giá trị thực tế
        predicted: Series giá trị dự báo

    Returns:
        MAPE (%) dạng float
    """
    return float(((actual - predicted).abs() / (actual + 1)).mean() * 100)


def _save_chart(
    metrics_df: pd.DataFrame,
    test_actual: pd.Series,
    test_dates: pd.Series,
    test_predicted: pd.Series,
    tenant_id: str,
    series_id: str,
    output_path: Path,
) -> None:
    """
    Tạo và lưu chart đánh giá model (Loss Curve + Forecast vs Actual).

    Layout 1 hàng 2 cột:
    - Trái: Loss Curve (Train MAE vs Validation MAE theo epoch)
    - Phải: Dự báo vs Thực tế trên tập test

    Args:
        metrics_df: DataFrame metrics từ model.fit() với cột MAE, MAEval
        test_actual: Giá trị thực tế trên tập test
        test_dates: Ngày tương ứng
        test_predicted: Giá trị dự báo
        tenant_id: Dùng để đặt title
        series_id: Dùng để đặt title
        output_path: Path file PNG đầu ra
    """
    fig, (ax_loss, ax_pred) = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle(
        f"Đánh giá Model — tenant: {tenant_id} | series: {series_id}",
        fontsize=13,
        fontweight="bold",
    )

    # ── Chart trái: Loss Curve ─────────────────────────────────────────────
    epochs = range(1, len(metrics_df) + 1)
    if "MAE" in metrics_df.columns:
        ax_loss.plot(epochs, metrics_df["MAE"], color="steelblue", label="Train MAE")
    if "MAEval" in metrics_df.columns:
        ax_loss.plot(
            epochs,
            metrics_df["MAEval"],
            color="crimson",
            linestyle="--",
            label="Validation MAE",
        )
    ax_loss.set_title("Loss Curve — Train vs Validation")
    ax_loss.set_xlabel("Epoch")
    ax_loss.set_ylabel("MAE")
    ax_loss.grid(True, alpha=0.3)
    ax_loss.legend()

    # ── Chart phải: Dự báo vs Thực tế ─────────────────────────────────────
    ax_pred.plot(test_dates, test_actual, color="green", label="Thực tế")
    ax_pred.plot(
        test_dates,
        test_predicted,
        color="darkorange",
        linestyle="--",
        label="Dự báo",
    )
    ax_pred.set_title("Dự báo vs Thực tế (tập test)")
    ax_pred.set_xlabel("Ngày")
    ax_pred.set_ylabel("Tiêu thụ")
    ax_pred.xaxis.set_major_formatter(mdates.DateFormatter("%m/%d"))
    plt.setp(ax_pred.get_xticklabels(), rotation=45, ha="right")
    ax_pred.grid(True, alpha=0.3)
    ax_pred.legend()

    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(str(output_path), dpi=150)
    plt.close(fig)


def _print_results(
    tenant_id: str,
    series_id: str,
    df_series: pd.DataFrame,
    n_train: int,
    n_test: int,
    mae: float,
    mae_unit: float,
    mape: float,
    mae_train_final: float,
    mae_val_final: float | None,
    output_path: Path,
) -> None:
    """
    In kết quả đánh giá model ra console theo format chuẩn.

    Args:
        tenant_id: ID tenant
        series_id: ID series đã đánh giá
        df_series: DataFrame đầy đủ của series
        n_train: Số ngày tập train
        n_test: Số ngày tập test
        mae: MAE tính từ tập test
        mae_unit: MAE theo đơn vị nguyên liệu (= mae vì y không scale)
        mape: MAPE (%)
        mae_train_final: MAE train epoch cuối
        mae_val_final: MAE validation epoch cuối (None nếu không có)
        output_path: Path file PNG đã lưu
    """
    n_total = len(df_series)
    start = df_series["ds"].min().date()
    end = df_series["ds"].max().date()

    # Kiểm tra overfit
    if mae_val_final is not None and mae_train_final > 0:
        ratio = mae_val_final / mae_train_final
        if ratio < 1.2:
            overfit_icon = "✅"
            overfit_msg = "Không overfit"
        elif ratio < 1.5:
            overfit_icon = "⚠️"
            overfit_msg = "Hơi overfit"
        else:
            overfit_icon = "❌"
            overfit_msg = "Overfit nặng"
        overfit_line = f"Tỉ lệ          : {ratio:.2f}x\nKết luận       : {overfit_icon} {overfit_msg}"
    else:
        overfit_line = "Tỉ lệ          : N/A (không có validation MAE)\nKết luận       : N/A"

    # Đánh giá MAPE tổng thể
    if mape < 10:
        quality = "🟢 Rất tốt cho production"
    elif mape < 15:
        quality = "🟡 Tốt, chấp nhận được"
    elif mape < 25:
        quality = "🟠 Tạm được, nên thêm data"
    else:
        quality = "🔴 Cần xem lại data hoặc config"

    # Mẫu MAPE ví dụ (nếu dùng 1000 đơn vị/ngày, lệch bao nhiêu)
    mape_example_qty = round(1000 * mape / 100)

    print()
    print("════════════════════════════════")
    print(f"ĐÁNH GIÁ MODEL — {tenant_id}")
    print(f"Series  : {series_id}")
    print(f"Dữ liệu : {n_total} ngày ({start} → {end})")
    print(f"Train   : {n_train} ngày | Test: {n_test} ngày")
    print("════════════════════════════════")
    print(f"MAE  (kỹ thuật) : {mae:.4f}")
    print(f"MAE  (thực tế)  : lệch ~{mae_unit:.1f} đơn vị/ngày")
    print(f"MAPE (thực tế)  : {mape:.1f}% → nếu dùng 1000 đơn vị/ngày thì lệch ~{mape_example_qty} đơn vị")
    print()
    print("KIỂM TRA OVERFIT:")
    print(f"MAE Train      : {mae_train_final:.4f}")
    print(f"MAE Validation : {mae_val_final:.4f}" if mae_val_final is not None else "MAE Validation : N/A")
    print(overfit_line)
    print()
    print("ĐÁNH GIÁ TỔNG THỂ:")
    print(f"→ MAPE < 10%  : 🟢 Rất tốt cho production")
    print(f"→ MAPE < 15%  : 🟡 Tốt, chấp nhận được")
    print(f"→ MAPE < 25%  : 🟠 Tạm được, nên thêm data")
    print(f"→ MAPE >= 25% : 🔴 Cần xem lại data hoặc config")
    print(f"Kết quả        : {quality}")
    print("════════════════════════════════")
    print(f"Chart đã lưu tại: {output_path}")


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

async def evaluate(tenant_id: str, series_id_arg: str | None) -> None:
    """
    Luồng evaluate chính: load data → tách train/test → train → đánh giá → chart.

    Args:
        tenant_id: ID tenant cần đánh giá
        series_id_arg: series_id cụ thể (None = tự chọn series nhiều data nhất)
    """
    print(f"\n[1/6] Lấy data tiêu thụ cho tenant: {tenant_id} ...")
    async with AsyncSessionLocal() as db:
        df_all = await get_all_consumption_for_tenant(db, tenant_id, days_back=365)

    if df_all.empty:
        print("[LỖI] Không có data tiêu thụ nào cho tenant này.")
        sys.exit(1)

    # ── Bước 1: Chọn series ──────────────────────────────────────────────────
    selected_id, df_series = _pick_series(df_all, series_id_arg)
    n_total = len(df_series)
    print(f"       Series: {selected_id} | Tổng: {n_total} ngày")

    if n_total < 40:
        print(f"[CẢNH BÁO] Chỉ có {n_total} ngày data — cần ≥ 40 để tách train/test có ý nghĩa")

    # ── Bước 2: Tách train/test ──────────────────────────────────────────────
    print("[2/6] Tách train/test (80/20 chronological) ...")
    df_train, df_test = _split_train_test(df_series, ratio=0.8)
    n_train, n_test = len(df_train), len(df_test)
    print(f"       Train: {n_train} ngày | Test: {n_test} ngày")

    if n_test == 0:
        print("[LỖI] Tập test rỗng — không đủ data để đánh giá.")
        sys.exit(1)

    # ── Bước 3: Train model với validation ──────────────────────────────────
    print("[3/6] Train NeuralProphet (seed=42) ...")
    model = _build_model()

    # df_train và df_test truyền vào model.fit() — NeuralProphet tự tính MAEval
    try:
        metrics = model.fit(df_train, freq="D", validation_df=df_test)
    except Exception as exc:
        print(f"[LỖI] Train thất bại: {exc}")
        sys.exit(1)

    # Lấy MAE train và MAE validation từ metrics cuối epoch
    mae_train_final: float = float(metrics["MAE"].iloc[-1]) if "MAE" in metrics.columns else 0.0
    mae_val_final: float | None = None
    if "MAEval" in metrics.columns and not metrics["MAEval"].isna().all():
        mae_val_final = float(metrics["MAEval"].dropna().iloc[-1])

    # ── Bước 4: Predict trên tập test ───────────────────────────────────────
    print("[4/6] Predict trên tập test ...")
    try:
        pred_df = model.predict(df_test)
    except Exception as exc:
        print(f"[LỖI] Predict thất bại: {exc}")
        sys.exit(1)

    # Lấy cột yhat1 và y — bỏ các hàng NaN
    if "yhat1" not in pred_df.columns:
        print("[LỖI] Kết quả predict không có cột 'yhat1'.")
        sys.exit(1)

    valid_pred = pred_df.dropna(subset=["yhat1", "y"]).copy()
    if valid_pred.empty:
        print("[LỖI] Không có dự báo hợp lệ trên tập test (tất cả NaN).")
        sys.exit(1)

    test_dates = valid_pred["ds"]
    test_actual = valid_pred["y"]
    test_predicted = valid_pred["yhat1"]

    # ── Bước 5: Tính metrics ─────────────────────────────────────────────────
    print("[5/6] Tính metrics ...")
    mae = float((test_actual - test_predicted).abs().mean())
    mape = _compute_mape(test_actual, test_predicted)

    # ── Bước 6: Vẽ và lưu chart ─────────────────────────────────────────────
    print("[6/6] Vẽ chart và lưu PNG ...")
    today_str = date.today().isoformat()
    output_path = (
        Path(__file__).parent.parent
        / "docs"
        / "dev-notes"
        / f"model_evaluation_{tenant_id}_{today_str}.png"
    )
    _save_chart(
        metrics_df=metrics,
        test_actual=test_actual,
        test_dates=test_dates,
        test_predicted=test_predicted,
        tenant_id=tenant_id,
        series_id=selected_id,
        output_path=output_path,
    )

    # ── In kết quả console ───────────────────────────────────────────────────
    _print_results(
        tenant_id=tenant_id,
        series_id=selected_id,
        df_series=df_series,
        n_train=n_train,
        n_test=n_test,
        mae=mae,
        mae_unit=mae,  # y không scale → đơn vị nguyên liệu = giá trị MAE
        mape=mape,
        mae_train_final=mae_train_final,
        mae_val_final=mae_val_final,
        output_path=output_path,
    )


def main() -> None:
    """Entry point — parse args và chạy evaluate."""
    parser = argparse.ArgumentParser(
        description="Đánh giá model NeuralProphet cho 1 tenant",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ví dụ:
  python scripts/evaluate_model.py --tenant-id abc123
  python scripts/evaluate_model.py --tenant-id abc123 --series-id s42
        """,
    )
    parser.add_argument(
        "--tenant-id",
        required=True,
        help="ID tenant cần đánh giá",
    )
    parser.add_argument(
        "--series-id",
        default=None,
        help="ID series cụ thể (mặc định: series có nhiều data nhất)",
    )

    args = parser.parse_args()
    asyncio.run(evaluate(tenant_id=args.tenant_id, series_id_arg=args.series_id))


if __name__ == "__main__":
    main()
