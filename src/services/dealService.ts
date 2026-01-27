import { CancelTokenSource } from "axios";
import { Deal, DealExport } from "../models/deal";
import { BaseService } from "./BaseService";
import { IsMockService } from "../others/util";

export class DealService extends BaseService<Deal>{
    constructor(errorHandler: any){
        super("Deal", "Deal", errorHandler);
    }

    getDeals(axiosCancel?: CancelTokenSource){
        return this.getItems(axiosCancel, 'Deal/GetDealDetails')
    }

    getDealsById(dealId:number, axiosCancel?: CancelTokenSource){
        return this.getItems(axiosCancel, IsMockService() ?  'mockData/deals.json' : 'Deal/'+dealId)
    }
    getDealsByPersonId(personId: number, axiosCancel?: CancelTokenSource) { // Add this method
        return this.getItems(axiosCancel, IsMockService() ? 'mockData/dealsByPerson.json' : `Deal/GetDealsByPersonId/${personId}`);
    }

    deleteDeal(dealId:number){
        return this.delete(dealId, "Deal");
    }

    updateAllDeals(deals: Partial<Deal>[], axiosCancel?: CancelTokenSource) {
        return this.putItemBySubURL(deals, 'UpdateAllDeals', axiosCancel);
    }

    searchDeals(searchTerm: string, axiosCancel?: CancelTokenSource) {
        const apiUrl = IsMockService() ? 'mockData/searchDeals.json' : 'Deal/Search';
        return this.getItems(axiosCancel, `${apiUrl}?searchTerm=${encodeURIComponent(searchTerm)}`);
    }

    exportDeal(exportDeal:DealExport, axiosCancel?: CancelTokenSource){
        return this.postItemBySubURL(exportDeal, `ExportDeal`)
    }
    
    importDeal(deals: any[], axiosCancel?: CancelTokenSource){
        return this.postItemBySubURL(deals, `ImportDeal`)
    }
    
    syncCallLogs(payload: any, axiosCancel?: CancelTokenSource) {
        return this.postItemBySubURL(payload, 'SyncCallLogs');
      }
      
}