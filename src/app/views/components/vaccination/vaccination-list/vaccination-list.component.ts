import { VaccinationService } from './../../../../services/vaccination.service';
import { Component, OnInit } from '@angular/core';
import { Page } from './../../../../model/page';

@Component({
    selector: 'app-vaccination-list',
    templateUrl: './vaccination-list.component.html',
    styleUrls: ['./vaccination-list.component.scss']
})
export class VaccinationListComponent implements OnInit {
    rows = [];
    columns = [{ name: 'Name' }, { name: 'Code' }, { name: 'Age in months' }];
    page = new Page();

    temp = [];

    ngOnInit() {
        this.setPage({ offset: 0 });
    }

    constructor(private vaccinationService: VaccinationService) {
        this.page.pageNumber = 0;
        this.page.size = 10;
    }

    setPage(pageInfo) {
        this.page.pageNumber = pageInfo.offset;
        return this.vaccinationService
            .listVaccination(this.page.pageNumber, this.page.size)
            .subscribe(data => {
                if (data) {
                    const payload = data.body['payload'];
                    const content = payload.content;

                    const formattedContent = content.map(content_ => {
                        const curEntry = {
                            name: content_.name,
                            code: content_.code,
                            ageInMonths: content_.ageInMonths
                        };
                        return curEntry;
                        // return payload.name;
                    });

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
}
