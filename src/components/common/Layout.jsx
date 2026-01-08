import {
  Page,
  Masthead,
  MastheadToggle,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  PageSidebar,
  PageSidebarBody,
  PageToggleButton,
  Nav,
  NavList,
  NavItem,
  Brand,
  FlexItem,
  Flex,
} from '@patternfly/react-core';
import { UserIcon } from '@patternfly/react-icons';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children, navItems = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login', { replace: true });
    }
  };

  const onDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const onDropdownSelect = () => {
    setIsDropdownOpen(false);
  };

  const headerToolbar = (
    <Toolbar id="toolbar" isFullHeight isStatic>
      <ToolbarContent>
        <ToolbarGroup
          variant="action-group-plain"
          align={{ default: 'alignEnd' }}
          gap={{ default: 'gapNone', md: 'gapMd' }}
        >
          <ToolbarItem visibility={{ default: 'hidden', md: 'visible' }}>
            <Dropdown
              isOpen={isDropdownOpen}
              onSelect={onDropdownSelect}
              onOpenChange={(isOpen) => setIsDropdownOpen(isOpen)}
              popperProps={{ position: 'right' }}
              toggle={(toggleRef) => (
              <MenuToggle
                ref={toggleRef}
                onClick={onDropdownToggle}
                isExpanded={isDropdownOpen}
                icon={<UserIcon />}
              >
                {profile?.name || 'User'}
              </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownItem key="profile">
                  <Flex direction={{ default: 'column' }}>
                    <FlexItem>
                        Email: {profile?.email}
                    </FlexItem>
                    <FlexItem>                                            
                        Role: {profile?.role?.toUpperCase()}                      
                    </FlexItem>                    
                  </Flex>
                </DropdownItem>
                <DropdownItem key="signout" onClick={handleSignOut}>
                  Sign out
                </DropdownItem>
              </DropdownList>
            </Dropdown>
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );

  const masthead = (
    <Masthead>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton isHamburgerButton aria-label="Global navigation" style={{ fontSize: "large" }}/>
        </MastheadToggle>
        <MastheadBrand style={{ alignItems: 'center', fontSize: '1rem' }}>
          <strong>Meal Booking System</strong>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>{headerToolbar}</MastheadContent>
    </Masthead>
  );

  const pageNav = (
    <Nav aria-label="Navigation">
      <NavList>
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            itemId={item.path}
            isActive={location.pathname === item.path}
            to={item.path}
            onClick={(e) => {
              e.preventDefault();
              navigate(item.path);
            }}
          >
            {item.icon && <span style={{ marginRight: '8px' }}>{item.icon}</span>}
            {item.label}
          </NavItem>
        ))}
      </NavList>
    </Nav>
  );

  const sidebar = (
    <PageSidebar>
      <PageSidebarBody>{pageNav}</PageSidebarBody>
    </PageSidebar>
  );

  return (
    <Page 
      masthead={masthead} 
      sidebar={sidebar}
      isManagedSidebar
    >
      {children}
    </Page>
  );
};

export default Layout;

