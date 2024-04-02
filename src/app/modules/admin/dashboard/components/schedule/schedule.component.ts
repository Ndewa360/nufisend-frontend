import { AfterViewInit, ChangeDetectorRef, Component,OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { PlanificationState, PlanificationModel, CRON_JOB_TYPE } from 'app/shared/store/planifcation';
import { CronJobString } from 'app/shared/utils';
import { DateUtil } from 'app/shared/utils/date-util';
import {parseExpression} from "cron-parser"
import { ApexOptions, ChartComponent } from 'ng-apexcharts';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit,AfterViewInit{
 
  planificationsChartOption: ApexOptions = {};
  @Select(PlanificationState.selectStateData) planification$:Observable<PlanificationModel[]>;
  @ViewChild('planifChart',{ static: false }) planificationChart: ChartComponent;

  private _unsubscribeAll: Subject<any> = new Subject<any>();
  planificationFirstDateChart:Date=new Date();
  planificationEndDateChart:Date=new Date();
  listOfPlanActive:any[]=[];
  listOfPlanInActive:any[]=[];
  currentDataGrid:number[]=[]
  planificationInitData:PlanificationModel[]=[]
  selectedPlanificationsDayData:PlanificationModel[]=[];
  listOfDay=["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"]
  selectedDayOfWeek="Lundi";



    /**
     * Constructor
     */
    constructor(
      private _router: Router,
      private _changeDetectorRef: ChangeDetectorRef,

    )
    {}
    

  // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngAfterViewInit(): void {}

    /**
     * On init
     */
  ngOnInit(): void {
    // Attach SVG fill fixer to all ApexCharts
    window['Apex'] = {
      chart: {
          events: {
              mounted: (chart: any, options?: any): void => {
                  this._fixSvgFill(chart.el);
              },
              updated: (chart: any, options?: any): void => {
                  this._fixSvgFill(chart.el);
              }
          }
      }
    };

    DateUtil.setToFirstDayOfWeek(this.planificationFirstDateChart);
    DateUtil.setToLastDayOfWeek(this.planificationEndDateChart);

    this._prepareChartData();
    this.planification$.subscribe((data)=>this._prepairData(data))    
  }

  // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Fix the SVG fill references. This fix must be applied to all ApexCharts
     * charts in order to fix 'black color on gradient fills on certain browsers'
     * issue caused by the '<base>' tag.
     *
     * Fix based on https://gist.github.com/Kamshak/c84cdc175209d1a30f711abd6a81d472
     *
     * @param element
     * @private
     */
    private _fixSvgFill(element: Element): void
    {
        // Current URL
        const currentURL = this._router.url;

        // 1. Find all elements with 'fill' attribute within the element
        // 2. Filter out the ones that doesn't have cross reference so we only left with the ones that use the 'url(#id)' syntax
        // 3. Insert the 'currentURL' at the front of the 'fill' attribute value
        Array.from(element.querySelectorAll('*[fill]'))
             .filter(el => el.getAttribute('fill').indexOf('url(') !== -1)
             .forEach((el) => {
                 const attrVal = el.getAttribute('fill');
                 el.setAttribute('fill', `url(${currentURL}${attrVal.slice(attrVal.indexOf('#'))}`);
             });
    }

  /**
     * Prepare the chart data from the data
     *
     * @private
     */
  private _prepareChartData(): void
  {
      this.planificationsChartOption = {
          chart      : {
              fontFamily: 'inherit',
              foreColor : 'inherit',
              height    : '100%',
              type      : 'line',
              toolbar   : {
                  show: false
              },
              zoom      : {
                  enabled: false
              },
              id:'planificationChart'
          },
          colors     : ['#64748B', '#fe9e0bd9'], //166534
          dataLabels : {
              enabled        : true,
              enabledOnSeries: [0],
              background     : {
                  borderWidth: 0
              }
          },
          grid       : {
              borderColor: 'var(--fuse-border)'
          },
          labels     : this.listOfDay,
          legend     : {
              show: false
          },
          plotOptions: {
              bar: {
                  columnWidth: '50%'
              }
          },
          series     : [{
            name:"Planifications Actives",
            type: 'line',
            data:[]
          },
          {
            name:"Planifications Inactives",
            type: 'line',
            data:[]
          }],
          states     : {
              hover: {
                  filter: {
                      type : 'darken',
                      value: 0.75
                  }
              }
          },
          stroke     : {
              width: [3, 0]
          },
          tooltip    : {
              followCursor: true,
              theme       : 'dark'
          },
          xaxis      : {
              axisBorder: {
                  show: false
              },
              axisTicks : {
                  color: 'var(--fuse-border)'
              },
              labels    : {
                  style: {
                      colors: 'var(--fuse-text-secondary)'
                  }
              },
              tooltip   : {
                  enabled: false
              }
          },
          yaxis      : {
              labels: {
                  offsetX: -16,
                  style  : {
                      colors: 'var(--fuse-text-secondary)'
                  }
              }
          }
      };
    }

    _prepairData(data:PlanificationModel[])
    {
        this.listOfPlanActive = data.filter((planing)=>planing.isActive).map((plan)=>CronJobString.transformPlanificationToCronJobArray(plan.planning))
            .reduce((acc,curr)=>[...acc,...curr],[]).map((plan)=>plan.plan).filter((plan)=>plan!=null); 

        this.listOfPlanInActive = data.filter((planing)=>!planing.isActive).map((plan)=>CronJobString.transformPlanificationToCronJobArray(plan.planning))
            .reduce((acc,curr)=>[...acc,...curr],[]).map((plan)=>plan.plan).filter((plan)=>plan!=null); 
        
        this.planificationInitData=data;
        this.updateCharView();
        this.getPlaningOfDay()
    }

    nextWeekData()
    {
        this.planificationFirstDateChart.setDate(this.planificationFirstDateChart.getDate()+7);
        this.planificationFirstDateChart=new Date(this.planificationFirstDateChart.getFullYear(),this.planificationFirstDateChart.getMonth(),this.planificationFirstDateChart.getDate()) 
        
        this.planificationEndDateChart.setDate(this.planificationEndDateChart.getDate()+7);
        this.planificationEndDateChart=new Date(this.planificationEndDateChart.getFullYear(),this.planificationEndDateChart.getMonth(),this.planificationEndDateChart.getDate()) 
        this.updateCharView();
        this.getPlaningOfDay()
    }

    prevWeekData()
    {
        this.planificationFirstDateChart.setDate(this.planificationFirstDateChart.getDate()-7);
        this.planificationFirstDateChart=new Date(this.planificationFirstDateChart.getFullYear(),this.planificationFirstDateChart.getMonth(),this.planificationFirstDateChart.getDate()) 
        
        this.planificationEndDateChart.setDate(this.planificationEndDateChart.getDate()-7);
        this.planificationEndDateChart=new Date(this.planificationEndDateChart.getFullYear(),this.planificationEndDateChart.getMonth(),this.planificationEndDateChart.getDate()) 
        this.updateCharView();
        this.getPlaningOfDay()
    }

    getPlaningOfDay(currentIndexDay=0)
    {
        let currentDate = new Date(this.planificationFirstDateChart.getFullYear(),this.planificationFirstDateChart.getMonth(),this.planificationFirstDateChart.getDate()+currentIndexDay);
        this.selectedPlanificationsDayData = this.planificationInitData.filter((plan)=>{
            let isToCurrentDate =false;
            CronJobString.transformPlanificationToCronJobArray(plan.planning).forEach((cronPlanString)=>{
                if(!cronPlanString.plan) return;
                // console.log("Console ",cronPlanString)
                if(parseExpression(cronPlanString.plan,{currentDate,iterator:true}).hasNext()) isToCurrentDate = true;
            });
            return isToCurrentDate;
        })
        // console.log("Selected For Date ",this.selectedPlanificationsDayData,this.planificationInitData)
    }

    selectDay(value)
    {
        this.selectedDayOfWeek=this.listOfDay[value];
        this.getPlaningOfDay(value)
    }


    getDataFromStartTo(startDate:Date,endDate:Date,data:string[])
    {
      let dataGrid = [0,0,0,0,0,0,0];
      data.forEach((plan)=>{
       let intervale = parseExpression(plan,{currentDate:startDate,endDate,iterator:true});
        while(intervale.hasNext())
        {
          let dateFound = intervale.next();
        //   console.log("Console GetData ",dateFound.value);
          dataGrid[dateFound.value.getDay()]++;
        }         
       })
       return dataGrid;
    }

    updateCharView()
    {
        this.planificationsChartOption.series =[
            {
                name:"Planifications Actives",
                type: 'line',
                data:this.getDataFromStartTo(this.planificationFirstDateChart,this.planificationEndDateChart,this.listOfPlanActive)
            },
            {
            name:"Planifications Inactives",
            type: 'dashed',
            data:this.getDataFromStartTo(this.planificationFirstDateChart,this.planificationEndDateChart,this.listOfPlanInActive)
            }
        ]
    }
}
