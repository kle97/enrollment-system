import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import {
	adminLogin,
	login,
	loginFail,
	loginSuccess,
	logout,
	logoutFail,
	logoutSuccess,
} from "./authentication.actions";
import { catchError, exhaustMap, map } from "rxjs/operators";
import { AuthenticationService } from "../../services/authentication.service";
import { AuthenticationUser } from "../../models/authentication-user.model";
import { CookieService } from "ngx-cookie";
import { of } from "rxjs";
import { Router } from "@angular/router";
import { ErrorNotificationService } from "../../services/error-notification.service";

@Injectable()
export class AuthenticationEffects {

	constructor(
		private actions$: Actions,
		private authenticationService: AuthenticationService,
		private cookieService: CookieService,
		private router: Router,
		private errorNotificationService: ErrorNotificationService,
	) {
	}

	adminLogin$ = createEffect(() => this.actions$.pipe(
		ofType(adminLogin),
		exhaustMap(action => {
			return this.authenticationService.adminLogin(action.username, action.password, action.secretKey).pipe(
				map((user: AuthenticationUser) => {
					let expiry = Date.now() + Number(this.cookieService.get("REFRESH-TOKEN-TTL")) * 1000;

					this.router.navigate([this.authenticationService.adminHomepage]);
					return loginSuccess({ user, expiry });
				}),
				catchError(errorResponse => {
					this.errorNotificationService.open(errorResponse);
					return of(loginFail());
				}),
			);
		}),
	));

	login$ = createEffect(() => this.actions$.pipe(
		ofType(login),
		exhaustMap(action => {
			return this.authenticationService.login(action.username, action.password).pipe(
				map((user: AuthenticationUser) => {
					let expiry = Date.now() + Number(this.cookieService.get("REFRESH-TOKEN-TTL")) * 1000;

					this.router.navigate([this.authenticationService.redirectUrl]);
					return loginSuccess({ user, expiry });
				}),
				catchError(errorResponse => {
					this.errorNotificationService.open(errorResponse);
					return of(loginFail());
				}),
			);
		}),
	));

	logout$ = createEffect(() => this.actions$.pipe(
		ofType(logout),
		exhaustMap(() => this.authenticationService.logout().pipe(
			map(() => {
				if (this.router.url.includes("admin")) {
					this.router.navigate(["/admin/login"]);
				} else {
					this.router.navigate(["/login"]);
				}
				return logoutSuccess();
			}),
			catchError(errorResponse => {
				this.errorNotificationService.open(errorResponse);
				return of(logoutFail());
			}),
		)),
	));
}
