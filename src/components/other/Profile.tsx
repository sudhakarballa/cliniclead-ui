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
        // Check if we're on a subdomain and need to redirect to main application
        const config = (window as any).config;
        
        if (config?.EnableSubdomainRedirect) {
            // Redirect to main application login page immediately
            const homePage = config.HomePage || '';
            const redirectUrl = config.RedirectUri + (homePage === '/' ? '' : homePage) + '/login';
            window.location.href = redirectUrl;
        } else {
            // Local development or already on main domain - redirect immediately
            window.location.href = '/login';
        }
        
        // Clear storage after redirect is initiated
        localStorage.clear();
        setIsLoggedIn(false);
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
