import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { interval } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit {
  constructor(private apiService: ApiService) {
    interval(3000).subscribe((x: any) => {
      this.getEvents();
    });
  }
  test_gif = 'assets/gif/test.gif';
  test_photo = 'assets/img/test.jpg';
  showModal = false;
  showWarnModal = false;
  warn_photo = '';
  warn_even_id = '';
  events: any = [];

  update_events = true;
  // events = [
  //   {
  //     datetime: '2023-04-09T01:52:39.607724',
  //     device_name: 'Smesharik Store',
  //     events: [],
  //     image_url:
  //       'http://185.146.3.164/frames/5e4ff46225fc1fa9904d45d7290a9235.jpg',
  //     showPopup: false,
  //   },
  // ];

  img_modal = '';
  // img_modal = this.test_photo;

  ngAfterViewInit(): void {
    // this.getEvents();
  }

  openModal(img_modal: any) {
    this.showModal = true;
    this.img_modal = img_modal;
  }
  openWarnModal(img_modal: any) {
    this.showWarnModal = true;
    this.warn_photo = img_modal;
  }
  closeModal() {
    this.showModal = false;
  }
  closeWarnModal(id: any) {
    this.showWarnModal = false;
    this.apiService.patchEvent(id).subscribe(() => {
      this.update_events = true;
      this.getEvents();
    });
  }

  getEvents(): void {
    if (this.update_events) {
      this.apiService.getEvents().subscribe((data) => {
        console.log(data, 'data');

        data.entities.forEach((el: any) => {
          // console.log(el);
          if (el.showPopup) {
            this.showWarnModal = true;
            this.warn_even_id = el._id;
            this.warn_photo = el.image_url;

            this.update_events = false;
          }
        });

        this.events = data.entities.slice().reverse();
      });
      // console.log(this.events);
    }
  }

  ngOnInit(): void {
    this.getEvents();
  }
}
