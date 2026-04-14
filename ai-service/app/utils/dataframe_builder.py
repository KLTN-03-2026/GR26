"""
DataFrame Builder — chuẩn bị DataFrame đúng format NeuralProphet từ raw data.

NeuralProphet yêu cầu:
- Cột 'ds': datetime64[ns] — không phải string
- Cột 'y': float — không có NaN, không có giá trị âm
- Cột 'ID' (Global Model): string duy nhất cho mỗi series
"""

import pandas as pd

from app.core.logging import get_logger

logger = get_logger(__name__)


def build_series_id(tenant_id: str, ingredient_id: str, branch_id: str) -> str:
    """
    Tạo ID duy nhất cho mỗi series trong Global Model.
    ID phải unique và không chứa ký tự đặc biệt.

    Format: {tenant_id}__{ingredient_id}__{branch_id}
    """
    return f"{tenant_id}__{ingredient_id}__{branch_id}"


def build_neuralprophet_df(
    raw_data: list[dict],
    tenant_id: str,
    ingredient_id: str,
    branch_id: str,
) -> pd.DataFrame:
    """
    Chuyển đổi raw data thành DataFrame chuẩn NeuralProphet.

    Args:
        raw_data: List[dict] với keys 'date' (str/date) và 'quantity' (float)
        tenant_id: Dùng để build series ID
        ingredient_id: Dùng để build series ID
        branch_id: Dùng để build series ID

    Returns:
        DataFrame với cột ['ds', 'y', 'ID'] đã validate
    """
    # TODO: implement trong sprint data
    raise NotImplementedError


def validate_df(df: pd.DataFrame) -> tuple[bool, str]:
    """
    Validate DataFrame trước khi đưa vào NeuralProphet.

    Kiểm tra:
    - Cột 'ds' là datetime64
    - Không có NaN trong cột 'y'
    - Không có giá trị âm trong cột 'y'
    - Đủ số ngày tối thiểu (30 ngày)

    Returns:
        (True, "") nếu hợp lệ
        (False, lý_do) nếu không hợp lệ
    """
    # TODO: implement trong sprint data
    raise NotImplementedError
