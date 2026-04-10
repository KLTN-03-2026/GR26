// Người sửa: Đào Thu Thiên - Ngày: 09/04/2026
const DEFAULT_BRANCH_ID = 'f312d771-47ba-470c-aae4-9ed66ee51e24';

export const autoFixBranchId = () => {
  // Người sửa: Đào Thu Thiên - Ngày: 09/04/2026
  try {
    const storageKey = 'auth-storage';
    const storedStr = localStorage.getItem(storageKey);
    
    if (storedStr) {
      const storedObj = JSON.parse(storedStr);
      let isUpdated = false;

      // Người sửa: Đào Thu Thiên - Ngày: 09/04/2026
      if (storedObj?.state?.user && !storedObj.state.user.branchId) {
        storedObj.state.user.branchId = DEFAULT_BRANCH_ID;
        isUpdated = true;
      }

      // Người sửa: Đào Thu Thiên - Ngày: 09/04/2026
      if (storedObj?.state?.session && !storedObj.state.session.branchId) {
        storedObj.state.session.branchId = DEFAULT_BRANCH_ID;
        isUpdated = true;
      }

      // Người sửa: Đào Thu Thiên - Ngày: 09/04/2026
      if (isUpdated) {
        localStorage.setItem(storageKey, JSON.stringify(storedObj));
        console.log("Đã tự động set branchId thành công:", DEFAULT_BRANCH_ID);
      }
    }
  } catch (error) {
    // Người sửa: Đào Thu Thiên - Ngày: 09/04/2026
    console.error("Lỗi khi tự động set branchId:", error);
  }
};
