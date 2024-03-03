import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { MatCalendar } from '@angular/material/datepicker';
import moment, { Moment } from 'moment';
import { NgxMaterialTimepickerTheme } from 'ngx-material-timepicker';

@Component({
  selector: 'app-planifier-date-envoi',
  templateUrl: './planifier-date-envoi.component.html',
  styleUrls: ['./planifier-date-envoi.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class PlanifierDateEnvoiComponent implements OnInit, AfterViewInit {
  @ViewChild("calendarCurrentDate") calendarCurrentDate:MatCalendar<Moment>
  @Output() planficationDateEvent:EventEmitter<any>= new EventEmitter<any>()
  minCurrentDate=new Date(Date.now());
  maxCurrentDate = new Date(Date.now());
  selectedCurrentDate = new Date(Date.now()) 
  startCurrentDateAt= new Date();
  planifForm: UntypedFormGroup;
  selectedDayOfWeek="Lundi";
  selectedMonthOfWeek="";
  panelOpenState = false;
  selectedRandomDate:string[]=[];

  listOfDay=["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"]
  listOfMonth=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Decembre"]

  ngxMaterialTimePickerTheme:NgxMaterialTimepickerTheme = {
    container: {
      buttonColor: '#166534'
    },
    dial: {
      dialBackgroundColor: '#166534',
    },
    clockFace: {
      clockHandColor: '#166534',
  }
  }

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private cdr: ChangeDetectorRef
  ){}

  ngAfterViewInit(): void {
  }



  selectedRandomDateFunc = (event)=>{
    let newDate=event.toISOString();
    return this.selectedRandomDate.find((foundDate)=> foundDate==newDate)?"selected":null;
  }

  /**
     * On init
     */
  ngOnInit(): void
  {
      // Create the form
      this.planifForm = this._formBuilder.group({
          startAllPlage  : [''],
          endAllPlage      : [''],
          timeAllPlage :[''],
          isAllDayPlage : [false],
          isCurrentPlage: [false],
          numberOfCurrent:[0],
          timeCurrentPlage:[''],
          typeOfCurrent:['day'],
          isRandomPlage: [false],
          timeRandomPlage:[""]
      });
      this.minCurrentDate.setFullYear(this.minCurrentDate.getFullYear(),0,1);
      this.maxCurrentDate.setFullYear(this.maxCurrentDate.getFullYear(),11,31);
      this.startCurrentDateAt.setFullYear(this.maxCurrentDate.getFullYear(),new Date().getMonth(),1);
      this.selectedMonthOfWeek=this.listOfMonth[new Date().getMonth()];
      this.planifForm.valueChanges.subscribe((value)=>this.onSubmit())
  }


  toggleExpand(recurenceSelect)
  {
    recurenceSelect.toggle();
    this.onSubmit();

  }

  removeRandomDateSelected(dateString,calendar)
  {
    let newDateIndex = this.selectedRandomDate.findIndex((foundDate)=>foundDate==dateString);
    
    if(newDateIndex>=-1) this.selectedRandomDate.splice(newDateIndex,1);
    calendar.updateTodaysDate();
  }

  updateRandomDateSelected(event,calendar)
  {
    let newDate=event.toISOString();
    let newDateIndex = this.selectedRandomDate.findIndex((foundDate)=>foundDate==newDate);
    if(newDateIndex<0) this.selectedRandomDate.push(newDate);
    else this.selectedRandomDate.splice(newDateIndex,1);
    calendar.updateTodaysDate();
    this.onSubmit();
  }

  selectDay(value)
  {
    this.selectedDayOfWeek=value;
    this.onSubmit();
  }

  getDate(dateString)
  {
    return new Date(dateString)
  }


  handleCurrentDateSelected(event)
  {
    this.selectedCurrentDate=event.toDate()
    this.onSubmit();

  } 

  selectCurrentMonth(value,i)
  {
    this.selectedMonthOfWeek=value;
    let newStartDateAt=new Date()
    newStartDateAt.setFullYear(this.maxCurrentDate.getFullYear(),i,1);
    this.calendarCurrentDate._goToDateInView(moment(newStartDateAt),"month")    
    this.onSubmit();
  }

  onSubmit()
  {
    this.planficationDateEvent.emit({hasPlanification:false});

    let value= this.planifForm.value;
    let planifObj = [];
    if(value.isAllDayPlage)
    {
      if(value.startAllPlage=="" || value.endAllPlage=="" || value.timeAllPlage=="")
      {
        if(value.startAllPlage=="") this.planifForm.controls.startAllPlage.setErrors({notEmpty:true})
        if(value.endAllPlage=="") this.planifForm.controls.endAllPlage.setErrors({notEmpty:true})
        if(value.timeAllPlage=="") this.planifForm.controls.timeAllPlage.setErrors({notEmpty:true})
        return;
      }
      planifObj.push({
        type:"isAllDay",
        startDate:value.startAllPlage.toISOString(),
        endDate:value.endAllPlage.toISOString(),
        time:value.timeAllPlage
      })
    }

    if(value.isCurrentPlage)
    {
      if(value.numberOfCurrent==0 || value.timeCurrentPlage=="")
      {
        if(value.numberOfCurrent==0) this.planifForm.controls.numberOfCurrent.setErrors({notEmpty:true})
        if(value.timeCurrentPlage=="") this.planifForm.controls.timeCurrentPlage.setErrors({notEmpty:true})
        return;
      }
      let obj:Record<string,any>={
        type:"isReccurent",
        time:value.timeCurrentPlage,
        every:value.numberOfCurrent,
        recurency:"day",
      };

      switch (value.typeOfCurrent) {
        case "week":
          obj={
            ...obj,
            recurency:"week",
            dayOfWeek:this.listOfDay.findIndex((day)=>day==this.selectedDayOfWeek)
          }
          break;
        case "month":
          obj={
            ...obj,
            recurency:"month",
            "monthOfYear":this.listOfMonth.findIndex((day)=>day==this.selectedMonthOfWeek),
            date:this.selectedCurrentDate.toISOString()
          }
          break;
        case "year":
          obj={
            ...obj,
            recurency:"year", 
            "monthOfYear":this.listOfMonth.findIndex((day)=>day==this.selectedMonthOfWeek),
            date:this.selectedCurrentDate.toISOString()
          }          
          break;
      }
      planifObj.push(obj);
    }
    if(value.isRandomPlage)
    {
      if(value.timeRandomPlage=="") {
        this.planifForm.controls.timeRandomPlage.setErrors({notEmpty:true})
        return;
      }

      planifObj.push({
        type:"isRandom",
        dates:this.selectedRandomDate,
        time:value.timeRandomPlage
      })
    }
    if(planifObj.length>0) this.planficationDateEvent.emit({planif:planifObj,hasPlanification:true});
    // console.log("Array Plannif",planifObj)
  }
}
