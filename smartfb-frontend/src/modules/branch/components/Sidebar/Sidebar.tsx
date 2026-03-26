import { type FC, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Package, LogOut } from 'lucide-react';
import { usePermission } from '@shared/hooks/usePermission';
import { menuConfig, type MenuItem } from '@/data';
import { CollapsibleMenuItem } from './CollapsibleMenuItem';
import { SubMenuItem } from './SubMenuItem';

/**
 * Sidebar component - menu điều hướng bên trái
 */
export const Sidebar: FC = () => {
  const location = useLocation();
  const { userRole } = usePermission();

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (title: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(userRole);
    });
  };

  return (
    <aside className="fixed left-0 top-0 w-60 bg-white border-r border-slate-200 h-screen flex flex-col shrink-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">F</span>
        </div>
        <span className="text-xl font-bold text-orange-500">SmartF&B</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-hide">
        {menuConfig.map((section) => {
          const filteredItems = filterMenuItems(section.items);
          if (filteredItems.length === 0) return null;

          return (
            <div key={section.title}>
              <div className="space-y-1">
                {filteredItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const isExpanded = expandedItems.has(item.title);
                  const hasChildren = item.children && item.children.length > 0;

                  return (
                    <div key={item.title}>
                      <CollapsibleMenuItem
                        item={item}
                        isActive={!!isActive}
                        isExpanded={isExpanded}
                        onToggle={() => toggleItem(item.title)}
                      />
                      {hasChildren && isExpanded && (
                        <div className="mt-1 space-y-1">
                          {item.children!.map((child) => (
                            <SubMenuItem
                              key={child.title}
                              item={child}
                              isActive={location.pathname === child.path}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-200 p-4 space-y-3">
        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-colors duration-150">
          <Package className="w-4 h-4" />
          <span>Nâng cấp Pro</span>
        </button>

        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
            OL
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              Orlando Laurentius
            </p>
            <p className="text-xs text-slate-500 capitalize">{userRole}</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
