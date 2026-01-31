import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import "./header.css";
import { SearchBar } from "./searchBar";
import { Profile } from '../other/Profile';
import { NotificationBell } from '../notifications/NotificationBell';
import { ThemeSelector } from '../common/ThemeSelector';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthContext } from '../../contexts/AuthContext';

type params={
    onExpandCollapseClick:any,
    collapsed?:boolean
}
export const HeaderComponent = (props:params) => {
    const { currentTheme } = useTheme();
    const { userRole } = useAuthContext();
    
    return (
        <header id="header" className={`header pt-2 pb-2 bggradiant ${props.collapsed ? 'sidebar-collapsed' : ''}`} 
               style={{background: `linear-gradient(90deg, ${currentTheme.primaryColor} 0%, ${currentTheme.secondaryColor} 50%, ${currentTheme.primaryColor} 100%)`}}>
            <div className="container-fluid">
                <div className="headerrow align-items-center">
                    <div className="header-col colheadname">
                        <div className="colheadname-row">
                            <button className="sidemenuicon" onClick={(e:any)=>props.onExpandCollapseClick()}><FontAwesomeIcon icon={faBars} /></button>
                            <h1 className="headname">Lead Management</h1>
                        </div>
                    </div>
                    <div className="header-col colheadsearch">
                        <SearchBar />
                    </div>
                    <div className="header-col colheadprofile">                        
                        <div className="colheadprofilerow">
                            <div className="headicon headbtnbell">
                                <NotificationBell />
                            </div>
                            {userRole !== 0 && (
                                <div className="headicon">
                                    <ThemeSelector />
                                </div>
                            )}
                            <Profile />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

