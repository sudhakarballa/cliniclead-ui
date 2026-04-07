import { CancelTokenSource } from "axios";
import { BaseService } from "./BaseService";


export class AccountService extends BaseService<any> {
    constructor(errorHandler: any) {
        super("account", "Account", errorHandler);
      }
    enableTwoFactorAuthentication(userId: number, enabled: boolean, axiosCancel?: CancelTokenSource) {
        return this.postItemBySubURL({ userId, twoFactorEnabled: enabled }, "enable-2fa", false, false, axiosCancel);
      }
}