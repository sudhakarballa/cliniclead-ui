import LocalStorageUtil from "./LocalStorageUtil";
import Constants from "./constants";

export const isUserLoggedIn = (): boolean => {
    let isUserLoggedIn = localStorage.getItem("isUserLoggedIn")
    return (isUserLoggedIn !== null && isUserLoggedIn === 'true');
}

export const getActiveUserToken = (): string => {
    // Check both localStorage and sessionStorage for token
    const token = LocalStorageUtil.getItem(Constants.ACCESS_TOKEN) || 
                  sessionStorage.getItem(Constants.ACCESS_TOKEN);
    return token ?? "";
}