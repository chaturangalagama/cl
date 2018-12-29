import { AlertService } from './../../../../services/alert.service';
import { Page } from './../../../../model/page';
import { Component, OnInit } from '@angular/core';
import { DrugService } from '../../../../services/drug.service';
import { CurrencyPipe } from '@angular/common/';

@Component({
  selector: 'app-drug-list',
  templateUrl: './drug-list.component.html',
  styleUrls: ['./drug-list.component.scss']
})
export class DrugListComponent implements OnInit {
  rows = [];
  columns = [{ name: 'Name' }, { name: 'UOM' }, { name: 'Price' }, { name: 'Tax included' }];
  page = new Page();

  temp = [];

  ngOnInit() {
    this.setPage({ offset: 0 });
  }

  constructor(private drugService: DrugService, private alertService: AlertService) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  setPage(pageInfo) {
    this.page.pageNumber = pageInfo.offset;
    return this.drugService.listDrugs(this.page.pageNumber, this.page.size).subscribe(data => {
      console.log('Drug data', data);
      if (data) {
        const payload = data['body']['payload'];
        const content = payload.content;

        const formattedContent = content.map(content_ => {
          const curEntry = {
            id: content_.id,
            name: content_.name,
            uom: content_.uom,
            price: new CurrencyPipe('en-SG').transform(content_.price.price, 'SGD', 'symbol-narrow'),
            taxIncluded: content_.price.taxIncluded ? 'Yes' : 'No'
          };
          return curEntry;
          // return payload.name;
        });

        console.log('Drug List', formattedContent);

        // push our inital complete list
        this.rows = formattedContent;
        this.page.pageNumber = payload.number;
        this.page.totalPages = payload.totalPages;
        this.page.totalElements = payload.totalElements;
        // this.page.size = 10;
      }

      return data;
    });
  }

  delete(value) {
    console.log('delete()', value);

    this.drugService.removeDrug(value).subscribe(
      data => {
        this.setPage({ offset: 0 });
      },
      err => {
        this.alertService.error(JSON.stringify(err.error.message));
      }
    );
  }
}
