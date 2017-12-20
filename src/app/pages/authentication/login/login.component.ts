import {
	Component,
	OnInit
} from "@angular/core";
import { LoginResponse, DataService } from "../../../shared/services/data/data.service"
//import { Http } from "@angular/Http"
import { ConfigService, UserProfile } from "../../../shared/services/config/config.service";
import { InfoDialogService } from '../../../shared/services/helpers/info-dialog.service';
import { Router } from "@angular/router";
import { Observable } from "rxjs";
@Component({
	selector: ".content_inner_wrapper",
	templateUrl: "./login.component.html",
	styleUrls: [
		"./login.component.scss",
		"./login.component.css"
	]
})

export class LoginComponent implements OnInit {

	public username: string;
	public password: string;

	constructor(public router: Router, private config: ConfigService, private data: DataService, private infoDialog: InfoDialogService) {

	}

	signIn() {
		this.data.login(this.username, this.password).subscribe(resData => {
			if (resData.error)
				this.infoDialog.alert('Unable to login', resData.error.message);
			else {
				let userProfile = this.config.getUserProfileFromLoginDetails(resData.data);
				if (userProfile.accessToken) {
					this.config.profile = userProfile;
					localStorage.setItem("profile", JSON.stringify(this.config.profile));
					this.router.navigate(['/chat']);
				}
				else
					this.router.navigate(['/']);
			}
		}, err => {
			try {
				let resp = JSON.parse(err._body);
				if (resp.error.message)
					this.infoDialog.alert('Unable to login', resp.error.message);
			} catch (e) {
				this.infoDialog.alert(`Oops! Something went wrong!`, err.statusText);
			}
		})
	}

	ngOnInit() {
		let savedProfile = JSON.parse(localStorage.getItem("profile")) as UserProfile;
		if (savedProfile && savedProfile.accessToken) {
			this.data.isAccessTokenValid(savedProfile.accessToken).subscribe(resp => {
				if (resp.error) {
					this.data.logout();
					this.router.navigateByUrl('/');
				}
				else {
					this.config.profile = savedProfile;
					this.router.navigateByUrl('/chat');
				}
			}, err => {
				if (err.status == 401) {
					this.data.logout();
					this.router.navigateByUrl('/');
				} else
					this.infoDialog.alert(`Unexpected error occured!`, err.message);
			});
		}
	}
}
