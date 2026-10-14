import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from './components/page-header.component';
import { BackButtonComponent } from './components/back-button.component';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    PageHeaderComponent,
  ],
  declarations: [
    BackButtonComponent,
  ],
  exports: [
    PageHeaderComponent,
    BackButtonComponent,
  ],
})
export class SharedModule {}