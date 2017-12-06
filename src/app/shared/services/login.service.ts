import {Injectable} from "@angular/core"
import {Http,RequestOptions,Headers} from "@angular/http"
//import {CanActivate} from "@angular/router"
import "rxjs/add/operator/map";
import {ConfigService} from "./config/config.service"
import { CanActivate } from "@angular/router/src/interfaces";
import {LoginComponent} from "../../pages/authentication/login/login.component"
@Injectable()

export class LoginService implements CanActivate
{
    loginDetails={}
    activate:boolean
    loginCredentials={} as LoginRequestData;
    loginResponse ={} as LoginResponse; 
    constructor(private _http:Http,private config:ConfigService){}
    canActivate(){
        if(this.activate)
            return true;
        else
            return false;
    }
    login(username,password){
        console.log("username "+username+" password "+password)
        this.loginCredentials.username=username;
        this.loginCredentials.password=password;
        let headers = new Headers({ 'Content-Type': 'application/json;charset=UTF-8' });
        let options = new RequestOptions({ headers: headers });
        
        
        console.log(JSON.stringify(this.loginCredentials))
       // this.loginResponse.name="agent1"
        //this.loginResponse.userId=username;
        //this.loginResponse.accessToken="SasAS";
        //this.loginResponse.username=username;        
       return this._http.post(this.config.app.apiGatewayEndPoint+"/auth/login",JSON.stringify(this.loginCredentials),options).map(res=>{;
        if(res.status==200 || localStorage.getItem("access_token"))
        {
            this.activate=true;
            return res.json()
        }
        })
       
    }
}

export interface LoginRequestData{
    username:string,
    password:string
}

export interface LoginResponse{
    userId:string,
    username:string,
    accessToken:string,
    name:string,
    roles:any[]
}