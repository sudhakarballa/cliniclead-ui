import LocalStorageUtil from './LocalStorageUtil';

class RoleValidator {
    private static readonly VALID_ROLES = [0, 1, 2, 3];
    private static lastValidationTime = 0;
    private static readonly VALIDATION_INTERVAL = 60000; // 60 seconds

    public static validateUserRole(): boolean {
        const now = Date.now();
        
        if (now - this.lastValidationTime < this.VALIDATION_INTERVAL) {
            return true;
        }
        
        this.lastValidationTime = now;
        
        const roleStr = localStorage.getItem('sys_perm_data');
        
        if (!roleStr) {
            return false;
        }
        
        try {
            const role = parseInt(roleStr, 10);
            if (!this.VALID_ROLES.includes(role)) {
                this.handleInvalidRole();
                return false;
            }
            return true;
        } catch {
            this.handleInvalidRole();
            return false;
        }
    }
    
    /**
     * Handles invalid role detection
     */
    private static handleInvalidRole(): void {
        console.warn('Invalid user role detected. Clearing session.');
        
        localStorage.removeItem('sys_perm_data');
        localStorage.removeItem('sys_check');
        LocalStorageUtil.removeItem('ACCESS_TOKEN');
        LocalStorageUtil.removeItem('USER_LOGGED_IN');
        
        window.location.href = '/login';
    }
    
    public static getCurrentRole(): number | null {
        if (!this.validateUserRole()) {
            return null;
        }
        
        const roleStr = localStorage.getItem('sys_perm_data');
        if (!roleStr) return null;
        
        try {
            return parseInt(roleStr, 10);
        } catch {
            return null;
        }
    }
}

export default RoleValidator;