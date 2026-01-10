import { faCircleUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { UserProfile } from "../../models/userProfile";

export const Profile = () => {
    const navigate = useNavigate();
    const { userProfile, setIsLoggedIn } = useAuthContext();
    
    const { user, email } = userProfile || new UserProfile();
    const doLogout = async () => {
        // Clear localStorage immediately to prevent UI flicker
        localStorage.removeItem('USER_LOGGED_IN');
        localStorage.removeItem('ACCESS_TOKEN');
        localStorage.removeItem('TOKEN_EXPIRATION_TIME');
        localStorage.removeItem('sys_perm_data');
        localStorage.removeItem('sys_check');
        
        setIsLoggedIn(false);
        
        // Check if we're on a subdomain and need to redirect to main application
        const config = (window as any).config;
        
        if (config?.EnableSubdomainRedirect) {
            // Redirect to main application login page
            const homePage = config.HomePage || '';
            const redirectUrl = config.RedirectUri + (homePage === '/' ? '' : homePage) + '/login';
            window.location.href = redirectUrl;
        } else {
            // Local development or already on main domain
            window.location.replace('/login');
        }
    };
    return (
        <Dropdown className="headerprofile">
        <Dropdown.Toggle className="profiledroupdown" variant="" id="dropdown-profile">
            <span className="profileicon"><FontAwesomeIcon icon={faCircleUser} /></span>
        </Dropdown.Toggle>
        <Dropdown.Menu>
            <div className="dropdown-header px-3 py-2 border-bottom">
                <div className="fw-bold">{user}</div>
                <div className="text-muted small">{email}</div>
            </div>
            <Dropdown.Item onClick={() => {
                console.log('Navigating to profile page');
                navigate("/profile");
            }}>Profile</Dropdown.Item>
            <Dropdown.Item onClick={(e:any)=>doLogout()}>Logout</Dropdown.Item>
        </Dropdown.Menu>
    </Dropdown>
 
    );
}
