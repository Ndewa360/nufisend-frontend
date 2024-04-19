import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-previsualize-data-file',
  templateUrl: './previsualize-data-file.component.html',
  styleUrls: ['./previsualize-data-file.component.scss']
})
export class PrevisualizeDataFileComponent {
  @Input() file:File;
}
