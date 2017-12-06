import {
  Component,
  OnInit
} from "@angular/core";
import {LoginService,LoginResponse} from "../../../shared/services/login.service"
//import { Http } from "@angular/Http"
import { ConfigService } from "../../../shared/services/config/config.service";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
@Component({
  selector: ".content_inner_wrapper",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"]
})

export class LoginComponent implements OnInit {
  toggleRegister: boolean = false;
  public username:string;
  public password:string;
  loginDetails={} as LoginResponse

  constructor(public router: Router,private _config:ConfigService,private _login:LoginService) {
   
  }

  onClick(){
    
    this._login.login(this.username,this.password).subscribe(resData=>{
      this.loginDetails=resData
      this._config.profile.user=this.loginDetails.name
      this._config.profile.userEmail=this.username
      this._config.profile.userId=this.loginDetails.userId
      this._config.profile.accessToken=this.loginDetails.accessToken
      localStorage.setItem("access_token",this._config.profile.accessToken)
      if(this.loginDetails.accessToken)
        this.router.navigate(['./chat'])
      //console.log(JSON.stringify(resData))
      else
        this.router.navigate(['/']);  
    })

    // this._config.profile.user=this.username;
    //  this._config.profile.userEmail=this.username;
    //   this._config.profile.userId=this.username;
    //    this._config.profile.accessToken="ASasA";
   
   // this.router.navigate(['./dashboards']);  

  }

  ngOnInit() {
  }

  onLoggedin() {
    localStorage.setItem('isLoggedin', 'true');
  }
}
