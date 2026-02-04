/// <reference types="react-scripts" />
declare global {
    interface Window {
        config: {
            ServicesBaseURL: string;
            DefaultStages:Array<string>;
            UseMockService:boolean;
            DisableDotDigitalAPI:boolean;
            CampaignSections:Array<string>;
            ClientId:string;
            DateFormat:string;
            NavItemsForUser:Array<any>;
            RedirectUri:string;
            HomePage:string;
            NavItemActiveColor:string;
            SMSServiceURL:string;
            Pagination: {
                defaultPageSize: number;
                pageSizeOptions: number[];
            };
            SessionTimeout: {
                idleTimeoutSeconds: number;
                maxSessionTimeoutMinutes: number;
            };
        }
    }
}

export {};