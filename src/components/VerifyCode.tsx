import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Form, Spinner } from "react-bootstrap";
import { LoginService } from '../services/loginService';
import LocalStorageUtil from '../others/LocalStorageUtil';
import Constants from '../others/constants';

const VerifyCode = () => {
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { userId, email } = location.state;
    
    const MAX_ATTEMPTS = 3;
    const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

    // Pass an error handler to the service that doesn't redirect
    const loginSvc = new LoginService((err: any) => {
        // Don't show error here, handle it in catch block
    });

    const handleVerifyClick = async () => {
        setLoading(true);
        setErrorMessage('');

        // Log to check if email and other fields are being sent
        console.log(`Entered Verification Code: ${verificationCode}`);
        console.log(`User ID: ${userId}`);
        console.log(`Email: ${email}`);

        if (!email) {
            setErrorMessage("Email is missing.");
            setLoading(false);
            return;
        }

        try {
            const res = await loginSvc.verifyTwoFactorCode({ userId, verificationCode, email, tenantId: null });
            
            if (res?.token) {
                LocalStorageUtil.setItem(Constants.USER_LOGGED_IN, "true");
                LocalStorageUtil.setItem(Constants.ACCESS_TOKEN, res?.token);
                LocalStorageUtil.setItem(Constants.User_Name, res?.user);
                LocalStorageUtil.setItem(Constants.TOKEN_EXPIRATION_TIME, res?.expires);
                navigate("/pipeline");
            } else {
                const newAttemptCount = attemptCount + 1;
                setAttemptCount(newAttemptCount);
                
                if (newAttemptCount >= MAX_ATTEMPTS) {
                    setIsLocked(true);
                    setErrorMessage('Too many failed attempts. Account locked for 15 minutes.');
                    setTimeout(() => navigate('/login'), 3000);
                } else {
                    const remainingAttempts = MAX_ATTEMPTS - newAttemptCount;
                    setErrorMessage(`Invalid verification code. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`);
                }
            }
        } catch (error: any) {
            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);
            
            if (newAttemptCount >= MAX_ATTEMPTS) {
                setIsLocked(true);
                setErrorMessage('Too many failed attempts. Account locked for 15 minutes.');
                setTimeout(() => navigate('/login'), 3000);
            } else {
                const remainingAttempts = MAX_ATTEMPTS - newAttemptCount;
                setErrorMessage(`Invalid verification code. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="verify-code-wrapper">
            <h2>Verify Your Code</h2>
            <p>Please enter the 2FA code sent to your email:</p>
            {errorMessage && (
                <div className="alert alert-danger" role="alert">
                    {errorMessage}
                </div>
            )}
            <Form>
                <Form.Group controlId="verificationCode" className="mb-3">
                    <Form.Control
                        type="text"
                        placeholder="Enter 2FA Code"
                        value={verificationCode}
                        onChange={(e) => {
                            setVerificationCode(e.target.value);
                            setErrorMessage('');
                        }}
                        disabled={loading}
                        isInvalid={!!errorMessage}
                    />
                    <Form.Control.Feedback type="invalid">
                        {errorMessage}
                    </Form.Control.Feedback>
                </Form.Group>

                {/* Adding explicit margin to the button */}
                <Button
                    variant="primary"
                    onClick={handleVerifyClick}
                    className="w-100 mt-3"
                    disabled={loading || isLocked}
                >
                    {loading ? <Spinner animation="border" /> : isLocked ? 'Account Locked' : 'Verify Code'}
                </Button>
            </Form>
            <div className="mt-3 text-center">
                <a href="#" className="text-muted">Forgot password?</a>
            </div>
        </div>
    );
};

export default VerifyCode;
