interface BuildEmployeeCodeParams {
  branchCode?: string | null;
  positionName?: string | null;
  sequence: number;
  generatedAt: Date;
}

interface BuildRandomPasswordParams {
  fullName?: string;
  dateOfBirth?: string;
}

const normalizeToken = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim();
};

const compactToken = (value?: string | null, maxLength = 6, fallback = 'GEN'): string => {
  const normalized = normalizeToken(value).replace(/\s+/g, '').toUpperCase();

  if (!normalized) {
    return fallback;
  }

  return normalized.slice(0, maxLength);
};

const buildPositionToken = (positionName?: string | null): string => {
  const normalized = normalizeToken(positionName);

  if (!normalized) {
    return 'GEN';
  }

  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return 'GEN';
  }

  if (words.length === 1) {
    return compactToken(words[0], 4, 'GEN');
  }

  return words
    .slice(0, 4)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
};

const formatTimestampToken = (generatedAt: Date): string => {
  const year = generatedAt.getFullYear().toString().slice(-2);
  const month = `${generatedAt.getMonth() + 1}`.padStart(2, '0');
  const day = `${generatedAt.getDate()}`.padStart(2, '0');
  const hour = `${generatedAt.getHours()}`.padStart(2, '0');
  const minute = `${generatedAt.getMinutes()}`.padStart(2, '0');

  return `${year}${month}${day}${hour}${minute}`;
};

const formatBirthToken = (dateOfBirth?: string): string => {
  if (!dateOfBirth) {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }

  const digits = dateOfBirth.replace(/\D/g, '');

  if (digits.length !== 8) {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }

  const year = digits.slice(2, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);

  return `${day}${month}${year}`;
};

const buildNameToken = (fullName?: string): string => {
  const normalized = normalizeToken(fullName).replace(/\s+/g, '');

  if (!normalized) {
    return 'Staff';
  }

  const token = normalized.slice(0, 5).toLowerCase();
  return token.charAt(0).toUpperCase() + token.slice(1);
};

const buildRandomSuffix = (length: number): string => {
  const source = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => source[Math.floor(Math.random() * source.length)]).join('');
};

/**
 * Sinh mã nhân viên theo ngữ cảnh hiện có ở FE.
 * Mã gồm tiền tố nghiệp vụ, chi nhánh, chức vụ, mốc thời gian tạo và STT hiện tại.
 */
export const buildEmployeeCode = ({
  branchCode,
  positionName,
  sequence,
  generatedAt,
}: BuildEmployeeCodeParams): string => {
  const branchToken = compactToken(branchCode, 6, 'CHAIN');
  const positionToken = buildPositionToken(positionName);
  const timestampToken = formatTimestampToken(generatedAt);
  const sequenceToken = `${sequence}`.padStart(4, '0').slice(-4);

  return ['NV', branchToken, positionToken, timestampToken, sequenceToken].join('-');
};

/**
 * Sinh mật khẩu gợi ý từ tên, ngày sinh và một cụm ký tự ngẫu nhiên.
 * Giúp owner có thể tạo nhanh nhưng vẫn có đầu mối để nhớ khi bàn giao cho nhân viên.
 */
export const buildRandomPassword = ({
  fullName,
  dateOfBirth,
}: BuildRandomPasswordParams): string => {
  const nameToken = buildNameToken(fullName);
  const birthToken = formatBirthToken(dateOfBirth);
  const randomSuffix = buildRandomSuffix(2);

  return `${nameToken}${birthToken}${randomSuffix}!`;
};

/**
 * Sinh nhanh POS PIN 4 số khi cần tạo mã tạm cho nhân viên.
 */
export const buildRandomPosPin = (): string => {
  return `${Math.floor(1000 + Math.random() * 9000)}`;
};
