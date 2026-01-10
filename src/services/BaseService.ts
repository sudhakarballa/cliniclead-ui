import axios, { AxiosResponse, AxiosError, CancelTokenSource } from "axios";
import { toast } from 'react-toastify';
import { getActiveUserToken } from "../others/authUtil";
import { APIResult } from "./APIResult";
import { AuditItem } from "../models/base/AuditNamedItem";
import { IsMockService } from "../others/util";
import { waitForAuth } from "../utils/authGate";

const baseURL = window?.config?.ServicesBaseURL;

export class BaseService<TItem extends AuditItem>{
    urlSuffix: string = "";
    itemName: any;
    errorHandler: any;

    constructor(urlSuffix: any, itemName: any, errorHandler: any) {
        this.urlSuffix = urlSuffix;
        this.itemName = itemName;
        this.errorHandler = errorHandler;
    }

    getItems(axiosCancel?: CancelTokenSource, customURL?: String) {
        console.log("GET - URL: ", `${baseURL}/${this.urlSuffix}`);
        var promise = new Promise<any>((resolve, reject) => {
            waitForAuth().then(() => {
                axios({
                    method: 'GET',
                    url: IsMockService()? customURL as any :  `${baseURL}/${customURL ? customURL : this.urlSuffix}`,
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8',
                        'Media-type': 'application/json',
                        'Authorization': `Bearer ${getActiveUserToken()}`
                    },
                    cancelToken: axiosCancel?.token
                }).then((res: AxiosResponse) => {
                    console.log("getItems - res: ", res);
                    resolve(res?.data);
                }).catch((err: AxiosError) => {
                    reject(err);
                });
            }).catch(reject);
        });
        return promise;
    }

    getItemsBySubURL(urlSuffix2: string, axiosCancel?: CancelTokenSource, isTokenOptional: boolean = false) {
        console.log("GET - URL: ", `${baseURL}/${this.urlSuffix}/${urlSuffix2}`);
        var promise = new Promise<any>((resolve, reject) => {
            if (isTokenOptional) {
                axios({
                    method: 'GET',
                    url:  `${baseURL}/${this.urlSuffix}/${urlSuffix2}`,
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8',
                        'Media-type': 'application/json'
                    },
                    cancelToken: axiosCancel?.token
                }).then((res: AxiosResponse) => {
                    resolve(res?.data);
                }).catch(reject);
            } else {
                waitForAuth().then(() => {
                    axios({
                        method: 'GET',
                        url:  `${baseURL}/${this.urlSuffix}/${urlSuffix2}`,
                        headers: {
                            'Content-Type': 'application/json; charset=UTF-8',
                            'Media-type': 'application/json',
                            'Authorization': `Bearer ${getActiveUserToken()}`
                        },
                        cancelToken: axiosCancel?.token
                    }).then((res: AxiosResponse) => {
                        resolve(res?.data);
                    }).catch(reject);
                }).catch(reject);
            }
        });
        return promise;
    }

    getItemsByRelativeURL(url: string, axiosCancel?: CancelTokenSource, isTokenOptional: boolean = false) {
        console.log("GET - URL: ", `${baseURL}/${this.urlSuffix}/${url}`, " | Token: ", getActiveUserToken());
        var promise = new Promise<any>((resolve, reject) => {
            if (isTokenOptional) {
                axios({
                    method: 'GET',
                    url:  url,
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8',
                        'Media-type': 'application/json'
                    },
                    cancelToken: axiosCancel?.token
                }).then((res: AxiosResponse) => {
                    console.log("getItemsBySubURL - res: ", res);
                    resolve(res?.data);
                }).catch(reject);
            } else {
                waitForAuth().then(() => {
                    axios({
                        method: 'GET',
                        url:  url,
                        headers: {
                            'Content-Type': 'application/json; charset=UTF-8',
                            'Media-type': 'application/json',
                            'Authorization': `Bearer ${getActiveUserToken()}`
                        },
                        cancelToken: axiosCancel?.token
                    }).then((res: AxiosResponse) => {
                        console.log("getItemsBySubURL - res: ", res);
                        resolve(res?.data);
                    }).catch(reject);
                }).catch(reject);
            }
        });
        return promise;
    }

    getItem(id: number, mockDataUrl?:string, axiosCancel?: CancelTokenSource) {

        var promise = new Promise<any>((resolve, reject) => {
            axios({
                method: 'GET',
                url: IsMockService() ? mockDataUrl : `${baseURL}/${this.urlSuffix}/${id}`,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Media-type': 'application/json',
                    'Authorization': `Bearer ${getActiveUserToken()}`
                },
                cancelToken: axiosCancel?.token
            }).then((res: any) => {
                console.log("getItem - res: ", res);
                resolve(IsMockService() ? (res.data as Array<any>).find(i=>i.id==id) : res.data);
            }).catch((err: AxiosError) => {
                console.log("Exception Occurred - res: ", err, " | Code: ", err.code, " | err.message", err.message,);
                reject(err);
            })
        });
        return promise;
    }

    postOrPutItem(item: any, axiosCancel?: CancelTokenSource) {
        return this.postItem(item, axiosCancel);
    }

    postItem(item: TItem, axiosCancel?: CancelTokenSource, ignoreToastr: boolean = false) {

        item = this.updateAuditDetails(item);
        console.log("postItem - URL: ", `${baseURL}/${this.urlSuffix}`, " | JSON Item: ", JSON.stringify(item));

        var promise = new Promise<any>((resolve, reject) => {
            axios({
                method: 'POST',
                url: `${baseURL}/${this.urlSuffix}`,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Media-type': 'application/json',
                    'Authorization': `Bearer ${getActiveUserToken()}`
                },
                data: item,
                cancelToken: axiosCancel?.token
            }).then((res: AxiosResponse) => {
                console.log("postItem - res: ", res);
                
                resolve(res.data);
            }).catch((err: AxiosError) => {
                console.log("Exception Occurred - res: ", err, " | Code: ", err.code, " | err.message", err.message,);
            });
        });
        return promise;
    }

    uploadFile(item: FormData, urlSuffix2: string, axiosCancel?: CancelTokenSource) {
        ;
        console.log("postItem - URL: ", `${baseURL}/${this.urlSuffix}/${urlSuffix2}`, " | JSON Item: ", JSON.stringify(item));

        var promise = new Promise<any>((resolve, reject) => {
            axios({
                method: 'POST',
                url: `${baseURL}/${this.urlSuffix}/${urlSuffix2}`,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Media-type': 'application/json',
                    'Authorization': `Bearer ${getActiveUserToken()}`
                },
                data: item,
                cancelToken: axiosCancel?.token
            }).then((res: AxiosResponse) => {
                console.log("postItem - res: ", res);
                if (!res.data?.result?.hasOwnProperty("message")) {
                    resolve(res.data?.result);
                    toast.success(`${this.itemName} uploaded successfully`, { autoClose: 3000 });
                }
                resolve(res);
            }).catch((err: AxiosError) => {
                console.log("Exception Occurred - res: ", err, " | Code: ", err.code, " | err.message", err.message,);
            });
        });
        return promise;
    }

    updateAuditDetails = (item: TItem) => {
        // let obj = item;
        // if (obj) {
        //     item.id == 0 ? obj.createdBy = getLoggedInUserName()
        //         : obj.updatedBy = getLoggedInUserName();
        // }

        return item;
    }

    postItemBySubURL(item: any, urlSuffix2: string,
        suppressToasterMessage: boolean = false,
        ignoreToastr: boolean = false,
        axiosCancel?: CancelTokenSource) {
            
        console.log("postItemBySubURL - URL: ", `${baseURL}/${this.urlSuffix}/${urlSuffix2}`,
            " | item: ", JSON.stringify(item));
        item = this.updateAuditDetails(item);
        let isItemasCollection = Array.isArray(item); // checking if item has been passed as array
        var promise = new Promise<any>((resolve, reject) => {

            axios({
                method: 'POST',
                url:  `${baseURL}/${this.urlSuffix}/${urlSuffix2}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': IsMockService()? null : `Bearer ${getActiveUserToken()}`
                },
                data: JSON.stringify(item),
                cancelToken: axiosCancel?.token
            }).then((res: AxiosResponse) => {
                console.log("postItemBySubURL - res: ", res);
                resolve(res.data);
                if (res.data?.success) {
                    resolve(res.data?.result);

                }
                else {
                    resolve(res.data?.message);
                }
            }).catch((err: AxiosError) => {
                console.log("Exception Occurred - res: ", err, " | Code: ", err.code, " | err.message", err.message,);
                reject(err);

            });
        });
        return promise;
    }

    putItemBySubURL(item: any, urlSuffix2: string,
        axiosCancel?: CancelTokenSource) {
        console.log("postItemBySubURL - URL: ", `${baseURL}/${this.urlSuffix}/${urlSuffix2}`,
            " | item: ", JSON.stringify(item));
        item = this.updateAuditDetails(item);
        let isItemasCollection = Array.isArray(item); // checking if item has been passed as array
        var promise = new Promise<any>((resolve, reject) => {

            axios({
                method: 'PUT',
                url: `${baseURL}/${this.urlSuffix}/${urlSuffix2}`,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Media-type': 'application/json',
                    'Authorization': `Bearer ${getActiveUserToken()}`
                },
                data: item,
                cancelToken: axiosCancel?.token
            }).then((res: AxiosResponse) => {
                console.log("postItemBySubURL - res: ", res);
                
                if (res.data) {
                    resolve(res.data);

                }
                else {
                    resolve(res.data);
                }
            }).catch((err: AxiosError) => {
                console.log("Exception Occurred - res: ", err, " | Code: ", err.code, " | err.message", err.message,);
                reject(err);

            });
        });
        return promise;
    }

    getItemsbyPost(item: any, urlSuffix2: string,
        axiosCancel?: CancelTokenSource) { //using post instead of get to avoid max length issues in query string

        console.log("postItemBySubURL - URL: ", `${baseURL}/${this.urlSuffix}/${urlSuffix2}`,
            " | item: ", JSON.stringify(item));
        item = this.updateAuditDetails(item);
        var promise = new Promise<any>((resolve, reject) => {
            axios({
                method: 'POST',
                url: `${baseURL}/${this.urlSuffix}/${urlSuffix2}`,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Media-type': 'application/json',
                    'Authorization': `Bearer ${getActiveUserToken()}`
                },
                data: item,
                cancelToken: axiosCancel?.token
            }).then((res: AxiosResponse) => {
                console.log("getItem - res: ", res);
                resolve(res);
            }).catch((err: AxiosError) => {
                console.log("Exception Occurred - res: ", err, " | Code: ", err.code, " | err.message", err.message,);
                reject(err);
            })
        });
        return promise;
    }

    putItem(item: TItem, axiosCancel?: CancelTokenSource) {
        console.log("postItem - URL: ", `${baseURL}/${this.urlSuffix}`,
            " | item: ", JSON.stringify(item));
        item = this.updateAuditDetails(item);
        var promise = new Promise<any>((resolve, reject) => {
            axios({
                method: 'PUT',
                url: `${baseURL}/${this.urlSuffix}`,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Media-type': 'application/json',
                    'Authorization': `Bearer ${getActiveUserToken()}`
                },
                data: item,
                cancelToken: axiosCancel?.token
            }).then((res: AxiosResponse) => {
                console.log("putItem - res: ", res);
                if (!res.data?.result?.hasOwnProperty("message")) {
                    resolve(res.data?.result);
                    toast.success(`${this.itemName} updated successfully`, { autoClose: 3000 });
                }
                resolve(res);
            }).catch((err: AxiosError) => {
                console.log("Exception Occurred - res: ", err, " | Code: ", err.code, " | err.message", err.message,);
                reject(err);

                if (err && !err.message.includes('attr')) {
                    toast.error(`${this.itemName} update failed`, { autoClose: 3000 });
                }
            });
        });
        return promise;
    }

    delete(id: number, urlSuffix: string = "") {

        console.log("delete - URL: ", `${baseURL}/${this.urlSuffix}`, " | Item Id: ", id,
            " | getActiveUserToken(): ", getActiveUserToken());

        var promise = new Promise<any>((resolve, reject) => {
            axios({
                method: 'DELETE',
                url: `${baseURL}/${this.urlSuffix}/${id}`,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Media-type': 'application/json',
                    'Authorization': `Bearer ${getActiveUserToken()}`
                }
            }).then((res: AxiosResponse) => {
                console.log("delete - res: ", res);
                // TODO: Services needs to be updated to accurately pass the deleted id if deletion is successful or return 204. For the moment, if there is no exception, the assumption is delete is successful
                // if (!res.data?.result?.hasOwnProperty("message")) {
                //resolve(res.data?.result);
                resolve(res.data);
                // }
                resolve(res);
            }).catch((err: AxiosError) => {
                console.log("Exception Occurred - res: ", err, " | Code: ", err.code, " | err.message", err.message,);
                reject(err);
            });
        });
        return promise;
    }


    parseMsg(data: any) {
        let errMsg = data;
        let hasError = data.hasOwnProperty("exceptionMessage") && data.hasOwnProperty("message");

        if (!hasError) return errMsg;

        errMsg = data.exceptionMessage;
        let s = data && data.lastIndexOf('-');
        errMsg = s > 0 ? errMsg.substring(s + 1, errMsg.length) : errMsg;

        return errMsg;
    }
}