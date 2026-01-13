import SecureStorageUtil from './secureStorageUtil';

 export default class LocalStorageUtil
 {
     // List of sensitive keys that should be encrypted
     private static readonly SENSITIVE_KEYS = [
         'ACCESS_TOKEN',
         'USER_LOGGED_IN',
         'USER_PERMISSIONS',
         'SESSION_DATA'
     ];

     // Add integrity check for critical values
     private static generateChecksum(value: string): string {
         let hash = 0;
         for (let i = 0; i < value.length; i++) {
             const char = value.charCodeAt(i);
             hash = ((hash << 5) - hash) + char;
             hash = hash & hash; // Convert to 32-bit integer
         }
         return Math.abs(hash).toString(36);
     }

     private static isSensitiveKey(key: string): boolean {
         return this.SENSITIVE_KEYS.some(sensitiveKey => key.includes(sensitiveKey));
     }
     // Public Methods
     // -------------------------------------------------------------------------------------- //
     /**
      * Checks if the browser supports local storage.
      * @returns true if the local storage is supported; false otherwise.
      */
     public static isSupported(): boolean
     {
         try
         {
             // Try to use basic methods of localStorage. 
             localStorage.setItem('__localstorage_support_test__', '');
             localStorage.getItem('__localstorage_support_test__');
             localStorage.removeItem('__localstorage_support_test__');
         }
         catch (e)
         {
             // If exception is thrown, then there is problem in local storage support.
             console.warn('LocalStorageUtil Not supported for this browser.');
             return false;
         }

         // local storage is suuported.
         return true;
     };

     /**
      * Sets an encoded string item in the local storage.
      * @param key Key of the item to be stored.
      * @param value Value of the item to be stored.
      */
     public static setItem(key: string, value: string): void
     {
         if (this.isSensitiveKey(key)) {
             // Add integrity check for sensitive data
             const checksum = this.generateChecksum(value);
             const dataWithChecksum = JSON.stringify({ data: value, checksum });
             SecureStorageUtil.setSecureItem(key, dataWithChecksum);
             
             // Also set as cookie for cross-subdomain access
             this.setCrossDomainCookie(key, dataWithChecksum);
         } else {
             localStorage.setItem(key, value);
             // Set non-sensitive data as cookie for cross-subdomain access
             this.setCrossDomainCookie(key, value);
         }
     };

     private static setCrossDomainCookie(key: string, value: string): void {
         // For localhost testing, use localhost domain without port
         const isLocalhost = window.location.hostname === 'localhost';
         const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1') || window.location.hostname.includes('local.cliniclead.app');
         
         let domain;
         if (isLocalhost) {
             // For localhost, don't set domain to share across ports
             domain = '';
         } else if (isLocal) {
             domain = '.local.cliniclead.app';
         } else {
             domain = window.location.hostname.includes('cliniclead.app') ? '.cliniclead.app' : window.location.hostname;
         }
         
         // Skip secure flag for local development
         const secureFlag = isLocal ? '' : 'secure; ';
         const domainPart = domain ? `domain=${domain}; ` : '';
         document.cookie = `${key}=${encodeURIComponent(value)}; ${domainPart}path=/; ${secureFlag}samesite=lax`;
     }

     private static getCrossDomainCookie(key: string): string | null {
         const cookies = document.cookie.split(';');
         for (let cookie of cookies) {
             const [cookieKey, cookieValue] = cookie.trim().split('=');
             if (cookieKey === key) {
                 return decodeURIComponent(cookieValue);
             }
         }
         return null;
     }

     private static removeCrossDomainCookie(key: string): void {
         const isLocalhost = window.location.hostname === 'localhost';
         const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1') || window.location.hostname.includes('local.cliniclead.app');
         
         let domain;
         if (isLocalhost) {
             domain = '';
         } else if (isLocal) {
             domain = '.local.cliniclead.app';
         } else {
             domain = window.location.hostname.includes('cliniclead.app') ? '.cliniclead.app' : window.location.hostname;
         }
         
         const domainPart = domain ? `domain=${domain}; ` : '';
         document.cookie = `${key}=; ${domainPart}path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
     }

     /**
      * Sets an encoded object item in the local storage.
      * @param key Key of the item to be stored.
      * @param value Value of the item to be stored.
      */
     public static setItemObject<T>(key: string, value: T, ignoreLog:boolean=false): void
     {
         const json = JSON.stringify(value);
         if(!ignoreLog) console.log("setItemObject - json: ", json);
         this.setItem(key, json);
     };

     /**
      * Gets the decoded string item from the local storage.
      * @param key Key of the item to be retrieved.
      * @returns String value against the given key.
      */
     public static getItem(key: string): string | null
     {
         if (this.isSensitiveKey(key)) {
             let secureData = SecureStorageUtil.getSecureItem(key);
             
             // If not found in secure storage, try cookie (for cross-subdomain)
             if (!secureData) {
                 secureData = this.getCrossDomainCookie(key);
                 if (secureData) {
                     // Store back in secure storage for future use
                     SecureStorageUtil.setSecureItem(key, secureData);
                 }
             }
             
             if (!secureData) return null;
             
             try {
                 const parsed = JSON.parse(secureData);
                 const expectedChecksum = this.generateChecksum(parsed.data);
                 
                 // Verify integrity
                 if (parsed.checksum !== expectedChecksum) {
                     console.warn('Data integrity check failed for key:', key);
                     this.removeItem(key); // Remove tampered data
                     return null;
                 }
                 
                 return parsed.data;
             } catch {
                 // If parsing fails, data might be tampered
                 this.removeItem(key);
                 return null;
             }
         }
         
         // Check localStorage first
         let value = localStorage.getItem(key);
         
         // If not found in localStorage, try cookie (for cross-subdomain)
         if (!value) {
             value = this.getCrossDomainCookie(key);
             if (value) {
                 // Store back in localStorage for future use
                 localStorage.setItem(key, value);
             }
         }
         
         return value;
     };

     /**
      * Gets the the decoded object item from the local storage.
      * @param key Key of the item to be retrieved.
      * @returns Object of type T against the given key.
      */
     public static getItemObject<T>(key: string): T | null
     {
         // Check if the value for given key is null.
         if (this.getItem(key) === null)
         {
             return null;
         }

         // Parse and return the JSON object.
         const value = this.getItem(key);
         // console.log("getItemObject - Value: ", value);
         if (value !== null && value !== undefined) {
            return JSON.parse(value) as T;
            // return null;
                     
        } else {
            return null;
        }
     };

     public static removeItem(key: string): void
     {
         if (this.isSensitiveKey(key)) {
             SecureStorageUtil.removeSecureItem(key);
         } else {
             localStorage.removeItem(key);
         }
         // Also remove from cookies
         this.removeCrossDomainCookie(key);
     }

     public static removeAllTokensWithPrefix (keyPrefix: string) {
        for(var i =0; i < localStorage.length; i++){
            let lsKey: string | null = localStorage.key(i);
            if (lsKey?.startsWith(keyPrefix)) {
                console.log("Removing LocalStorage Key: ", lsKey)
                localStorage.removeItem(lsKey);
            }
        }
     }

 }; // End of class: LocalStorageUtil