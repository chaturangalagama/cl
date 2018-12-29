import { Component, OnInit } from '@angular/core';
import { VaccinationService } from './../../../../services/vaccination.service';
import { Page } from './../../../../model/page';
import { EventEmitter } from '@angular/core';

@Component({
  selector: 'app-add-vaccination',
  templateUrl: './add-vaccination.component.html',
  styleUrls: ['./add-vaccination.component.scss']
})
export class AddVaccinationComponent implements OnInit {
  rows = [];
  columns = [{ name: 'Name' }, { name: 'Code' }, { name: 'Age in months' }];
  page = new Page();

  temp = [];
  selected = [];

  public event: EventEmitter<any> = new EventEmitter();

  ngOnInit() {
    this.setPage({ page: 1 });
  }

  constructor(private vaccinationService: VaccinationService) {
    this.page.pageNumber = 1;
    this.page.size = 3;
  }

  onSelect({ selected }) {
    this.selected = selected;
  }

  setPage(pageInfo) {
    this.page.pageNumber = pageInfo.page - 1;
    return this.vaccinationService.listVaccination(this.page.pageNumber, this.page.size).subscribe(data => {
      if (data) {
        const payload = data.body['payload'];
        const content = payload.content;

        const formattedContent = content.map(content_ => {
          const curEntry = {
            name: content_.name,
            code: content_.code,
            ageInMonths: content_.ageInMonths,
            id: content_.id
          };
          return curEntry;
          // return payload.name;
        });

        // push our inital complete list
        this.rows = formattedContent;
        this.page.pageNumber = payload.number + 1;
        this.page.totalPages = payload.totalPages;
        this.page.totalElements = payload.totalElements;
      }

      return data;
    });
  }

  onBtnAddClicked(event) {
    this.event.emit(this.selected[0]);
  }
}
