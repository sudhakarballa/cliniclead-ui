import { useEffect, useState, useRef } from "react";
import React from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { HiTemplate } from "react-icons/hi";
import { FaClinicMedical, FaNotesMedical, FaProjectDiagram, FaBuilding } from "react-icons/fa";
import { IoSettings } from "react-icons/io5";
import { MdCampaign } from "react-icons/md";
import {
  RiAdminFill,
  RiContactsBookFill,
  RiDashboard2Fill,
} from "react-icons/ri";
import { RxActivityLog } from "react-icons/rx";
import { Menu, MenuItem, Sidebar, SubMenu } from "react-pro-sidebar";
import { Link } from "react-router-dom";
import { Header } from "rsuite";
import "rsuite/dist/rsuite.min.css";
import logo from "../../src/resources/images/Clinic-Lead-White.png";
import logoicon from "../../src/resources/images/Clinic-Lead-White-Icon.png";
import Util from "../others/util";
import RoleValidator from "../others/RoleValidator";
import { BiGitBranch } from "react-icons/bi";
import { HiOutlineFunnel } from "react-icons/hi2";
import { GiStairsGoal } from "react-icons/gi";
import { useAuthContext } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { TOOLTIPS } from "../constants/tooltips";

// Icon wrapper functions to ensure proper typing
const IconWrapper = ({ Icon, ...props }: { Icon: any; [key: string]: any }): React.ReactElement => {
  return <Icon {...props} />;
};

interface MenuItemConfig {
  key: string;
  title: string;
  path: string;
  icon: React.ReactElement;
  iconComponent: any;
  permission: string;
  displayName?: string;
  tooltip?: string;
}

interface SubMenuConfig {
  key: string;
  title: string;
  icon: React.ReactElement;
  permission: string;
  tooltip?: string;
  items: MenuItemConfig[];
}

type SideBarProps = {
  collapsed: boolean;
};

export const SideBar = ({ collapsed }: SideBarProps) => {
  const { userRole } = useAuthContext();
  const { currentTheme } = useTheme();
  const location = useLocation();
  const [selectedNavItem, setSelectedNavItem] = useState("");
  const [expandedSubMenu, setExpandedSubMenu] = useState<string | null>(null);
  const [collapsedSubmenu, setCollapsedSubmenu] = useState<{key: string, items: MenuItemConfig[], top: number} | null>(null);
  const submenuRefs = useRef<{[key: string]: HTMLElement | null}>({});
  const activeNavColor = currentTheme.primaryColor;

  const campaignSubMenu = ["Template"];
  const adminSubMenu = ["Clinic", "Treatment", "Source", "PipeLineType"];

  const pathToNavMap: Record<string, string> = {
    '/stages': 'Stages',
    '/pipelinetype': 'PipeLineType',
    '/pipeline': 'pipeline',
    '/deal': 'pipeline',
    '/dealdetails': 'pipeline',
    '/activities': 'Activities',
    '/person': 'Person',
    '/template': 'Template',
    '/users': 'Settings',
    '/clinic': 'Clinic',
    '/source': 'Source',
    '/treatment': 'Treatment',
    '/tenant': 'Tenant',
    '/reporting': 'Reporting'
  };

  useEffect(() => {
    const fullPath = location.pathname.toLowerCase();
    console.log('Current path:', fullPath);
    
    // Remove /PLMSUI prefix if present
    const path = fullPath.replace(/^\/plmsui/, '') || '/';
    console.log('Cleaned path:', path);
    
    // Clear selection for root path
    if (path === '/' || path === '') {
      setSelectedNavItem('');
      setExpandedSubMenu(null);
      return;
    }
    
    // Check for deal-related paths first
    if (path.includes('deal') || path.startsWith('/deal')) {
      console.log('Setting pipeline as selected');
      setSelectedNavItem('pipeline');
      setExpandedSubMenu(null);
      return;
    }
    
    // Sort routes by length (longest first) to match most specific routes first
    const sortedRoutes = Object.entries(pathToNavMap).sort(([a], [b]) => b.length - a.length);
    
    const matchedRoute = sortedRoutes.find(([route]) => {
      // Exact match
      if (path === route) return true;
      // Match with trailing slash
      if (path === route + '/') return true;
      // Match with route parameters (e.g., /source/123)
      if (path.startsWith(route + '/') && route !== '/') return true;
      return false;
    });
    
    const navItem = matchedRoute?.[1] || '';
    
    console.log('Selected nav item:', navItem);
    
    // Always update the selected nav item and clear any previous selection
    setSelectedNavItem(navItem);
    
    // Reset expanded submenu when navigating to non-submenu items
    if (navItem && !adminSubMenu.includes(navItem) && !campaignSubMenu.includes(navItem)) {
      setExpandedSubMenu(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const updateSubMenuIcon = (selector: string, isActive: boolean) => {
      const icon = document.querySelector(selector) as HTMLElement;
      if (icon) {
        if (isActive) {
          icon.style.setProperty('color', activeNavColor, 'important');
          icon.style.setProperty('fill', activeNavColor, 'important');
        } else {
          icon.style.removeProperty('color');
          icon.style.removeProperty('fill');
        }
      }
    };

    // Update main menu icons
    const updateMainMenuIcon = (title: string, isActive: boolean) => {
      const menuItem = document.querySelector(`[title="${title}"] .ps-menu-icon svg`);
      if (menuItem) {
        if (isActive) {
          menuItem.setAttribute('color', activeNavColor);
          (menuItem as HTMLElement).style.color = activeNavColor;
        } else {
          menuItem.removeAttribute('color');
          (menuItem as HTMLElement).style.removeProperty('color');
        }
      }
    };

    setTimeout(() => {
      updateSubMenuIcon('.ps-submenu-root:has([title="Admin"]) .ps-menu-icon svg', adminSubMenu.includes(selectedNavItem));
      updateSubMenuIcon('.ps-submenu-root:has([title="Campaigns"]) .ps-menu-icon svg', campaignSubMenu.includes(selectedNavItem));
      updateMainMenuIcon('Sales Stage', selectedNavItem === 'pipeline');
    }, 100);
  }, [selectedNavItem, activeNavColor]);

  // Close collapsed submenu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collapsedSubmenu && !submenuRefs.current[collapsedSubmenu.key]?.contains(event.target as Node)) {
        setCollapsedSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [collapsedSubmenu]);

  // Close collapsed submenu when sidebar expands and update icon colors
  useEffect(() => {
    if (!collapsed) {
      setCollapsedSubmenu(null);
    }
    // Update submenu icon colors after collapse/expand
    setTimeout(() => {
      const updateSubMenuIcon = (selector: string, isActive: boolean) => {
        const icon = document.querySelector(selector) as HTMLElement;
        if (icon) {
          if (isActive) {
            icon.style.setProperty('color', activeNavColor, 'important');
            icon.style.setProperty('fill', activeNavColor, 'important');
          } else {
            icon.style.removeProperty('color');
            icon.style.removeProperty('fill');
          }
        }
      };
      updateSubMenuIcon('.ps-submenu-root:has([title="Admin"]) .ps-menu-icon svg', adminSubMenu.includes(selectedNavItem));
      updateSubMenuIcon('.ps-submenu-root:has([title="Campaigns"]) .ps-menu-icon svg', campaignSubMenu.includes(selectedNavItem));
    }, 200);
  }, [collapsed, selectedNavItem, activeNavColor]);

  // Enable tampering detection
  useEffect(() => {
    const interval = setInterval(() => {
      if (userRole !== null && userRole !== undefined) {
        // Check if role is still valid
        const currentRole = Util.getUserRole();
        if (currentRole === null) {
          console.warn('Session invalidated due to tampering');
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [userRole]);

  const sidebarTheme = {
    backgroundColor: currentTheme.sidebarColor,
    color: currentTheme.textColor
  };

  const MenuItemComponent = ({ item, isActive }: { item: MenuItemConfig; isActive: boolean }) => (
    <MenuItem 
      hidden={!Util.isAuthorized(item.permission)} 
      icon={item.icon}
      title={item.tooltip || item.title}
      component={<Link to={item.path} />}
      onClick={() => setSelectedNavItem(item.key)}
      rootStyles={{
        ['.' + 'ps-menu-button']: {
          color: 'var(--text-primary) !important',
          backgroundColor: 'transparent !important',
          textDecoration: 'none !important'
        },
        ['.' + 'ps-menu-label']: {
          color: 'inherit !important'
        }
      }}
    >
      {isActive ? (
        <b style={{ color: activeNavColor }}>{item.displayName || item.title}</b>
      ) : (
        <span style={{ color: 'var(--text-primary)' }}>{item.displayName || item.title}</span>
      )}
    </MenuItem>
  );

  const getMainMenuItems = (): MenuItemConfig[] => [
    {
      key: "Stages",
      title: "Add Pipeline",
      path: "/Stages",
      icon: <IconWrapper Icon={HiOutlineFunnel} color={selectedNavItem === "Stages" ? activeNavColor : "var(--text-primary)"} />,
      iconComponent: HiOutlineFunnel,
      permission: "Stages",
      tooltip: TOOLTIPS.SIDEBAR.ADD_PIPELINE
    },
    {
      key: "pipeline",
      title: "Sales Stage",
      path: "/pipeline",
      icon: <IconWrapper Icon={GiStairsGoal} style={{color: selectedNavItem === "pipeline" ? activeNavColor : "var(--text-primary)"}} />,
      iconComponent: GiStairsGoal,
      permission: "pipeline",
      tooltip: TOOLTIPS.SIDEBAR.SALES_STAGE
    },
    {
      key: "Activities",
      title: "Activities",
      path: "/Activities",
      icon: <IconWrapper Icon={RxActivityLog} color={selectedNavItem === "Activities" ? activeNavColor : "var(--text-primary)"} />,
      iconComponent: RxActivityLog,
      permission: "Activities",
      tooltip: TOOLTIPS.SIDEBAR.ACTIVITIES
    },
    {
      key: "Person",
      title: "Persons",
      path: "/Person",
      icon: <IconWrapper Icon={RiContactsBookFill} color={selectedNavItem === "Person" ? activeNavColor : "var(--text-primary)"} />,
      iconComponent: RiContactsBookFill,
      permission: "Person",
      tooltip: TOOLTIPS.SIDEBAR.PERSONS
    },
    {
      key: "Settings",
      title: "Settings",
      displayName: "Users",
      path: "/users",
      icon: <IconWrapper Icon={IoSettings} color={selectedNavItem === "Settings" ? activeNavColor : "var(--text-primary)"} />,
      iconComponent: IoSettings,
      permission: "users",
      tooltip: TOOLTIPS.SIDEBAR.USERS
    },
    {
      key: "Reporting",
      title: "Reporting",
      path: "/Reporting",
      icon: <IconWrapper Icon={RiDashboard2Fill} color={selectedNavItem === "Reporting" ? activeNavColor : "var(--text-primary)"} />,
      iconComponent: RiDashboard2Fill,
      permission: "Reporting",
      tooltip: TOOLTIPS.SIDEBAR.REPORTING
    }
  ];

  const getSubMenus = (): SubMenuConfig[] => [
    {
      key: "Campaigns",
      title: "Campaigns",
      icon: <IconWrapper Icon={MdCampaign} color={campaignSubMenu.includes(selectedNavItem) ? activeNavColor : "var(--text-primary)"} />,
      permission: "Template",
      tooltip: TOOLTIPS.SIDEBAR.CAMPAIGNS,
      items: [
        {
          key: "Template",
          title: "Template",
          path: "/Template",
          icon: <IconWrapper Icon={HiTemplate} color={selectedNavItem === "Template" ? activeNavColor : "var(--text-primary)"} />,
          iconComponent: HiTemplate,
          permission: "Template",
          tooltip: TOOLTIPS.SIDEBAR.TEMPLATE
        }
      ]
    },
    {
      key: "Admin",
      title: "Admin",
      icon: <IconWrapper Icon={RiAdminFill} color={adminSubMenu.includes(selectedNavItem) ? activeNavColor : "var(--text-primary)"} />,
      permission: "Admin",
      tooltip: TOOLTIPS.SIDEBAR.ADMIN,
      items: [
        {
          key: "Clinic",
          title: "Clinic",
          path: "/Clinic",
          icon: <IconWrapper Icon={FaClinicMedical} color={selectedNavItem === "Clinic" ? activeNavColor : "var(--text-primary)"} />,
          iconComponent: FaClinicMedical,
          permission: "Clinic",
          tooltip: TOOLTIPS.SIDEBAR.CLINIC
        },
        {
          key: "Source",
          title: "Source",
          path: "/Source",
          icon: <IconWrapper Icon={BiGitBranch} color={selectedNavItem === "Source" ? activeNavColor : "var(--text-primary)"} />,
          iconComponent: BiGitBranch,
          permission: "Source",
          tooltip: TOOLTIPS.SIDEBAR.SOURCE
        },
        {
          key: "Treatment",
          title: "Treatment",
          path: "/Treatment",
          icon: <IconWrapper Icon={FaNotesMedical} color={selectedNavItem === "Treatment" ? activeNavColor : "var(--text-primary)"} />,
          iconComponent: FaNotesMedical,
          permission: "Treatment",
          tooltip: TOOLTIPS.SIDEBAR.TREATMENT
        },
        {
          key: "PipeLineType",
          title: "Pipeline Type",
          path: "/PipeLineType",
          icon: <IconWrapper Icon={FaProjectDiagram} color={selectedNavItem === "PipeLineType" ? activeNavColor : "var(--text-primary)"} />,
          iconComponent: FaProjectDiagram,
          permission: "PipeLineType",
          tooltip: TOOLTIPS.SIDEBAR.PIPELINE_TYPE
        }
      ]
    }
  ];

  if (userRole === null || userRole === undefined) return null;

  return (
    <Sidebar
      collapsed={collapsed}
      width="180"
      transitionDuration={500}
      backgroundColor={sidebarTheme.backgroundColor}
      rootStyles={{ color: sidebarTheme.color }}
    >
      <Header className="sidenavhead">
        <img 
          className="sideopenlogo" 
          src={logo} 
          style={{ display: !collapsed ? "block" : "none", width: "100%", height: "auto" }} 
        />
        <img 
          className="sidehidelogo" 
          src={logoicon} 
          style={{ display: collapsed ? "block" : "none", width: "28px", height: "auto", left: "10px", top: "15px" }} 
        />
      </Header>

      <Menu style={{ paddingTop: "58px" }}>
        {getMainMenuItems().map(item => (
          <MenuItem 
            key={`${item.key}-${selectedNavItem}`}
            hidden={!Util.isAuthorized(item.permission)} 
            icon={<IconWrapper Icon={item.iconComponent} color={selectedNavItem === item.key ? activeNavColor : "var(--text-primary)"} />}
            title={item.tooltip || item.title}
            component={<Link to={item.path} />}
            onClick={() => setSelectedNavItem(item.key)}
            rootStyles={{
              ['.' + 'ps-menu-button']: {
                color: 'var(--text-primary) !important',
                backgroundColor: 'transparent !important',
                textDecoration: 'none !important'
              },
              ['.' + 'ps-menu-label']: {
                color: 'inherit !important'
              }
            }}
          >
            {selectedNavItem === item.key ? (
              <b style={{ color: activeNavColor }}>{item.displayName || item.title}</b>
            ) : (
              <span style={{ color: 'var(--text-primary)' }}>{item.displayName || item.title}</span>
            )}
          </MenuItem>
        ))}

        {getSubMenus().map(subMenu => {
          const isSubMenuActive = subMenu.key === "Admin" ? adminSubMenu.includes(selectedNavItem) : campaignSubMenu.includes(selectedNavItem);
          const isHidden = !Util.isAuthorized(subMenu.permission);
          const shouldBeOpen = isSubMenuActive || expandedSubMenu === subMenu.key;
          
          // Always render the submenu but control visibility with CSS to prevent layout shifts
          const menuStyle = isHidden ? { display: 'none' } : {};
          
          if (collapsed) {
            return (
              <MenuItem
                key={subMenu.key}
                icon={subMenu.icon}
                style={menuStyle}
                title={subMenu.tooltip || subMenu.title}
                onClick={(e) => {
                  if (!isHidden) {
                    const rect = (e.target as HTMLElement).closest('.ps-menuitem-root')?.getBoundingClientRect();
                    if (rect) {
                      setCollapsedSubmenu({
                        key: subMenu.key,
                        items: subMenu.items,
                        top: rect.top
                      });
                    }
                  }
                }}
                rootStyles={{
                  ['.' + 'ps-menu-button']: {
                    color: isSubMenuActive ? `${activeNavColor} !important` : 'var(--text-primary) !important',
                    backgroundColor: isSubMenuActive ? 'rgba(13, 104, 197, 0.1) !important' : 'transparent !important'
                  },
                  ['.' + 'ps-menu-icon']: {
                    color: isSubMenuActive ? `${activeNavColor} !important` : 'var(--text-primary) !important'
                  },
                  ['.' + 'ps-menu-icon svg']: {
                    color: isSubMenuActive ? `${activeNavColor} !important` : 'var(--text-primary) !important',
                    fill: isSubMenuActive ? `${activeNavColor} !important` : 'var(--text-primary) !important'
                  }
                }}
              />
            );
          }
          
          return (
            <SubMenu
              key={`${subMenu.key}-${selectedNavItem}`}
              icon={subMenu.icon}
              style={menuStyle}
              title={subMenu.tooltip || subMenu.title}
              defaultOpen={shouldBeOpen}
              onOpenChange={(open) => {
                if (!isHidden) {
                  if (open && !isSubMenuActive) {
                    setExpandedSubMenu(subMenu.key);
                  } else if (!open && !isSubMenuActive) {
                    setExpandedSubMenu(null);
                  }
                }
              }}
              label={subMenu.title}
              rootStyles={{
                ['.' + 'ps-submenu-content']: {
                  color: isSubMenuActive ? activeNavColor : 'var(--text-primary) !important'
                },
                ['.' + 'ps-menu-label']: {
                  color: isSubMenuActive ? activeNavColor : 'var(--text-primary) !important'
                }
              }}
            >
              {subMenu.items.map(item => (
                <MenuItemComponent key={item.key} item={item} isActive={selectedNavItem === item.key} />
              ))}
            </SubMenu>
          );
        })}

        <MenuItem 
          key={`tenant-${selectedNavItem}`}
          hidden={userRole !== 0} 
          title={TOOLTIPS.SIDEBAR.TENANTS}
          component={<Link to="/Tenant" />} 
          onClick={() => setSelectedNavItem("Tenant")} 
          icon={<IconWrapper Icon={FaBuilding} color={selectedNavItem === "Tenant" ? activeNavColor : "var(--text-primary)"} />}
          rootStyles={{
            ['.' + 'ps-menu-button']: {
              color: 'var(--text-primary) !important',
              backgroundColor: 'transparent !important'
            }
          }}
        >
          <b hidden={selectedNavItem !== "Tenant"} style={{ color: selectedNavItem === "Tenant" ? activeNavColor : "var(--text-primary)" }}>Tenants</b>
          <p hidden={selectedNavItem === "Tenant"} style={{ color: 'var(--text-primary)' }}>Tenants</p>
        </MenuItem>
      </Menu>
      
      {/* Portal-based collapsed submenu flyout */}
      {collapsed && collapsedSubmenu && createPortal(
        <div
          ref={(el) => {
            submenuRefs.current[collapsedSubmenu.key] = el;
          }}
          style={{
            position: 'fixed',
            left: '64px',
            top: `${collapsedSubmenu.top}px`,
            zIndex: 2000,
            backgroundColor: 'var(--modal-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            minWidth: '200px',
            padding: '8px 0'
          }}
        >
          {collapsedSubmenu.items.map(item => {
            console.log(`Flyout item: ${item.key}, selectedNavItem: ${selectedNavItem}, match: ${selectedNavItem === item.key}`);
            return (
            <Link
              key={item.key}
              to={item.path}
              onClick={() => {
                setSelectedNavItem(item.key);
                setCollapsedSubmenu(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                textDecoration: 'none',
                color: selectedNavItem === item.key ? activeNavColor : 'var(--text-primary)',
                backgroundColor: selectedNavItem === item.key ? 'rgba(13, 104, 197, 0.1)' : 'transparent',
                borderBottom: '1px solid var(--border-color)'
              }}
              onMouseEnter={(e) => {
                if (selectedNavItem !== item.key) {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedNavItem !== item.key) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                } else {
                  e.currentTarget.style.backgroundColor = 'rgba(13, 104, 197, 0.1)';
                }
              }}
            >
              <span style={{ marginRight: '12px', fontSize: '16px' }}>{item.icon}</span>
              <span style={{ fontWeight: selectedNavItem === item.key ? 'bold' : 'normal' }}>
                {item.title}
              </span>
            </Link>
            );
          })}
        </div>,
        document.body
      )}
    </Sidebar>
  );
};