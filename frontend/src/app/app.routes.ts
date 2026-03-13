import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { BlogListComponent } from './components/blog-list/blog-list.component';
import { BlogDetailComponent } from './components/blog-detail/blog-detail.component';
import { BlogCreateComponent } from './components/blog-create/blog-create.component';
import { BlogEditComponent } from './components/blog-edit/blog-edit.component';
import { SettingsComponent } from './components/settings/settings.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AdminGuard } from './guards/admin.guard';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { AdminUserDetailsComponent } from './components/admin-user-details/admin-user-details.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'blogs', component: BlogListComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'blog/create', component: BlogCreateComponent, canActivate: [AuthGuard] },
  { path: 'blog/edit/:id', component: BlogEditComponent, canActivate: [AuthGuard] },
  { path: 'blog/:id', component: BlogDetailComponent },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  { path: 'user/:userName', component: UserProfileComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'admin/user/:userId', component: AdminUserDetailsComponent, canActivate: [AdminGuard] },
  { path: '**', redirectTo: '' }
];
