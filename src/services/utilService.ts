import { CancelTokenSource } from "axios";
import { Stage } from "../models/stage";
import { BaseService } from "./BaseService";
import { Utility } from "../models/utility";
import { IsMockService } from "../others/util";

export class UtilService extends BaseService<Utility>{
    constructor(errorHandler: any){
        super("Utility", "Utility", errorHandler);
    }

    getDropdownValues(axiosCancel?: CancelTokenSource){
        return this.getItemsBySubURL(IsMockService() ? 'mockData/utility.json' : "GetAllDropdonws");
    }
}