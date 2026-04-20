import type { StaffPermissionDefinition } from '@modules/staff/types/role.types';

export const ALL_PERMISSION_MODULES = 'ALL';

export interface FilteredPermissionModule {
  moduleName: string;
  permissions: StaffPermissionDefinition[];
  selectedPermissions: StaffPermissionDefinition[];
  selectedCount: number;
}

export const normalizePermissionIds = (permissionIds: string[]): string[] => {
  return [...permissionIds].sort((left, right) => left.localeCompare(right));
};

export const isPermissionSetEqual = (left: string[], right: string[]): boolean => {
  const normalizedLeft = normalizePermissionIds(left);
  const normalizedRight = normalizePermissionIds(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every(
    (permissionId, index) => permissionId === normalizedRight[index]
  );
};

/**
 * Hợp nhất hoặc loại bỏ permission khỏi bản nháp trước khi lưu xuống backend.
 * Dùng chung cho thao tác bật/tắt từng quyền và thao tác chọn nhanh theo module.
 */
export const buildNextPermissionIds = ({
  sourcePermissionIds,
  permissionIds,
  checked,
}: {
  sourcePermissionIds: string[];
  permissionIds: string[];
  checked: boolean;
}): string[] => {
  if (checked) {
    return Array.from(new Set([...sourcePermissionIds, ...permissionIds]));
  }

  return sourcePermissionIds.filter(
    (permissionId) => !permissionIds.includes(permissionId)
  );
};

export const groupPermissionsByModule = (
  allPermissions: StaffPermissionDefinition[]
) => {
  return allPermissions.reduce<Record<string, StaffPermissionDefinition[]>>(
    (result, permission) => {
      const moduleKey = permission.module || 'OTHER';

      if (!result[moduleKey]) {
        result[moduleKey] = [];
      }

      result[moduleKey].push(permission);
      return result;
    },
    {}
  );
};

export const buildModuleNames = (
  groupedPermissions: Record<string, StaffPermissionDefinition[]>
) => {
  return [
    ALL_PERMISSION_MODULES,
    ...Object.keys(groupedPermissions).sort((left, right) => left.localeCompare(right)),
  ];
};

export const buildFilteredPermissionGroups = ({
  groupedPermissions,
  activeModule,
  permissionKeyword,
}: {
  groupedPermissions: Record<string, StaffPermissionDefinition[]>;
  activeModule: string;
  permissionKeyword: string;
}) => {
  const normalizedKeyword = permissionKeyword.trim().toLowerCase();
  const entries = Object.entries(groupedPermissions).filter(([moduleName]) => {
    return activeModule === ALL_PERMISSION_MODULES || moduleName === activeModule;
  });

  return entries
    .map(([moduleName, permissions]) => {
      const filteredPermissions = permissions.filter((permission) => {
        if (!normalizedKeyword) {
          return true;
        }

        const searchableText = `${permission.id} ${permission.description}`.toLowerCase();
        return searchableText.includes(normalizedKeyword);
      });

      return [moduleName, filteredPermissions] as const;
    })
    .filter(([, permissions]) => permissions.length > 0);
};

export const buildFilteredPermissionModules = ({
  filteredPermissionGroups,
  effectivePermissionIds,
}: {
  filteredPermissionGroups: ReadonlyArray<
    readonly [string, StaffPermissionDefinition[]]
  >;
  effectivePermissionIds: string[];
}): FilteredPermissionModule[] => {
  return filteredPermissionGroups.map(([moduleName, permissions]) => {
    const selectedPermissions = permissions.filter((permission) =>
      effectivePermissionIds.includes(permission.id)
    );

    return {
      moduleName,
      permissions,
      selectedPermissions,
      selectedCount: selectedPermissions.length,
    };
  });
};
