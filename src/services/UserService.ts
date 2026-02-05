import { CancelTokenSource } from "axios";
import { User } from "../models/user";
import { IsMockService } from "../others/util";
import { BaseService } from "./BaseService";
import { VisibilityGroup } from "../models/visibilityGroup";

export class UserService extends BaseService<User> {
  constructor(errorHandler: any) {
    super("ManageUser", "ManageUser", errorHandler);
  }

  getUsers(axiosCancel?: CancelTokenSource) {
    return this.getItems(axiosCancel, 'ManageUser/GetUsers');
  }

  changePassword(userId:number){
    return this.getItemsBySubURL(`ResetUserPassword/${userId}`)
  }

 
  getUserById(userId: number, axiosCancel?: CancelTokenSource) {
    return this.getItems(axiosCancel, IsMockService() ? 'mockData/users.json' : `ManageUser/${userId}`);
}

  deleteUser(userId: number) {
    return this.delete(userId, `User/${userId}`);
  }
  
  getRoles(axiosCancel?: CancelTokenSource) {
    return this.getItems(axiosCancel, 'Role/GetAllRoles'); // Adjust the API endpoint as necessary
  }

  getOrganizations(axiosCancel?: CancelTokenSource) {
    return this.getItems(axiosCancel, 'Organization/GetAllOrganizationDetails'); // Adjust the API endpoint as necessary
  }

confirmEmail(userId: string, token: string) {
  const encToken = encodeURIComponent(token);           // ✅ good
  const encUserId = encodeURIComponent(userId);         // (also safe)
  return this.getItems(
    undefined,
    `ManageUser/ConfirmEmail?userId=${encUserId}&token=${encToken}`
  );
}
resendConfirmation(userId: number | string) {
  return this.postItemBySubURL({ userId }, "ResendConfirmation", false, true);
}

unlockUser(userId: number) {
  return this.postItemBySubURL({}, `unlock/${userId}`, false, true);
}
}

