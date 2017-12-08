import { Http, Headers, Response, Jsonp, RequestOptions } from "@angular/http";
import { HttpParams } from "@angular/common/http"
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { ConfigService } from "../config/config.service"
import "rxjs/Rx";
import "rxjs/add/operator/map";
import "rxjs/add/operator/toPromise";
import "rxjs/add/operator/catch";
import { timestamp } from "rxjs/operator/timestamp";
//import { ConfigService } from "../config/config.service"
@Injectable()
export class DataService {

	baseURL: string;
	constructor(private http: Http, private _config: ConfigService) { }

	// getProfile = (): Observable<Response> => {
	//   return this.http
	//     .get("api/my-profile")
	//     .map(res => res.json());
	// };

	getChatDetails() {
		let headers = new Headers({ 'access-token': this._config.profile.accessToken });
		let options = new RequestOptions({ headers: headers });
		return this.http.get(this._config.app.webSocketEndPoint + "/api/agents/" + this._config.profile.userId + "/chats", options).map(res => res.json());
	};

	getHistory(customerId, businessId, pageSize, pageNumber, timeStamp?: number) {
		let myparams = new URLSearchParams();
		myparams.append("userId", customerId);
		myparams.append("businessId", businessId);
		myparams.append("size", pageSize);

		if (timeStamp)
			myparams.append("lastMessageTimeStamp", timeStamp.toString());
		else
			myparams.append("page", pageNumber);

		this.baseURL = this._config.app.apiGatewayEndPoint;
		// console.log("from history api" + myparams);
		return this.http.get(this.baseURL + "/chatdata/messages?" + myparams).map((res: Response) => res.json());
	};
	//   getContactsCardDemo = (): Observable<Response> => {
	//    return this.http
	//        .get("api/my-contacts")
	//        .map(res => res.json());
	//  };
	//    getMailDemo = (): Observable<Response> => {
	//      return this.http
	//        .get("api/mail")
	//        .map(res => res.json());
	//    };
	//    getListCardDemo = (): Observable<Response> => {
	//      return this.http
	//        .get("api/list")
	//        .map(res => res.json());
	//    };
	// 	 getChatContacts = (): Observable<Response> => {
	// 	 	return this.http
	// 	 		.get("api/chat-messages")
	// 	 		.map(res => res.json());
	// 	 };
	// 	getTabsOverCard = (): Observable<Response> => {
	// 	 	return this.http
	// 	 		.get("api/tabs-over-card")
	// 	 		.map(res => res.json());
	// 	 };
	// 	 getContacts = (): Observable<Response> => {
	// 	 	return this.http
	// 	 		.get("api/my-contacts")
	// 	 		.map(res => res.json());
	// 	 };
}
