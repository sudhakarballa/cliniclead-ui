import { IControl } from "../models/iControl";
import * as Yup from "yup";
import moment from "moment";
import LocalStorageUtil from "./LocalStorageUtil";
import Constants from "./constants";
import { UserProfile } from "../models/userProfile";
import { Utility } from "../models/utility";
import SecureNavService from "../services/secureNavService";
import RoleValidator from "./RoleValidator";

export default class Util {
  static navItemsList: Array<any> = [];

  public static loadNavItemsForUser = (role: number) => {
    Util.navItemsList =
      window.config.NavItemsForUser.find((i) => i.Role == role)?.NavItems ?? [];
  };

  public static isAuthorized = (item: string): boolean => {
    const authorized = Util.navItemsList.some(
      (i) => i.toLowerCase() === item.toLowerCase()
    );
    console.log(`🔐 Checking permission for "${item}" → ${authorized}`);
    return authorized;
  };

  // Simple role management - just change the key name
  public static setUserRole(role: number): void {
    localStorage.setItem('sys_perm_data', role.toString());
    // Store a hash to detect tampering
    localStorage.setItem('sys_check', btoa(role.toString() + 'plms2024'));
  }

  public static getUserRole(): number | null {
    const roleStr = localStorage.getItem('sys_perm_data');
    const checkStr = localStorage.getItem('sys_check');
    
    if (!roleStr || !checkStr) return null;
    
    const role = parseInt(roleStr, 10);
    if (![0, 1, 2, 3].includes(role)) return null;
    
    // Verify integrity
    const expectedCheck = btoa(role.toString() + 'plms2024');
    if (checkStr !== expectedCheck) {
      console.warn('Role tampering detected');
      this.clearSession();
      return null;
    }
    
    return role;
  }

  public static isMasterAdmin(): boolean {
    const role = this.getUserRole();
    return role === 0; // Role 0 = Master Admin
  }
  
  private static clearSession(): void {
    alert('Session expired due to security violation. Please login again.');
    localStorage.clear();
    window.location.replace(window.config.HomePage + '/Login');
  }



  public static capitalizeFirstLetter = (string: any) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  public static UserProfile = () => {
    // This method is deprecated - use useAuthContext() instead
    console.warn('Util.UserProfile() is deprecated. Use useAuthContext() hook instead.');
    return null as any;
  };

  public static convertTZ = (dateTime: any) => {
    return moment(new Date(Util.toLocalTimeZone(dateTime + "Z"))).format(
      "MM/DD/YYYY hh:mm:ss a"
    ) as any;
  };

  public static toLocalTimeZone = (
    dateTime: any,
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  ) => {
    return new Date(dateTime).toLocaleString("en-US", { timeZone: timeZone });
  };

  public static buildValidations = (controlsList: IControl[]) => {
    const validateObj = {};
    controlsList
      ?.filter((i) => !i.hidden || Util.isNullOrUndefinedOrEmpty(i.hidden))
      .map((field: any) => {
        if (field.isRequired && !field.disabled) {
          if (field.min && !field.max) {
            Object.assign(validateObj, {
              [field.value]: Yup.string()
                .required(`${field.key} is required`)
                .min(
                  field.min,
                  `${field.key} must be atleast ${field.min} chars`
                )
                .matches(field.regex1 ?? "", field.errMsg1)
                .matches(field.regex2 ?? "", field.errMsg2)
                .matches(field.regex3 ?? "", field.errMsg3)
                .nullable(),
            });
          }
          if (field.max && !field.min) {
            Object.assign(validateObj, {
              [field.value]: Yup.string()
                .required(`${field.key} is required`)
                .max(field.max, `${field.key} must be max ${field.max} chars`)
                .matches(field.regex1 ?? "", field.errMsg1)
                .matches(field.regex2 ?? "", field.errMsg2)
                .matches(field.regex3 ?? "", field.errMsg3)
                .nullable(),
            });
          }
          if (!field.max && !field.min) {
            Object.assign(validateObj, {
              [field.value]: Yup.string()
                .required(`${field.key} is required`)
                .matches(field.regex1 ?? "", field.errMsg1)
                .matches(field.regex2 ?? "", field.errMsg2)
                .matches(field.regex3 ?? "", field.errMsg3)
                .nullable(),
            });
          }
          if (field.min && field.max) {
            Object.assign(validateObj, {
              [field.value]: Yup.string()
                .required(`${field.key} is required`)
                .min(
                  field.min,
                  `${field.key} must be atleast ${field.min} chars`
                )
                .max(field.max, `${field.key} must be max ${field.max} chars`)
                .matches(field.regex1 ?? "", field.errMsg1)
                .matches(field.regex2 ?? "", field.errMsg2)
                .matches(field.regex3 ?? "", field.errMsg3)
                .nullable(),
            });
          }
        } else {
          Object.assign(validateObj, {
            [field.value]: Yup.string().nullable(),
          });
        }
      });
    return validateObj;
  };

  public static isNullOrUndefined(list: any): boolean {
    return list === null || list === undefined;
  }

  public static isNullOrUndefinedOrEmpty(list: any): boolean {
    return list === null || list === undefined || list.length === 0;
  }

  public static isListNullOrUndefinedOrEmpty(list: any): boolean {
    return (
      list === null ||
      list === undefined ||
      list.length === 0 ||
      (list.length === 1 && (list[0] === null || list[0] === ""))
    );
  }

  public static truncateValue(itemValue: string, size: number = 15): string {
    if (size < 4) return itemValue;
    if (itemValue && itemValue.length > size) {
      itemValue = itemValue.substring(0, size - 3) + "...";
    }
    return itemValue;
  }

  public static clone<T>(obj: T): T {
    let objJSONStr: string = JSON.stringify(obj);
    let parsedJSON = JSON.parse(objJSONStr);
    // let rtnClone: T = <T>Object.create(parsedJSON);
    let rtnClone: T = <T>parsedJSON;
    // console.log("Clone - obj: ", obj, " | objJSONStr: ", objJSONStr, " | JSON.parse(objJSON): ", parsedJSON, " | rtnClone: ", rtnClone);
    console.log("clone - obj: ", obj, " | rtnClone: ", rtnClone);
    return rtnClone;
    // return <T>Object.create(JSON.parse(JSON.stringify(obj)));
    // return {...obj};
  }

  public static toClassObject(item: any, data: any) {
    //updates item props with data props
    Object.keys(item).forEach((key: any) => {
      if (data[key] != null) {
        item[key] = data[key] ? data[key] : null;
      }
    });
    return item;
  }

  public static sortList(
    list: Array<any>,
    sortBy: any = "name",
    order = "asc"
  ) {
    return (list = list.sort(this.compareValues(sortBy, order)));
  }

  static compareValues(key: any, order: any) {
    return function innerSort(a: any, b: any) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        // property doesn't exist on either object
        return 0;
      }

      const varA = typeof a[key] === "string" ? a[key].toUpperCase() : a[key];
      const varB = typeof b[key] === "string" ? b[key].toUpperCase() : b[key];

      let comparison = 0;
      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
      return order === "desc" ? comparison * -1 : comparison;
    };
  }

  static getUserNameById(userId: number) {
    let utility: Utility = JSON.parse(
      LocalStorageUtil.getItemObject(Constants.UTILITY) as any
    );
    return utility?.persons?.find((u) => u.personID == userId)?.personName;
  }

  public static toDateFormat(date: any) {
    return moment(date, "YYYY-MM-DD").format("YYYY-MM-DD");
  }

  public static capitalizeFirstChar(inputString: string): string {
    return inputString && inputString[0].toUpperCase() + inputString.slice(1);
  }

  public static formatDateToBrowserTimezone(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  public static removeDuplicates(array: Array<any>, property: string) {
    // Step 1: Create an empty object to keep track of unique items
    let uniqueMap: any = {};

    // Step 2: Use filter() and map() to iterate over each item in the array
    let result = array.filter((item) => {
      // Step 3: For each item, extract the value of the specified property
      let key = item[property];

      // Step 4: Check if the key exists in uniqueMap
      // If it does, return false (filter out this item)
      // If it doesn't, add this key to uniqueMap and return true
      return uniqueMap.hasOwnProperty(key) ? false : (uniqueMap[key] = true);
    });

    return result;
  }
}

export const IsMockService = () => window.config.UseMockService;
