const ALLOWED_MENU_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const MAX_RAW_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_MENU_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const TARGET_MENU_IMAGE_SIZE_BYTES = 600 * 1024;
const SMALL_MENU_IMAGE_SIZE_BYTES = 350 * 1024;
const MAX_MENU_IMAGE_DIMENSION = 1600;
const MENU_IMAGE_OUTPUT_QUALITIES = [0.86, 0.82, 0.78] as const;

type LoadedImage = {
  cleanup: () => void;
  element: CanvasImageSource;
  height: number;
  width: number;
};

export class MenuImageOptimizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MenuImageOptimizationError';
  }
}

const replaceFileExtension = (filename: string, extension: string): string => {
  const sanitizedName = filename.trim() || 'menu-image';
  const dotIndex = sanitizedName.lastIndexOf('.');

  if (dotIndex <= 0) {
    return `${sanitizedName}.${extension}`;
  }

  return `${sanitizedName.slice(0, dotIndex)}.${extension}`;
};

const loadImage = async (file: File): Promise<LoadedImage> => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.decoding = 'async';
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new MenuImageOptimizationError('Không thể đọc file ảnh đã chọn'));
      nextImage.src = objectUrl;
    });

    return {
      cleanup: () => {
        image.src = '';
        URL.revokeObjectURL(objectUrl);
      },
      element: image,
      height: image.naturalHeight,
      width: image.naturalWidth,
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
};

const createCanvas = (width: number, height: number): OffscreenCanvas | HTMLCanvasElement => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const canvasToBlob = async (
  canvas: OffscreenCanvas | HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> => {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type, quality });
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });

  if (!blob) {
    throw new MenuImageOptimizationError('Không thể tối ưu ảnh trước khi upload');
  }

  return blob;
};

const validateRawImageFile = (file: File): void => {
  if (!ALLOWED_MENU_IMAGE_TYPES.has(file.type)) {
    throw new MenuImageOptimizationError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP');
  }

  if (file.size > MAX_RAW_IMAGE_SIZE_BYTES) {
    throw new MenuImageOptimizationError('Ảnh gốc không được vượt quá 15MB');
  }
};

export const optimizeMenuImageForUpload = async (file: File): Promise<File> => {
  validateRawImageFile(file);

  const { cleanup, element, height, width } = await loadImage(file);

  try {
    const largestDimension = Math.max(width, height);
    const resizeRatio = largestDimension > MAX_MENU_IMAGE_DIMENSION
      ? MAX_MENU_IMAGE_DIMENSION / largestDimension
      : 1;
    const targetWidth = Math.max(1, Math.round(width * resizeRatio));
    const targetHeight = Math.max(1, Math.round(height * resizeRatio));
    const shouldOptimize = file.type !== 'image/webp'
      || file.size > SMALL_MENU_IMAGE_SIZE_BYTES
      || resizeRatio < 1;

    if (!shouldOptimize) {
      if (file.size > MAX_MENU_UPLOAD_SIZE_BYTES) {
        throw new MenuImageOptimizationError('Ảnh đã chọn vượt quá 5MB và chưa thể tối ưu thêm');
      }

      return file;
    }

    const canvas = createCanvas(targetWidth, targetHeight);
    const context = canvas.getContext('2d');

    if (!context) {
      if (file.size > MAX_MENU_UPLOAD_SIZE_BYTES) {
        throw new MenuImageOptimizationError('Trình duyệt không hỗ trợ xử lý ảnh để upload');
      }

      return file;
    }

    context.drawImage(element, 0, 0, targetWidth, targetHeight);

    let bestCandidate: File | null = null;

    for (const quality of MENU_IMAGE_OUTPUT_QUALITIES) {
      const optimizedBlob = await canvasToBlob(canvas, 'image/webp', quality);
      const optimizedFile = new File(
        [optimizedBlob],
        replaceFileExtension(file.name, 'webp'),
        {
          type: 'image/webp',
          lastModified: Date.now(),
        }
      );

      if (!bestCandidate || optimizedFile.size < bestCandidate.size) {
        bestCandidate = optimizedFile;
      }

      if (optimizedFile.size <= TARGET_MENU_IMAGE_SIZE_BYTES) {
        break;
      }
    }

    if (!bestCandidate) {
      if (file.size > MAX_MENU_UPLOAD_SIZE_BYTES) {
        throw new MenuImageOptimizationError('Không thể tạo ảnh tối ưu để upload');
      }

      return file;
    }

    if (file.size > MAX_MENU_UPLOAD_SIZE_BYTES && bestCandidate.size > MAX_MENU_UPLOAD_SIZE_BYTES) {
      throw new MenuImageOptimizationError('Ảnh sau tối ưu vẫn vượt quá 5MB, vui lòng chọn ảnh nhỏ hơn');
    }

    if (file.size > MAX_MENU_UPLOAD_SIZE_BYTES) {
      return bestCandidate;
    }

    const savedEnoughBytes = bestCandidate.size <= Math.round(file.size * 0.92);
    const resizedImage = resizeRatio < 1;

    if (savedEnoughBytes || resizedImage) {
      return bestCandidate;
    }

    return file;
  } finally {
    cleanup();
  }
};

export const menuImageUploadConstraints = {
  accept: Array.from(ALLOWED_MENU_IMAGE_TYPES).join(','),
  maxRawSizeBytes: MAX_RAW_IMAGE_SIZE_BYTES,
  maxUploadSizeBytes: MAX_MENU_UPLOAD_SIZE_BYTES,
} as const;
