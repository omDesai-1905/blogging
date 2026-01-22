import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { BlogListComponent } from './components/blog-list/blog-list.component';
import { BlogDetailComponent } from './components/blog-detail/blog-detail.component';
import { BlogCreateComponent } from './components/blog-create/blog-create.component';
import { SettingsComponent } from './components/settings/settings.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { FollowRequestsComponent } from './components/follow-requests/follow-requests.component';

export const routes: Routes = [
  { path: '', component: BlogListComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'blog/create', component: BlogCreateComponent, canActivate: [AuthGuard] },
  { path: 'blog/:id', component: BlogDetailComponent },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  { path: 'follow-requests', component: FollowRequestsComponent, canActivate: [AuthGuard] },
  { path: 'user/:userName', component: UserProfileComponent },
  { path: '**', redirectTo: '' }
];
