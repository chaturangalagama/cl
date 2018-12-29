import { FormControl } from '@angular/forms';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-consultation-memo',
  templateUrl: './consultation-memo.component.html',
  styleUrls: ['./consultation-memo.component.scss']
})
export class ConsultationMemoComponent implements OnInit {
  @Input() memo: FormControl;
  ckeConfig: any;
  codes: string[];
  constructor() { }

  ngOnInit() {
    this.ckeConfig = {
      allowedContent: true,
      extraPlugins: 'divarea'
    };

    // this.subscribeChanges();
  }

  // subscribeChanges() {
  //   this.memo.valueChanges.debounceTime(200).subscribe(value => {
  //     console.log('changes in memo: ', value);

  //     if (value) {
  //       let memo: string = value;
  //       // memo = memo.replace("↵", "");

  //       console.log("memo: ", memo);
  //       // this.memo.patchValue(memo);
  //     }

  //   });
  // }
}
