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

@Injectable()
export class DataService {

	baseURL: string;
	constructor(private http: Http, private config: ConfigService) { }

	private getHeaders() {
		let headers = new Headers();
		if (this.config.profile.accessToken)
			headers.set('access-token', this.config.profile.accessToken);
		return headers;
	}

	getChatDetails() {
		return this.http.get(this.config.app.webSocketEndPoint + "/api/agents/" + this.config.profile.userId + "/chats", { headers: this.getHeaders() })
			.map(res => res.json() as AgentChatsResponse);
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

		this.baseURL = this.config.app.apiGatewayEndPoint;
		return this.http.get(this.baseURL + "/chatdata/messages?" + myparams, { headers: this.getHeaders() })
			.map((res: Response) => res.json());
	};

	login(username, password) {
		return this.http.post(this.config.app.apiGatewayEndPoint + "/auth/login", {
			username: username,
			password: password
		}).map(res => res.json() as LoginResponse)
	}

	logout() {
		localStorage.removeItem("profile");
	}
}

export interface LoginData {
	userId: string;
	username: string;
	accessToken: string;
	name: string;
	roles: UserRole[];
}

export interface ErrorInfo {
	code: string;
	status: number;
	message: string;
	timestamp: number;
	errors: any[];
}

export interface LoginResponse {
	error: ErrorInfo;
	data: LoginData;
}

export interface UserRole {
	id: number;
	role: string;
	description: string;
	label: string;
	enabled: boolean;
}


export interface ChatCustomerInfo {
	id: number;
	customerId: string;
	businessId: string;
	agentId: string;
	assignedAt: any;
	unreadCount: number;
	status: number;
	created_at: any;
	last_message_time: any;
}

export interface AgentChatsData {
	content: ChatCustomerInfo[];
	last: boolean;
	totalElements: number;
	totalPages: number;
	first: boolean;
	numberOfElements: number;
	size: number;
	number: number;
}

export interface AgentChatsResponse {
	data: AgentChatsData;
	error: ErrorInfo;
}