import {
	Component,
	OnInit
} from "@angular/core";
import { LoginResponse, DataService } from "../../../shared/services/data/data.service"
//import { Http } from "@angular/Http"
import { ConfigService, UserProfile } from "../../../shared/services/config/config.service";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
@Component({
	selector: ".content_inner_wrapper",
	templateUrl: "./login.component.html",
	styleUrls: ["./login.component.scss"]
})

export class LoginComponent implements OnInit {

	public username: string;
	public password: string;

	constructor(public router: Router, private config: ConfigService, private data: DataService) {

	}

	signIn() {
		this.data.login(this.username, this.password).subscribe(resData => {
			if (resData.error) {
				alert(resData.error.message);
			} else {
				let loginDetails = resData.data;
				this.config.profile = {
					user: loginDetails.name,
					userEmail: loginDetails.name,
					userId: loginDetails.userId,
					accessToken: loginDetails.accessToken
				};

				localStorage.setItem("profile", JSON.stringify(this.config.profile));

				if (this.config.profile.accessToken)
					this.router.navigate(['/chat']);
				else
					this.router.navigate(['/']);
			}
		})
	}

	ngOnInit() {
		let savedProfile = JSON.parse(localStorage.getItem("profile")) as UserProfile;
		if (savedProfile && savedProfile.accessToken) {
			this.config.profile = savedProfile;
			this.router.navigate(['/chat']);
		}
	}
}
