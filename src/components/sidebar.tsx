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
}

interface SubMenuConfig {
  key: string;
  title: string;
  icon: React.ReactElement;
  permission: string;
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
    
    // Always update the selected nav item
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
          icon.style.setProperty('color', 'black', 'important');
          icon.style.setProperty('fill', 'black', 'important');
        }
      }
    };

    // Update main menu icons
    const updateMainMenuIcon = (title: string, isActive: boolean) => {
      const menuItem = document.querySelector(`[title="${title}"] .ps-menu-icon svg`);
      if (menuItem) {
        menuItem.setAttribute('color', isActive ? activeNavColor : 'black');
        (menuItem as HTMLElement).style.color = isActive ? activeNavColor : 'black';
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
            icon.style.setProperty('color', 'black', 'important');
            icon.style.setProperty('fill', 'black', 'important');
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
      title={item.title} 
      component={<Link to={item.path} />}
      onClick={() => setSelectedNavItem(item.key)}
      rootStyles={{
        ['.' + 'ps-menu-button']: {
          color: 'black !important',
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
        <span style={{ color: 'black' }}>{item.displayName || item.title}</span>
      )}
    </MenuItem>
  );

  const getMainMenuItems = (): MenuItemConfig[] => [
    {
      key: "Stages",
      title: "Add Pipeline",
      path: "/Stages",
      icon: <IconWrapper Icon={HiOutlineFunnel} color={selectedNavItem === "Stages" ? activeNavColor : "black"} />,
      iconComponent: HiOutlineFunnel,
      permission: "Stages"
    },
    {
      key: "pipeline",
      title: "Sales Stage",
      path: "/pipeline",
      icon: <IconWrapper Icon={GiStairsGoal} style={{color: selectedNavItem === "pipeline" ? activeNavColor : "black"}} />,
      iconComponent: GiStairsGoal,
      permission: "pipeline"
    },
    {
      key: "Activities",
      title: "Activities",
      path: "/Activities",
      icon: <IconWrapper Icon={RxActivityLog} color={selectedNavItem === "Activities" ? activeNavColor : "black"} />,
      iconComponent: RxActivityLog,
      permission: "Activities"
    },
    {
      key: "Person",
      title: "Persons",
      path: "/Person",
      icon: <IconWrapper Icon={RiContactsBookFill} color={selectedNavItem === "Person" ? activeNavColor : "black"} />,
      iconComponent: RiContactsBookFill,
      permission: "Person"
    },
    {
      key: "Settings",
      title: "Settings",
      displayName: "Manage User",
      path: "/users",
      icon: <IconWrapper Icon={IoSettings} color={selectedNavItem === "Settings" ? activeNavColor : "black"} />,
      iconComponent: IoSettings,
      permission: "users"
    },
    {
      key: "Reporting",
      title: "Reporting",
      path: "/Reporting",
      icon: <IconWrapper Icon={RiDashboard2Fill} color={selectedNavItem === "Reporting" ? activeNavColor : "black"} />,
      iconComponent: RiDashboard2Fill,
      permission: "Reporting"
    }
  ];

  const getSubMenus = (): SubMenuConfig[] => [
    {
      key: "Campaigns",
      title: "Campaigns",
      icon: <IconWrapper Icon={MdCampaign} color={campaignSubMenu.includes(selectedNavItem) ? activeNavColor : "black"} />,
      permission: "Template",
      items: [
        {
          key: "Template",
          title: "Template",
          path: "/Template",
          icon: <IconWrapper Icon={HiTemplate} color={selectedNavItem === "Template" ? activeNavColor : "black"} />,
          iconComponent: HiTemplate,
          permission: "Template"
        }
      ]
    },
    {
      key: "Admin",
      title: "Admin",
      icon: <IconWrapper Icon={RiAdminFill} color={adminSubMenu.includes(selectedNavItem) ? activeNavColor : "black"} />,
      permission: "Admin",
      items: [
        {
          key: "Clinic",
          title: "Clinic",
          path: "/Clinic",
          icon: <IconWrapper Icon={FaClinicMedical} color={selectedNavItem === "Clinic" ? activeNavColor : "black"} />,
          iconComponent: FaClinicMedical,
          permission: "Clinic"
        },
        {
          key: "Source",
          title: "Source",
          path: "/Source",
          icon: <IconWrapper Icon={BiGitBranch} color={selectedNavItem === "Source" ? activeNavColor : "black"} />,
          iconComponent: BiGitBranch,
          permission: "Source"
        },
        {
          key: "Treatment",
          title: "Treatment",
          path: "/Treatment",
          icon: <IconWrapper Icon={FaNotesMedical} color={selectedNavItem === "Treatment" ? activeNavColor : "black"} />,
          iconComponent: FaNotesMedical,
          permission: "Treatment"
        },
        {
          key: "PipeLineType",
          title: "Pipeline Type",
          path: "/PipeLineType",
          icon: <IconWrapper Icon={FaProjectDiagram} color={selectedNavItem === "PipeLineType" ? activeNavColor : "black"} />,
          iconComponent: FaProjectDiagram,
          permission: "PipeLineType"
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
            icon={<IconWrapper Icon={item.iconComponent} color={selectedNavItem === item.key ? activeNavColor : "black"} />}
            title={item.title} 
            component={<Link to={item.path} />}
            onClick={() => setSelectedNavItem(item.key)}
            rootStyles={{
              ['.' + 'ps-menu-button']: {
                color: 'black !important',
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
              <span style={{ color: 'black' }}>{item.displayName || item.title}</span>
            )}
          </MenuItem>
        ))}

        {getSubMenus().map(subMenu => {
          const isSubMenuActive = subMenu.key === "Admin" ? adminSubMenu.includes(selectedNavItem) : campaignSubMenu.includes(selectedNavItem);
          const isHidden = subMenu.key === "Admin" ? userRole === 0 || !Util.isAuthorized(subMenu.permission) : !Util.isAuthorized(subMenu.permission);
          const shouldBeOpen = isSubMenuActive || expandedSubMenu === subMenu.key;
          
          if (collapsed) {
            return (
              <MenuItem
                key={subMenu.key}
                icon={subMenu.icon}
                hidden={isHidden}
                title={subMenu.title}
                onClick={(e) => {
                  const rect = (e.target as HTMLElement).closest('.ps-menuitem-root')?.getBoundingClientRect();
                  if (rect) {
                    setCollapsedSubmenu({
                      key: subMenu.key,
                      items: subMenu.items,
                      top: rect.top
                    });
                  }
                }}
                rootStyles={{
                  ['.' + 'ps-menu-button']: {
                    color: isSubMenuActive ? `${activeNavColor} !important` : 'black !important',
                    backgroundColor: isSubMenuActive ? 'rgba(13, 104, 197, 0.1) !important' : 'transparent !important'
                  },
                  ['.' + 'ps-menu-icon']: {
                    color: isSubMenuActive ? `${activeNavColor} !important` : 'black !important'
                  },
                  ['.' + 'ps-menu-icon svg']: {
                    color: isSubMenuActive ? `${activeNavColor} !important` : 'black !important',
                    fill: isSubMenuActive ? `${activeNavColor} !important` : 'black !important'
                  }
                }}
              />
            );
          }
          
          return (
            <SubMenu
              key={`${subMenu.key}-${selectedNavItem}`}
              icon={subMenu.icon}
              hidden={isHidden}
              defaultOpen={shouldBeOpen}
              onOpenChange={(open) => {
                if (open && !isSubMenuActive) {
                  setExpandedSubMenu(subMenu.key);
                } else if (!open && !isSubMenuActive) {
                  setExpandedSubMenu(null);
                }
              }}
              title={subMenu.title}
              label={subMenu.title}
              rootStyles={{
                ['.' + 'ps-submenu-content']: {
                  color: isSubMenuActive ? activeNavColor : 'black !important'
                },
                ['.' + 'ps-menu-label']: {
                  color: isSubMenuActive ? activeNavColor : 'black !important'
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
          hidden={userRole !== 0} 
          title="Tenants" 
          component={<Link to="/Tenant" />} 
          onClick={() => setSelectedNavItem("Tenant")} 
          icon={<IconWrapper Icon={FaBuilding} color={selectedNavItem === "Tenant" ? activeNavColor : "black"} />}
          rootStyles={{
            ['.' + 'ps-menu-button']: {
              color: 'black !important',
              backgroundColor: 'transparent !important'
            }
          }}
        >
          <b hidden={selectedNavItem !== "Tenant"} style={{ color: selectedNavItem === "Tenant" ? activeNavColor : "black" }}>Tenants</b>
          <p hidden={selectedNavItem === "Tenant"}>Tenants</p>
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
            backgroundColor: '#ffffff',
            border: '1px solid #e4cb9a',
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
                color: selectedNavItem === item.key ? activeNavColor : '#3f3f3f',
                backgroundColor: selectedNavItem === item.key ? 'rgba(13, 104, 197, 0.1)' : 'transparent',
                borderBottom: '1px solid #f0f0f0'
              }}
              onMouseEnter={(e) => {
                if (selectedNavItem !== item.key) {
                  e.currentTarget.style.backgroundColor = '#f3f3f3';
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