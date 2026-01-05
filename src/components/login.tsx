import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment";
import { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { ErrorBoundary } from "react-error-boundary";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import { TextField, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { UserProfile } from "../models/userProfile";
import Constants from "../others/constants";
import LocalStorageUtil from "../others/LocalStorageUtil";
import Util, { IsMockService } from "../others/util";
import Logo from "../resources/images/Clinic-Lead-White.png";
import { LoginService } from "../services/loginService";
import ForgotPassword from "./profiles/forgotPassword";
import { useAuthContext } from "../contexts/AuthContext";

export class UserCredentails {
  public userName!: string;
  public password!:string;
  public passwordHash!: string;
  public confirmPasswordHash!: string;
  public email!: string;
  public userId: number = 0;

  constructor(
    userName: string = null as any,
    passwordHash: string = null as any,
    email: string = "" as any,
    userId: number = 0
  ) {
    this.userId = userId;
    this.userName = userName;
    this.email = email;
    this.passwordHash = passwordHash;
  }
}
type LoginForm = {
  email: string;
  passwordHash: string;
};
const Login = () => {
  const { setUserProfile, setUserRole, setIsLoggedIn } = useAuthContext();
  const [showForGotPasswordDiglog, setShowForGotPasswordDiglog] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  const [selectedItem, setSelectedItem] = useState(
    new UserCredentails(
      LocalStorageUtil.getItem(Constants.REMEMBER_ME) === "true"
        ? (LocalStorageUtil.getItem(Constants.User_Name) as any) ?? null
        : null
    )
  );
  const [disableLogin, setDisableLogin]=useState<boolean>(true);
  const [rememberMe, setRememberMe] = useState(false);
  const loginSvc = new LoginService(ErrorBoundary);
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [loginError, setLoginError]=useState();
  const validationsSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email format").required("Email is required"),
    passwordHash: Yup.string().required("Password is required").matches(/^\S+$/, "Password cannot contain spaces"),
  });


   const convertTZ = (dateTime: any) => {
     return moment(new Date(Util.toLocalTimeZone(dateTime))).format(
       "MM/DD/YYYY hh:mm:ss a"
     ) as any;
   };

 const methods = useForm<LoginForm>({
  resolver: yupResolver(validationsSchema),
  shouldFocusError: true,
});
  const { handleSubmit, getValues, setValue } = methods;
    // top of Login.tsx (or a utils file)
function getApiErrorMessage(err: any) {
  const data = err?.response?.data;
  if (typeof data === "string") return data;
  if (data?.errors) {
    // take the first model-state error
    const first = Object.values(data.errors).flat()[0] as string | undefined;
    if (first) return first;
  }
  return data?.message || err?.message || "Request failed";
}
const showPwdError = (msg: string) => {
  methods.setError("passwordHash" as never, { type: "manual", message: msg } as any);
  methods.setFocus("passwordHash" as never);
};
  const onSubmitClick = async (item: any) => {
  // pull & sanitize
  const email = (item?.email ?? "").trim();
  const pwd   = (item?.passwordHash ?? "").trim();

  // hard guards (no API call if missing)
  if (!email) { 
    methods.setError("email" as never, { type: "manual", message: "Email is required" } as any);
    return; 
  }
  if (!pwd) { 
    showPwdError("Password is required");
    return; 
  }

  // build the payload you already use
  const obj = Util.toClassObject(new UserCredentails(), item);
  obj.userName     = email;
  obj.passwordHash = pwd;   // backend needs PasswordHash
  obj.password     = pwd;   // keep if you also send Password
    setLoading(true);

    // Only use the username and password
    console.log(`Username :${obj.userName}, Password :${obj.passwordHash}`);

    if (rememberMe) {
      LocalStorageUtil.setItem(Constants.REMEMBER_ME, "true");
      LocalStorageUtil.setItem(Constants.User_Name, obj.userName);
    } else {
      LocalStorageUtil.removeItem(Constants.REMEMBER_ME);
      LocalStorageUtil.removeItem(Constants.User_Name);
    }

    if (obj.userName.toLocaleLowerCase() !== "developer") {
      if (IsMockService()) {
        LocalStorageUtil.setItem(Constants.USER_LOGGED_IN, "true");
        navigate("/pipeline");
      } else {
        loginSvc
          .login(obj)
          .then((res: any) => {
            setLoading(false);
            
            if(res?.forcePasswordReset){
              navigate(
    `/changePassword?userId=${res.encryptedUserId}&token=${res.encryptedToken}&changePassword=true`
  );
              return;
            }
            if (res && res?.token) {
              LocalStorageUtil.setItem(Constants.USER_LOGGED_IN, "true");
              LocalStorageUtil.setItem(Constants.ACCESS_TOKEN, res?.token);
              LocalStorageUtil.setItem(Constants.User_Name, res?.user);
              LocalStorageUtil.setItem(
                Constants.TOKEN_EXPIRATION_TIME,
                convertTZ(res?.expires)
              );
              console.log("Login Response:", res);
              console.log("Tenant Data:", res?.tenant);
              
              const isMasterAdmin = !res.tenant || res.tenant.length === 0;
              const userRole = isMasterAdmin ? 0 : res.role;
              
              // Store user role using secure method
              Util.setUserRole(userRole);
              
              const profile = {
                user: res.user,
                email: res.email,
                userId: res.userId,
                role: userRole,
                tenant: res.tenant,
                isMasterAdmin: isMasterAdmin
              };
              
              console.log("Setting user profile:", profile);
              console.log("Is Master Admin:", isMasterAdmin);
              
              setUserProfile(profile as any as UserProfile);
              setUserRole(userRole);
              setIsLoggedIn(true);
              
              Util.loadNavItemsForUser(userRole);
              
              if (isMasterAdmin) {
                navigate("/Tenant");
              } else {
                // Check if subdomain redirect is enabled
                const enableSubdomainRedirect = (window as any).config?.EnableSubdomainRedirect;
                const tenantId = res.tenant?.[0]?.id;
                const tenantSubdomain = (window as any).config?.TenantSubdomains?.[tenantId];
                
                if (enableSubdomainRedirect && tenantSubdomain) {
                  // Encode login response as base64 to pass all data
                  const loginData = {
                    token: res.token,
                    user: res.user,
                    email: res.email,
                    userId: res.userId,
                    role: userRole,
                    tenant: res.tenant,
                    expires: res.expires,
                    isMasterAdmin: isMasterAdmin
                  };
                  const encodedData = btoa(JSON.stringify(loginData));
                  window.location.href = `https://${tenantSubdomain}?auth=${encodedData}`;
                } else {
                  // Local development or no subdomain configured
                  navigate("/pipeline");
                }
              }
            } else if (res?.twoFactorRequired) {
              toast.success(
                "2FA code sent to your email! Please check your inbox."
              );

          
              setTwoFactorRequired(true);
              setUserId(res.userId);
              setEmail(res.email);
            } else if ((res as any)?.status === 401 || (res as any)?.error === 'Invalid credentials') {
              setLoginError('Invalid email or password. Please try again.' as any);
            } else {
              setLoginError(res as any);
            }
          })
         .catch((err) => {
  setLoading(false);
  const msg = getApiErrorMessage(err);
  if (msg.toLowerCase().includes("passwordhash")) {
    showPwdError(msg);
  } else {
    toast.error(msg);
  }
});
      }
    }
  };



  const handlePassword = () => {
    navigate("/forgot-password");
  };

  const onChange = (value: any, item: any) => {
    let obj = { ...selectedItem };
    if (item.value == "email") {
      obj.email = value;
      methods.clearErrors("email" as any);
    }
    if (item.value === "passwordHash") {
      obj.passwordHash = value;
      methods.clearErrors("passwordHash" as any);
    }

    setSelectedItem(obj);
    setDisableLogin(Util.isNullOrUndefinedOrEmpty(obj.email) || Util.isNullOrUndefinedOrEmpty(obj.passwordHash));
    
    setValue("email" as never, obj.email as never);
    setValue("passwordHash" as never, obj.passwordHash as never);
  };

  const handleVerifyClick = async () => {
    if (userId === null || email === null) {
      // Check both userId and email
      toast.error("User ID or Email is not available");
      return;
    }

    setLoading(true);
    try {
      await loginSvc
        .verifyTwoFactorCode({ userId, verificationCode, email })
        .then((res: any) => {
          if (res?.token) {
            LocalStorageUtil.setItem(Constants.USER_LOGGED_IN, "true");
            LocalStorageUtil.setItem(Constants.ACCESS_TOKEN, res?.token);
            LocalStorageUtil.setItem(Constants.User_Name, res?.user);
           LocalStorageUtil.setItem(
            Constants.TOKEN_EXPIRATION_TIME,
           convertTZ(res?.expires)
            );
            
            const isMasterAdmin = !res.tenant || res.tenant.length === 0;
            const userRole = isMasterAdmin ? 0 : res.role;
            
            // Store user role using secure method
            Util.setUserRole(userRole);
            
             const profile = {
                user: res.user,
                email: res.email,
               userId: res.userId,
               role: userRole,
               tenant: res.tenant,
               isMasterAdmin: isMasterAdmin
             };
             
             // Set in AuthContext only (session-based)
             setUserProfile(profile as any as UserProfile);
             setUserRole(userRole);
             setIsLoggedIn(true);
             
             Util.loadNavItemsForUser(userRole);
             
             if (isMasterAdmin) {
               navigate("/Tenant");
             } else {
               // Check if subdomain redirect is enabled
               const enableSubdomainRedirect = (window as any).config?.EnableSubdomainRedirect;
               const tenantId = res.tenant?.[0]?.id;
               const tenantSubdomain = (window as any).config?.TenantSubdomains?.[tenantId];
               
               if (enableSubdomainRedirect && tenantSubdomain) {
                 // Encode login response as base64 to pass all data
                 const loginData = {
                   token: res.token,
                   user: res.user,
                   email: res.email,
                   userId: res.userId,
                   role: userRole,
                   tenant: res.tenant,
                   expires: res.expires,
                   isMasterAdmin: isMasterAdmin
                 };
                 const encodedData = btoa(JSON.stringify(loginData));
                 window.location.href = `https://${tenantSubdomain}?auth=${encodedData}`;
               } else {
                 // Local development or no subdomain configured
                 navigate("/pipeline");
               }
             }
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

  useEffect(() => {
    LocalStorageUtil.removeItem(Constants.USER_LOGGED_IN);
    LocalStorageUtil.removeItem(Constants.ACCESS_TOKEN);
    LocalStorageUtil.removeItem(Constants.TOKEN_EXPIRATION_TIME);
    if (LocalStorageUtil.getItem(Constants.REMEMBER_ME) === "true") {
      setRememberMe(true);
    }
  }, []);

  return (
    <>
      <FormProvider {...methods}>
        {/* <div
          className="sign-in__wrapper"
          style={{ backgroundImage: `url(${BackgroundImage})` }}
        > */}
        <div className="sign-in__wrapper">
          <div className="signinwrapper-layout">
            <div className="signinwrapper-inner">
              {/* Overlay */}
              <div className="sign-in__backdrop"></div>
              <div className="logheader">
                <div className="logo"><img className="lohheaderlogo" src={Logo} /></div>
              </div>
              {/* Form */}
              
              <Form
                  className="loginformblock"
                  noValidate
                onKeyDown={(e) => {
  if (twoFactorRequired) return;           // don’t block 2FA screen
  if (e.key === "Enter") {
    const pwd = (methods.getValues() as any)?.passwordHash?.trim();
    if (!pwd) {
      e.preventDefault();
      showPwdError("Password is required"); // <-- inline error under the field
      return;
    }
  }
}}
                  onSubmit={
    twoFactorRequired
      ? (e) => { e.preventDefault(); handleVerifyClick(); } // verify instead of login
      : handleSubmit(onSubmitClick)                         // normal login
  }
                >
                <div className="shadow-lg p-3 bg-white rounded-4 loginformblock-row">
                  {/* Header */}
                  <div className="logformhead">
                    <h1 className="h1">Sign In</h1>
                    <p>to access CRM</p>
                  </div>
                  {(loading || twoFactorRequired || loginError) && (
                    <div className="logformsubtext p-1 text-center">
                      {loading ? "Please wait" : twoFactorRequired
                        ? "Enter the 2FA code sent to your email"
                        : loginError
                          ? <span style={{ color: '#d32f2f', fontWeight: 'bold', background: '#fff0f0', borderRadius: '4px', padding: '6px 12px', display: 'inline-block', boxShadow: '0 1px 4px rgba(211,47,47,0.08)' }}>
                              {loginError}
                            </span>
                          : null}
                    </div>
                  )}
                  {twoFactorRequired ? (
                    // If 2FA is required, show the verification code form
                    <>
                      <Form.Group controlId="verificationCode">
                        <Form.Control
                          type="text"
                          placeholder="Enter Verification Code"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          disabled={loading}
                          onKeyDown={(e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleVerifyClick();   // call your /VerifyTwoFactorCode
      }
    }}
                        />
                      </Form.Group>
                      <br/>
                      <Button
                        className="w-100"
                        variant="primary"
                        type="button"
                        disabled={loading}
                        onClick={handleVerifyClick}
                      >
                        {loading ? "Verifying..." : "Verify Code"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Form.Group className="mb-1" controlId="email">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          placeholder="Enter your email"
                          value={selectedItem.email || ''}
                          onChange={(e) => onChange(e.target.value, { value: 'email' })}
                          disabled={loading}
                          isInvalid={!!methods.formState.errors.email}
                        />
                        <Form.Control.Feedback type="invalid">
                          {methods.formState.errors.email?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                      <Form.Group className="mb-1" controlId="password">
                        <Form.Label>Password</Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={selectedItem.passwordHash || ''}
                            onChange={(e) => onChange(e.target.value, { value: 'passwordHash' })}
                            disabled={loading}
                          />
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            size="small"
                            style={{
                              position: 'absolute',
                              right: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              zIndex: 1
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </div>
                        {methods.formState.errors.passwordHash && (
                          <div className="invalid-feedback d-block">
                            {methods.formState.errors.passwordHash.message}
                          </div>
                        )}
                      </Form.Group>
                    {/*   <Form.Group className="mb-2" controlId="checkbox">
                        <Form.Check
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e: any) => setRememberMe(!rememberMe)}
                          disabled={Util.isNullOrUndefinedOrEmpty(
                            selectedItem.userName
                          )}
                          tabIndex={3}
                          label="Remember me"
                        />
                      </Form.Group>*/}
                      {!loading ? (
                        <Button className="w-100 btngradiant" variant="primary" type="submit">
                          Log In
                        </Button>
                      ) : (
                        loading && (
                          <Button
                            className="w-100 btngradiant"
                            variant="primary"
                            type="submit"
                            disabled
                          >
                            Logging In...
                          </Button>
                        )
                      )}

                      <div className="d-grid justify-content-end">
                        <Button
                          className="text-muted px-0"
                          variant="link"
                          onClick={(e: any) => setShowForGotPasswordDiglog(true)}
                        >
                          Forgot Password?
                        </Button>
                      </div>
                      {/* 
                      <div className="oraccessquickly text-center mt-3 mb-3">
                        <span>or access quickly</span>
                      </div>
                      */}
                      {/* 
                      <div className="oraccessquicklybtn">
                        <a className="btn" href="#">
                          Google
                        </a>
                        <a className="btn" href="#">
                          SSO
                        </a>
                      </div>
                      */}
                    </>
                  )}
                </div>
              </Form>              
            </div>
          </div>
          <div className="loginfooter">
            <div className="container">
              <div className="loginfooter-inner">
                <div className="loginfooter-row">
                  <div className="loginfooter-lang">
                    <select>
                      <option>Language</option>
                      <option selected>English (US)</option>
                    </select>
                  </div>
                  <div className="loginfooter-social">
                    {/* <ul className='socialmedia'>
                      <li><a href='#' target='_blank'><FontAwesomeIcon icon={faFacebook} /></a></li>
                      <li><a href='#' target='_blank'><FontAwesomeIcon icon={faXTwitter} /></a></li>
                      <li><a href='#' target='_blank'><FontAwesomeIcon icon={faLinkedin} /></a></li>
                    </ul> */}
                  </div>
                </div>
                <div className="loginfooter-btmlink">
                  <ul className="loginfooter-link">
                    <li>
                      <a href="#">Terms of Service</a>
                    </li>
                    <li>
                      <a href="#">Privacy Policy</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormProvider>
      <ToastContainer />
      {showForGotPasswordDiglog && (
        <ForgotPassword
          dialogIsOpen={showForGotPasswordDiglog}
          setDialogIsOpen={setShowForGotPasswordDiglog}
        />
      )}
    </>
  );
};

export default Login;
