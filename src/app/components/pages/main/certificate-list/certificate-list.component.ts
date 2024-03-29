import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { throttle } from 'lodash';
import { Subscription } from 'rxjs/internal/Subscription';
import { Certificate } from 'src/app/entities/certificate';

import { CertificateService } from 'src/app/services/certificate-service.service';
import { CertificatePreviewComponent } from '../certificate-preview/certificate-preview.component';


@Component({
  selector: 'app-certificate-list',
  templateUrl: './certificate-list.component.html',
  styleUrls: ['./certificate-list.component.scss']
})
export class CertificateListComponent implements OnInit, OnDestroy {

  @Input() selectedCategoryId: number = NaN;
  @Input() certificateSelector: string = "";

  certificates: Certificate[] = [];

  private subscription: Subscription | undefined;

  private baseOffset: number = 0;
  private baseLimith: number = 12;

  private scrollTimeOut = 250;
  private addOnScroll = 6;
  private baseScrollOffsetHieght = 150;

  constructor(private certificateService: CertificateService, private elementRef: ElementRef) { }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void { 
    this.subscription = this.certificateService.getAllWithPagination(
      this.baseLimith,
      this.baseOffset,
      this.selectedCategoryId,
      this.certificateSelector
    )
      .subscribe(certificates => { this.certificates = certificates });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  @HostListener('document:scroll', ['$event'])
  getScrollHeight(event: any) {
    this.throttledAppend();
  }

  private throttledAppend = throttle(
    () => {
      if (CertificatePreviewComponent.height === undefined || CertificatePreviewComponent.width === undefined) {
        return;
      } else {
        let columns: number = Math.floor(this.getCurrentWidth() / CertificatePreviewComponent.width);
        let rows: number = Math.floor(this.getCurrentHeight() / CertificatePreviewComponent.height);

        const size = this.certificates.length;
        if (rows * columns >= size) {
          const subscription: Subscription =
            this.certificateService.getAllWithPagination(
              this.addOnScroll,
              size,
              this.selectedCategoryId,
              this.certificateSelector
            )
              .subscribe(certificates => {
                this.certificates = this.certificates.concat(certificates)
                subscription.unsubscribe();
              });
        }
      }
    }, this.scrollTimeOut)

  private getCurrentWidth(): number {
    return window.innerWidth;
  }

  private getCurrentHeight(): number {
    return document.documentElement.scrollTop + document.documentElement.clientHeight - this.baseScrollOffsetHieght
  }
}
