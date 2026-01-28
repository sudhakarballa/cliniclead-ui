import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Form, Spinner } from "react-bootstrap";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LoginService } from '../services/loginService';
import LocalStorageUtil from '../others/LocalStorageUtil';
import Constants from '../others/constants';

const VerifyCode = () => {
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { userId, email } = location.state; // Retrieve userId from previous navigation

    // Pass an error handler to the service
    const loginSvc = new LoginService((err: any) => {
        toast.error("An error occurred: " + err.message);
    });

    const handleVerifyClick = async () => {
        setLoading(true);

        // Log to check if email and other fields are being sent
        console.log(`Entered Verification Code: ${verificationCode}`);
        console.log(`User ID: ${userId}`);
        console.log(`Email: ${email}`);

        if (!email) {
            toast.error("Email is missing.");
            setLoading(false);
            return;
        }

        try {
            await loginSvc.verifyTwoFactorCode({ userId, verificationCode, email, tenantId: null }).then((res: any) => {
                if (res?.token) {
                    // Save token and user information in local storage
                    LocalStorageUtil.setItem(Constants.USER_LOGGED_IN, "true");
                    LocalStorageUtil.setItem(Constants.ACCESS_TOKEN, res?.token);
                    LocalStorageUtil.setItem(Constants.User_Name, res?.user);
                    LocalStorageUtil.setItem(Constants.TOKEN_EXPIRATION_TIME, res?.expires);
                      // Display a success toast notification after verification
                toast.success("Verification successful! You will be redirected shortly.");
                    navigate("/pipeline"); // Navigate to the next screen after successful verification
                } else {
                    toast.error("Invalid verification code.");
                }
            });
        } catch (error) {
            toast.error("Verification failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="verify-code-wrapper">
            <h2>Verify Your Code</h2>
            <p>Please enter the 2FA code sent to your email:</p>
            <Form>
                <Form.Group controlId="verificationCode" className="mb-3">
                    <Form.Control
                        type="text"
                        placeholder="Enter 2FA Code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        disabled={loading}
                    />
                </Form.Group>

                {/* Adding explicit margin to the button */}
                <Button
                    variant="primary"
                    onClick={handleVerifyClick}
                    className="w-100 mt-3"  // Using Bootstrap margin-top to create space
                >
                    {loading ? <Spinner animation="border" /> : 'Verify Code'}
                </Button>
            </Form>
            <div className="mt-3 text-center">
                <a href="#" className="text-muted">Forgot password?</a>
            </div>
            <ToastContainer />
        </div>
    );
};

export default VerifyCode;
