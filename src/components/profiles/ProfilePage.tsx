import React, { useEffect, useState } from "react";
import { UserProfile } from "../../models/userProfile";
import "./ProfilePage.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Form, Button, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useAuthContext } from "../../contexts/AuthContext";
import { UserService } from "../../services/UserService";
import { ErrorBoundary } from "react-error-boundary";
import ToggleSwitch from "../../elements/ToggleSwitch"; 




export const ProfilePage = () => {
  const { userProfile, userRole } = useAuthContext();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const userService = new UserService(ErrorBoundary);

  const getBackPath = () => userRole === 0 ? "/Tenant" : "/pipeline";

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (userProfile?.userId) {
        try {
          setLoading(true);
          const userData = await userService.getUserById(userProfile.userId);
          setUserDetails(userData);
          setIsTwoFactorEnabled(userData?.twoFactorEnabled || false);
        } catch (error) {
          console.error('Failed to fetch user details:', error);
          toast.error('Failed to load user details');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserDetails();
  }, [userProfile?.userId]);

  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: userDetails?.timeZone || "Europe/London",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      const timeString = new Intl.DateTimeFormat("en-GB", options).format(new Date());
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [userDetails]);

  const handleMFAToggle = (newMFAStatus: boolean) => {
    setIsTwoFactorEnabled(newMFAStatus);
    
    // Update the profile in localStorage
    if (userProfile) {
      const updatedProfile = { ...userProfile, twoFactorEnabled: newMFAStatus };
      localStorage.setItem('UserProfile', JSON.stringify(updatedProfile));
      toast.success(`Two-Factor Authentication ${newMFAStatus ? 'enabled' : 'disabled'} successfully!`);
    }
  };



  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', flexDirection: 'column' }}>
        <div className="text-center p-4" style={{ 
          backgroundColor: '#f8f9fa', 
          borderRadius: '12px', 
          border: '2px solid #dee2e6',
          maxWidth: '400px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', color: '#dc3545', marginBottom: '16px' }}>⚠️</div>
          <h5 style={{ color: '#495057', marginBottom: '12px' }}>Profile Not Available</h5>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>User profile could not be loaded. Please try again later.</p>
          <Button 
            variant="primary" 
            onClick={() => navigate(getBackPath())}
            className="d-flex align-items-center gap-2 mx-auto"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            {userRole === 0 ? "Back to Tenants" : "Back to Deals"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <Button 
          variant="outline-primary" 
          className="back-button d-flex align-items-center gap-2" 
          onClick={() => navigate(getBackPath())}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>{userRole === 0 ? "Back to Tenants" : "Back to Deals"}</span>
        </Button>
        <div className="profile-header">
          <div className="profile-header-info">
            <h2>{`${userDetails.firstName || "User"} ${userDetails.lastName || "Profile"}`}</h2>
            <p className="email">{userDetails.email || "No email provided"}</p>
          </div>
        </div>
        <div className="profile-details">
          <div className="profile-item">
            <strong>Full Name</strong>
            <p>{`${userDetails.firstName || ""} ${userDetails.lastName || ""}`.trim() || "Not provided"}</p>
          </div>
          <div className="profile-item">
            <strong>Display Name</strong>
            <p>{userDetails.userName || "Not provided"}</p>
          </div>
          <div className="profile-item">
            <strong>Email</strong>
            <p>{userDetails.email || "Not provided"}</p>
          </div>
          <div className="profile-item">
            <strong>Phone Number</strong>
            <p>{userDetails.phoneNumber || "Not provided"}</p>
          </div>
          <div className="profile-item">
            <strong>Country/Region</strong>
            <p>
              <img
                src="https://flagcdn.com/gb.svg"
                alt="UK Flag"
                className="country-flag"
              />
              {userDetails.country || "United Kingdom"}
            </p>
          </div>
          <div className="profile-item">
            <strong>Language</strong>
            <p>{userDetails.language || "English"}</p>
          </div>
          <div className="profile-item">
            <strong>Current Time</strong>
            <p>{currentTime}</p>
          </div>
          <div className="profile-item">
            <strong>Two-Factor Authentication</strong>
            <ToggleSwitch
              checked={isTwoFactorEnabled}
              onChange={handleMFAToggle}
              label={isTwoFactorEnabled ? "Enabled" : "Disabled"}
              id="mfa-toggle"
              size="medium"
            />
          </div>
        
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
